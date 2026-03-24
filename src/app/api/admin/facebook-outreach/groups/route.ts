// src/app/api/admin/facebook-outreach/groups/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { auth, currentUser } from "@clerk/nextjs/server";

const ALLOWED = "gavegliojules@gmail.com";

async function guard() {
  const { userId } = await auth();
  if (!userId) return false;
  const user = await currentUser();
  return user?.emailAddresses?.[0]?.emailAddress === ALLOWED;
}

export async function GET() {
  if (!(await guard())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("facebook_groups")
    .select("*")
    .order("priority", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  if (!(await guard())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json() as {
    group_name: string;
    group_url: string;
    member_count?: number;
    category?: string;
    priority?: number;
  };
  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase.from("facebook_groups").insert(body).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  if (!(await guard())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id, ...updates } = await req.json() as { id: string; [k: string]: unknown };
  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("facebook_groups")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest) {
  if (!(await guard())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await req.json() as { id: string };
  const supabase = createSupabaseAdmin();
  const { error } = await supabase.from("facebook_groups").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
