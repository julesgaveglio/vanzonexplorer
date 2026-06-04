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
  pareto: string[];
  next_steps: string[];
  annotated_transcript: {
    speaker: string;
    text: string;
    status: "good" | "bad" | "neutral";
    comment?: string;
    suggestion?: string;
  }[];
}

// ── Prompt pour annotation par batch (étape 3) ──

const ANNOTATION_PROMPT = `# RÔLE
Tu es un coach de closing expérimenté qui analyse les appels de vente de Jules.
Jules vend la Van Business Academy (997€) : un accompagnement pour aménager soi-même un van homologué VASP et en faire un business de location.

# CONTEXTE SUR JULES
Jules TUTOIE toujours ses prospects. Il parle de façon directe, concrète, terre-à-terre.
Vocabulaire de terrain : van, fourgon, châssis, rouille perforante, homologation, plus-value, budget, Trafic, VASP, Yescapa.
Il est jeune (23 ans), proche de ses prospects, informel mais professionnel.

# RÈGLE ABSOLUE SUR LES SUGGESTIONS
Toute phrase de remplacement DOIT :
1. Être au TUTOIEMENT. Jamais "vous". Jamais "pouvez-vous", toujours "tu peux".
2. Sonner comme une phrase que Jules dirait VRAIMENT à l'oral : naturelle, parlée, pas du jargon de coach. Interdit : "Comment pensez-vous que...", "Je voudrais souligner que...", "atteindre tes objectifs".
3. Rester dans son univers concret (van, budget, travaux, homologation), pas dans l'abstraction.

Exemple :
- MAUVAIS : "Pouvez-vous me dire ce que vous attendez de notre conversation ?"
- BON : "Du coup c'est quoi ton objectif avec ton van, tu veux juste voyager ou aussi le mettre en loc derrière ?"

# COMMENT JUGER UN SEGMENT
Juge l'EFFICACITÉ RÉELLE en closing, pas la conformité à un manuel théorique.
- "neutral" : échange normal sans impact sur la vente.
- "good" : technique efficace — qualification utile, création de valeur, gestion d'objection, ancrage de prix, preuve par l'expérience perso, etc.
- "bad" : VRAIE erreur de closing — occasion manquée de qualifier/closer/traiter une objection/créer de l'urgence ; phrase confuse/trop longue qui perd le prospect ; prix lâché sans valeur posée avant ; positionnement qui dévalue l'offre.

NE CLASSE PAS "bad" :
- Une question de qualification légitime ("tu fais quoi dans la vie ?", "t'as des notions en électricité ?") → "good" ou "neutral"
- Le tutoiement ou un ton informel (c'est sa marque, pas un défaut)
- Le fait de poser des questions personnelles pertinentes pour qualifier

# POUR CHAQUE SEGMENT "bad"
1. "comment" : explique en 1 phrase claire et actionnable POURQUOI c'est une occasion manquée, et ce que ça coûte (ex: "Tu lâches le prix de 997€ avant d'avoir posé la valeur, du coup ça paraît cher dans le vide")
2. "suggestion" : la phrase exacte que Jules aurait dû dire, au tutoiement, dans son ton parlé naturel.

Retourne UNIQUEMENT un tableau JSON valide.`;

// ── Prompt pour analyse globale (étape 4) ──

const GLOBAL_PROMPT = `# RÔLE
Tu es un coach de closing qui analyse les appels de Jules. Tu t'adresses directement à Jules au tutoiement.
Jules vend la Van Business Academy (997€) pour aménager un van VASP et en faire un business.

# RÈGLES
- Tout au TUTOIEMENT, adresse-toi à Jules directement ("ton appel", "tu as", etc.)
- Sois CONCRET et orienté action. Chaque amélioration = un comportement précis et observable.
- Score /10 sévère : premier closeur sans formation = 3-5/10.
- Le champ "pareto" = les 3 actions MAX qui auraient le plus gros impact sur ton prochain appel. C'est le 20% qui change 80%. Formule chaque action comme un ordre direct et court.

Retourne UNIQUEMENT un JSON valide :
{
  "prospect": { "name": "string", "age": "string|null", "location": "string|null", "situation": "string", "need": "string", "budget": "string", "objections": ["string"], "buying_signals": ["string"] },
  "score": number,
  "score_rationale": "string — 1 phrase, tutoiement",
  "strengths": ["string — max 5, tutoiement"],
  "weaknesses": ["string — max 5, tutoiement"],
  "improvements": ["string — max 5, comportement précis observable"],
  "pareto": ["string — max 3, les 20% d'actions qui changent 80% du résultat, formulées comme des ordres directs courts"],
  "next_steps": ["string — max 4, actions concrètes post-appel"]
}`;

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
  if (analysis.pareto?.length > 0) {
    lines.push(`## Pareto — Les 20% qui changent tout`);
    analysis.pareto.forEach((p) => lines.push(`- ${p}`));
    lines.push("");
  }
  lines.push(`## Améliorations`);
  analysis.improvements.forEach((imp) => lines.push(`- ${imp}`));
  lines.push("");
  lines.push(`## Actions / next steps`);
  analysis.next_steps.forEach((ns) => lines.push(`- ${ns}`));
  return lines.join("\n");
}

// ── Groq helper ──

const GROQ_KEYS = [
  process.env.GROQ_API_KEY,
  process.env.GROQ_API_KEY_2,
  process.env.GROQ_API_KEY_3,
].filter(Boolean) as string[];
let groqKeyIdx = 0;

