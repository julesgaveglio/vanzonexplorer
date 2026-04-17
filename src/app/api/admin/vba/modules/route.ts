import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { slugify } from "@/lib/slugify";

// GET — list all modules
export async function GET() {
  const adminCheck = await requireAdmin();
  if (adminCheck instanceof NextResponse) return adminCheck;

  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("vba_modules")
    .select("*, vba_lessons(id)")
    .order("order");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const modules = (data ?? []).map((m) => ({
    ...m,
    lesson_count: m.vba_lessons?.length ?? 0,
    vba_lessons: undefined,
  }));

  return NextResponse.json({ modules });
}

// POST — create module
export async function POST(req: NextRequest) {
  const adminCheck = await requireAdmin();
  if (adminCheck instanceof NextResponse) return adminCheck;

  const body = await req.json();
  const { title, description } = body;
  if (!title) return NextResponse.json({ error: "Titre requis" }, { status: 400 });

  const supabase = createSupabaseAdmin();

  // Get max order
  const { data: existing } = await supabase
    .from("vba_modules")
    .select("order")
    .order("order", { ascending: false })
    .limit(1);
  const nextOrder = (existing?.[0]?.order ?? -1) + 1;

  const slug = slugify(title);

  const { data, error } = await supabase
    .from("vba_modules")
    .insert({ title, slug, description: description || null, order: nextOrder })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ module: data }, { status: 201 });
}

// PATCH — update module (id in body)
export async function PATCH(req: NextRequest) {
  const adminCheck = await requireAdmin();
  if (adminCheck instanceof NextResponse) return adminCheck;

  const body = await req.json();
  const { id, title, description, is_published, order } = body;
  if (!id) return NextResponse.json({ error: "ID requis" }, { status: 400 });

  const supabase = createSupabaseAdmin();

  const updates: Record<string, unknown> = {};
  if (title !== undefined) {
    updates.title = title;
    updates.slug = slugify(title);
  }
  if (description !== undefined) updates.description = description;
  if (is_published !== undefined) updates.is_published = is_published;
  if (order !== undefined) updates.order = order;

  const { data, error } = await supabase
    .from("vba_modules")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ module: data });
}

// DELETE — delete module (id in query string)
export async function DELETE(req: NextRequest) {
  const adminCheck = await requireAdmin();
  if (adminCheck instanceof NextResponse) return adminCheck;

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID requis" }, { status: 400 });

  const supabase = createSupabaseAdmin();
  const { error } = await supabase.from("vba_modules").delete().eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
