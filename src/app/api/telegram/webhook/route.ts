// src/app/api/telegram/webhook/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET!;

async function sendTelegram(chatId: string, text: string) {
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
  });
}

async function answerCallback(callbackQueryId: string, text: string) {
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ callback_query_id: callbackQueryId, text }),
  });
}

export async function POST(req: NextRequest) {
  // Vérifier le secret
  const secret = req.headers.get("X-Telegram-Bot-Api-Secret-Token");
  if (secret !== WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json() as {
    callback_query?: {
      id: string;
      from: { id: number };
      data?: string;
      message?: { message_id: number; chat: { id: number } };
    };
  };

  const cb = body.callback_query;
  if (!cb?.data) return NextResponse.json({ ok: true });

  const [action, scheduleId] = cb.data.split(":");
  const chatId = String(cb.message?.chat.id ?? cb.from.id);

  await answerCallback(cb.id, action === "posted" ? "✅ Enregistré !" : "⏭ Reporté");

  const supabase = createSupabaseAdmin();

  if (action === "posted") {
    // 1. Récupérer le slot planifié
    const { data: slot } = await supabase
      .from("facebook_outreach_schedule")
      .select("group_id, template_id, facebook_templates(content)")
      .eq("id", scheduleId)
      .single() as { data: {
        group_id: string;
        template_id: number;
        facebook_templates: { content: string } | null;
      } | null };

    if (slot) {
      // 2. Marquer le slot comme envoyé
      await supabase
        .from("facebook_outreach_schedule")
        .update({ status: "sent", updated_at: new Date().toISOString() })
        .eq("id", scheduleId);

      // 3. Créer l'entrée historique
      await supabase.from("facebook_outreach_posts").insert({
        group_id: slot.group_id,
        template_id: slot.template_id,
        message_content: slot.facebook_templates?.content ?? "",
        status: "sent",
        telegram_message_id: cb.message?.message_id ?? null,
        posted_at: new Date().toISOString(),
      });
    }

    await sendTelegram(chatId, "✅ Post enregistré dans l'historique !");

  } else if (action === "skip") {
    // Reporter au lendemain
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
          updated_at: new Date().toISOString(),
        })
        .eq("id", scheduleId);
    }

    await sendTelegram(chatId, "⏭ Reporté au lendemain.");
  }

  return NextResponse.json({ ok: true });
}
