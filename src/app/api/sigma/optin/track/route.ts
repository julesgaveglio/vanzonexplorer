import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";

// POST — public tracking endpoint (no auth required)
export async function POST(req: NextRequest) {
  const { firstname, email, phone, utm_source, utm_campaign, utm_content, utm_medium, utm_term } =
    await req.json();

  if (!email) {
    return NextResponse.json({ error: "email required" }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();

  // Insert into sigma_leads (upsert on email)
  await supabase
    .from("sigma_leads")
    .upsert(
      {
        email: email.toLowerCase().trim(),
        firstname: firstname || null,
        phone: phone || null,
        utm_source: utm_source || null,
        utm_campaign: utm_campaign || null,
        utm_content: utm_content || null,
        utm_medium: utm_medium || null,
        utm_term: utm_term || null,
      },
      { onConflict: "email" }
    );

  // Insert funnel event
  await supabase.from("sigma_funnel_events").insert({
    event: "optin",
    email: email.toLowerCase().trim(),
    page: "/optin",
    utm_source: utm_source || null,
    utm_campaign: utm_campaign || null,
    utm_content: utm_content || null,
    utm_medium: utm_medium || null,
    utm_term: utm_term || null,
    metadata: { firstname: firstname || null, phone: phone || null },
  });

  return NextResponse.json({ ok: true });
}
