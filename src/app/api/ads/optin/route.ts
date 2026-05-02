import { NextRequest, NextResponse } from "next/server";
import { requireAdsAuth } from "@/lib/ads-auth";
import { createSupabaseAdmin } from "@/lib/supabase/server";

const EXCLUDED_EMAILS = ["gavegliojules@gmail.com"];

// V1 = ancien design (light), V2 = nouveau design (dark) déployé le 2 mai 2026
const V2_CUTOFF = "2026-05-02T18:00:00.000Z";

const INSCRIPTION_PAGE = "/van-business-academy/inscription";
const INSCRIPTION_V2_PAGE = "/van-business-academy/inscription-v2";

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
    .order("created_at", { ascending: false })
    .limit(10000);

  const allEvents = events ?? [];

  // Split events into V1 (before cutoff on /inscription) and V2 (after cutoff on /inscription + all /inscription-v2)
  const v1Events = allEvents.filter(
    (e) => e.page === INSCRIPTION_PAGE && e.created_at && e.created_at < V2_CUTOFF
  );
  const v2Events = allEvents.filter(
    (e) =>
      e.page === INSCRIPTION_V2_PAGE ||
      (e.page === INSCRIPTION_PAGE && e.created_at && e.created_at >= V2_CUTOFF)
  );

  const countUnique = (evts: typeof allEvents, event: string) =>
    new Set(evts.filter((e) => e.event === event).map((e) => e.email || e.session_id || "anon")).size;

  const v1Views = countUnique(v1Events, "page_view");
  const v1Optins = countUnique(v1Events, "optin");
  const v2Views = countUnique(v2Events, "page_view");
  const v2Optins = countUnique(v2Events, "optin");

  const pages = [
    {
      slug: "v1",
      label: "Opt-in V1 (ancien design)",
      views: v1Views,
      optins: v1Optins,
      rate: v1Views > 0 ? Math.round((v1Optins / v1Views) * 100 * 10) / 10 : 0,
    },
    {
      slug: "v2",
      label: "Opt-in V2 (dark theme)",
      views: v2Views,
      optins: v2Optins,
      rate: v2Views > 0 ? Math.round((v2Optins / v2Views) * 100 * 10) / 10 : 0,
    },
  ];

  // Total — global uniques
  const allOptinEvents = allEvents.filter(
    (e) => e.page === INSCRIPTION_PAGE || e.page === INSCRIPTION_V2_PAGE
  );
  const totalViews = countUnique(allOptinEvents, "page_view");
  const totalOptins = countUnique(allOptinEvents, "optin");
  const totalRate = totalViews > 0 ? Math.round((totalOptins / totalViews) * 100 * 10) / 10 : 0;

  // Daily breakdown
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const dayMap: Record<string, Record<string, { views: number; optins: number }>> = {};
  const cursor = new Date(since);
  cursor.setUTCHours(0, 0, 0, 0);
  while (cursor <= today) {
    const key = cursor.toISOString().slice(0, 10);
    dayMap[key] = { v1: { views: 0, optins: 0 }, v2: { views: 0, optins: 0 } };
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  for (const e of allOptinEvents) {
    const day = e.created_at?.slice(0, 10);
    if (!day || !dayMap[day]) continue;
    const isV2 = e.page === INSCRIPTION_V2_PAGE || (e.created_at && e.created_at >= V2_CUTOFF);
    const slug = isV2 ? "v2" : "v1";
    if (e.event === "page_view") dayMap[day][slug].views++;
    if (e.event === "optin") dayMap[day][slug].optins++;
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
