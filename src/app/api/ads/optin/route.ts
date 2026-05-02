import { NextRequest, NextResponse } from "next/server";
import { requireAdsAuth } from "@/lib/ads-auth";
import { createSupabaseAdmin } from "@/lib/supabase/server";

const EXCLUDED_EMAILS = ["gavegliojules@gmail.com"];

const OPTIN_PAGES = [
  { slug: "v1", page: "/van-business-academy/inscription", label: "Opt-in V1" },
  { slug: "v2", page: "/van-business-academy/inscription-v2", label: "Opt-in V2" },
];

export async function GET(req: NextRequest) {
  const check = await requireAdsAuth();
  if (check instanceof NextResponse) return check;

  const supabase = createSupabaseAdmin();
  const params = req.nextUrl.searchParams;
  const days = parseInt(params.get("days") ?? "30");
  const since = new Date(Date.now() - days * 86400000).toISOString();

  const { data: events } = await supabase
    .from("funnel_events")
    .select("event, page, email, session_id, created_at")
    .in("event", ["page_view", "optin"])
    .gte("created_at", since)
    .or(`email.is.null,email.not.in.(${EXCLUDED_EMAILS.join(",")})`)
    .order("created_at", { ascending: false });

  const allEvents = events ?? [];

  // Per-page stats
  const pages = OPTIN_PAGES.map(({ slug, page, label }) => {
    const views = new Set(
      allEvents
        .filter((e) => e.event === "page_view" && e.page === page)
        .map((e) => e.email || e.session_id || "anon")
    ).size;

    const optins = new Set(
      allEvents
        .filter((e) => e.event === "optin" && e.page === page)
        .map((e) => e.email || e.session_id || "anon")
    ).size;

    const rate = views > 0 ? Math.round((optins / views) * 100 * 10) / 10 : 0;

    return { slug, label, views, optins, rate };
  });

  // Total — global uniques (pas la somme par page, pour éviter les doublons cross-page)
  const allPages = OPTIN_PAGES.map((p) => p.page);
  const totalViews = new Set(
    allEvents
      .filter((e) => e.event === "page_view" && allPages.includes(e.page ?? ""))
      .map((e) => e.email || e.session_id || "anon")
  ).size;
  const totalOptins = new Set(
    allEvents
      .filter((e) => e.event === "optin" && allPages.includes(e.page ?? ""))
      .map((e) => e.email || e.session_id || "anon")
  ).size;
  const totalRate = totalViews > 0 ? Math.round((totalOptins / totalViews) * 100 * 10) / 10 : 0;

  // Daily breakdown per page
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const dayMap: Record<string, Record<string, { views: number; optins: number }>> = {};
  const cursor = new Date(since);
  cursor.setUTCHours(0, 0, 0, 0);
  while (cursor <= today) {
    const key = cursor.toISOString().slice(0, 10);
    dayMap[key] = {};
    for (const { slug } of OPTIN_PAGES) {
      dayMap[key][slug] = { views: 0, optins: 0 };
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  for (const e of allEvents) {
    const day = e.created_at?.slice(0, 10);
    if (!day || !dayMap[day]) continue;
    const match = OPTIN_PAGES.find((p) => p.page === e.page);
    if (!match) continue;
    if (e.event === "page_view") dayMap[day][match.slug].views++;
    if (e.event === "optin") dayMap[day][match.slug].optins++;
  }

  const daily = Object.entries(dayMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, slugs]) => ({ date, ...slugs }));

  return NextResponse.json({
    pages,
    total: { views: totalViews, optins: totalOptins, rate: totalRate },
    daily,
  });
}
