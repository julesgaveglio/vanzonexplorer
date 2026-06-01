import { NextResponse } from "next/server";
import { requireAdsAuth } from "@/lib/ads-auth";
import { createSupabaseAdmin } from "@/lib/supabase/server";

const EXCLUDED_EMAILS = ["gavegliojules@gmail.com", "mateogb.ads@gmail.com", "jules@vanzonexplorer.com"];

export async function GET() {
  const check = await requireAdsAuth();
  if (check instanceof NextResponse) return check;

  const sb = createSupabaseAdmin();

  // 1. Get all variants
  const { data: variants } = await sb
    .from("title_variants")
    .select("*")
    .order("position", { ascending: true });

  if (!variants || variants.length === 0) {
    return NextResponse.json({ variants: [] });
  }

  // 2. Get page_view events (paginated, include metadata for variant attribution)
  const PAGE = 1000;
  const pageViewEvents: { event: string; email: string | null; session_id: string | null; metadata: Record<string, unknown> | null }[] = [];
  let offset = 0;
  while (true) {
    const { data } = await sb
      .from("funnel_events")
      .select("event, email, session_id, metadata")
      .eq("event", "page_view")
      .or(`email.is.null,email.not.in.(${EXCLUDED_EMAILS.join(",")})`)
      .range(offset, offset + PAGE - 1);
    if (!data || data.length === 0) break;
    pageViewEvents.push(...(data as typeof pageViewEvents));
    if (data.length < PAGE) break;
    offset += PAGE;
  }

  // 3. Get hot leads from vba_funnel_leads (the source of truth for qualification)
  const { data: hotLeads } = await sb
    .from("vba_funnel_leads")
    .select("email, created_at")
    .eq("is_hot", true)
    .not("email", "in", `(${EXCLUDED_EMAILS.join(",")})`);

  // Map hot lead emails to their optin events (to get variant attribution)
  const hotEmails = new Set((hotLeads ?? []).map((l) => l.email));

  // Get optin events for hot leads only (to retrieve title_variant_id)
  const optinEvents: { event: string; email: string | null; session_id: string | null; metadata: Record<string, unknown> | null }[] = [];
  offset = 0;
  while (true) {
    const { data } = await sb
      .from("funnel_events")
      .select("event, email, session_id, metadata")
      .eq("event", "optin")
      .or(`email.is.null,email.not.in.(${EXCLUDED_EMAILS.join(",")})`)
      .range(offset, offset + PAGE - 1);
    if (!data || data.length === 0) break;
    optinEvents.push(...(data as typeof optinEvents));
    if (data.length < PAGE) break;
    offset += PAGE;
  }

  // Filter optin events to hot leads only
  const hotOptinEvents = optinEvents.filter((e) => e.email && hotEmails.has(e.email));

  // 4. Compute stats per variant
  const variantIds = new Set(variants.map((v) => v.id));

  const results = variants.map((v) => {
    const variantPageViews = pageViewEvents.filter((e) => {
      const meta = e.metadata as Record<string, unknown> | null;
      return meta?.title_variant_id === v.id;
    });

    const variantHotOptins = hotOptinEvents.filter((e) => {
      const meta = e.metadata as Record<string, unknown> | null;
      return meta?.title_variant_id === v.id;
    });

    const views = new Set(
      variantPageViews.map((e) => e.email || e.session_id || "anon")
    ).size;

    const hotLeadCount = new Set(
      variantHotOptins.map((e) => e.email || e.session_id || "anon")
    ).size;

    const rate = views > 0 ? Math.round((hotLeadCount / views) * 1000) / 10 : 0;

    return {
      id: v.id,
      title: v.title,
      position: v.position,
      is_active: v.is_active,
      is_completed: v.is_completed,
      views_target: v.views_target ?? 200,
      views,
      hot_leads: hotLeadCount,
      rate,
    };
  });

  // Sort by rate descending (best performing first)
  results.sort((a, b) => b.rate - a.rate || b.hot_leads - a.hot_leads);

  // 5. Count unattributed events
  const unattributedPageViews = pageViewEvents.filter((e) => {
    const meta = e.metadata as Record<string, unknown> | null;
    const vid = meta?.title_variant_id;
    return !vid || vid === "unknown" || vid === "fallback" || !variantIds.has(vid as string);
  });
  const unattributedHotOptins = hotOptinEvents.filter((e) => {
    const meta = e.metadata as Record<string, unknown> | null;
    const vid = meta?.title_variant_id;
    return !vid || vid === "unknown" || vid === "fallback" || !variantIds.has(vid as string);
  });
  const unattributedViews = new Set(
    unattributedPageViews.map((e) => e.email || e.session_id || "anon")
  ).size;
  const unattributedHotLeads = new Set(
    unattributedHotOptins.map((e) => e.email || e.session_id || "anon")
  ).size;

  return NextResponse.json({
    variants: results,
    unattributed: { views: unattributedViews, hot_leads: unattributedHotLeads },
    total_hot_leads: hotLeads?.length ?? 0,
  });
}

// PATCH — update a variant (rename, reorder, etc.)
export async function PATCH(req: Request) {
  const check = await requireAdsAuth();
  if (check instanceof NextResponse) return check;

  const { id, ...fields } = await req.json();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const sb = createSupabaseAdmin();
  const { data, error } = await sb
    .from("title_variants")
    .update(fields)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ variant: data });
}

// POST — add a new variant
export async function POST(req: Request) {
  const check = await requireAdsAuth();
  if (check instanceof NextResponse) return check;

  const { title, position } = await req.json();
  if (!title) return NextResponse.json({ error: "title required" }, { status: 400 });

  const sb = createSupabaseAdmin();

  // Auto-position if not specified
  let pos = position;
  if (!pos) {
    const { data: last } = await sb
      .from("title_variants")
      .select("position")
      .order("position", { ascending: false })
      .limit(1)
      .single();
    pos = (last?.position ?? 0) + 1;
  }

  const { data, error } = await sb
    .from("title_variants")
    .insert({ title, position: pos })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ variant: data }, { status: 201 });
}

// DELETE — remove a variant
export async function DELETE(req: Request) {
  const check = await requireAdsAuth();
  if (check instanceof NextResponse) return check;

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const sb = createSupabaseAdmin();
  await sb.from("title_variants").delete().eq("id", id);
  return NextResponse.json({ ok: true });
}
