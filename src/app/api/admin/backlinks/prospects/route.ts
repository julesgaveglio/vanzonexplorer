import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const check = await requireAdmin();
  if (check instanceof NextResponse) return check;

  const body = await req.json().catch(() => ({}));
  const { domain, url, type, score, notes } = body;

  if (!domain || !url) {
    return Response.json({ success: false, error: "domain et url requis" }, { status: 400 });
  }

  const validTypes = ["blog", "forum", "partenaire", "annuaire", "media"];
  const supabase = createSupabaseAdmin();

  const { data, error } = await supabase
    .from("backlink_prospects")
    .insert({
      domain,
      url,
      type: validTypes.includes(type) ? type : "annuaire",
      score: Math.min(10, Math.max(1, score || 7)),
      statut: "découvert",
      notes: notes || null,
      source_query: "manual",
    })
    .select()
    .single();

  if (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }

  return Response.json({ success: true, prospect: data });
}
