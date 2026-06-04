import { NextRequest, NextResponse } from "next/server";
import { requireSigmaAuth } from "../_helpers/auth";
import { createSupabaseAdmin } from "@/lib/supabase/server";

export async function GET() {
  const check = await requireSigmaAuth();
  if (check instanceof NextResponse) return check;

  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("sigma_campaigns")
    .select("*")
    .order("start_date", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ campaigns: data ?? [] });
}

export async function POST(req: NextRequest) {
  const check = await requireSigmaAuth();
  if (check instanceof NextResponse) return check;

  const { name, start_date, budget_euros } = await req.json();
  if (!name || !start_date) {
    return NextResponse.json({ error: "name et start_date requis" }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("sigma_campaigns")
    .insert({
      name,
      start_date,
      budget_euros: budget_euros || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ campaign: data }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const check = await requireSigmaAuth();
  if (check instanceof NextResponse) return check;

  const { id, ...fields } = await req.json();
  if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 });

  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("sigma_campaigns")
    .update(fields)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ campaign: data });
}
