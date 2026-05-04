import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  const sb = createSupabaseAdmin();
  const days = Number(req.nextUrl.searchParams.get("days") ?? "30");
  const since = new Date(Date.now() - days * 86400000).toISOString();

  // Fetch all VSL versions
  const { data: versions } = await sb
    .from("vsl_versions")
    .select("*")
    .order("created_at", { ascending: true });

  // Fetch funnel events for retention curves
  const { data: events } = await sb
    .from("funnel_events")
    .select("event, metadata, created_at")
    .in("event", ["vsl_view", "vsl_25", "vsl_50", "vsl_75", "vsl_100", "vsl_exit"])
    .gte("created_at", since);

  // Build stats per version
  const stats = (versions ?? []).map((v) => {
    const versionEvents = (events ?? []).filter((e) => {
      const vid = e.metadata?.vsl_version_id;
      // Events without vsl_version_id are attributed to the first (oldest) version
      if (!vid) return v.id === versions?.[0]?.id;
      return vid === v.id;
    });

    const count = (event: string) => versionEvents.filter((e) => e.event === event).length;
    const views = count("vsl_view");

    // Build retention curve from vsl_exit events (10-second buckets)
    const exitEvents = versionEvents.filter((e) => e.event === "vsl_exit" && e.metadata?.seconds);
    const maxSeconds = Math.max(...exitEvents.map((e) => e.metadata.seconds ?? 0), 0);
    const bucketSize = 10;
    const buckets: { second: number; viewers: number }[] = [];

    for (let s = 0; s <= maxSeconds; s += bucketSize) {
      const viewersLeft = exitEvents.filter((e) => (e.metadata.seconds ?? 0) > s).length;
      buckets.push({ second: s, viewers: views > 0 ? Math.round((viewersLeft / views) * 100) : 0 });
    }

    // If not enough exit data, use milestone fallback
    const milestones = views > 0
      ? {
          "25": Math.round((count("vsl_25") / views) * 100),
          "50": Math.round((count("vsl_50") / views) * 100),
          "75": Math.round((count("vsl_75") / views) * 100),
          "100": Math.round((count("vsl_100") / views) * 100),
        }
      : { "25": 0, "50": 0, "75": 0, "100": 0 };

    return {
      ...v,
      views,
      milestones,
      retention_curve: buckets.length > 2 ? buckets : null,
      booking_starts: versionEvents.filter((e) => e.event === "booking_start").length,
    };
  });

  return NextResponse.json({ versions: stats });
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  const sb = createSupabaseAdmin();
  const body = await req.json();

  const { name, bunny_video_id, bunny_library_id, color, notes } = body;
  if (!name || !bunny_video_id) {
    return NextResponse.json({ error: "name and bunny_video_id required" }, { status: 400 });
  }

  const { data, error } = await sb
    .from("vsl_versions")
    .insert({
      name,
      bunny_video_id,
      bunny_library_id: bunny_library_id || "641831",
      color: color || "#3B82F6",
      notes: notes || null,
      is_active: false,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
