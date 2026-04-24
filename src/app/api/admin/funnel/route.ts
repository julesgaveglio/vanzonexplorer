import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/server";

const FUNNEL_STEPS = [
  "page_view",
  "optin",
  "vsl_view",
  "vsl_25",
  "vsl_50",
  "vsl_75",
  "vsl_100",
  "booking_start",
  "booking_confirmed",
  "checkout",
  "purchase",
] as const;

export async function GET(req: NextRequest) {
  const adminCheck = await requireAdmin();
  if (adminCheck instanceof NextResponse) return adminCheck;

  const supabase = createSupabaseAdmin();
  const params = req.nextUrl.searchParams;

  // Support campaign filter (date range) or days
  const startDate = params.get("start");
  const endDate = params.get("end");
  const days = parseInt(params.get("days") ?? "30");

  const since = startDate
    ? new Date(startDate).toISOString()
    : new Date(Date.now() - days * 86400000).toISOString();
  const until = endDate
    ? new Date(new Date(endDate).getTime() + 86400000).toISOString()
    : undefined;

  // Get events
  let query = supabase
    .from("funnel_events")
    .select("event, email, session_id, created_at, utm_source, utm_campaign")
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
    ["optin", "vsl_view"],
    ["vsl_view", "vsl_50"],
    ["vsl_50", "vsl_100"],
    ["vsl_view", "booking_start"],
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
  const utmBreakdown: Record<
    string,
    { source: string; campaign: string; count: number }
  > = {};
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

  // Estimated revenue
  const estimatedRevenue = (stepCounts.purchase ?? 0) * 997;

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
  });
}
