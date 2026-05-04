import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  const check = await requireAdmin();
  if (check instanceof NextResponse) return check;

  const sb = createSupabaseAdmin();
  const { data, error } = await sb
    .from("spreadsheet_bases")
    .select("*, spreadsheet_tables(id, name, icon, sort_order)")
    .order("sort_order", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ bases: data });
}

export async function POST(req: NextRequest) {
  const check = await requireAdmin();
  if (check instanceof NextResponse) return check;

  const { name, icon, color } = await req.json().catch(() => ({} as Record<string, string>));
  if (!name) return NextResponse.json({ error: "name requis" }, { status: 400 });

  const sb = createSupabaseAdmin();
  const { data, error } = await sb
    .from("spreadsheet_bases")
    .insert({ name, icon: icon || "📋", color: color || "#3b82f6" })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ base: data });
}
