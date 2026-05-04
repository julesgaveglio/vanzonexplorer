import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const check = await requireAdmin();
  if (check instanceof NextResponse) return check;

  const { base_id, name, icon } = await req.json().catch(() => ({} as Record<string, string>));
  if (!base_id || !name) return NextResponse.json({ error: "base_id et name requis" }, { status: 400 });

  const sb = createSupabaseAdmin();
  const { data, error } = await sb
    .from("spreadsheet_tables")
    .insert({ base_id, name, icon: icon || "📋" })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ table: data });
}
