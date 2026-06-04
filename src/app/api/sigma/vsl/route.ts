import { NextRequest, NextResponse } from "next/server";
import { requireSigmaAuth } from "../_helpers/auth";
import { createSupabaseAdmin } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const check = await requireSigmaAuth();
  if (check instanceof NextResponse) return check;

  const supabase = createSupabaseAdmin();
  const params = req.nextUrl.searchParams;
  const startDate = params.get("start");
  const endDate = params.get("end");
  const days = parseInt(params.get("days") ?? "30");

  const since = startDate
    ? new Date(startDate).toISOString()
    : new Date(Date.now() - days * 86400000).toISOString();
  const until = endDate
    ? new Date(new Date(endDate).getTime() + 86400000).toISOString()
    : undefined;

  // Fetch VSL versions
  const { data: versions } = await supabase
    .from("sigma_vsl_versions")
    .select("id, name, is_active, created_at")
    .order("created_at", { ascending: true });

  // Fetch VSL events
  let eventsQuery = supabase
    .from("sigma_funnel_events")
    .select("event, email, session_id, metadata")
    .in("event", ["vsl_view", "vsl_25", "vsl_50", "vsl_75", "vsl_100"])
    .gte("created_at", since)
    .order("created_at", { ascending: false });
  if (until) eventsQuery = eventsQuery.lte("created_at", until);
  const { data: events } = await eventsQuery;

  const allEvents = events ?? [];
  const allVersions = versions ?? [];

  // Per-version stats
  const versionStats = allVersions.map((v) => {
    const versionEvents = allEvents.filter((e) => {
      const vid = (e.metadata as Record<string, unknown>)?.vsl_version_id;
      if (!vid) return v.id === allVersions[0]?.id;
      return vid === v.id;
    });

    const viewers = new Set(
      versionEvents.filter((e) => e.event === "vsl_view").map((e) => e.email || e.session_id || "anon")
    ).size;
    const completions = new Set(
      versionEvents.filter((e) => e.event === "vsl_100").map((e) => e.email || e.session_id || "anon")
    ).size;

    return {
      id: v.id,
      name: v.name,
      is_active: v.is_active,
      vsl_view: viewers,
      vsl_100: completions,
      completion_rate: viewers > 0 ? Math.round((completions / viewers) * 100) : 0,
    };
  });

  return NextResponse.json({ versions: versionStats });
}
