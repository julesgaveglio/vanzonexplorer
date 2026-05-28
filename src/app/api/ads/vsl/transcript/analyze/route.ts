import { NextRequest, NextResponse } from "next/server";
import { requireAdsAuth } from "@/lib/ads-auth";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { groqWithFallback } from "@/lib/groq-with-fallback";

// POST — AI analyzes transcript + retention data → hook suggestions + optimized version
export async function POST(req: NextRequest) {
  const check = await requireAdsAuth();
  if (check instanceof NextResponse) return check;

  const { versionId } = await req.json();
  if (!versionId) {
    return NextResponse.json({ error: "versionId required" }, { status: 400 });
  }

  const sb = createSupabaseAdmin();

  // 1. Get transcript
  const { data: version } = await sb
    .from("vsl_versions")
    .select("id, name, transcript_srt, transcript_text")
    .eq("id", versionId)
    .single();

  if (!version || (!version.transcript_srt && !version.transcript_text)) {
    return NextResponse.json(
      { error: "Aucun transcript pour cette version" },
      { status: 400 }
    );
  }

  // 2. Get retention exit data
  const { data: exitEvents } = await sb
    .from("funnel_events")
    .select("metadata")
    .in("event", ["vsl_exit", "vsl_25", "vsl_50", "vsl_75", "vsl_100"])
    .not("metadata", "is", null);

  const exitSeconds: number[] = [];
  for (const e of exitEvents ?? []) {
    const meta = e.metadata as Record<string, unknown> | null;
    if (!meta || meta.vsl_version_id !== versionId) continue;
    if (typeof meta.seconds === "number" && meta.seconds > 0) {
      exitSeconds.push(Math.round(meta.seconds));
    }
  }

  // 3. Build retention buckets (30s)
  const bucketSize = 30;
  const maxSec = Math.max(...exitSeconds, 300);
  const totalViewers = exitSeconds.length || 1;
  const buckets: { start: number; end: number; retention: number; exits: number }[] = [];

  for (let t = 0; t < maxSec; t += bucketSize) {
    const exitsInBucket = exitSeconds.filter((s) => s >= t && s < t + bucketSize).length;
    const exitsBefore = exitSeconds.filter((s) => s < t + bucketSize).length;
    const retention = Math.round(((totalViewers - exitsBefore) / totalViewers) * 100);
    buckets.push({ start: t, end: t + bucketSize, retention: Math.max(retention, 0), exits: exitsInBucket });
  }

  // 4. Parse SRT into text segments with timestamps
  const segments = parseSRTForAnalysis(version.transcript_srt ?? "");
  const hasSegments = segments.length > 0;

  // 5. Build context for AI
  const transcriptContext = hasSegments
    ? segments
        .map((s) => `[${formatTime(s.startSec)}-${formatTime(s.endSec)}] ${s.text}`)
        .join("\n")
    : version.transcript_text ?? "";

  const retentionContext = buckets
    .map((b) => `${formatTime(b.start)}-${formatTime(b.end)}: ${b.retention}% retention (${b.exits} sorties)`)
    .join("\n");

  const dropZones = buckets.filter((b, i, arr) => {
    if (i === 0) return false;
    return arr[i - 1].retention - b.retention > 5;
  });

  const dropContext = dropZones.length > 0
    ? dropZones
        .map((z) => `${formatTime(z.start)}: retention chute a ${z.retention}% (${z.exits} sorties)`)
        .join("\n")
    : "Pas de zone de drop-off majeure detectee";

  // 6. AI Analysis
  const systemPrompt = `Tu es un expert en retention video et copywriting VSL (Video Sales Letter).
Tu analyses des transcripts de VSL avec leurs donnees de retention pour suggerer des hooks strategiques.

TYPES DE HOOKS A UTILISER :
- PATTERN INTERRUPT : casse le rythme, surprend le spectateur (ex: "Stop. Relis ce que je viens de dire.")
- OPEN LOOP : cree une question en suspens (ex: "Et la, il s'est passe un truc que personne n'avait prevu...")
- CURIOSITY GAP : tease une info a venir (ex: "Dans 2 minutes je te montre exactement comment...")
- PROOF DROP : insere une preuve sociale au bon moment (ex: "C'est exactement ce qu'a fait Marc, et en 3 mois...")
- DIRECT QUESTION : interpelle directement (ex: "Est-ce que toi aussi tu as deja ressenti ca ?")
- REFRAME : change la perspective (ex: "La question n'est pas si c'est possible, mais pourquoi tu ne l'as pas encore fait")
- MICRO-COMMITMENT : obtient un petit oui mental (ex: "Si tu es encore la, c'est que ca te parle...")
- TENSION EMOTIONNELLE : amplifie l'emotion du moment (ex: pause, repetition, contraste avant/apres)

REGLES :
- Place les hooks 10-20 secondes AVANT chaque zone de drop-off (pour prevenir l'abandon)
- Ajoute aussi des hooks reguliers toutes les 60-90 secondes meme sans drop-off (maintenir l'attention)
- Chaque hook doit etre naturel dans le flow de la VSL, pas force
- Les hooks doivent correspondre au ton de la VSL (analyse le style de l'auteur)
- Genere entre 8 et 15 hooks pour une VSL de 10-15 min

IMPORTANT : Reponds UNIQUEMENT en JSON valide, sans markdown, sans code fence.`;

  const userPrompt = `Analyse cette VSL et genere des hooks pour maximiser la retention.

=== TRANSCRIPT ===
${transcriptContext}

=== RETENTION PAR TRANCHE DE 30s ===
${retentionContext}

=== ZONES DE DROP-OFF ===
${dropContext}

=== TOTAL SPECTATEURS : ${exitSeconds.length} ===

Reponds en JSON avec cette structure exacte :
{
  "analysis": "Resume de 2-3 phrases de ton diagnostic global sur la retention",
  "hooks": [
    {
      "atSecond": 45,
      "type": "PATTERN INTERRUPT",
      "suggestion": "Texte exact du hook a inserer",
      "reason": "Pourquoi ce hook a cet endroit",
      "priority": "high"
    }
  ],
  "optimized_script": "Le script complet reecrit avec les hooks integres naturellement. Marque chaque hook avec [HOOK: TYPE] avant le texte du hook."
}`;

  try {
    const result = await groqWithFallback({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 8000,
      response_format: { type: "json_object" },
    });

    let parsed;
    try {
      parsed = JSON.parse(result.content);
    } catch {
      return NextResponse.json(
        { error: "Erreur parsing AI response", raw: result.content.slice(0, 500) },
        { status: 500 }
      );
    }

    // Save hook suggestions to DB
    if (parsed.hooks?.length) {
      await sb
        .from("vsl_versions")
        .update({ hook_suggestions: parsed.hooks })
        .eq("id", versionId);
    }

    return NextResponse.json({
      analysis: parsed.analysis ?? "",
      hooks: parsed.hooks ?? [],
      optimized_script: parsed.optimized_script ?? "",
      model_used: result.modelUsed,
      retention_summary: {
        total_viewers: exitSeconds.length,
        drop_zones: dropZones.length,
        avg_retention: buckets.length > 0
          ? Math.round(buckets.reduce((s, b) => s + b.retention, 0) / buckets.length)
          : 0,
      },
    });
  } catch (err) {
    console.error("[vsl-transcript-analyze]", err);
    return NextResponse.json(
      { error: "Erreur lors de l'analyse IA" },
      { status: 500 }
    );
  }
}

function parseSRTForAnalysis(srt: string) {
  if (!srt) return [];
  const blocks = srt.trim().split(/\n\n+/);
  const segments: { startSec: number; endSec: number; text: string }[] = [];

  for (const block of blocks) {
    const lines = block.trim().split("\n");
    if (lines.length < 3) continue;
    const timeLine = lines[1];
    const text = lines.slice(2).join(" ");
    const m = timeLine.match(/(\d{2}:\d{2}:\d{2}[,.]\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}[,.]\d{3})/);
    if (!m) continue;
    segments.push({ startSec: toSec(m[1]), endSec: toSec(m[2]), text });
  }
  return segments;
}

function toSec(t: string): number {
  const [h, m, rest] = t.split(":");
  const [s, ms] = rest.replace(",", ".").split(".");
  return parseInt(h) * 3600 + parseInt(m) * 60 + parseInt(s) + parseInt(ms ?? "0") / 1000;
}

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}
