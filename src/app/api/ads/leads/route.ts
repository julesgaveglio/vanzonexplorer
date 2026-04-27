import { NextRequest, NextResponse } from "next/server";
import { requireAdsAuth } from "@/lib/ads-auth";
import { createSupabaseAdmin } from "@/lib/supabase/server";

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

  let query = supabase
    .from("funnel_events")
    .select("email, metadata, utm_source, utm_campaign, utm_content, created_at")
    .eq("event", "optin")
    .gte("created_at", since)
    .order("created_at", { ascending: false });

  if (until) {
    query = query.lte("created_at", until);
  }

  const { data } = await query;

  const leads = (data ?? []).map((row) => ({
    email: row.email,
    firstname: typeof row.metadata === "object" && row.metadata !== null
      ? (row.metadata as Record<string, unknown>).firstname ?? null
      : null,
    utm_source: row.utm_source,
    utm_campaign: row.utm_campaign,
    utm_content: row.utm_content,
    created_at: row.created_at,
  }));

  return NextResponse.json({ leads });
}
