import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const check = await requireAdmin();
  if (check instanceof NextResponse) return check;

  const { id } = await params;
  const sb = createSupabaseAdmin();

  const [fieldsRes, recordsRes, viewsRes] = await Promise.all([
    sb.from("spreadsheet_fields").select("*").eq("table_id", id).order("sort_order"),
    sb.from("spreadsheet_records").select("*").eq("table_id", id).order("sort_order"),
    sb.from("spreadsheet_views").select("*").eq("table_id", id).order("sort_order"),
  ]);

  return NextResponse.json({
    fields: fieldsRes.data || [],
    records: recordsRes.data || [],
    views: viewsRes.data || [],
  });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const check = await requireAdmin();
  if (check instanceof NextResponse) return check;

  const { id } = await params;
  const sb = createSupabaseAdmin();
  const { error } = await sb.from("spreadsheet_tables").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
