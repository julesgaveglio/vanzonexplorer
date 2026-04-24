import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const adminCheck = await requireAdmin();
  if (adminCheck instanceof NextResponse) return adminCheck;

  const campaignId = req.nextUrl.searchParams.get("campaign_id");
  const supabase = createSupabaseAdmin();

  let query = supabase.from("funnel_ads").select("*").order("created_at");
  if (campaignId) query = query.eq("campaign_id", campaignId);

  const { data } = await query;
  return NextResponse.json({ ads: data ?? [] });
}

export async function POST(req: NextRequest) {
  const adminCheck = await requireAdmin();
  if (adminCheck instanceof NextResponse) return adminCheck;

  const body = await req.json();
  const { campaign_id, name, hook_type, video_url, transcript, notes } = body;

  if (!name) return NextResponse.json({ error: "name requis" }, { status: 400 });

  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("funnel_ads")
    .insert({
      campaign_id: campaign_id || null,
      name,
      hook_type: hook_type || null,
      video_url: video_url || null,
      transcript: transcript || null,
      notes: notes || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ad: data }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const adminCheck = await requireAdmin();
  if (adminCheck instanceof NextResponse) return adminCheck;

  const body = await req.json();
  const { id, ...fields } = body;
  if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 });

  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("funnel_ads")
    .update(fields)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ad: data });
}

export async function DELETE(req: NextRequest) {
  const adminCheck = await requireAdmin();
  if (adminCheck instanceof NextResponse) return adminCheck;

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 });

  const supabase = createSupabaseAdmin();
  const { error } = await supabase.from("funnel_ads").delete().eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
