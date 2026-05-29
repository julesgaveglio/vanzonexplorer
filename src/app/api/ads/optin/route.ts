import { NextRequest, NextResponse } from "next/server";
import { requireAdsAuth } from "@/lib/ads-auth";
import { createSupabaseAdmin } from "@/lib/supabase/server";

const EXCLUDED_EMAILS = ["gavegliojules@gmail.com"];
const INSCRIPTION_PAGE = "/van-business-academy/inscription";

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

  // Paginate — Supabase caps at 1000 rows per request
  const PAGE = 1000;
  const allEvents: { event: string; page: string | null; email: string | null; session_id: string | null; created_at: string | null }[] = [];
  let offset = 0;
  while (true) {
    let q = supabase
      .from("funnel_events")
      .select("event, page, email, session_id, created_at")
      .in("event", ["page_view", "optin"])
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

  // Count unique viewers/optins
  const countUnique = (evts: typeof allEvents, event: string) =>
    new Set(evts.filter((e) => e.event === event).map((e) => e.email || e.session_id || "anon")).size;

  const totalViews = countUnique(allEvents, "page_view");
  const totalOptins = countUnique(allEvents, "optin");
  const totalRate = totalViews > 0 ? Math.round((totalOptins / totalViews) * 100 * 10) / 10 : 0;

  // Daily breakdown
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const dayMap: Record<string, { views: number; optins: number }> = {};
  const cursor = new Date(since);
  cursor.setUTCHours(0, 0, 0, 0);
  while (cursor <= today) {
    const key = cursor.toISOString().slice(0, 10);
    dayMap[key] = { views: 0, optins: 0 };
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  const optinPageEvents = allEvents.filter(
    (e) => e.page === INSCRIPTION_PAGE
  );
  for (const e of optinPageEvents) {
    const day = e.created_at?.slice(0, 10);
    if (!day || !dayMap[day]) continue;
    if (e.event === "page_view") dayMap[day].views++;
    if (e.event === "optin") dayMap[day].optins++;
  }

  const daily = Object.entries(dayMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, stats]) => ({ date, ...stats }));

  return NextResponse.json({
    total: { views: totalViews, optins: totalOptins, rate: totalRate },
    daily,
  });
}
