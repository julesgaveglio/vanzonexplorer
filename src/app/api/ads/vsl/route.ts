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

  // Fetch VSL versions
  const { data: versions } = await supabase
    .from("vsl_versions")
    .select("id, name, color, is_active, created_at")
    .order("created_at", { ascending: true });

  // Fetch all VSL events
  const { data: events } = await supabase
    .from("funnel_events")
    .select("event, email, session_id, created_at, metadata")
    .in("event", ["vsl_view", "vsl_25", "vsl_50", "vsl_75", "vsl_100", "vsl_exit"])
    .gte("created_at", since)
    .order("created_at", { ascending: false });

  const allEvents = events ?? [];
  const allVersions = versions ?? [];

  // Build per-version stats
  const versionStats = allVersions.map((v) => {
    const versionEvents = allEvents.filter((e) => {
      const vid = (e.metadata as Record<string, unknown>)?.vsl_version_id;
      if (!vid) return v.id === allVersions[0]?.id;
      return vid === v.id;
    });

    // Unique viewers per milestone
    const milestones = ["vsl_view", "vsl_25", "vsl_50", "vsl_75", "vsl_100"];
    const milestoneCounts: Record<string, number> = {};
    for (const m of milestones) {
      const unique = new Set(
        versionEvents.filter((e) => e.event === m).map((e) => e.email || e.session_id || "anon")
      );
      milestoneCounts[m] = unique.size;
    }

    const totalViewers = milestoneCounts.vsl_view || 0;

    // Precise retention curve from vsl_exit
    const viewerMaxSeconds: Record<string, number> = {};
    let maxDuration = 0;

    for (const e of versionEvents) {
      const uid = e.email || e.session_id || "anon";
      const meta = e.metadata as Record<string, unknown> | null;

      if (meta && typeof meta.seconds === "number") {
        // vsl_exit, vsl_25, vsl_50, vsl_75, vsl_100 — all carry seconds now
        if (e.event === "vsl_exit" || e.event === "vsl_100" || e.event === "vsl_75" || e.event === "vsl_50" || e.event === "vsl_25") {
          viewerMaxSeconds[uid] = Math.max(viewerMaxSeconds[uid] ?? 0, meta.seconds);
        }
        if (meta.duration && typeof meta.duration === "number" && meta.duration > maxDuration) {
          maxDuration = meta.duration;
        }
      }
    }

    const bucketSize = 10;
    const numBuckets = maxDuration > 0 ? Math.ceil(maxDuration / bucketSize) : 0;
    const totalExitViewers = Object.keys(viewerMaxSeconds).length;

    const retention: { time: number; label: string; pct: number }[] = [];
    const hasPreciseData = totalExitViewers > 0 && numBuckets > 0 && totalViewers > 0;

    if (hasPreciseData) {
      // Viewers without vsl_exit are assumed still watching (not counted as dropped)
      // exitedBefore(t) = viewers whose max watched seconds < t
      // stillWatching(t) = totalViewers - exitedBefore(t)
      for (let i = 0; i <= numBuckets; i++) {
        const t = i * bucketSize;
        const exitedBefore = Object.values(viewerMaxSeconds).filter((s) => s < t).length;
        const still = totalViewers - exitedBefore;
        const minutes = Math.floor(t / 60);
        const secs = t % 60;
        retention.push({
          time: t,
          label: `${minutes}:${secs.toString().padStart(2, "0")}`,
          pct: Math.round((still / totalViewers) * 100),
        });
      }
    }

    // Milestone fallback
    const VSL_DURATION = 730;
    const fmt = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
    const fallbackRetention = !hasPreciseData
      ? [
          { time: 0, label: fmt(0), pct: 100 },
          { time: Math.round(VSL_DURATION * 0.25), label: fmt(Math.round(VSL_DURATION * 0.25)), pct: totalViewers > 0 ? Math.round(((milestoneCounts.vsl_25 ?? 0) / totalViewers) * 100) : 0 },
          { time: Math.round(VSL_DURATION * 0.50), label: fmt(Math.round(VSL_DURATION * 0.50)), pct: totalViewers > 0 ? Math.round(((milestoneCounts.vsl_50 ?? 0) / totalViewers) * 100) : 0 },
          { time: Math.round(VSL_DURATION * 0.75), label: fmt(Math.round(VSL_DURATION * 0.75)), pct: totalViewers > 0 ? Math.round(((milestoneCounts.vsl_75 ?? 0) / totalViewers) * 100) : 0 },
          { time: VSL_DURATION, label: fmt(VSL_DURATION), pct: totalViewers > 0 ? Math.round(((milestoneCounts.vsl_100 ?? 0) / totalViewers) * 100) : 0 },
        ]
      : [];

    // Drop-off zones
    const dropoffs = [
      { zone: `0% → 25%`, lost: (milestoneCounts.vsl_view ?? 0) - (milestoneCounts.vsl_25 ?? 0), rate: totalViewers > 0 ? Math.round((((milestoneCounts.vsl_view ?? 0) - (milestoneCounts.vsl_25 ?? 0)) / (milestoneCounts.vsl_view ?? 1)) * 100) : 0 },
      { zone: `25% → 50%`, lost: (milestoneCounts.vsl_25 ?? 0) - (milestoneCounts.vsl_50 ?? 0), rate: (milestoneCounts.vsl_25 ?? 0) > 0 ? Math.round((((milestoneCounts.vsl_25 ?? 0) - (milestoneCounts.vsl_50 ?? 0)) / (milestoneCounts.vsl_25 ?? 1)) * 100) : 0 },
      { zone: `50% → 75%`, lost: (milestoneCounts.vsl_50 ?? 0) - (milestoneCounts.vsl_75 ?? 0), rate: (milestoneCounts.vsl_50 ?? 0) > 0 ? Math.round((((milestoneCounts.vsl_50 ?? 0) - (milestoneCounts.vsl_75 ?? 0)) / (milestoneCounts.vsl_50 ?? 1)) * 100) : 0 },
      { zone: `75% → 100%`, lost: (milestoneCounts.vsl_75 ?? 0) - (milestoneCounts.vsl_100 ?? 0), rate: (milestoneCounts.vsl_75 ?? 0) > 0 ? Math.round((((milestoneCounts.vsl_75 ?? 0) - (milestoneCounts.vsl_100 ?? 0)) / (milestoneCounts.vsl_75 ?? 1)) * 100) : 0 },
    ];

    return {
      id: v.id,
      name: v.name,
      color: v.color,
      is_active: v.is_active,
      total_viewers: totalViewers,
      completion_rate: totalViewers > 0 ? Math.round(((milestoneCounts.vsl_100 ?? 0) / totalViewers) * 100) : 0,
      retention: hasPreciseData ? retention : fallbackRetention,
      has_precise_data: hasPreciseData,
      max_duration: maxDuration || VSL_DURATION,
      dropoffs,
    };
  });

  // Daily views (all versions combined)
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

  return NextResponse.json({ versions: versionStats, daily });
}
