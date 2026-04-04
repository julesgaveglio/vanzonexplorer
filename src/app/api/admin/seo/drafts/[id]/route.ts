// src/app/api/admin/seo/drafts/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const check = await requireAdmin();
  if (check instanceof NextResponse) return check;
  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("draft_articles")
    .select("*")
    .eq("id", params.id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json(data);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const check = await requireAdmin();
  if (check instanceof NextResponse) return check;
  const supabase = createSupabaseAdmin();
  const body = await req.json();

  const { data, error } = await supabase
    .from("draft_articles")
    .update({
      title:        body.title,
      html_content: body.html_content,
      excerpt:      body.excerpt,
      target_url:   body.target_url,
    })
    .eq("id", params.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const check = await requireAdmin();
  if (check instanceof NextResponse) return check;
  const supabase = createSupabaseAdmin();
  const { error } = await supabase
    .from("draft_articles")
    .delete()
    .eq("id", params.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
