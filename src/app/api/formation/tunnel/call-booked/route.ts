import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const VIDEO_ID = "uY6pgzXhOPk";
const VIDEO_THUMB = `https://img.youtube.com/vi/${VIDEO_ID}/maxresdefault.jpg`;
const VIDEO_LINK = `https://youtu.be/${VIDEO_ID}`;

export async function POST(req: NextRequest) {
  try {
    const { email, firstname, calendly_event_uri } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "email required" }, { status: 400 });
    }

    const supabase = createSupabaseAdmin();

    await supabase.from("vba_call_reminders").insert({
      email,
      firstname: firstname || null,
      calendly_event_uri: calendly_event_uri || null,
      email_confirm_sent: true,
    });

    const name = firstname || "là";

    await resend.emails.send({
      from: "Jules · Vanzon Explorer <jules@vanzonexplorer.com>",
      to: email,
      subject: "Ton appel avec Jules est confirmé ✅",
      html: `Salut ${name},<br><br>Ton appel est bien réservé. Tu recevras un email Calendly avec la <b>date et l'heure exactes</b>.<br><br>D'ici là, je te conseille de regarder la vidéo dans son intégralité si ce n'est pas encore fait. Ça nous permettra d'avoir un <b>échange plus riche</b> !<br><br><a href="${VIDEO_LINK}"><img src="${VIDEO_THUMB}" alt="Regarder la vidéo" style="width:100%;max-width:480px;border-radius:8px"></a><br><br>À très vite !<br>Jules`,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[call-booked]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
