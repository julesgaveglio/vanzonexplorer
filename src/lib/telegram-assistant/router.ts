// src/lib/telegram-assistant/router.ts
// Gère les messages et callbacks de l'assistant Telegram.
// handleAssistantMessage → runAgent() (nouveau)
// handleAssistantCallback → confirm/edit/select, supporte road_trip_feedback + gmail_reply

import { createSupabaseAdmin } from "@/lib/supabase/server";
import { runAgent } from "./agent";
import { sendGmailEmail, replyGmailEmail } from "@/lib/gmail";
import { saveEmailToMemory } from "./email-memory";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;

async function tgSend(chatId: number, text: string, extra?: object) {
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML", ...extra }),
  });
}

async function tgAnswer(callbackQueryId: string, text = "") {
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ callback_query_id: callbackQueryId, text }),
  });
}

async function cleanExpired(supabase: ReturnType<typeof createSupabaseAdmin>) {
  await supabase
    .from("telegram_pending_actions")
    .delete()
    .lt("expires_at", new Date().toISOString());
}

// ── handleAssistantMessage ────────────────────────────────────────────────────
export async function handleAssistantMessage(
  text:   string,
  chatId: number
): Promise<void> {
  const supabase = createSupabaseAdmin();
  await cleanExpired(supabase);

  // 1. Vérifier awaiting_edit AVANT Groq (le texte est le nouveau corps de l'email)
  const { data: editAction } = await supabase
    .from("telegram_pending_actions")
    .select("*")
    .eq("chat_id", chatId)
    .eq("state", "awaiting_edit")
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  if (editAction) {
    const payload = editAction.payload as Record<string, string>;
    payload.body = text
      .split("\n")
      .map(line => `<p>${line}</p>`)
      .join("");

    await supabase
      .from("telegram_pending_actions")
      .update({
        state:      "awaiting_confirmation",
        payload,
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      })
      .eq("id", editAction.id as string);

    const bodyPreview = text.slice(0, 400).trim();
    const preview =
      `📧 <b>Email mis à jour — Aperçu</b>\n` +
      `─────────────────────\n` +
      `<b>À :</b> ${payload.to}\n` +
      `<b>Objet :</b> ${payload.subject}\n\n` +
      `${bodyPreview}${bodyPreview.length >= 400 ? "…" : ""}\n` +
      `─────────────────────`;

    await tgSend(chatId, preview, {
      reply_markup: {
        inline_keyboard: [[
          { text: "✅ Envoyer",   callback_data: `asst:confirm:${editAction.id}` },
          { text: "✏️ Modifier", callback_data: `asst:edit:${editAction.id}` },
        ]],
      },
    });
    return;
  }

  // 2. Vérifier awaiting_selection
  const { data: selAction } = await supabase
    .from("telegram_pending_actions")
    .select("*")
    .eq("chat_id", chatId)
    .eq("state", "awaiting_selection")
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  if (selAction) {
    await tgSend(chatId, "👆 Clique sur l'un des boutons ci-dessus pour sélectionner la personne.");
    return;
  }

  // 3. Agent Groq tool-calling
  await runAgent(text, chatId);
}

// ── handleAssistantCallback ───────────────────────────────────────────────────
export async function handleAssistantCallback(
  callbackQueryId: string,
  data:            string,
  chatId:          number
): Promise<void> {
  const supabase = createSupabaseAdmin();
  const parts     = data.split(":");
  const type      = parts[1];
  const pendingId = parts[2];
  const index     = parts[3] !== undefined ? parseInt(parts[3], 10) : undefined;

  await tgAnswer(callbackQueryId);

  const { data: action } = await supabase
    .from("telegram_pending_actions")
    .select("*")
    .eq("id", pendingId)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  if (!action) {
    await tgSend(chatId, "⏱ Demande expirée (10 min). Recommence 🔄");
    return;
  }

  const payload    = action.payload as Record<string, unknown>;
  const actionType = (payload.action_type as string) ?? "road_trip_feedback";

  // ── asst:confirm ─────────────────────────────────────────────────────────
  if (type === "confirm") {
    try {
      if (actionType === "gmail_reply") {
        await replyGmailEmail({
          to:          payload.to        as string,
          subject:     payload.subject   as string,
          htmlBody:    payload.body      as string,
          signature:   payload.signature as string,
          in_reply_to: payload.in_reply_to as string,
          references:  payload.references  as string,
          thread_id:   payload.thread_id   as string,
        });
      } else {
        await sendGmailEmail({
          to:        payload.to        as string,
          subject:   payload.subject   as string,
          htmlBody:  payload.body      as string,
          signature: payload.signature as string,
        });
      }

      // Sauvegarder en mémoire few-shot
      await saveEmailToMemory({
        action_type: actionType,
        context:     (payload.context as Record<string, string>) ?? {},
        subject:     payload.subject as string,
        body:        payload.body    as string,
      });

      await supabase.from("telegram_pending_actions").delete().eq("id", pendingId);
      await tgSend(chatId, `✅ Email envoyé à <b>${payload.to}</b>`);
    } catch (err) {
      console.error("[router] confirm error:", err);
      await tgSend(chatId, "❌ Erreur lors de l'envoi. Réessaie 🔄");
    }
    return;
  }

  // ── asst:edit ────────────────────────────────────────────────────────────
  if (type === "edit") {
    await supabase
      .from("telegram_pending_actions")
      .update({
        state:      "awaiting_edit",
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      })
      .eq("id", pendingId);

    const bodyText = (payload.body as string)
      .replace(/<p>/g,   "")
      .replace(/<\/p>/g, "\n")
      .replace(/<[^>]+>/g, "")
      .trim();

    await tgSend(
      chatId,
      `✏️ Modifie le texte ci-dessous et renvoie-le moi :\n\n${bodyText}`,
      { reply_markup: { force_reply: true, selective: true } }
    );
    return;
  }

  // ── asst:select ──────────────────────────────────────────────────────────
  if (type === "select" && index !== undefined) {
    const candidates = payload.candidates as Array<{
      id: string; prenom: string; email: string; region: string; duree: number;
    }>;
    const selected = candidates[index];
    if (!selected) {
      await tgSend(chatId, "❓ Sélection invalide.");
      return;
    }
    await supabase.from("telegram_pending_actions").delete().eq("id", pendingId);

    // Import dynamique pour éviter la circularité
    const { buildAndSendPreview } = await import("./actions/send-email");
    await buildAndSendPreview(chatId, selected);
    return;
  }

  await tgSend(chatId, "❓ Action inconnue.");
}