async function callGroq(system: string, user: string, maxTokens = 4000): Promise<string> {
  const key = GROQ_KEYS[groqKeyIdx % GROQ_KEYS.length];
  groqKeyIdx++;

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: 0.2,
      max_tokens: maxTokens,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Groq ${res.status}: ${err.substring(0, 200)}`);
  }

  const data = await res.json();
  let raw = data.choices?.[0]?.message?.content ?? "";
  raw = raw.trim();
  if (raw.startsWith("```")) {
    raw = raw.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");
  }
  return raw;
}

// ── Parse transcript into segments ──

function parseTranscriptSegments(transcript: string): { speaker: string; text: string }[] {
  const segments: { speaker: string; text: string }[] = [];
  const lines = transcript.split("\n").filter((l) => l.trim());
  for (const line of lines) {
    const match = line.match(/^([A-ZÀ-Üa-zà-ü]+)\s*:\s*(.+)$/);
    if (match) {
      segments.push({ speaker: match[1], text: match[2].trim() });
    } else if (segments.length > 0) {
      segments[segments.length - 1].text += " " + line.trim();
    }
  }
  return segments;
}

// ── Annotate segments in batches ──

async function annotateSegments(
  segments: { speaker: string; text: string }[],
  prospectName: string,
): Promise<StructuredAnalysis["annotated_transcript"]> {
  const BATCH = 15;
  const result: StructuredAnalysis["annotated_transcript"] = [];

  for (let i = 0; i < segments.length; i += BATCH) {
    const batch = segments.slice(i, i + BATCH);
    const numbered = batch
      .map((s, idx) => `[${i + idx}] ${s.speaker}: ${s.text}`)
      .join("\n\n");

    const user = `Annote chaque segment. Jules = closeur, ${prospectName} = prospect.\n\nPour CHAQUE segment, retourne : {"idx": number, "status": "good"|"bad"|"neutral", "comment": "string|null", "suggestion": "string|null"}\n\nRetourne un tableau JSON uniquement.\n\n${numbered}`;

    try {
      const raw = await callGroq(ANNOTATION_PROMPT, user, 3000);
      const annotations: { idx: number; status: string; comment?: string; suggestion?: string }[] = JSON.parse(raw);

      for (let j = 0; j < batch.length; j++) {
        const ann = annotations.find((a) => a.idx === i + j);
        result.push({
          speaker: batch[j].speaker,
          text: batch[j].text,
          status: (ann?.status as "good" | "bad" | "neutral") || "neutral",
          ...(ann?.comment ? { comment: ann.comment } : {}),
          ...(ann?.suggestion ? { suggestion: ann.suggestion } : {}),
        });
      }
    } catch {
      // On error, mark all as neutral
      for (const seg of batch) {
        result.push({ speaker: seg.speaker, text: seg.text, status: "neutral" });
      }
    }

    // Rate limit pause between batches
    if (i + BATCH < segments.length) {
      await new Promise((r) => setTimeout(r, 2000));
    }
  }

  return result;
}

// ── Format raw transcript (no speaker labels) into segments via Groq ──

async function formatRawTranscript(
  rawText: string,
  prospectName: string,
): Promise<{ speaker: string; text: string }[]> {
  const CHUNK = 5000;
  const allSegments: { speaker: string; text: string }[] = [];

  for (let i = 0; i < rawText.length; i += CHUNK) {
    const chunk = rawText.substring(i, i + CHUNK);
    const user = `Ce texte est un transcript brut d'appel entre Jules (closeur) et ${prospectName} (prospect). Reformate en dialogue.\n\nRetourne UNIQUEMENT un tableau JSON : [{"speaker": "Jules"|"${prospectName}", "text": "ce qui est dit"}]\n\nDéduis qui parle par le contexte. Jules présente la Van Business Academy.\n\n${chunk}`;

    try {
      const raw = await callGroq("Reformate ce transcript en dialogue JSON. Tableau JSON uniquement.", user, 4000);
      const segs: { speaker: string; text: string }[] = JSON.parse(raw);
      allSegments.push(...segs);
    } catch {
      allSegments.push({ speaker: "?", text: chunk.substring(0, 300) + "..." });
    }

    if (i + CHUNK < rawText.length) {
      await new Promise((r) => setTimeout(r, 2000));
    }
  }

  return allSegments;
}

// ── Main analysis pipeline ──

async function analyzeTranscript(transcript: string, name: string): Promise<{ structured: StructuredAnalysis; markdown: string }> {
  // Step 1: Parse into segments
  const isFormatted = /^[A-ZÀ-Üa-zà-ü]+\s*:/.test(transcript.trim());
  let segments: { speaker: string; text: string }[];

  if (isFormatted) {
    segments = parseTranscriptSegments(transcript);
  } else {
    segments = await formatRawTranscript(transcript, name);
  }

  // Step 2: Annotate all segments
  const annotated = await annotateSegments(segments, name);

  // Step 3: Global analysis (prospect profile + score + pareto)
  const truncated = transcript.length > 6000
    ? transcript.substring(0, 6000) + "\n[... suite tronquée pour analyse]"
    : transcript;

  const globalRaw = await callGroq(
    GLOBAL_PROMPT,
    `Transcript de closing avec "${name}" :\n\n${truncated}`,
    2500,
  );
  const global = JSON.parse(globalRaw);

  // Step 4: Combine
  const structured: StructuredAnalysis = {
    ...global,
    pareto: global.pareto ?? [],
    annotated_transcript: annotated,
  };

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
