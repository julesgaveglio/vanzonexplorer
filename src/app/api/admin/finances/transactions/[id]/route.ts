import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const check = await requireAdmin();
  if (check instanceof NextResponse) return check;

  const { id } = await params;
  const body = await req.json().catch(() => ({}));

  const allowed = ["date", "description", "amount", "type", "category_id", "entity", "tags", "notes", "is_recurring", "recurring_frequency"];
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const key of allowed) {
    if (key in body) {
      updates[key] = key === "amount" ? Math.abs(Number(body[key])) : body[key];
    }
  }

  const sb = createSupabaseAdmin();
  const { data, error } = await sb
    .from("finance_transactions")
    .update(updates)
    .eq("id", id)
    .select("*, finance_categories(name, icon, color)")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ transaction: data });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const check = await requireAdmin();
  if (check instanceof NextResponse) return check;

  const { id } = await params;
  const sb = createSupabaseAdmin();
  const { error } = await sb.from("finance_transactions").delete().eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
