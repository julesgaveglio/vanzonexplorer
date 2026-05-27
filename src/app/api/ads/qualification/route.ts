import { NextRequest, NextResponse } from "next/server";
import { requireAdsAuth } from "@/lib/ads-auth";
import { createSupabaseAdmin } from "@/lib/supabase/server";

const EXCLUDED_EMAILS = ["gavegliojules@gmail.com"];

export async function GET(req: NextRequest) {
  const check = await requireAdsAuth();
  if (check instanceof NextResponse) return check;

  const supabase = createSupabaseAdmin();
  const params = req.nextUrl.searchParams;
  const days = parseInt(params.get("days") ?? "30");
  const campaign = params.get("campaign") ?? "all";

  const since = new Date(Date.now() - days * 86400000).toISOString();

  let query = supabase
    .from("vba_funnel_leads")
    .select("firstname, email, phone, q_objective, q_profile, q_budget, is_hot, utm_campaign, created_at")
    .gte("created_at", since)
    .not("email", "in", `(${EXCLUDED_EMAILS.join(",")})`)
    .order("created_at", { ascending: false });

  if (campaign && campaign !== "all") {
    query = query.eq("utm_campaign", campaign);
  }

  const { data: leads, error } = await query;

  if (error) {
    console.error("[ads/qualification] Supabase error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }

  // Get unique campaigns for filter dropdown
  const { data: allLeads } = await supabase
    .from("vba_funnel_leads")
    .select("utm_campaign")
    .gte("created_at", since)
    .not("utm_campaign", "is", null);

  const campaigns = Array.from(
    new Set((allLeads ?? []).map((l) => l.utm_campaign).filter(Boolean) as string[])
  ).sort();

  return NextResponse.json({ leads: leads ?? [], campaigns });
}
