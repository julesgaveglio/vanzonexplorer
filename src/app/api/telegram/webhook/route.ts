// src/app/api/telegram/webhook/route.ts
// Thin router : dispatche vers Facebook outreach ou Assistant selon le type d'événement.

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { handleAssistantMessage, handleAssistantCallback } from "@/lib/telegram-assistant/router";

const BOT_TOKEN      = process.env.TELEGRAM_BOT_TOKEN!;
const WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET!;

async function sendTelegram(chatId: string, text: string) {
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
  });
}

async function answerCallback(callbackQueryId: string, text: string) {
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ callback_query_id: callbackQueryId, text }),
  });
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get("X-Telegram-Bot-Api-Secret-Token");
  if (secret !== WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json() as {
    message?: {
      message_id: number;
      chat:       { id: number };
      text?:      string;
    };
    callback_query?: {
      id:       string;
      from:     { id: number };
      data?:    string;
      message?: { message_id: number; chat: { id: number } };
    };
  };

  // ── Message texte → Assistant ─────────────────────────────────────────────
  if (body.message?.text) {
    const chatId = body.message.chat.id;
    await handleAssistantMessage(body.message.text, chatId);
    return NextResponse.json({ ok: true });
  }

  // ── Callback query ─────────────────────────────────────────────────────────
  const cb = body.callback_query;
  if (!cb?.data) return NextResponse.json({ ok: true });

  const chatId  = cb.message?.chat.id ?? cb.from.id;
  const [action] = cb.data.split(":");

  // Callbacks Facebook : "posted:<uuid>" ou "skip:<uuid>"
  if (action === "posted" || action === "skip") {
    const scheduleId = cb.data.split(":")[1];
    await answerCallback(cb.id, action === "posted" ? "✅ Enregistré !" : "⏭ Reporté");

    const supabase = createSupabaseAdmin();

    if (action === "posted") {
      const { data: slot } = await supabase
        .from("facebook_outreach_schedule")
        .select("group_id, template_id, facebook_templates(content)")
        .eq("id", scheduleId)
        .single() as {
          data: {
            group_id:           string;
            template_id:        number;
            facebook_templates: { content: string } | null;
          } | null;
        };

      if (slot) {
        await supabase
          .from("facebook_outreach_schedule")
          .update({ status: "sent", updated_at: new Date().toISOString() })
          .eq("id", scheduleId);

        await supabase.from("facebook_outreach_posts").insert({
          group_id:        slot.group_id,
          template_id:     slot.template_id,
          message_content: slot.facebook_templates?.content ?? "",
          status:          "sent",
          telegram_message_id: cb.message?.message_id ?? null,
          posted_at:       new Date().toISOString(),
        });
      }

      await sendTelegram(String(chatId), "✅ Post enregistré dans l'historique !");
    } else {
      const { data: slot } = await supabase
        .from("facebook_outreach_schedule")
        .select("scheduled_for")
        .eq("id", scheduleId)
        .single();

      if (slot) {
        const next = new Date(slot.scheduled_for);
        next.setDate(next.getDate() + 1);
        await supabase
          .from("facebook_outreach_schedule")
          .update({
            scheduled_for: next.toISOString().split("T")[0],
            updated_at:    new Date().toISOString(),
          })
          .eq("id", scheduleId);
      }

      await sendTelegram(String(chatId), "⏭ Reporté au lendemain.");
    }

    return NextResponse.json({ ok: true });
  }

  // Callbacks Assistant : "asst:<type>:<pendingId>[:<index>]"
  if (action === "asst") {
    await handleAssistantCallback(cb.id, cb.data, chatId);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: true });
}
