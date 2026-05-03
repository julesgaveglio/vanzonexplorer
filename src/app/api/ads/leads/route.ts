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

  const EXCLUDED_EMAILS = ["gavegliojules@gmail.com"];

  // Paginate — Supabase caps at 1000 rows per request
  const PAGE = 1000;
  const data: { email: string | null; metadata: unknown; utm_source: string | null; utm_campaign: string | null; utm_content: string | null; created_at: string | null }[] = [];
  let offset = 0;
  while (true) {
    let q = supabase
      .from("funnel_events")
      .select("email, metadata, utm_source, utm_campaign, utm_content, created_at")
      .eq("event", "optin")
      .gte("created_at", since)
      .not("email", "in", `(${EXCLUDED_EMAILS.join(",")})`)
      .order("created_at", { ascending: false })
      .range(offset, offset + PAGE - 1);
    if (until) q = q.lte("created_at", until);
    const { data: page } = await q;
    if (!page || page.length === 0) break;
    data.push(...page);
    if (page.length < PAGE) break;
    offset += PAGE;
  }

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

export async function DELETE(req: NextRequest) {
  const check = await requireAdsAuth();
  if (check instanceof NextResponse) return check;

  const { email } = await req.json();
  if (!email) return NextResponse.json({ error: "email required" }, { status: 400 });

  const supabase = createSupabaseAdmin();

  // Delete all funnel events for this email
  const { error: funnelErr } = await supabase
    .from("funnel_events")
    .delete()
    .eq("email", email);

  // Also delete from vba_funnel_leads if exists
  const { error: leadErr } = await supabase
    .from("vba_funnel_leads")
    .delete()
    .eq("email", email);

  if (funnelErr || leadErr) {
    console.error("[ads/leads DELETE]", funnelErr, leadErr);
    return NextResponse.json({ error: "delete failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
