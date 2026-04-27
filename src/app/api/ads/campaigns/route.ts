import { NextRequest, NextResponse } from "next/server";
import { requireMediaBuyer } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/server";

export async function GET() {
  const check = await requireMediaBuyer();
  if (check instanceof NextResponse) return check;

  const supabase = createSupabaseAdmin();
  const { data } = await supabase
    .from("funnel_campaigns")
    .select("*")
    .order("start_date", { ascending: false });

  return NextResponse.json({ campaigns: data ?? [] });
}

export async function POST(req: NextRequest) {
  const check = await requireMediaBuyer();
  if (check instanceof NextResponse) return check;

  const body = await req.json();
  const { name, start_date, end_date, budget_euros, platform, notes } = body;

  if (!name || !start_date) {
    return NextResponse.json({ error: "name et start_date requis" }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("funnel_campaigns")
    .insert({
      name,
      start_date,
      end_date: end_date || null,
      budget_euros: budget_euros || null,
      platform: platform || null,
      notes: notes || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ campaign: data }, { status: 201 });
}
