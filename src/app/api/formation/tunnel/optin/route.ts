import { NextResponse } from "next/server";
import { z } from "zod";
import { Resend } from "resend";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { buildVBAWelcomeEmail } from "@/emails/vba-funnel-welcome";

const schema = z.object({
  firstname: z.string().min(2, "Prénom requis").max(50),
  email: z.string().email("Email invalide"),
  utm_source: z.string().optional(),
  utm_medium: z.string().optional(),
  utm_campaign: z.string().optional(),
  utm_content: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = schema.parse(body);

    const supabase = createSupabaseAdmin();
    const { error } = await supabase.from("vba_funnel_leads").upsert(
      {
        firstname: data.firstname,
        email: data.email,
        utm_source: data.utm_source ?? null,
        utm_medium: data.utm_medium ?? null,
        utm_campaign: data.utm_campaign ?? null,
        utm_content: data.utm_content ?? null,
        step_reached: "optin",
      },
      { onConflict: "email" }
    );

    if (error) {
      console.error("[tunnel/optin] Supabase error:", error);
      return NextResponse.json({ error: "Erreur lors de l'enregistrement." }, { status: 500 });
    }

    // Send welcome email
    sendWelcomeEmail(data.firstname, data.email).catch((err) =>
      console.error("[tunnel/optin] Email error:", err)
    );

    // Telegram notification
    notifyTelegram(data.firstname, data.email).catch(() => {});

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0].message }, { status: 400 });
    }
    console.error("[tunnel/optin] Error:", err);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}

async function sendWelcomeEmail(firstname: string, email: string) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const vslUrl = "https://vanzonexplorer.com/van-business-academy/presentation";
  const { subject, html } = buildVBAWelcomeEmail({ firstname, vslUrl });

  await resend.emails.send({
    from: "Vanzon Explorer <noreply@vanzonexplorer.com>",
    to: email,
    subject,
    html,
  });
}

async function notifyTelegram(firstname: string, email: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;

  const text =
    `🎓 <b>Nouveau lead VBA Tunnel !</b>\n` +
    `─────────────────────\n` +
    `<b>Prénom :</b> ${firstname}\n` +
    `<b>Email :</b> ${email}\n` +
    `─────────────────────\n` +
    `<a href="https://vanzonexplorer.com/admin/formation">👉 Voir dans l'admin</a>`;

  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
  });
}
