import { NextRequest, NextResponse } from "next/server";
import { requireAdsAuth } from "@/lib/ads-auth";
import { createSupabaseAdmin } from "@/lib/supabase/server";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(_req: NextRequest) {
  const check = await requireAdsAuth();
  if (check instanceof NextResponse) return check;

  const supabase = createSupabaseAdmin();

  // Get all campaigns with send counts
  const { data: campaigns } = await supabase
    .from("email_campaigns")
    .select("id, name, subject, body_html, created_at")
    .order("created_at", { ascending: false });

  // Get send counts per campaign
  const { data: sendCounts } = await supabase
    .from("email_sends")
    .select("campaign_id, sent_at");

  const countMap = new Map<string, { total: number; last_sent: string | null }>();
  for (const s of sendCounts ?? []) {
    if (!s.campaign_id) continue;
    const entry = countMap.get(s.campaign_id) ?? { total: 0, last_sent: null };
    entry.total++;
    if (!entry.last_sent || s.sent_at > entry.last_sent) entry.last_sent = s.sent_at;
    countMap.set(s.campaign_id, entry);
  }

  const enriched = (campaigns ?? []).map((c) => ({
    ...c,
    sends_count: countMap.get(c.id)?.total ?? 0,
    last_sent: countMap.get(c.id)?.last_sent ?? null,
  }));

  return NextResponse.json({ campaigns: enriched });
}

// Create new campaign
export async function POST(req: NextRequest) {
  const check = await requireAdsAuth();
  if (check instanceof NextResponse) return check;

  const { name, subject, body_html } = await req.json();
  if (!name || !subject || !body_html) {
    return NextResponse.json({ error: "name, subject, body_html required" }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("email_campaigns")
    .insert({ name, subject, body_html })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

// Update a campaign
export async function PATCH(req: NextRequest) {
  const check = await requireAdsAuth();
  if (check instanceof NextResponse) return check;

  const { id, name, subject, body_html } = await req.json();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const supabase = createSupabaseAdmin();
  const updates: Record<string, string> = {};
  if (name) updates.name = name;
  if (subject) updates.subject = subject;
  if (body_html) updates.body_html = body_html;

  const { error } = await supabase
    .from("email_campaigns")
    .update(updates)
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// Record a send
export async function PUT(req: NextRequest) {
  const check = await requireAdsAuth();
  if (check instanceof NextResponse) return check;

  const { email, campaign_id, campaign_name, subject } = await req.json();
  if (!email || !campaign_name) {
    return NextResponse.json({ error: "email and campaign_name required" }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();
  await supabase.from("email_sends").insert({
    email,
    campaign_id: campaign_id || null,
    campaign_name,
    subject: subject || null,
  });

  return NextResponse.json({ ok: true });
}
