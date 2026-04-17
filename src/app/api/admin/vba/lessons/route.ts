import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { slugify } from "@/lib/slugify";

// GET — list lessons for a module
export async function GET(req: NextRequest) {
  const adminCheck = await requireAdmin();
  if (adminCheck instanceof NextResponse) return adminCheck;

  const moduleId = req.nextUrl.searchParams.get("module_id");
  if (!moduleId)
    return NextResponse.json({ error: "module_id requis" }, { status: 400 });

  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("vba_lessons")
    .select("*")
    .eq("module_id", moduleId)
    .order("order");

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ lessons: data });
}

// POST — create lesson
export async function POST(req: NextRequest) {
  const adminCheck = await requireAdmin();
  if (adminCheck instanceof NextResponse) return adminCheck;

  const body = await req.json();
  const { module_id, title, bunny_video_id, bunny_library_id, description, resources, duration_seconds } = body;

  if (!module_id || !title)
    return NextResponse.json({ error: "module_id et title requis" }, { status: 400 });

  const supabase = createSupabaseAdmin();

  // Get max order within module
  const { data: existing } = await supabase
    .from("vba_lessons")
    .select("order")
    .eq("module_id", module_id)
    .order("order", { ascending: false })
    .limit(1);
  const nextOrder = (existing?.[0]?.order ?? -1) + 1;

  const slug = slugify(title);

  const { data, error } = await supabase
    .from("vba_lessons")
    .insert({
      module_id,
      title,
      slug,
      bunny_video_id: bunny_video_id || null,
      bunny_library_id: bunny_library_id || null,
      description: description || null,
      resources: resources ?? [],
      duration_seconds: duration_seconds || null,
      order: nextOrder,
    })
    .select()
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ lesson: data }, { status: 201 });
}

// PATCH — update lesson
export async function PATCH(req: NextRequest) {
  const adminCheck = await requireAdmin();
  if (adminCheck instanceof NextResponse) return adminCheck;

  const body = await req.json();
  const { id, ...fields } = body;
  if (!id) return NextResponse.json({ error: "ID requis" }, { status: 400 });

  const supabase = createSupabaseAdmin();

  const updates: Record<string, unknown> = {};
  if (fields.title !== undefined) {
    updates.title = fields.title;
    updates.slug = slugify(fields.title);
  }
  if (fields.bunny_video_id !== undefined) updates.bunny_video_id = fields.bunny_video_id || null;
  if (fields.bunny_library_id !== undefined) updates.bunny_library_id = fields.bunny_library_id || null;
  if (fields.description !== undefined) updates.description = fields.description || null;
  if (fields.resources !== undefined) updates.resources = fields.resources;
  if (fields.duration_seconds !== undefined) updates.duration_seconds = fields.duration_seconds || null;
  if (fields.is_published !== undefined) updates.is_published = fields.is_published;
  if (fields.order !== undefined) updates.order = fields.order;

  const { data, error } = await supabase
    .from("vba_lessons")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ lesson: data });
}

// DELETE — delete lesson
export async function DELETE(req: NextRequest) {
  const adminCheck = await requireAdmin();
  if (adminCheck instanceof NextResponse) return adminCheck;

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID requis" }, { status: 400 });

  const supabase = createSupabaseAdmin();
  const { error } = await supabase.from("vba_lessons").delete().eq("id", id);

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
