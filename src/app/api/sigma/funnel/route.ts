import { NextRequest, NextResponse } from "next/server";
import { requireSigmaAuth } from "../_helpers/auth";
import { createSupabaseAdmin } from "@/lib/supabase/server";

const EXCLUDED_EMAILS = ["gavegliojules@gmail.com", "jules@vanzonexplorer.com"];

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
] as const;

const DAILY_KEYS = ["page_view", "optin", "booking_confirmed"] as const;

export async function GET(req: NextRequest) {
  const check = await requireSigmaAuth();
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
  type FunnelEvent = {
    event: string;
    email: string | null;
    session_id: string | null;
    created_at: string | null;
    utm_source: string | null;
    utm_campaign: string | null;
  };
  const allEvents: FunnelEvent[] = [];
  let offset = 0;
  while (true) {
    let q = supabase
      .from("sigma_funnel_events")
      .select("event, email, session_id, created_at, utm_source, utm_campaign")
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
  const funnel: Record<string, number> = {};
  for (const step of FUNNEL_STEPS) {
    const uniqueKeys = new Set(
      allEvents
        .filter((e) => e.event === step)
        .map((e) => e.email || e.session_id || "anon")
    );
    funnel[step] = uniqueKeys.size;
  }

  // Source breakdown (optins by utm_source)
  const sourceMap: Record<string, number> = {};
  for (const e of allEvents.filter((ev) => ev.event === "optin")) {
    const src = e.utm_source || "direct";
    sourceMap[src] = (sourceMap[src] ?? 0) + 1;
  }
  const sources = Object.entries(sourceMap)
    .map(([source, count]) => ({ source, count }))
    .sort((a, b) => b.count - a.count);

  // Daily breakdown
  const sinceDate = new Date(since);
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const endBound = until ? new Date(until) : today;
  endBound.setUTCHours(0, 0, 0, 0);
  if (endBound > today) endBound.setTime(today.getTime());

  const dayMap: Record<string, Record<string, number>> = {};
  const cursor = new Date(sinceDate);
  cursor.setUTCHours(0, 0, 0, 0);

  while (cursor <= endBound) {
    const key = cursor.toISOString().slice(0, 10);
    dayMap[key] = { page_view: 0, optin: 0, booking_confirmed: 0 };
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  for (const eventKey of DAILY_KEYS) {
    const dayUniques: Record<string, Set<string>> = {};
    for (const e of allEvents.filter((ev) => ev.event === eventKey)) {
      const day = e.created_at?.slice(0, 10);
      if (!day || !dayMap[day]) continue;
      if (!dayUniques[day]) dayUniques[day] = new Set();
      dayUniques[day].add(e.email || e.session_id || "anon");
    }
    for (const [day, set] of Object.entries(dayUniques)) {
      if (dayMap[day]) dayMap[day][eventKey] = set.size;
    }
  }

  const daily = Object.entries(dayMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, counts]) => ({ date, ...counts }));

  return NextResponse.json({ funnel, daily, sources });
}
