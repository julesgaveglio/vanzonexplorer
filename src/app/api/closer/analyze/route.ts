import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { analyzeClosingTranscript, transcriptHash } from "@/lib/closing/analyze";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const ALLOWED_EMAILS = (process.env.ADMIN_EMAILS ?? "gavegliojules@gmail.com,vanzonexplorer@gmail.com,jules.skate64@gmail.com")
  .split(",")
  .map((e) => e.trim().toLowerCase());

async function requireAllowed(): Promise<boolean> {
  const { userId } = await auth();
  if (!userId) return false;
  const user = await currentUser();
  const email = user?.emailAddresses?.[0]?.emailAddress?.toLowerCase() ?? "";
  return ALLOWED_EMAILS.includes(email);
}

export async function POST(req: Request) {
  if (!(await requireAllowed())) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY manquante côté serveur." }, { status: 500 });
  }

  let body: { transcript?: string; title?: string; prospect?: string; closer?: string; callDate?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide." }, { status: 400 });
  }

  const transcript = (body.transcript ?? "").trim();
  const title = (body.title ?? "").trim() || null;
  const prospect = (body.prospect ?? "").trim() || null;
  const closer = (body.closer ?? "").trim() || "Jules";
  const callDate = (body.callDate ?? "").trim() || new Date().toISOString().slice(0, 10);

  if (transcript.length < 80) {
    return NextResponse.json(
      { error: "Colle un transcript d'appel plus complet (au moins quelques échanges)." },
      { status: 400 },
    );
  }

  let analysis, context;
  try {
    ({ analysis, context } = await analyzeClosingTranscript({ transcript, prospect, title, closer, callDate }));
  } catch (err) {
    console.error("[closer/analyze] erreur:", err);
    return NextResponse.json({ error: "L'analyse a échoué. Réessaie dans un instant." }, { status: 502 });
  }

  const score = typeof analysis?.verdict?.score === "number" ? Math.round(analysis.verdict.score) : null;
  // Nom d'affichage : prospect fourni, sinon extrait de la fiche.
  const displayProspect =
    prospect ||
    [context?.prenom, context?.nom].filter(Boolean).join(" ").trim() ||
    null;
  const ville = context?.ville ?? null;
  const statut = context?.statut ?? analysis?.verdict?.outcome ?? null;

  // Persistance best-effort : l'analyse est renvoyée même si la table n'existe pas encore.
  let savedRow: unknown = null;
  try {
    const supabase = createSupabaseAdmin();

    // Rattachement intelligent : retrouve la réservation Calendly (closing_calls)
    // du prospect par son prénom, pour lier le transcript à la bonne personne.
    let closingCallId: string | null = null;
    const searchName = context?.prenom || displayProspect;
    if (searchName) {
      const { data: bookings } = await supabase
        .from("closing_calls")
        .select("id, name, scheduled_at")
        .ilike("name", `%${searchName}%`)
        .order("scheduled_at", { ascending: false })
        .limit(1);
      if (bookings && bookings.length > 0) closingCallId = bookings[0].id as string;
    }

    const { data, error } = await supabase
      .from("closing_analyses")
      .insert({
        title,
        prospect: displayProspect,
        closer,
        call_date: callDate,
        ville,
        statut,
        transcript,
        transcript_hash: transcriptHash(transcript),
        analysis,
        context,
        score,
        closing_call_id: closingCallId,
      })
      .select("*")
      .single();
    if (error) console.warn("[closer/analyze] insert non persisté:", error.message);
    else savedRow = data;
  } catch (e) {
    console.warn("[closer/analyze] Supabase indisponible:", e);
  }

  return NextResponse.json({ analysis, context, saved: savedRow });
}
