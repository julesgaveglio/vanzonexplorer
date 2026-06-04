import { NextRequest, NextResponse } from "next/server";
import { requireSigmaAuth } from "../_helpers/auth";
import { createSupabaseAdmin } from "@/lib/supabase/server";

const EXCLUDED_EMAILS = ["gavegliojules@gmail.com", "jules@vanzonexplorer.com"];

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

  // Paginate
  const PAGE = 1000;
  type EventRow = { event: string; email: string | null; session_id: string | null };
  const allEvents: EventRow[] = [];
  let offset = 0;
  while (true) {
    let q = supabase
      .from("sigma_funnel_events")
      .select("event, email, session_id")
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

  const views = new Set(
    allEvents.filter((e) => e.event === "page_view").map((e) => e.session_id || "anon")
  ).size;
  const optins = new Set(
    allEvents.filter((e) => e.event === "optin").map((e) => e.email || "anon")
  ).size;
  const rate = views > 0 ? Math.round((optins / views) * 100 * 10) / 10 : 0;

  return NextResponse.json({ views, optins, rate });
}
