import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const check = await requireAdmin();
  if (check instanceof NextResponse) return check;

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const allowed = ["name", "icon", "view_type", "filters", "sort_by", "sort_dir", "gallery_image_field", "sort_order"];
  const updates: Record<string, unknown> = {};
  for (const k of allowed) if (k in body) updates[k] = body[k];

  const sb = createSupabaseAdmin();
  const { data, error } = await sb.from("spreadsheet_views").update(updates).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ view: data });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const check = await requireAdmin();
  if (check instanceof NextResponse) return check;

  const { id } = await params;
  const sb = createSupabaseAdmin();
  const { error } = await sb.from("spreadsheet_views").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
