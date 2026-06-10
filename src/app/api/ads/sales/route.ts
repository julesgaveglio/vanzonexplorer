import { NextResponse } from "next/server";
import { requireAdsAuth } from "@/lib/ads-auth";
import { createSupabaseAdmin } from "@/lib/supabase/server";

export async function GET() {
  const check = await requireAdsAuth();
  if (check instanceof NextResponse) return check;

  const supabase = createSupabaseAdmin();

  // 1. Get all purchase events from funnel_events
  const { data: purchaseEvents } = await supabase
    .from("funnel_events")
    .select("email, created_at, metadata, utm_source, utm_medium, utm_campaign, utm_content")
    .eq("event", "purchase")
    .order("created_at", { ascending: false });

  // 2. Get all VBA members from profiles
  const { data: members } = await supabase
    .from("profiles")
    .select("clerk_id, email, full_name, plan, created_at")
    .eq("plan", "vba_member");

  // 3. Get funnel leads for UTM + optin date
  const allEmails = Array.from(
    new Set([
      ...(purchaseEvents ?? []).map((e) => e.email).filter(Boolean),
      ...(members ?? []).map((m) => m.email).filter(Boolean),
    ])
  ) as string[];

  const { data: leads } = allEmails.length > 0
    ? await supabase
        .from("vba_funnel_leads")
        .select("email, firstname, utm_source, utm_medium, utm_campaign, utm_content, created_at, phone")
        .in("email", allEmails)
    : { data: [] };

  const leadMap = new Map((leads ?? []).map((l) => [l.email, l]));
  const purchaseMap = new Map(
    (purchaseEvents ?? []).map((e) => [e.email, e])
  );

  // Build unified sales list — one entry per VBA member
  const memberEmails = new Set((members ?? []).map((m) => m.email));
  // Also include purchase events for emails not yet in profiles (edge case)
  for (const pe of purchaseEvents ?? []) {
    if (pe.email) memberEmails.add(pe.email);
  }

  const sales = Array.from(memberEmails).map((email) => {
    const member = (members ?? []).find((m) => m.email === email);
    const purchase = purchaseMap.get(email);
    const lead = leadMap.get(email);

    const meta = (purchase?.metadata ?? {}) as Record<string, unknown>;

    return {
      email,
      full_name: member?.full_name ?? lead?.firstname ?? null,
      phone: lead?.phone ?? null,
      amount: typeof meta.amount === "number" ? meta.amount : null,
      payment_type: typeof meta.payment_type === "string" ? meta.payment_type : null,
      promo_code: typeof meta.promo_code === "string" ? meta.promo_code : null,
      stripe_session_id: typeof meta.stripe_session_id === "string" ? meta.stripe_session_id : null,
      // Purchase date from funnel_events, fallback to profile creation
      purchased_at: purchase?.created_at ?? member?.created_at ?? null,
      // UTM: prefer purchase event UTMs, fallback to lead UTMs
      utm_source: purchase?.utm_source ?? lead?.utm_source ?? null,
      utm_medium: purchase?.utm_medium ?? lead?.utm_medium ?? null,
      utm_campaign: purchase?.utm_campaign ?? lead?.utm_campaign ?? null,
      utm_content: purchase?.utm_content ?? lead?.utm_content ?? null,
      // Optin date (first funnel touch)
      optin_at: lead?.created_at ?? null,
      // Member profile creation
      member_since: member?.created_at ?? null,
    };
  });

  // Sort by purchase date desc
  sales.sort((a, b) => {
    const da = a.purchased_at ? new Date(a.purchased_at).getTime() : 0;
    const db = b.purchased_at ? new Date(b.purchased_at).getTime() : 0;
    return db - da;
  });

  // KPIs
  const totalRevenue = sales.reduce((sum, s) => sum + (s.amount ?? 0), 0);
  const avgTicket = sales.length > 0 ? totalRevenue / sales.length : 0;
  const paymentTypes = { "1x": 0, "4x": 0, unknown: 0 };
  for (const s of sales) {
    if (s.payment_type === "1x") paymentTypes["1x"]++;
    else if (s.payment_type === "4x") paymentTypes["4x"]++;
    else paymentTypes.unknown++;
  }

  // Source breakdown
  const sourceCount: Record<string, number> = {};
  for (const s of sales) {
    const src = s.utm_source || "direct";
    sourceCount[src] = (sourceCount[src] ?? 0) + 1;
  }

  // Promo code breakdown
  const promoCount: Record<string, number> = {};
  for (const s of sales) {
    const code = s.promo_code && s.promo_code !== "none" ? s.promo_code : "Sans code";
    promoCount[code] = (promoCount[code] ?? 0) + 1;
  }

  return NextResponse.json({
    sales,
    kpis: {
      total_sales: sales.length,
      total_revenue: totalRevenue,
      avg_ticket: avgTicket,
      payment_types: paymentTypes,
      source_breakdown: sourceCount,
      promo_breakdown: promoCount,
    },
  });
}
