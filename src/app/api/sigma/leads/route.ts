import { NextRequest, NextResponse } from "next/server";
import { requireSigmaAuth } from "../_helpers/auth";
import { createSupabaseAdmin } from "@/lib/supabase/server";

const EXCLUDED_EMAILS = ["gavegliojules@gmail.com", "jules@vanzonexplorer.com"];

export async function GET(req: NextRequest) {
  const check = await requireSigmaAuth();
  if (check instanceof NextResponse) return check;

  const supabase = createSupabaseAdmin();
  const params = req.nextUrl.searchParams;
  const page = parseInt(params.get("page") ?? "1");
  const perPage = parseInt(params.get("per_page") ?? "50");
  const search = params.get("search")?.trim();
  const offset = (page - 1) * perPage;

  // Build query
  let query = supabase
    .from("sigma_leads")
    .select("*", { count: "exact" })
    .not("email", "in", `(${EXCLUDED_EMAILS.join(",")})`)
    .order("created_at", { ascending: false })
    .range(offset, offset + perPage - 1);

  if (search) {
    query = query.or(`email.ilike.%${search}%,firstname.ilike.%${search}%,phone.ilike.%${search}%`);
  }

  const { data: leads, count, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Fetch last funnel events per lead for VSL watch time
  const emails = (leads ?? []).map((l) => l.email).filter(Boolean);
  let watchTimeMap = new Map<string, number>();

  if (emails.length > 0) {
    const { data: vslEvents } = await supabase
      .from("sigma_funnel_events")
      .select("email, event, metadata")
      .in("email", emails)
      .in("event", ["vsl_view", "vsl_25", "vsl_50", "vsl_75", "vsl_100"]);

    for (const e of vslEvents ?? []) {
      if (!e.email) continue;
      const meta = e.metadata as Record<string, unknown> | null;
      const seconds = typeof meta?.seconds === "number" ? meta.seconds : 0;
      if (seconds > 0) {
        watchTimeMap.set(e.email, Math.max(watchTimeMap.get(e.email) ?? 0, seconds));
      }
    }
  }

  const enriched = (leads ?? []).map((lead) => ({
    ...lead,
    vsl_seconds: watchTimeMap.get(lead.email) ?? null,
  }));

  return NextResponse.json({
    leads: enriched,
    total: count ?? 0,
    page,
    per_page: perPage,
  });
}

export async function DELETE(req: NextRequest) {
  const check = await requireSigmaAuth();
  if (check instanceof NextResponse) return check;

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const supabase = createSupabaseAdmin();
  const { error } = await supabase
    .from("sigma_leads")
    .delete()
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
