import { NextRequest, NextResponse } from "next/server";
import { requireAdsAuth } from "@/lib/ads-auth";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { groqWithFallback } from "@/lib/groq-with-fallback";

// POST — AI analyzes transcript + retention data → segment-level edits
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

  // 4. Parse SRT segments
  const segments = parseSRTForAnalysis(version.transcript_srt ?? "");
  const hasSegments = segments.length > 0;

  // 5. Number each segment for AI reference
  const numberedTranscript = hasSegments
    ? segments
        .map((s, i) => `[#${i}|${fmtTime(s.startSec)}] ${s.text}`)
        .join("\n")
    : version.transcript_text ?? "";

  const retentionContext = buckets
    .map((b) => `${fmtTime(b.start)}-${fmtTime(b.end)}: ${b.retention}% (${b.exits} sorties)`)
    .join("\n");

  const dropZones = buckets.filter((b, i, arr) => {
    if (i === 0) return false;
    return arr[i - 1].retention - b.retention > 5;
  });

  const dropContext = dropZones.length > 0
    ? dropZones
        .map((z) => `${fmtTime(z.start)}: chute a ${z.retention}% (${z.exits} sorties)`)
        .join("\n")
    : "Aucune zone critique detectee";

  // 6. AI prompt — ask for segment-level edits
  const systemPrompt = `Tu es un expert en retention video et copywriting VSL.
Tu analyses des transcripts avec les donnees de retention pour proposer des EDITS precis.

TON ROLE : proposer des modifications chirurgicales du script pour maintenir la retention.
Tu ne changes PAS tout le script. Tu identifies les passages faibles et tu proposes des remplacements.

TYPES DE HOOKS :
- PATTERN INTERRUPT : casse le rythme ("Stop. Relis ce que je viens de dire.")
- OPEN LOOP : question en suspens ("Et la, il s'est passe un truc...")
- CURIOSITY GAP : tease ("Dans 2 minutes je te montre exactement...")
- PROOF DROP : preuve sociale ("C'est ce qu'a fait Marc, en 3 mois...")
- DIRECT QUESTION : interpelle ("Est-ce que toi aussi tu as ressenti ca ?")
- REFRAME : change la perspective
- MICRO-COMMITMENT : petit oui mental ("Si tu es encore la...")
- TRANSITION : phrase de liaison engageante entre deux sections

REGLES STRICTES :
- Maximum 6 a 10 edits pour une VSL de 10-15 min (pas plus, sois strategique)
- Espace les edits : minimum 60 secondes entre chaque edit
- Place les edits 10-20s AVANT les zones de drop-off
- Le texte de remplacement doit etre naturel, meme ton que l'auteur (tutoiement, direct, van life)
- Chaque edit remplace un passage existant OU insere du texte (insert_after_segment)
- Pour un remplacement : donne le texte original exact a barrer + le nouveau texte
- Pour une insertion : donne le numero du segment apres lequel inserer

IMPORTANT : JSON valide uniquement, sans markdown.`;

  const userPrompt = `Analyse cette VSL et propose des edits pour maximiser la retention.

=== TRANSCRIPT (chaque ligne = [#index|timestamp] texte) ===
${numberedTranscript}

=== RETENTION PAR TRANCHE DE 30s ===
${retentionContext}

=== ZONES DE DROP-OFF ===
${dropContext}

=== TOTAL SPECTATEURS : ${exitSeconds.length} ===

Reponds en JSON :
{
  "analysis": "Diagnostic global 2-3 phrases",
  "edits": [
    {
      "segment_index": 15,
      "at_time": "1:12",
      "type": "replace",
      "hook_type": "OPEN LOOP",
      "original_text": "le texte exact du segment a remplacer",
      "new_text": "le nouveau texte avec le hook integre naturellement",
      "reason": "pourquoi cet edit a cet endroit"
    },
    {
      "segment_index": 30,
      "at_time": "2:25",
      "type": "insert_after",
      "hook_type": "DIRECT QUESTION",
      "original_text": "",
      "new_text": "Est-ce que tu te reconnais dans cette situation ?",
      "reason": "relance l'attention apres passage technique"
    }
  ]
}`;

  try {
    const result = await groqWithFallback({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.6,
      max_tokens: 4000,
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

    // Save to DB
    if (parsed.edits?.length) {
      await sb
        .from("vsl_versions")
        .update({ hook_suggestions: parsed.edits })
        .eq("id", versionId);
    }

    return NextResponse.json({
      analysis: parsed.analysis ?? "",
      edits: parsed.edits ?? [],
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

function fmtTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}
