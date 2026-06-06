import { NextRequest, NextResponse } from "next/server";
import { requireAdsAuth } from "@/lib/ads-auth";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { fetchMetaInsights } from "@/lib/meta-ads";

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
  const check = await requireAdsAuth();
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

  const EXCLUDED_EMAILS = ["gavegliojules@gmail.com"];

  // Paginate — Supabase caps at 1000 rows per request
  const PAGE = 1000;
  const allEvents: { event: string; email: string | null; session_id: string | null; created_at: string | null; utm_source: string | null; utm_campaign: string | null; utm_content: string | null }[] = [];
  let offset = 0;
  while (true) {
    let q = supabase
      .from("funnel_events")
      .select("event, email, session_id, created_at, utm_source, utm_campaign, utm_content, metadata")
      .gte("created_at", since)
      .or(`email.is.null,email.not.in.(${EXCLUDED_EMAILS.join(",")})`)
      .order("created_at", { ascending: false })
      .range(offset, offset + PAGE - 1);
    if (until) q = q.lte("created_at", until);
    const { data } = await q;
    if (!data || data.length === 0) break;
    allEvents.push(...data);
    if (data.length < PAGE) break;
    offset += PAGE;
  }

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

  // Source breakdown (optins by utm_source, normalized)
  const sourceBreakdown: Record<string, number> = {};
  for (const e of allEvents.filter((ev) => ev.event === "optin")) {
    const src = e.utm_source || "direct";
    const normalized = src.toLowerCase().includes("instagram") || src === "ig" ? "Instagram"
      : src.toLowerCase().includes("facebook") || src === "fb" ? "Facebook"
      : src.charAt(0).toUpperCase() + src.slice(1);
    sourceBreakdown[normalized] = (sourceBreakdown[normalized] ?? 0) + 1;
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

  // Sum real amounts from purchase events (metadata.value or fallback 997)
  const purchaseEvents = allEvents.filter((e) => e.event === "purchase");
  const estimatedRevenue = purchaseEvents.reduce((sum, e) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const meta = ((e as any).metadata ?? {}) as Record<string, unknown>;
    const val = meta.value ?? meta.amount ?? 997;
    return sum + Number(val);
  }, 0);

  // Meta Ads spend — real-time from Meta Marketing API
  const sinceDate10 = since.slice(0, 10);
  const untilDate10 = until ? until.slice(0, 10) : new Date().toISOString().slice(0, 10);
  const meta = await fetchMetaInsights(sinceDate10, untilDate10);
  const metaSpend = meta.spend;

  // Count hot leads only (exclude cold leads from CPL calculation)
  let hotLeadQuery = supabase
    .from("vba_funnel_leads")
    .select("email", { count: "exact", head: true })
    .eq("is_hot", true)
    .gte("created_at", since);
  if (until) hotLeadQuery = hotLeadQuery.lte("created_at", until);
  const { count: hotLeadCount } = await hotLeadQuery;

  const hotCount = hotLeadCount ?? 0;
  const pageViews = stepCounts.page_view ?? 0;
  const cpl = hotCount > 0 ? Math.round((metaSpend / hotCount) * 100) / 100 : 0;
  // Use Meta's own CPC/CPM/CTR (more accurate than our page_view count)
  const cpc = meta.cpc ? Math.round(meta.cpc * 100) / 100 : 0;
  const ctr = meta.ctr ? Math.round(meta.ctr * 10) / 10 : 0;
  const cpm = meta.cpm ? Math.round(meta.cpm * 100) / 100 : 0;
  const costPerView = pageViews > 0 ? Math.round((metaSpend / pageViews) * 100) / 100 : 0;

  // Daily breakdown — fill in missing days with zeros, stop at today
  const sinceDate = new Date(since);
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const endBound = until ? new Date(until) : today;
  endBound.setUTCHours(0, 0, 0, 0);
  // Ensure we don't go past today
  if (endBound > today) endBound.setTime(today.getTime());

  const dayMap: Record<string, Record<string, number>> = {};

  // Initialize all days
  const cursor = new Date(sinceDate);
  cursor.setUTCHours(0, 0, 0, 0);

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
    source_breakdown: Object.entries(sourceBreakdown).map(([source, count]) => ({ source, count })).sort((a, b) => b.count - a.count),
    recent_events: recentEvents,
    overall_conversion: overallOptinToPurchase,
    view_to_optin: viewToOptin,
    total_events: allEvents.length,
    estimated_revenue: estimatedRevenue,
    meta_spend: Math.round(metaSpend * 100) / 100,
    cpl,
    hot_lead_count: hotCount,
    cpc,
    ctr,
    cpm,
    cost_per_view: costPerView,
    daily_breakdown,
  });
}
