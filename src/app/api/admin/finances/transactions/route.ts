import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const check = await requireAdmin();
  if (check instanceof NextResponse) return check;

  const url = new URL(req.url);
  const entity = url.searchParams.get("entity");
  const type = url.searchParams.get("type");
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  const limit = Math.min(Number(url.searchParams.get("limit")) || 200, 1000);

  const sb = createSupabaseAdmin();
  let query = sb
    .from("finance_transactions")
    .select("*, finance_categories(name, icon, color)")
    .order("date", { ascending: false })
    .limit(limit);

  if (entity) query = query.eq("entity", entity);
  if (type) query = query.eq("type", type);
  if (from) query = query.gte("date", from);
  if (to) query = query.lte("date", to);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ transactions: data });
}

export async function POST(req: NextRequest) {
  const check = await requireAdmin();
  if (check instanceof NextResponse) return check;

  const body = await req.json().catch(() => ({}));
  const { date, description, amount, type, category_id, entity, tags, notes, is_recurring, recurring_frequency } = body;

  if (!description || !amount || !type) {
    return NextResponse.json({ error: "description, amount et type requis" }, { status: 400 });
  }

  const sb = createSupabaseAdmin();
  const { data, error } = await sb
    .from("finance_transactions")
    .insert({
      date: date || new Date().toISOString().split("T")[0],
      description,
      amount: Math.abs(Number(amount)),
      type,
      category_id: category_id || null,
      entity: entity || "vanzon",
      tags: tags || [],
      notes: notes || null,
      is_recurring: is_recurring || false,
      recurring_frequency: recurring_frequency || null,
    })
    .select("*, finance_categories(name, icon, color)")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ transaction: data });
}
