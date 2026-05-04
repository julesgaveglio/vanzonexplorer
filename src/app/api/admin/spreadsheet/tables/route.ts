import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const check = await requireAdmin();
  if (check instanceof NextResponse) return check;

  const { base_id, name, icon } = await req.json().catch(() => ({} as Record<string, string>));
  if (!base_id || !name) return NextResponse.json({ error: "base_id et name requis" }, { status: 400 });

  const sb = createSupabaseAdmin();

  // 1. Create table
  const { data: table, error } = await sb
    .from("spreadsheet_tables")
    .insert({ base_id, name, icon: icon || "📋" })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // 2. Auto-create default fields
  await sb.from("spreadsheet_fields").insert([
    { table_id: table.id, name: "Nom", field_key: "nom", field_type: "text", sort_order: 0, width: 250 },
    { table_id: table.id, name: "Description", field_key: "description", field_type: "longtext", sort_order: 1, width: 250 },
    { table_id: table.id, name: "Prix", field_key: "prix", field_type: "number", sort_order: 2, width: 100 },
    { table_id: table.id, name: "Lien", field_key: "lien", field_type: "url", sort_order: 3, width: 200 },
    { table_id: table.id, name: "Categorie", field_key: "categorie", field_type: "select", sort_order: 4, width: 150, options: { choices: [] } },
  ]);

  // 3. Auto-create default views
  await sb.from("spreadsheet_views").insert([
    { table_id: table.id, name: "Vue liste", icon: "📋", view_type: "list", sort_order: 0 },
    { table_id: table.id, name: "Vue galerie", icon: "🖼️", view_type: "gallery", sort_order: 1 },
  ]);

  return NextResponse.json({ table });
}
