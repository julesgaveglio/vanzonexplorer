import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { CHANNEL_LABELS, type Channel } from "@/lib/channel-classifier";

const CONVERSION_EVENTS = [
  "booking_click", "whatsapp_click", "roadtrip_lead", "resource_download",
  "vsl_cta_click", "contact_submit", "optin", "purchase",
];

interface Row {
  session_id: string | null;
  event: string;
  page: string | null;
  channel: string | null;
  landing_page: string | null;
  email: string | null;
  created_at: string;
}

export async function GET() {
  const adminCheck = await requireAdmin();
  if (adminCheck instanceof NextResponse) return adminCheck;

  const supabase = createSupabaseAdmin();

  // On récupère les événements récents et on reconstruit les sessions.
  const { data, error } = await supabase
    .from("funnel_events")
    .select("session_id, event, page, channel, landing_page, email, created_at")
    .order("created_at", { ascending: false })
    .limit(2000);

  if (error) {
    console.error("[pulse/visitors] error:", error);
    return NextResponse.json({ error: "query failed" }, { status: 500 });
  }

  const rows = (data ?? []) as Row[];

  // Regroupe par session_id
  const sessions = new Map<string, Row[]>();
  for (const r of rows) {
    if (!r.session_id) continue;
    if (!sessions.has(r.session_id)) sessions.set(r.session_id, []);
    sessions.get(r.session_id)!.push(r);
  }

  const visitors = Array.from(sessions.entries())
    .map(([sid, evs]) => {
      // evs sont en desc → on remet en ordre chronologique
      const chrono = [...evs].reverse();
      const first = chrono[0];
      const last = chrono[chrono.length - 1];
      const channel = evs.find((e) => e.channel)?.channel ?? "direct";
      const email = evs.find((e) => e.email)?.email ?? null;
      const pageViews = evs.filter((e) => e.event === "page_view").length;
      const conversions = evs.filter((e) => CONVERSION_EVENTS.includes(e.event));
      const sawVsl = evs.some((e) => e.event.startsWith("vsl_"));
      const vslDepth = ["vsl_100", "vsl_75", "vsl_50", "vsl_25", "vsl_view"].find((step) =>
        evs.some((e) => e.event === step)
      );

      // Séquence d'événements lisible (max 12)
      const journey = chrono
        .map((e) => (e.event === "page_view" ? e.page ?? "?" : e.event))
        .slice(0, 12);

      return {
        id: sid.slice(0, 8),
        channel,
        channelLabel: CHANNEL_LABELS[channel as Channel] ?? channel,
        email,
        landingPage: first?.landing_page ?? first?.page ?? null,
        pageViews,
        events: evs.length,
        conversions: conversions.map((c) => c.event),
        sawVsl,
        vslDepth: vslDepth ?? null,
        journey,
        firstSeen: first?.created_at ?? null,
        lastSeen: last?.created_at ?? null,
      };
    })
    .sort((a, b) => (b.lastSeen ?? "").localeCompare(a.lastSeen ?? ""))
    .slice(0, 40);

  return NextResponse.json({ visitors });
}
