import { NextRequest, NextResponse } from "next/server";
import { requireAdsAuth } from "@/lib/ads-auth";
import { createSupabaseAdmin } from "@/lib/supabase/server";

const EXCLUDED_EMAILS = ["gavegliojules@gmail.com"];

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

  // 1. Get optin events (leads)
  const PAGE = 1000;
  const optinRows: { email: string | null; metadata: unknown; utm_source: string | null; utm_campaign: string | null; utm_content: string | null; created_at: string | null }[] = [];
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
    optinRows.push(...page);
    if (page.length < PAGE) break;
    offset += PAGE;
  }

  // Collect unique emails
  const emails = Array.from(new Set(
    optinRows.map((r) => r.email).filter(Boolean) as string[]
  ));

  // 2. Get firstnames + qualification data from vba_funnel_leads
  const { data: funnelLeads } = emails.length > 0
    ? await supabase
        .from("vba_funnel_leads")
        .select("email, firstname, phone, q_objective, q_profile, q_budget, is_hot, lead_status")
        .in("email", emails)
    : { data: [] };
  const firstnameMap = new Map(
    (funnelLeads ?? []).map((l) => [l.email, l.firstname])
  );
  const qualMap = new Map(
    (funnelLeads ?? []).map((l) => [l.email, {
      phone: l.phone as string | null,
      q_objective: l.q_objective as string | null,
      q_profile: l.q_profile as string | null,
      q_budget: l.q_budget as string | null,
      is_hot: l.is_hot as boolean | null,
      lead_status: (l.lead_status as string | null) ?? "new",
    }])
  );

  // 3. Get VSL watch time (max seconds from vsl_exit + milestones)
  const { data: vslEvents } = emails.length > 0
    ? await supabase
        .from("funnel_events")
        .select("email, event, metadata")
        .in("email", emails)
        .in("event", ["vsl_exit", "vsl_25", "vsl_50", "vsl_75", "vsl_100"])
    : { data: [] };

  const watchTimeMap = new Map<string, number>();
  for (const e of vslEvents ?? []) {
    if (!e.email) continue;
    const meta = e.metadata as Record<string, unknown> | null;
    const seconds = typeof meta?.seconds === "number" ? meta.seconds : 0;
    if (seconds > 0) {
      watchTimeMap.set(e.email, Math.max(watchTimeMap.get(e.email) ?? 0, seconds));
    }
  }

  // 4. Get ALL emails sent per lead + campaign colors
  let emailHistoryMap = new Map<string, { campaign_name: string; sent_at: string; color: string | null }[]>();
  try {
    const { data: sends } = emails.length > 0
      ? await supabase
          .from("email_sends")
          .select("email, campaign_name, sent_at")
          .in("email", emails)
          .order("sent_at", { ascending: false })
      : { data: [] };

    // Get campaign colors
    const { data: campaigns } = await supabase
      .from("email_campaigns")
      .select("name, color");
    const colorMap = new Map((campaigns ?? []).map((c) => [c.name, c.color]));

    for (const s of sends ?? []) {
      const list = emailHistoryMap.get(s.email) ?? [];
      list.push({
        campaign_name: s.campaign_name,
        sent_at: s.sent_at,
        color: colorMap.get(s.campaign_name) ?? null,
      });
      emailHistoryMap.set(s.email, list);
    }
  } catch {
    emailHistoryMap = new Map();
  }

  // 5. Build enriched leads
  const leads = optinRows.map((row) => {
    const email = row.email ?? "";
    const metaFirstname =
      typeof row.metadata === "object" && row.metadata !== null
        ? ((row.metadata as Record<string, unknown>).firstname as string) ?? null
        : null;

    const qual = qualMap.get(email);
    return {
      email,
      firstname: firstnameMap.get(email) ?? metaFirstname ?? null,
      phone: qual?.phone ?? null,
      q_objective: qual?.q_objective ?? null,
      q_profile: qual?.q_profile ?? null,
      q_budget: qual?.q_budget ?? null,
      is_hot: qual?.is_hot ?? null,
      lead_status: qual?.lead_status ?? "new",
      utm_source: row.utm_source,
      utm_campaign: row.utm_campaign,
      utm_content: row.utm_content,
      created_at: row.created_at,
      vsl_seconds: watchTimeMap.get(email) ?? null,
      email_history: emailHistoryMap.get(email) ?? [],
      last_email: (emailHistoryMap.get(email) ?? [])[0] ?? null,
    };
  });

  return NextResponse.json({ leads });
}

export async function PATCH(req: NextRequest) {
  const check = await requireAdsAuth();
  if (check instanceof NextResponse) return check;

  const { email, lead_status } = await req.json();
  if (!email || !lead_status) return NextResponse.json({ error: "email and lead_status required" }, { status: 400 });

  const VALID_STATUSES = ["new", "call_booked", "blacklist", "validated"];
  if (!VALID_STATUSES.includes(lead_status)) {
    return NextResponse.json({ error: "invalid status" }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();
  await supabase.from("vba_funnel_leads").update({ lead_status }).eq("email", email);

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const check = await requireAdsAuth();
  if (check instanceof NextResponse) return check;

  const { email } = await req.json();
  if (!email) return NextResponse.json({ error: "email required" }, { status: 400 });

  const supabase = createSupabaseAdmin();

  await Promise.all([
    supabase.from("funnel_events").delete().eq("email", email),
    supabase.from("vba_funnel_leads").delete().eq("email", email),
  ]);

  return NextResponse.json({ ok: true });
}
