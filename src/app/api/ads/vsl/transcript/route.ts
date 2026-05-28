import { NextRequest, NextResponse } from "next/server";
import { requireAdsAuth } from "@/lib/ads-auth";
import { createSupabaseAdmin } from "@/lib/supabase/server";

// GET — fetch transcript + retention data + hook suggestions for a VSL version
export async function GET(req: NextRequest) {
  const check = await requireAdsAuth();
  if (check instanceof NextResponse) return check;

  const sb = createSupabaseAdmin();
  const versionId = req.nextUrl.searchParams.get("versionId");

  if (!versionId) {
    return NextResponse.json({ error: "versionId required" }, { status: 400 });
  }

  // 1. Get VSL version with transcript
  const { data: version } = await sb
    .from("vsl_versions")
    .select("id, name, transcript_srt, transcript_text, hook_suggestions")
    .eq("id", versionId)
    .single();

  if (!version) {
    return NextResponse.json({ error: "Version not found" }, { status: 404 });
  }

  // 2. Get retention data (exit seconds)
  const { data: exitEvents } = await sb
    .from("funnel_events")
    .select("metadata")
    .in("event", ["vsl_exit", "vsl_25", "vsl_50", "vsl_75", "vsl_100"])
    .not("metadata", "is", null);

  // Filter by version and collect exit seconds
  const exitSeconds: number[] = [];
  for (const e of exitEvents ?? []) {
    const meta = e.metadata as Record<string, unknown> | null;
    if (!meta) continue;
    if (meta.vsl_version_id !== versionId) continue;
    if (typeof meta.seconds === "number" && meta.seconds > 0) {
      exitSeconds.push(Math.round(meta.seconds));
    }
  }

  // 3. Build drop-off heatmap (30-second buckets)
  const bucketSize = 30;
  const maxSec = Math.max(...exitSeconds, 800);
  const buckets: { start: number; end: number; exits: number; cumulative_retention: number }[] = [];
  const totalViewers = exitSeconds.length > 0 ? exitSeconds.length : 1;

  for (let t = 0; t < maxSec; t += bucketSize) {
    const exitsInBucket = exitSeconds.filter((s) => s >= t && s < t + bucketSize).length;
    const exitsBefore = exitSeconds.filter((s) => s < t + bucketSize).length;
    const retention = Math.round(((totalViewers - exitsBefore) / totalViewers) * 100);
    buckets.push({
      start: t,
      end: t + bucketSize,
      exits: exitsInBucket,
      cumulative_retention: Math.max(retention, 0),
    });
  }

  // 4. Parse SRT into segments
  const segments = parseSRT(version.transcript_srt ?? "");

  return NextResponse.json({
    version: {
      id: version.id,
      name: version.name,
    },
    transcript_text: version.transcript_text ?? "",
    segments,
    retention_buckets: buckets,
    total_exits: exitSeconds.length,
    hook_suggestions: version.hook_suggestions ?? [],
  });
}

// PATCH — save transcript or hook suggestions
export async function PATCH(req: NextRequest) {
  const check = await requireAdsAuth();
  if (check instanceof NextResponse) return check;

  const { versionId, transcript_srt, transcript_text, hook_suggestions } = await req.json();
  if (!versionId) {
    return NextResponse.json({ error: "versionId required" }, { status: 400 });
  }

  const sb = createSupabaseAdmin();
  const updates: Record<string, unknown> = {};
  if (transcript_srt !== undefined) updates.transcript_srt = transcript_srt;
  if (transcript_text !== undefined) updates.transcript_text = transcript_text;
  if (hook_suggestions !== undefined) updates.hook_suggestions = hook_suggestions;

  const { error } = await sb
    .from("vsl_versions")
    .update(updates)
    .eq("id", versionId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// Parse SRT format into segments
interface SRTSegment {
  index: number;
  startSec: number;
  endSec: number;
  startLabel: string;
  endLabel: string;
  text: string;
}

function parseSRT(srt: string): SRTSegment[] {
  if (!srt) return [];
  const blocks = srt.trim().split(/\n\n+/);
  const segments: SRTSegment[] = [];

  for (const block of blocks) {
    const lines = block.trim().split("\n");
    if (lines.length < 3) continue;

    const index = parseInt(lines[0]);
    const timeLine = lines[1];
    const text = lines.slice(2).join(" ");

    const timeMatch = timeLine.match(/(\d{2}:\d{2}:\d{2}[,.]\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}[,.]\d{3})/);
    if (!timeMatch) continue;

    segments.push({
      index,
      startSec: srtTimeToSeconds(timeMatch[1]),
      endSec: srtTimeToSeconds(timeMatch[2]),
      startLabel: timeMatch[1].replace(",", ".").slice(0, 8),
      endLabel: timeMatch[2].replace(",", ".").slice(0, 8),
      text,
    });
  }

  return segments;
}

function srtTimeToSeconds(time: string): number {
  const [h, m, rest] = time.split(":");
  const [s, ms] = rest.replace(",", ".").split(".");
  return parseInt(h) * 3600 + parseInt(m) * 60 + parseInt(s) + (parseInt(ms ?? "0") / 1000);
}
