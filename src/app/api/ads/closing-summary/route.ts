import { NextRequest, NextResponse } from "next/server";
import { requireAdsAuth } from "@/lib/ads-auth";
import { createSupabaseAdmin } from "@/lib/supabase/server";

const GROQ_MODEL = "llama-3.3-70b-versatile";

// ── Structured analysis types ──

interface StructuredAnalysis {
  prospect: {
    name: string;
    age: string | null;
    location: string | null;
    situation: string;
    need: string;
    budget: string;
    objections: string[];
    buying_signals: string[];
  };
  score: number;
  score_rationale: string;
  strengths: string[];
  weaknesses: string[];
  improvements: string[];
  next_steps: string[];
  annotated_transcript: {
    speaker: string;
    text: string;
    status: "good" | "bad" | "neutral";
    comment?: string;
    suggestion?: string;
  }[];
}

const SYSTEM_PROMPT = `Tu es un coach de closing expert et impitoyable. Tu analyses des transcripts d'appels de vente pour aider le closeur (Jules) à s'améliorer.

Tu DOIS retourner UNIQUEMENT un objet JSON valide (pas de texte avant/après, pas de blocs markdown). Voici la structure exacte :

{
  "prospect": {
    "name": "string — prénom du prospect",
    "age": "string ou null — âge si mentionné",
    "location": "string ou null — ville/région si mentionné",
    "situation": "string — job, situation de vie, contexte",
    "need": "string — ce qu'il cherche concrètement",
    "budget": "string — budget mentionné ou capacité financière estimée",
    "objections": ["string — chaque objection ou frein exprimé"],
    "buying_signals": ["string — chaque signal d'achat positif détecté"]
  },
  "score": 4,
  "score_rationale": "Une phrase expliquant le score",
  "strengths": ["string — ce qui a bien marché dans le closing"],
  "weaknesses": ["string — ce qui a bloqué ou été mal fait"],
  "improvements": ["string — conseil actionnable pour la prochaine fois"],
  "next_steps": ["string — actions concrètes à faire après cet appel"],
  "annotated_transcript": [
    {
      "speaker": "Jules",
      "text": "ce qui a été dit",
      "status": "good | bad | neutral",
      "comment": "pourquoi c'est bien/mal (uniquement si status != neutral)",
      "suggestion": "ce que Jules aurait dû dire à la place (uniquement si status == bad)"
    }
  ]
}

RÈGLES IMPÉRATIVES :
- Découpe le transcript en segments de dialogue (un segment = une prise de parole d'un interlocuteur).
- Les speakers sont identifiés par les patterns "Jules :", "Prospect :", ou le nom du prospect suivi de ":". Si le transcript n'a pas de labels clairs, déduis qui parle par le contexte.
- Marque chaque segment : "good" (Jules a dit quelque chose d'efficace pour le closing), "bad" (erreur de closing, occasion manquée, maladresse), "neutral" (échange normal sans impact).
- Pour les segments "bad", donne TOUJOURS un "comment" ET une "suggestion" concrète (la phrase exacte que Jules aurait dû dire).
- Pour les segments "good", donne un "comment" expliquant pourquoi c'est efficace.
- Score sur 10 : sois TRÈS sévère. Un premier closeur sans formation fait 3-5/10. Un 7+ = excellent closing.
- Focus 100% sur la technique de vente : écoute active, traitement des objections, création d'urgence, closing, frame control, qualification.
- Si une info prospect n'est pas dans le transcript, mets null ou "Non mentionné".
- Retourne UNIQUEMENT le JSON, rien d'autre.`;

function extractJSON(raw: string): StructuredAnalysis {
  // Strip markdown code fences if present
  let cleaned = raw.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");
  }
  return JSON.parse(cleaned);
}

function analysisToMarkdown(analysis: StructuredAnalysis): string {
  const lines: string[] = [];
  lines.push(`## Données prospect`);
  lines.push(`- **Nom** : ${analysis.prospect.name}`);
  lines.push(`- **Situation** : ${analysis.prospect.situation}`);
  lines.push(`- **Besoin** : ${analysis.prospect.need}`);
  lines.push(`- **Budget** : ${analysis.prospect.budget}`);
  if (analysis.prospect.objections.length > 0) {
    lines.push(`- **Objections** : ${analysis.prospect.objections.join(" / ")}`);
  }
  if (analysis.prospect.buying_signals.length > 0) {
    lines.push(`- **Signaux d'achat** : ${analysis.prospect.buying_signals.join(" / ")}`);
  }
  lines.push("");
  lines.push(`## Coaching closing`);
  lines.push(`- **Score** : ${analysis.score}/10 — ${analysis.score_rationale}`);
  lines.push(`- **Points forts** : ${analysis.strengths.join(" / ")}`);
  lines.push(`- **Faiblesses** : ${analysis.weaknesses.join(" / ")}`);
  lines.push("");
  lines.push(`## Améliorations`);
  analysis.improvements.forEach((imp) => lines.push(`- ${imp}`));
  lines.push("");
  lines.push(`## Actions / next steps`);
  analysis.next_steps.forEach((ns) => lines.push(`- ${ns}`));
  return lines.join("\n");
}

async function analyzeTranscript(transcript: string, name: string): Promise<{ structured: StructuredAnalysis; markdown: string }> {
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
          content: `Voici le transcript de l'appel de closing avec "${name}":\n\n${transcript}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 8000,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Groq error: ${res.status} — ${err}`);
  }

  const data = await res.json();
  const raw = data.choices?.[0]?.message?.content ?? "";

  const structured = extractJSON(raw);
  const markdown = analysisToMarkdown(structured);

  return { structured, markdown };
}

// GET — list all closing summaries
export async function GET() {
  const check = await requireAdsAuth();
  if (check instanceof NextResponse) return check;

  const sb = createSupabaseAdmin();
  const { data } = await sb
    .from("closing_summaries")
    .select("id, name, summary, structured_analysis, is_audio, created_at")
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
    const { structured, markdown } = await analyzeTranscript(record.transcript, record.name);

    // Save both structured + markdown fallback in DB
    await sb
      .from("closing_summaries")
      .update({ summary: markdown, structured_analysis: structured })
      .eq("id", id);

    return NextResponse.json({ summary: markdown, structured_analysis: structured });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
