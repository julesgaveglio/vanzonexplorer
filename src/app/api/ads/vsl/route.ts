import { NextRequest, NextResponse } from "next/server";
import { requireAdsAuth } from "@/lib/ads-auth";
import { createSupabaseAdmin } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const check = await requireAdsAuth();
  if (check instanceof NextResponse) return check;

  const supabase = createSupabaseAdmin();
  const params = req.nextUrl.searchParams;
  const days = parseInt(params.get("days") ?? "30");
  const since = new Date(Date.now() - days * 86400000).toISOString();

  // Get all VSL events
  const { data: events } = await supabase
    .from("funnel_events")
    .select("event, email, session_id, created_at, metadata")
    .in("event", ["vsl_view", "vsl_25", "vsl_50", "vsl_75", "vsl_100", "vsl_exit"])
    .gte("created_at", since)
    .order("created_at", { ascending: false });

  const allEvents = events ?? [];

  // Unique viewers per milestone (for backward compat KPIs)
  const milestones = ["vsl_view", "vsl_25", "vsl_50", "vsl_75", "vsl_100"];
  const milestoneCounts: Record<string, number> = {};
  for (const m of milestones) {
    const unique = new Set(
      allEvents.filter((e) => e.event === m).map((e) => e.email || e.session_id || "anon")
    );
    milestoneCounts[m] = unique.size;
  }

  const totalViewers = milestoneCounts.vsl_view || 0;

  // --- PRECISE RETENTION CURVE from vsl_exit events ---
  // Group by viewer (email or session_id), take max seconds watched per viewer
  const viewerMaxSeconds: Record<string, number> = {};
  let maxDuration = 0;

  for (const e of allEvents) {
    const uid = e.email || e.session_id || "anon";
    const meta = e.metadata as Record<string, unknown> | null;

    if (e.event === "vsl_exit" && meta && typeof meta.seconds === "number") {
      viewerMaxSeconds[uid] = Math.max(viewerMaxSeconds[uid] ?? 0, meta.seconds);
      if (meta.duration && typeof meta.duration === "number" && meta.duration > maxDuration) {
        maxDuration = meta.duration;
      }
    }

    // Also count milestone viewers who didn't get an exit event
    if (e.event === "vsl_100") {
      // They watched to the end — estimate full duration
      const dur = meta?.duration as number | undefined;
      if (dur) {
        viewerMaxSeconds[uid] = Math.max(viewerMaxSeconds[uid] ?? 0, dur);
        if (dur > maxDuration) maxDuration = dur;
      }
    }
  }

  // Build retention curve with 10-second buckets
  const bucketSize = 10; // seconds
  const numBuckets = maxDuration > 0 ? Math.ceil(maxDuration / bucketSize) : 0;
  const totalExitViewers = Object.keys(viewerMaxSeconds).length;

  const retention: { time: number; label: string; viewers: number; pct: number }[] = [];

  if (totalExitViewers > 0 && numBuckets > 0) {
    for (let i = 0; i <= numBuckets; i++) {
      const t = i * bucketSize;
      // Count viewers who watched at least t seconds
      const still = Object.values(viewerMaxSeconds).filter((s) => s >= t).length;
      const minutes = Math.floor(t / 60);
      const secs = t % 60;
      retention.push({
        time: t,
        label: `${minutes}:${secs.toString().padStart(2, "0")}`,
        viewers: still,
        pct: Math.round((still / totalExitViewers) * 100),
      });
    }
  }

  // If no precise data yet, fall back to milestone-based curve converted to real timestamps
  // VSL duration = 12 minutes (720 seconds)
  const VSL_DURATION = 720;
  const hasPreciseData = retention.length > 0;
  if (!hasPreciseData && maxDuration === 0) maxDuration = VSL_DURATION;

  const fmt = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  const fallbackRetention = !hasPreciseData
    ? [
        { time: 0, label: fmt(0), viewers: milestoneCounts.vsl_view ?? 0, pct: 100 },
        { time: Math.round(VSL_DURATION * 0.25), label: fmt(Math.round(VSL_DURATION * 0.25)), viewers: milestoneCounts.vsl_25 ?? 0, pct: totalViewers > 0 ? Math.round(((milestoneCounts.vsl_25 ?? 0) / totalViewers) * 100) : 0 },
        { time: Math.round(VSL_DURATION * 0.50), label: fmt(Math.round(VSL_DURATION * 0.50)), viewers: milestoneCounts.vsl_50 ?? 0, pct: totalViewers > 0 ? Math.round(((milestoneCounts.vsl_50 ?? 0) / totalViewers) * 100) : 0 },
        { time: Math.round(VSL_DURATION * 0.75), label: fmt(Math.round(VSL_DURATION * 0.75)), viewers: milestoneCounts.vsl_75 ?? 0, pct: totalViewers > 0 ? Math.round(((milestoneCounts.vsl_75 ?? 0) / totalViewers) * 100) : 0 },
        { time: VSL_DURATION, label: fmt(VSL_DURATION), viewers: milestoneCounts.vsl_100 ?? 0, pct: totalViewers > 0 ? Math.round(((milestoneCounts.vsl_100 ?? 0) / totalViewers) * 100) : 0 },
      ]
    : [];

  // Daily VSL views
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const dayMap: Record<string, { date: string; views: number; completions: number }> = {};
  const cursor = new Date(since);
  cursor.setUTCHours(0, 0, 0, 0);
  while (cursor <= today) {
    const key = cursor.toISOString().slice(0, 10);
    dayMap[key] = { date: key, views: 0, completions: 0 };
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  for (const e of allEvents) {
    const day = e.created_at?.slice(0, 10);
    if (!day || !dayMap[day]) continue;
    if (e.event === "vsl_view") dayMap[day].views++;
    if (e.event === "vsl_100") dayMap[day].completions++;
  }

  const daily = Object.values(dayMap).sort((a, b) => a.date.localeCompare(b.date));

  // Drop-off zones with real timestamps
  const dropoffs = [
    { zone: `${fmt(0)} → ${fmt(Math.round(VSL_DURATION * 0.25))}`, lost: (milestoneCounts.vsl_view ?? 0) - (milestoneCounts.vsl_25 ?? 0), rate: (milestoneCounts.vsl_view ?? 0) > 0 ? Math.round((((milestoneCounts.vsl_view ?? 0) - (milestoneCounts.vsl_25 ?? 0)) / (milestoneCounts.vsl_view ?? 0)) * 100) : 0 },
    { zone: `${fmt(Math.round(VSL_DURATION * 0.25))} → ${fmt(Math.round(VSL_DURATION * 0.50))}`, lost: (milestoneCounts.vsl_25 ?? 0) - (milestoneCounts.vsl_50 ?? 0), rate: (milestoneCounts.vsl_25 ?? 0) > 0 ? Math.round((((milestoneCounts.vsl_25 ?? 0) - (milestoneCounts.vsl_50 ?? 0)) / (milestoneCounts.vsl_25 ?? 0)) * 100) : 0 },
    { zone: `${fmt(Math.round(VSL_DURATION * 0.50))} → ${fmt(Math.round(VSL_DURATION * 0.75))}`, lost: (milestoneCounts.vsl_50 ?? 0) - (milestoneCounts.vsl_75 ?? 0), rate: (milestoneCounts.vsl_50 ?? 0) > 0 ? Math.round((((milestoneCounts.vsl_50 ?? 0) - (milestoneCounts.vsl_75 ?? 0)) / (milestoneCounts.vsl_50 ?? 0)) * 100) : 0 },
    { zone: `${fmt(Math.round(VSL_DURATION * 0.75))} → ${fmt(VSL_DURATION)}`, lost: (milestoneCounts.vsl_75 ?? 0) - (milestoneCounts.vsl_100 ?? 0), rate: (milestoneCounts.vsl_75 ?? 0) > 0 ? Math.round((((milestoneCounts.vsl_75 ?? 0) - (milestoneCounts.vsl_100 ?? 0)) / (milestoneCounts.vsl_75 ?? 0)) * 100) : 0 },
  ];

  return NextResponse.json({
    retention: hasPreciseData ? retention : fallbackRetention,
    has_precise_data: hasPreciseData,
    daily,
    dropoffs,
    total_viewers: totalViewers,
    completion_rate: totalViewers > 0 ? Math.round(((milestoneCounts.vsl_100 ?? 0) / totalViewers) * 100) : 0,
    max_duration: maxDuration,
  });
}
