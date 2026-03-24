// src/app/api/telegram/send-daily/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID!;
const CRON_SECRET = process.env.CRON_SECRET!;

async function sendTelegramWithButtons(
  text: string,
  buttons: Array<Array<{ text: string; callback_data: string }>>
) {
  const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: CHAT_ID,
      text,
      parse_mode: "HTML",
      reply_markup: { inline_keyboard: buttons },
    }),
  });
  return res.json();
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");
  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createSupabaseAdmin();
  const today = new Date().toISOString().split("T")[0];

  // Récupérer les posts du jour
  const { data: slots, error } = await supabase
    .from("facebook_outreach_schedule")
    .select(`
      id,
      template_id,
      facebook_groups(group_name, group_url),
      facebook_templates(content)
    `)
    .eq("scheduled_for", today)
    .eq("status", "pending") as {
      data: Array<{
        id: string;
        template_id: number;
        facebook_groups: { group_name: string; group_url: string } | null;
        facebook_templates: { content: string } | null;
      }> | null;
      error: unknown;
    };

  if (error || !slots?.length) {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: "📅 Aucun post Facebook prévu aujourd'hui.",
      }),
    });
    return NextResponse.json({ sent: 0 });
  }

  for (const slot of slots) {
    const group = slot.facebook_groups;
    const template = slot.facebook_templates;
    if (!group || !template) continue;

    const messageText = template.content.replace(
      /utm_content=template_\d/,
      `utm_content=template_${slot.template_id}`
    );

    const text =
      `📣 <b>Post Facebook du jour</b> — Template ${slot.template_id}\n\n` +
      `<b>Groupe :</b> ${group.group_name}\n` +
      `<b>URL :</b> ${group.group_url}\n\n` +
      `<b>Message à copier-coller :</b>\n\n` +
      `<code>${messageText}</code>`;

    await sendTelegramWithButtons(text, [[
      { text: "✅ Posté !", callback_data: `posted:${slot.id}` },
      { text: "⏭ Reporter", callback_data: `skip:${slot.id}` },
    ]]);
  }

  return NextResponse.json({ sent: slots.length });
}
