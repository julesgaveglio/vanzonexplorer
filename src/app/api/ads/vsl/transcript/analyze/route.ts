import { NextRequest, NextResponse } from "next/server";
import { requireAdsAuth } from "@/lib/ads-auth";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { groqWithFallback } from "@/lib/groq-with-fallback";

// POST — AI analyzes transcript + retention data → segment-level edits + quality scores
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

  // 6. Calculate total duration from segments
  const totalDuration = hasSegments
    ? Math.ceil((segments.at(-1)?.endSec ?? 0) / 30)
    : Math.ceil(maxSec / 30);

  // Build zone list for scoring (30s zones)
  const zoneCount = Math.max(totalDuration, buckets.length);
  const zoneLabels = Array.from({ length: zoneCount }, (_, i) =>
    `${fmtTime(i * 30)}-${fmtTime((i + 1) * 30)}`
  );

  // 7. AI prompt
  const systemPrompt = `Tu es un expert en retention video et copywriting VSL.
Tu analyses des transcripts pour proposer des EDITS precis et SCORER la qualite de chaque zone.

TON ROLE :
1. Evaluer la qualite de retention du script zone par zone (toutes les 30 secondes)
2. Proposer des modifications chirurgicales aux points faibles

SCORING PAR ZONE (0-100) :
- 90-100 : excellent — hook fort, emotion, tension, le spectateur est captive
- 70-89 : bon — contenu interessant, rythme correct
- 50-69 : moyen — passage un peu plat, risque de decrochage
- 30-49 : faible — trop technique, monotone, pas d'engagement
- 0-29 : critique — le spectateur quitte probablement ici

CRITERES DE SCORING :
- Presence de hooks ou pattern interrupts
- Variation du rythme (pas de monologue plat trop long)
- Engagement emotionnel (histoires, questions, preuves)
- Clarte du message (pas trop technique sans payoff)
- Tension narrative (open loops, curiosity gaps actifs)

TYPES DE HOOKS :
- PATTERN INTERRUPT : casse le rythme
- OPEN LOOP : question en suspens
- CURIOSITY GAP : tease une info
- PROOF DROP : preuve sociale
- DIRECT QUESTION : interpelle
- REFRAME : change la perspective
- MICRO-COMMITMENT : petit oui mental
- TRANSITION : liaison engageante

REGLES EDITS :
- Max 6 a 10 edits pour 10-15 min
- Minimum 60 secondes entre chaque edit
- Place les edits AVANT les zones faibles
- Ton naturel : tutoiement, direct, van life
- Pour "replace" : donne le texte original exact + le nouveau
- Pour "insert_after" : donne juste le nouveau texte

JSON valide uniquement.`;

  const userPrompt = `Analyse cette VSL. Score chaque zone de 30s et propose des edits.

=== TRANSCRIPT ===
${numberedTranscript}

=== RETENTION REELLE ===
${retentionContext}

=== ZONES DE DROP-OFF ===
${dropContext}

=== ${zoneCount} ZONES A SCORER ===
${zoneLabels.join(", ")}

Reponds en JSON :
{
  "analysis": "Diagnostic 2-3 phrases",
  "zone_scores": [
    { "zone": "0:00-0:30", "score": 85, "note": "Hook fort, bonne intro" },
    { "zone": "0:30-1:00", "score": 55, "note": "Passage technique sans hook" }
  ],
  "edits": [
    {
      "segment_index": 15,
      "at_time": "1:12",
      "type": "replace",
      "hook_type": "OPEN LOOP",
      "original_text": "texte exact a remplacer",
      "new_text": "nouveau texte avec hook",
      "reason": "pourquoi cet edit",
      "score_impact": 25
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
      max_tokens: 6000,
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
    const dbData = { edits: parsed.edits ?? [], zone_scores: parsed.zone_scores ?? [] };
    await sb
      .from("vsl_versions")
      .update({ hook_suggestions: dbData })
      .eq("id", versionId);

    return NextResponse.json({
      analysis: parsed.analysis ?? "",
      edits: parsed.edits ?? [],
      zone_scores: parsed.zone_scores ?? [],
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
