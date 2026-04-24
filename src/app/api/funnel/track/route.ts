import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";

const VALID_EVENTS = [
  "page_view",
  "optin",
  "vsl_view",
  "vsl_25",
  "vsl_50",
  "vsl_75",
  "vsl_100",
  "booking_start",
  "booking_confirmed",
  "checkout",
  "purchase",
] as const;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { session_id, event, page, email, firstname, referrer, metadata, ...utm } = body;

    if (!event || !page) {
      return NextResponse.json({ error: "event and page required" }, { status: 400 });
    }

    if (!VALID_EVENTS.includes(event)) {
      return NextResponse.json({ error: "invalid event" }, { status: 400 });
    }

    const supabase = createSupabaseAdmin();

    const { error } = await supabase.from("funnel_events").insert({
      session_id: session_id || null,
      email: email || null,
      firstname: firstname || null,
      event,
      page,
      utm_source: utm.utm_source || null,
      utm_medium: utm.utm_medium || null,
      utm_campaign: utm.utm_campaign || null,
      utm_content: utm.utm_content || null,
      utm_term: utm.utm_term || null,
      referrer: referrer || null,
      metadata: metadata || {},
    });

    if (error) {
      console.error("[funnel/track] Supabase error:", error);
      return NextResponse.json({ error: "tracking failed" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "invalid request" }, { status: 400 });
  }
}
