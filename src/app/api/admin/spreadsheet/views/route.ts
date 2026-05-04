import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const check = await requireAdmin();
  if (check instanceof NextResponse) return check;

  const body = await req.json().catch(() => ({}));
  const { table_id, name, view_type, filters, sort_by, sort_dir, gallery_image_field, icon } = body;
  if (!table_id || !name) return NextResponse.json({ error: "table_id et name requis" }, { status: 400 });

  const sb = createSupabaseAdmin();
  const { data, error } = await sb
    .from("spreadsheet_views")
    .insert({
      table_id,
      name,
      icon: icon || (view_type === "gallery" ? "🖼️" : "📋"),
      view_type: view_type || "list",
      filters: filters || [],
      sort_by: sort_by || null,
      sort_dir: sort_dir || "asc",
      gallery_image_field: gallery_image_field || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ view: data });
}
