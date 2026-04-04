// src/app/api/admin/seo/drafts/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  const check = await requireAdmin();
  if (check instanceof NextResponse) return check;
  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("draft_articles")
    .select("id, title, excerpt, target_url, status, created_at, updated_at")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const check = await requireAdmin();
  if (check instanceof NextResponse) return check;
  const supabase = createSupabaseAdmin();
  const body = await req.json();

  const { data, error } = await supabase
    .from("draft_articles")
    .insert({
      title:        body.title        ?? "Sans titre",
      html_content: body.html_content ?? "",
      excerpt:      body.excerpt      ?? "",
      target_url:   body.target_url   ?? "",
      status:       "draft",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
