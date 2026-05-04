import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const check = await requireAdmin();
  if (check instanceof NextResponse) return check;

  const body = await req.json().catch(() => ({}));
  const { table_id, name, field_key, field_type, options, width } = body;
  if (!table_id || !name || !field_key || !field_type) {
    return NextResponse.json({ error: "table_id, name, field_key, field_type requis" }, { status: 400 });
  }

  const sb = createSupabaseAdmin();

  // Get max sort_order for this table
  const { data: existing } = await sb
    .from("spreadsheet_fields")
    .select("sort_order")
    .eq("table_id", table_id)
    .order("sort_order", { ascending: false })
    .limit(1);

  const nextOrder = (existing?.[0]?.sort_order ?? -1) + 1;

  const { data, error } = await sb
    .from("spreadsheet_fields")
    .insert({
      table_id,
      name,
      field_key,
      field_type,
      options: options || {},
      width: width || 150,
      sort_order: nextOrder,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ field: data });
}
