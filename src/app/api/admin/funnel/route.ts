import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/server";

const FUNNEL_STEPS = [
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
  const days = parseInt(req.nextUrl.searchParams.get("days") ?? "30");
  const since = new Date(Date.now() - days * 86400000).toISOString();

  // Get event counts
  const { data: events } = await supabase
    .from("funnel_events")
    .select("event, email, session_id, created_at, utm_source, utm_campaign")
    .gte("created_at", since)
    .order("created_at", { ascending: false });

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

  // Conversion rates between steps
  const conversionRates: { from: string; to: string; rate: number }[] = [];
  for (let i = 0; i < FUNNEL_STEPS.length - 1; i++) {
    const from = FUNNEL_STEPS[i];
    const to = FUNNEL_STEPS[i + 1];
    const fromCount = stepCounts[from];
    const toCount = stepCounts[to];
    conversionRates.push({
      from,
      to,
      rate: fromCount > 0 ? Math.round((toCount / fromCount) * 100) : 0,
    });
  }

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

  // Overall conversion: optin → purchase
  const overallRate =
    stepCounts.optin > 0
      ? Math.round((stepCounts.purchase / stepCounts.optin) * 100 * 10) / 10
      : 0;

  return NextResponse.json({
    period_days: days,
    step_counts: stepCounts,
    conversion_rates: conversionRates,
    utm_breakdown: Object.values(utmBreakdown).sort((a, b) => b.count - a.count),
    recent_events: recentEvents,
    overall_conversion: overallRate,
    total_events: allEvents.length,
  });
}
