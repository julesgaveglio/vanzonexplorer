import { NextRequest, NextResponse } from "next/server";
import { requireAdsAuth } from "@/lib/ads-auth";
import { createSupabaseAdmin } from "@/lib/supabase/server";

const GROQ_MODEL = "llama-3.3-70b-versatile";

const SYSTEM_PROMPT = `Tu es un analyste commercial expert. Tu analyses des transcripts d'appels de closing pour en extraire les informations exploitables.

Tu DOIS structurer ta réponse EXACTEMENT ainsi (en markdown) :

## Données prospect
- **Profil** : [qui est le prospect, sa situation]
- **Besoin** : [ce qu'il cherche concrètement]
- **Budget** : [budget mentionné, capacité financière]
- **Objections** : [freins exprimés ou sous-entendus]
- **Signaux d'achat** : [indices positifs, moments d'engagement]

## Points clés du closing
- **Ce qui a fonctionné** : [arguments/moments qui ont eu de l'impact]
- **Ce qui a bloqué** : [résistances, hésitations]
- **Étapes de la négociation** : [déroulé chronologique résumé]

## Data réutilisable
- **Chiffres clés** : [tous les montants, durées, pourcentages mentionnés]
- **Verbatims importants** : [citations exactes exploitables]
- **Contexte décisionnel** : [qui décide, quand, quelles conditions]

## Actions / next steps
- [action 1 concrète avec deadline si mentionnée]
- [action 2...]

## Coaching closing
- **Score** : [X/10]
- **Ce qui a bien marché** : [2-3 points forts du closeur]
- **Erreurs identifiées** : [liste des erreurs de closing avec explication courte]
- **Conseil #1** : [conseil actionnable le plus important]
- **Conseil #2** : [deuxième conseil]
- **Conseil #3** : [troisième conseil]

RÈGLES :
- Concision maximale. Pas de remplissage.
- Ne garde que ce qui sert à piloter les ventes.
- Cite les verbatims entre guillemets.
- Si une info n'est pas dans le transcript, écris "Non mentionné".
- Pour le coaching : sois direct et honnête, pas complaisant. Note sévèrement.`;

async function analyzeTranscript(transcript: string, name: string): Promise<string> {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Voici le transcript de l'appel de closing de "${name}":\n\n${transcript}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 2000,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Groq error: ${res.status} — ${err}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "Aucune analyse générée.";
}

// GET — list all closing summaries
export async function GET() {
  const check = await requireAdsAuth();
  if (check instanceof NextResponse) return check;

  const sb = createSupabaseAdmin();
  const { data } = await sb
    .from("closing_summaries")
    .select("id, name, summary, is_audio, created_at")
    .order("created_at", { ascending: false });

  return NextResponse.json({ items: data ?? [] });
}

// POST — generate/regenerate summary for a record
export async function POST(req: NextRequest) {
  const check = await requireAdsAuth();
  if (check instanceof NextResponse) return check;

  const { id } = await req.json();
  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  const sb = createSupabaseAdmin();
  const { data: record } = await sb
    .from("closing_summaries")
    .select("id, name, transcript")
    .eq("id", id)
    .single();

  if (!record || !record.transcript) {
    return NextResponse.json({ error: "Transcript introuvable" }, { status: 404 });
  }

  try {
    const summary = await analyzeTranscript(record.transcript, record.name);

    // Save summary in DB
    await sb
      .from("closing_summaries")
      .update({ summary })
      .eq("id", id);

    return NextResponse.json({ summary });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
