import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { CHANNEL_LABELS, type Channel } from "@/lib/channel-classifier";

// Events comptés comme "conversions" dans le dashboard analytics
const CONVERSION_EVENTS = [
  "booking_click",
  "whatsapp_click",
  "roadtrip_lead",
  "resource_download",
  "vsl_cta_click",
  "contact_submit",
  "optin",
  "purchase",
];

const PERIOD_DAYS: Record<string, number> = {
  day: 1,
  week: 7,
  month: 30,
  year: 365,
};

export async function GET(req: NextRequest) {
  const adminCheck = await requireAdmin();
  if (adminCheck instanceof NextResponse) return adminCheck;

  const supabase = createSupabaseAdmin();
  const period = req.nextUrl.searchParams.get("period") ?? "month";
  const days = PERIOD_DAYS[period] ?? 30;
  const since = new Date(Date.now() - days * 864e5).toISOString();

  // On récupère les colonnes utiles ; funnel_events reste léger (pas de body volumineux)
  const { data, error } = await supabase
    .from("funnel_events")
    .select("event, channel, landing_page, session_id, created_at")
    .gte("created_at", since)
    .limit(50000);

  if (error) {
    console.error("[admin/analytics] error:", error);
    return NextResponse.json({ error: "query failed" }, { status: 500 });
  }

  const rows = data ?? [];

  // ── Agrégation par canal ──
  type ChannelStat = {
    channel: string;
    label: string;
    visitors: Set<string>;
    pageViews: number;
    conversions: number;
  };
  const byChannel = new Map<string, ChannelStat>();

  const ensure = (ch: string): ChannelStat => {
    if (!byChannel.has(ch)) {
      byChannel.set(ch, {
        channel: ch,
        label: CHANNEL_LABELS[ch as Channel] ?? ch,
        visitors: new Set(),
        pageViews: 0,
        conversions: 0,
      });
    }
    return byChannel.get(ch)!;
  };

  const allVisitors = new Set<string>();
  let totalPageViews = 0;
  let totalConversions = 0;
  const conversionsByType = new Map<string, number>();
  const blogVisitors = new Set<string>();

  for (const r of rows) {
    const ch = r.channel ?? "direct";
    const stat = ensure(ch);
    if (r.session_id) {
      stat.visitors.add(r.session_id);
      allVisitors.add(r.session_id);
    }
    if (r.event === "page_view") {
      stat.pageViews++;
      totalPageViews++;
      if (r.landing_page?.startsWith("/articles/") && r.session_id) {
        blogVisitors.add(r.session_id);
      }
    }
    if (CONVERSION_EVENTS.includes(r.event)) {
      stat.conversions++;
      totalConversions++;
      conversionsByType.set(r.event, (conversionsByType.get(r.event) ?? 0) + 1);
    }
  }

  const channels = Array.from(byChannel.values())
    .map((s) => ({
      channel: s.channel,
      label: s.label,
      visitors: s.visitors.size,
      pageViews: s.pageViews,
      conversions: s.conversions,
      conversionRate: s.visitors.size > 0 ? s.conversions / s.visitors.size : 0,
    }))
    .sort((a, b) => b.visitors - a.visitors);

  const conversionTypes = Array.from(conversionsByType.entries())
    .map(([event, count]) => ({ event, count }))
    .sort((a, b) => b.count - a.count);

  return NextResponse.json({
    period,
    totals: {
      visitors: allVisitors.size,
      pageViews: totalPageViews,
      conversions: totalConversions,
      conversionRate: allVisitors.size > 0 ? totalConversions / allVisitors.size : 0,
      blogVisitors: blogVisitors.size,
    },
    channels,
    conversionTypes,
  });
}
