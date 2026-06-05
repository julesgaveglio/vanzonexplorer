import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { sendViaGmail } from "@/lib/gmail/client";

export async function POST(req: NextRequest) {
  try {
    const { email, firstname, calendly_event_uri } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "email required" }, { status: 400 });
    }

    const supabase = createSupabaseAdmin();

    // Store booking reminder
    const { error: insertError } = await supabase.from("vba_call_reminders").insert({
      email,
      firstname: firstname || null,
      calendly_event_uri: calendly_event_uri || null,
      email_confirm_sent: true,
    });

    if (insertError) {
      console.error("[call-booked] Insert error:", insertError.message);
    }

    // Send confirmation email (Email 1)
    const name = firstname || "là";

    await sendViaGmail({
      to: email,
      subject: "Ton appel avec Jules est confirmé ✅",
      textBody: `Salut ${name},

Ton appel est bien réservé. Tu recevras un email Calendly avec la date et l'heure exactes.

D'ici là je te conseille de regarder la vidéo en entier si ce n'est pas encore fait — on aura un échange bien plus riche.

À très vite`,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[call-booked] Error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
