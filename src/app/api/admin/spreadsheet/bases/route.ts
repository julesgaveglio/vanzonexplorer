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

  // 1. Create base
  const { data: base, error } = await sb
    .from("spreadsheet_bases")
    .insert({ name, icon: icon || "📋", color: color || "#3b82f6" })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // 2. Auto-create first table
  const { data: table } = await sb
    .from("spreadsheet_tables")
    .insert({ base_id: base.id, name: "Table 1", icon: "📋", sort_order: 0 })
    .select()
    .single();

  if (table) {
    // 3. Auto-create default fields
    const defaultFields = [
      { table_id: table.id, name: "Nom", field_key: "nom", field_type: "text", sort_order: 0, width: 250 },
      { table_id: table.id, name: "Description", field_key: "description", field_type: "longtext", sort_order: 1, width: 250 },
      { table_id: table.id, name: "Prix", field_key: "prix", field_type: "number", sort_order: 2, width: 100 },
      { table_id: table.id, name: "Lien", field_key: "lien", field_type: "url", sort_order: 3, width: 200 },
      { table_id: table.id, name: "Categorie", field_key: "categorie", field_type: "select", sort_order: 4, width: 150, options: { choices: [] } },
    ];
    await sb.from("spreadsheet_fields").insert(defaultFields);

    // 4. Auto-create default views
    const defaultViews = [
      { table_id: table.id, name: "Vue liste", icon: "📋", view_type: "list", sort_order: 0 },
      { table_id: table.id, name: "Vue galerie", icon: "🖼️", view_type: "gallery", sort_order: 1 },
    ];
    await sb.from("spreadsheet_views").insert(defaultViews);
  }

  return NextResponse.json({ base: { ...base, spreadsheet_tables: table ? [{ id: table.id }] : [] } });
}
