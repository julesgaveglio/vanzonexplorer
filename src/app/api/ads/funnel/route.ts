import { NextRequest, NextResponse } from "next/server";
import { requireMediaBuyer } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/server";

const FUNNEL_STEPS = [
  "page_view",
  "optin",
  "vsl_25",
  "vsl_50",
  "vsl_75",
  "vsl_100",
  "booking_start",
  "booking_confirmed",
  "checkout",
  "purchase",
] as const;

const DAILY_KEYS = ["page_view", "optin", "booking_confirmed", "purchase"] as const;

export async function GET(req: NextRequest) {
  const check = await requireMediaBuyer();
  if (check instanceof NextResponse) return check;

  const supabase = createSupabaseAdmin();
  const params = req.nextUrl.searchParams;

  const startDate = params.get("start");
  const endDate = params.get("end");
  const days = parseInt(params.get("days") ?? "30");

  const since = startDate
    ? new Date(startDate).toISOString()
    : new Date(Date.now() - days * 86400000).toISOString();
  const until = endDate
    ? new Date(new Date(endDate).getTime() + 86400000).toISOString()
    : undefined;

  let query = supabase
    .from("funnel_events")
    .select("event, email, session_id, created_at, utm_source, utm_campaign, utm_content")
    .gte("created_at", since)
    .order("created_at", { ascending: false });

  if (until) {
    query = query.lte("created_at", until);
  }

  const { data: events } = await query;
  const allEvents = events ?? [];

  // Count unique sessions/emails per step
  const stepCounts: Record<string, number> = {};
  for (const step of FUNNEL_STEPS) {
    const uniqueKeys = new Set(
      allEvents
        .filter((e) => e.event === step)
        .map((e) => e.email || e.session_id || "anon")
    );
    stepCounts[step] = uniqueKeys.size;
  }

  // Conversion rates between key steps
  const KEY_CONVERSIONS: [string, string][] = [
    ["page_view", "optin"],
    ["optin", "vsl_50"],
    ["vsl_50", "vsl_75"],
    ["vsl_75", "vsl_100"],
    ["optin", "booking_start"],
    ["booking_start", "booking_confirmed"],
    ["booking_confirmed", "checkout"],
    ["checkout", "purchase"],
  ];

  const conversionRates = KEY_CONVERSIONS.map(([from, to]) => {
    const fromCount = stepCounts[from] ?? 0;
    const toCount = stepCounts[to] ?? 0;
    return {
      from,
      to,
      rate: fromCount > 0 ? Math.round((toCount / fromCount) * 100) : 0,
    };
  });

  // UTM breakdown
  const utmBreakdown: Record<string, { source: string; campaign: string; count: number }> = {};
  for (const e of allEvents.filter((ev) => ev.event === "optin")) {
    const key = `${e.utm_source || "direct"}|${e.utm_campaign || "none"}`;
    if (!utmBreakdown[key]) {
      utmBreakdown[key] = {
        source: e.utm_source || "direct",
        campaign: e.utm_campaign || "(aucune)",
        count: 0,
      };
    }
    utmBreakdown[key].count++;
  }

  // Recent events (last 50)
  const recentEvents = allEvents.slice(0, 50).map((e) => ({
    event: e.event,
    email: e.email,
    created_at: e.created_at,
    utm_source: e.utm_source,
  }));

  // Overall conversions
  const overallOptinToPurchase =
    stepCounts.optin > 0
      ? Math.round((stepCounts.purchase / stepCounts.optin) * 100 * 10) / 10
      : 0;
  const viewToOptin =
    stepCounts.page_view > 0
      ? Math.round((stepCounts.optin / stepCounts.page_view) * 100 * 10) / 10
      : 0;

  const estimatedRevenue = (stepCounts.purchase ?? 0) * 997;

  // Daily breakdown — fill in missing days with zeros
  const sinceDate = new Date(since);
  const untilDate = until ? new Date(until) : new Date();
  const dayMap: Record<string, Record<string, number>> = {};

  // Initialize all days
  const cursor = new Date(sinceDate);
  cursor.setUTCHours(0, 0, 0, 0);
  const endBound = new Date(untilDate);
  endBound.setUTCHours(0, 0, 0, 0);

  while (cursor <= endBound) {
    const key = cursor.toISOString().slice(0, 10);
    dayMap[key] = { page_view: 0, optin: 0, booking_confirmed: 0, purchase: 0 };
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  // Fill with actual counts (unique per email/session per day per event)
  for (const eventKey of DAILY_KEYS) {
    const dayUniques: Record<string, Set<string>> = {};
    for (const e of allEvents.filter((ev) => ev.event === eventKey)) {
      const day = e.created_at?.slice(0, 10);
      if (!day || !dayMap[day]) continue;
      if (!dayUniques[day]) dayUniques[day] = new Set();
      const uid = e.email || e.session_id || "anon";
      dayUniques[day].add(uid);
    }
    for (const [day, set] of Object.entries(dayUniques)) {
      if (dayMap[day]) dayMap[day][eventKey] = set.size;
    }
  }

  const daily_breakdown = Object.entries(dayMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, counts]) => ({ date, ...counts }));

  return NextResponse.json({
    period: { since, until: until ?? null },
    step_counts: stepCounts,
    conversion_rates: conversionRates,
    utm_breakdown: Object.values(utmBreakdown).sort((a, b) => b.count - a.count),
    recent_events: recentEvents,
    overall_conversion: overallOptinToPurchase,
    view_to_optin: viewToOptin,
    total_events: allEvents.length,
    estimated_revenue: estimatedRevenue,
    daily_breakdown,
  });
}
