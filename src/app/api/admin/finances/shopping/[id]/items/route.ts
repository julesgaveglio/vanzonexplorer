import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const check = await requireAdmin();
  if (check instanceof NextResponse) return check;

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const { name, quantity, estimated_price, url, notes } = body;

  if (!name) {
    return NextResponse.json({ error: "name requis" }, { status: 400 });
  }

  const sb = createSupabaseAdmin();
  const { data, error } = await sb
    .from("shopping_items")
    .insert({
      list_id: id,
      name,
      quantity: quantity || 1,
      estimated_price: estimated_price || null,
      url: url || null,
      notes: notes || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ item: data });
}

export async function PATCH(req: NextRequest) {
  const check = await requireAdmin();
  if (check instanceof NextResponse) return check;

  const body = await req.json().catch(() => ({}));
  const { item_id, ...updates } = body;

  if (!item_id) {
    return NextResponse.json({ error: "item_id requis" }, { status: 400 });
  }

  const allowed = ["name", "quantity", "estimated_price", "actual_price", "purchased", "url", "notes", "sort_order"];
  const patch: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in updates) patch[key] = updates[key];
  }

  const sb = createSupabaseAdmin();
  const { data, error } = await sb
    .from("shopping_items")
    .update(patch)
    .eq("id", item_id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ item: data });
}
