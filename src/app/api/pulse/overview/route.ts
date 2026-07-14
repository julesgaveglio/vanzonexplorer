import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { CHANNEL_LABELS, type Channel } from "@/lib/channel-classifier";

const CONVERSION_EVENTS = [
  "booking_click", "whatsapp_click", "roadtrip_lead", "resource_download",
  "vsl_cta_click", "contact_submit", "optin", "purchase",
];
const PERIOD_DAYS: Record<string, number> = { day: 1, week: 7, month: 30, year: 365 };

// Pages internes / techniques à exclure des "top pages"
function isPublicPage(p: string | null): boolean {
  if (!p) return false;
  return !p.startsWith("/admin") && !p.startsWith("/pulse") && !p.startsWith("/api");
}

interface Row {
  event: string; channel: string | null; landing_page: string | null;
  page: string | null; session_id: string | null; created_at: string;
}

function aggregate(rows: Row[]) {
  const visitors = new Set<string>();
  const byChannelVisitors = new Map<string, Set<string>>();
  const byChannelConv = new Map<string, number>();
  const byPageViews = new Map<string, number>();
  const convByType = new Map<string, number>();
  let pageViews = 0;
  let conversions = 0;

  for (const r of rows) {
    const ch = r.channel ?? "direct";
    if (r.session_id) {
      visitors.add(r.session_id);
      if (!byChannelVisitors.has(ch)) byChannelVisitors.set(ch, new Set());
      byChannelVisitors.get(ch)!.add(r.session_id);
    }
    if (r.event === "page_view") {
      pageViews++;
      if (isPublicPage(r.page)) byPageViews.set(r.page!, (byPageViews.get(r.page!) ?? 0) + 1);
    }
    if (CONVERSION_EVENTS.includes(r.event)) {
      conversions++;
      byChannelConv.set(ch, (byChannelConv.get(ch) ?? 0) + 1);
      convByType.set(r.event, (convByType.get(r.event) ?? 0) + 1);
    }
  }

  const channels = Array.from(byChannelVisitors.entries())
    .map(([ch, set]) => ({
      channel: ch,
      label: CHANNEL_LABELS[ch as Channel] ?? ch,
      visitors: set.size,
      conversions: byChannelConv.get(ch) ?? 0,
      conversionRate: set.size > 0 ? (byChannelConv.get(ch) ?? 0) / set.size : 0,
    }))
    .sort((a, b) => b.visitors - a.visitors);

  const topPages = Array.from(byPageViews.entries())
    .map(([page, views]) => ({ page, views }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 5);

  const conversionTypes = Array.from(convByType.entries())
    .map(([event, count]) => ({ event, count }))
    .sort((a, b) => b.count - a.count);

  return {
    visitors: visitors.size,
    pageViews,
    conversions,
    channels,
    topPages,
    conversionTypes,
  };
}

export async function GET(req: NextRequest) {
  const adminCheck = await requireAdmin();
  if (adminCheck instanceof NextResponse) return adminCheck;

  const supabase = createSupabaseAdmin();
  const period = req.nextUrl.searchParams.get("period") ?? "week";
  const days = PERIOD_DAYS[period] ?? 7;

  const now = Date.now();
  const currentSince = new Date(now - days * 864e5).toISOString();
  const prevSince = new Date(now - days * 2 * 864e5).toISOString();

  const { data, error } = await supabase
    .from("funnel_events")
    .select("event, channel, landing_page, page, session_id, created_at")
    .gte("created_at", prevSince)
    .limit(50000);

  if (error) {
    console.error("[pulse/overview] error:", error);
    return NextResponse.json({ error: "query failed" }, { status: 500 });
  }

  const all = (data ?? []) as Row[];
  const current = all.filter((r) => r.created_at >= currentSince);
  const previous = all.filter((r) => r.created_at < currentSince);

  const cur = aggregate(current);
  const prev = aggregate(previous);

  // Tendance visiteurs vs période précédente
  const visitorsDelta = prev.visitors > 0
    ? (cur.visitors - prev.visitors) / prev.visitors
    : (cur.visitors > 0 ? 1 : 0);

  // Trend quotidien (sparkline)
  const dayBuckets = new Map<string, Set<string>>();
  for (const r of current) {
    const d = r.created_at.slice(0, 10);
    if (!dayBuckets.has(d)) dayBuckets.set(d, new Set());
    if (r.session_id) dayBuckets.get(d)!.add(r.session_id);
  }
  const trend: { date: string; visitors: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now - i * 864e5).toISOString().slice(0, 10);
    trend.push({ date: d, visitors: dayBuckets.get(d)?.size ?? 0 });
  }

  // ── Insights dirigés ──
  const topChannel = cur.channels[0] ?? null;
  const topPage = cur.topPages[0] ?? null;
  const bestConverting = cur.channels
    .filter((c) => c.visitors >= 3)
    .sort((a, b) => b.conversionRate - a.conversionRate)[0] ?? null;

  let headline: string;
  if (cur.visitors === 0) {
    headline = "Pas encore de trafic sur cette période. La collecte tourne — reviens plus tard.";
  } else if (topChannel) {
    const share = Math.round((topChannel.visitors / cur.visitors) * 100);
    headline = `${topChannel.label} est ton canal n°1 (${share}% du trafic).`;
  } else {
    headline = "";
  }

  return NextResponse.json({
    period,
    totals: {
      visitors: cur.visitors,
      pageViews: cur.pageViews,
      conversions: cur.conversions,
      conversionRate: cur.visitors > 0 ? cur.conversions / cur.visitors : 0,
    },
    visitorsDelta,
    trend,
    topChannel,
    topPage,
    bestConverting,
    channels: cur.channels,
    topPages: cur.topPages,
    conversionTypes: cur.conversionTypes,
    headline,
  });
}
