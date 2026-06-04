import { NextRequest, NextResponse } from "next/server";
import { requireSigmaAuth } from "../_helpers/auth";
import { createSupabaseAdmin } from "@/lib/supabase/server";

// GET — list email campaigns with send counts
export async function GET() {
  const check = await requireSigmaAuth();
  if (check instanceof NextResponse) return check;

  const supabase = createSupabaseAdmin();

  const { data: campaigns } = await supabase
    .from("sigma_email_campaigns")
    .select("id, name, subject, body_html, created_at")
    .order("created_at", { ascending: false });

  // Count sends per campaign
  const { data: allSends } = await supabase
    .from("sigma_email_sends")
    .select("campaign_id, sent_at");

  const countMap = new Map<string, { total: number; last_sent: string | null }>();
  for (const s of allSends ?? []) {
    if (!s.campaign_id) continue;
    const entry = countMap.get(s.campaign_id) ?? { total: 0, last_sent: null };
    entry.total++;
    if (!entry.last_sent || s.sent_at > entry.last_sent) entry.last_sent = s.sent_at;
    countMap.set(s.campaign_id, entry);
  }

  // Count clicks per campaign
  const { data: allClicks } = await supabase
    .from("sigma_email_clicks")
    .select("campaign_id");

  const clickMap = new Map<string, number>();
  for (const c of allClicks ?? []) {
    if (!c.campaign_id) continue;
    clickMap.set(c.campaign_id, (clickMap.get(c.campaign_id) ?? 0) + 1);
  }

  const enriched = (campaigns ?? []).map((c) => ({
    ...c,
    sends_count: countMap.get(c.id)?.total ?? 0,
    last_sent: countMap.get(c.id)?.last_sent ?? null,
    clicks_count: clickMap.get(c.id) ?? 0,
  }));

  return NextResponse.json({ campaigns: enriched });
}

// POST — create new email campaign
export async function POST(req: NextRequest) {
  const check = await requireSigmaAuth();
  if (check instanceof NextResponse) return check;

  const { name, subject, body_html } = await req.json();
  if (!name || !subject || !body_html) {
    return NextResponse.json({ error: "name, subject, body_html required" }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("sigma_email_campaigns")
    .insert({ name, subject, body_html })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

// PATCH — update email campaign
export async function PATCH(req: NextRequest) {
  const check = await requireSigmaAuth();
  if (check instanceof NextResponse) return check;

  const { id, subject, body_html } = await req.json();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const updates: Record<string, string> = {};
  if (subject) updates.subject = subject;
  if (body_html) updates.body_html = body_html;

  const supabase = createSupabaseAdmin();
  const { error } = await supabase
    .from("sigma_email_campaigns")
    .update(updates)
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
