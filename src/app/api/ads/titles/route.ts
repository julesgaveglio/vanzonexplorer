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

  // 2. Get all page_view and optin events with title_variant_id
  const { data: allEvents } = await sb
    .from("funnel_events")
    .select("event, email, session_id, metadata")
    .in("event", ["page_view", "optin"])
    .not("email", "in", `(${EXCLUDED_EMAILS.join(",")})`)
    .not("metadata", "is", null);

  const events = allEvents ?? [];

  // 3. Compute stats per variant
  const results = variants.map((v) => {
    const variantEvents = events.filter((e) => {
      const meta = e.metadata as Record<string, unknown> | null;
      return meta?.title_variant_id === v.id;
    });

    const views = new Set(
      variantEvents
        .filter((e) => e.event === "page_view")
        .map((e) => e.email || e.session_id || "anon")
    ).size;

    const optins = new Set(
      variantEvents
        .filter((e) => e.event === "optin")
        .map((e) => e.email || e.session_id || "anon")
    ).size;

    const rate = views > 0 ? Math.round((optins / views) * 1000) / 10 : 0;

    return {
      id: v.id,
      title: v.title,
      position: v.position,
      is_active: v.is_active,
      is_completed: v.is_completed,
      views_target: v.views_target ?? 150,
      views,
      optins,
      rate,
    };
  });

  return NextResponse.json({ variants: results });
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
