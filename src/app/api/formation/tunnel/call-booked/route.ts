import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const { email, firstname, calendly_event_uri } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "email required" }, { status: 400 });
    }

    const supabase = createSupabaseAdmin();

    // Store booking reminder
    await supabase.from("vba_call_reminders").insert({
      email,
      firstname: firstname || null,
      calendly_event_uri: calendly_event_uri || null,
      email_confirm_sent: true,
    });

    // Send confirmation email (Email 1)
    const name = firstname || "là";

    await resend.emails.send({
      from: "Jules · Vanzon Explorer <jules@vanzonexplorer.com>",
      to: email,
      subject: "Ton appel avec Jules est confirmé ✅",
      html: `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:15px;line-height:1.6;color:#1a1a1a;max-width:600px;margin:0 auto;padding:20px">
<p>Salut ${name},</p>
<p>Ton appel est bien réservé. Tu recevras un email Calendly avec la date et l'heure exactes.</p>
<p>D'ici là je te conseille de regarder la vidéo en entier si ce n'est pas encore fait — on aura un échange bien plus riche.</p>
<p>À très vite</p>
<p>Jules</p>
</div>`,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[call-booked] Error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
