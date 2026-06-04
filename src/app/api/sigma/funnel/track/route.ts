import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";

// POST — public tracking endpoint (no auth required)
export async function POST(req: NextRequest) {
  const {
    session_id,
    event,
    page,
    email,
    firstname,
    metadata,
    referrer,
    utm_source,
    utm_campaign,
    utm_content,
    utm_medium,
    utm_term,
  } = await req.json();

  if (!event) {
    return NextResponse.json({ error: "event required" }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();

  const { error } = await supabase.from("sigma_funnel_events").insert({
    session_id: session_id || null,
    event,
    page: page || null,
    email: email?.toLowerCase().trim() || null,
    metadata: {
      ...(metadata || {}),
      firstname: firstname || metadata?.firstname || null,
      referrer: referrer || null,
    },
    utm_source: utm_source || null,
    utm_campaign: utm_campaign || null,
    utm_content: utm_content || null,
    utm_medium: utm_medium || null,
    utm_term: utm_term || null,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
