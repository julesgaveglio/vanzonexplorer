import { NextRequest, NextResponse } from "next/server";
import { requireAdsAuth } from "@/lib/ads-auth";
import { createSupabaseAdmin } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const check = await requireAdsAuth();
  if (check instanceof NextResponse) return check;

  const supabase = createSupabaseAdmin();
  const days = parseInt(req.nextUrl.searchParams.get("days") ?? "90");
  const since = new Date(Date.now() - days * 86400000).toISOString();

  // Get all booking events (booking_start + booking_confirmed)
  const { data: bookingEvents } = await supabase
    .from("funnel_events")
    .select("email, firstname, event, created_at, utm_source, utm_medium, utm_campaign, metadata")
    .in("event", ["booking_start", "booking_confirmed"])
    .gte("created_at", since)
    .order("created_at", { ascending: false });

  // Get email click data to detect email source
  const { data: emailClicks } = await supabase
    .from("email_clicks")
    .select("email, campaign_name, clicked_at")
    .gte("clicked_at", since);

  // Get funnel leads for firstnames
  const emails = Array.from(new Set(
    (bookingEvents ?? []).map((e) => e.email).filter(Boolean) as string[]
  ));
  const { data: leads } = emails.length > 0
    ? await supabase.from("vba_funnel_leads").select("email, firstname").in("email", emails)
    : { data: [] };
  const firstnameMap = new Map((leads ?? []).map((l) => [l.email, l.firstname]));

  // Build email click map (last click before booking)
  const clickMap = new Map<string, string>();
  for (const c of emailClicks ?? []) {
    if (!clickMap.has(c.email)) clickMap.set(c.email, c.campaign_name);
  }

  // Group by email — one row per person with their booking status
  const callMap = new Map<string, {
    email: string;
    firstname: string | null;
    booking_started: string | null;
    booking_confirmed: string | null;
    source: string;
    utm_source: string | null;
    utm_campaign: string | null;
  }>();

  for (const e of bookingEvents ?? []) {
    if (!e.email) continue;
    const existing = callMap.get(e.email) ?? {
      email: e.email,
      firstname: firstnameMap.get(e.email) ?? e.firstname ?? null,
      booking_started: null,
      booking_confirmed: null,
      source: "direct",
      utm_source: e.utm_source,
      utm_campaign: e.utm_campaign,
    };

    if (e.event === "booking_start" && !existing.booking_started) {
      existing.booking_started = e.created_at;
    }
    if (e.event === "booking_confirmed" && !existing.booking_confirmed) {
      existing.booking_confirmed = e.created_at;
    }

    // Determine source
    if (clickMap.has(e.email)) {
      existing.source = `email: ${clickMap.get(e.email)}`;
    } else if (e.utm_source) {
      existing.source = e.utm_campaign
        ? `${e.utm_source} / ${e.utm_campaign}`
        : e.utm_source;
    } else {
      existing.source = "tunnel VSL";
    }

    callMap.set(e.email, existing);
  }

  const calls = Array.from(callMap.values()).sort((a, b) => {
    const dateA = a.booking_confirmed ?? a.booking_started ?? "";
    const dateB = b.booking_confirmed ?? b.booking_started ?? "";
    return dateB.localeCompare(dateA);
  });

  return NextResponse.json({ calls });
}
