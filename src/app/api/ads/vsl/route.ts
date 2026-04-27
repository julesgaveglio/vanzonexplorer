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

  const { data: events } = await supabase
    .from("funnel_events")
    .select("event, email, session_id, created_at")
    .in("event", ["vsl_view", "vsl_25", "vsl_50", "vsl_75", "vsl_100"])
    .gte("created_at", since)
    .order("created_at", { ascending: false });

  const allEvents = events ?? [];

  // Unique viewers per milestone
  const milestones = ["vsl_view", "vsl_25", "vsl_50", "vsl_75", "vsl_100"];
  const milestoneCounts: Record<string, number> = {};
  for (const m of milestones) {
    const unique = new Set(
      allEvents.filter((e) => e.event === m).map((e) => e.email || e.session_id || "anon")
    );
    milestoneCounts[m] = unique.size;
  }

  // Retention curve data (for the chart)
  const totalViewers = milestoneCounts.vsl_view || 1;
  const retention = [
    { point: "0%", label: "Début", viewers: milestoneCounts.vsl_view ?? 0, pct: 100 },
    { point: "25%", label: "25%", viewers: milestoneCounts.vsl_25 ?? 0, pct: Math.round(((milestoneCounts.vsl_25 ?? 0) / totalViewers) * 100) },
    { point: "50%", label: "50%", viewers: milestoneCounts.vsl_50 ?? 0, pct: Math.round(((milestoneCounts.vsl_50 ?? 0) / totalViewers) * 100) },
    { point: "75%", label: "75%", viewers: milestoneCounts.vsl_75 ?? 0, pct: Math.round(((milestoneCounts.vsl_75 ?? 0) / totalViewers) * 100) },
    { point: "100%", label: "Fin", viewers: milestoneCounts.vsl_100 ?? 0, pct: Math.round(((milestoneCounts.vsl_100 ?? 0) / totalViewers) * 100) },
  ];

  // Daily VSL views
  const dayMap: Record<string, { date: string; views: number; completions: number }> = {};
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
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

  // Drop-off zones (biggest losses)
  const dropoffs = [
    { zone: "0% → 25%", lost: (milestoneCounts.vsl_view ?? 0) - (milestoneCounts.vsl_25 ?? 0), rate: milestoneCounts.vsl_view > 0 ? Math.round(((milestoneCounts.vsl_view - (milestoneCounts.vsl_25 ?? 0)) / milestoneCounts.vsl_view) * 100) : 0 },
    { zone: "25% → 50%", lost: (milestoneCounts.vsl_25 ?? 0) - (milestoneCounts.vsl_50 ?? 0), rate: (milestoneCounts.vsl_25 ?? 0) > 0 ? Math.round((((milestoneCounts.vsl_25 ?? 0) - (milestoneCounts.vsl_50 ?? 0)) / (milestoneCounts.vsl_25 ?? 0)) * 100) : 0 },
    { zone: "50% → 75%", lost: (milestoneCounts.vsl_50 ?? 0) - (milestoneCounts.vsl_75 ?? 0), rate: (milestoneCounts.vsl_50 ?? 0) > 0 ? Math.round((((milestoneCounts.vsl_50 ?? 0) - (milestoneCounts.vsl_75 ?? 0)) / (milestoneCounts.vsl_50 ?? 0)) * 100) : 0 },
    { zone: "75% → 100%", lost: (milestoneCounts.vsl_75 ?? 0) - (milestoneCounts.vsl_100 ?? 0), rate: (milestoneCounts.vsl_75 ?? 0) > 0 ? Math.round((((milestoneCounts.vsl_75 ?? 0) - (milestoneCounts.vsl_100 ?? 0)) / (milestoneCounts.vsl_75 ?? 0)) * 100) : 0 },
  ];

  return NextResponse.json({
    retention,
    daily,
    dropoffs,
    total_viewers: milestoneCounts.vsl_view ?? 0,
    completion_rate: milestoneCounts.vsl_view > 0 ? Math.round(((milestoneCounts.vsl_100 ?? 0) / milestoneCounts.vsl_view) * 100) : 0,
  });
}
