// src/lib/telegram-assistant/router.ts
// Gère les messages et callbacks de l'assistant Telegram.
// Appelé depuis le webhook uniquement si ce n'est pas un callback Facebook.

import { createSupabaseAdmin } from "@/lib/supabase/server";
import { parseIntent } from "./intent";
import { ACTIONS, getActionDescriptions } from "./actions/index";
import { buildAndSendPreview } from "./actions/send-email";
import { sendGmailEmail } from "@/lib/gmail";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;

// ── Helpers Telegram ──────────────────────────────────────────────────────────
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

// ── Nettoyage des actions expirées ────────────────────────────────────────────
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

  // 1. Vérifier awaiting_edit AVANT de passer à Groq
  const { data: editAction } = await supabase
    .from("telegram_pending_actions")
    .select("*")
    .eq("chat_id", chatId)
    .eq("state", "awaiting_edit")
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  if (editAction) {
    // Traiter le message comme le nouveau corps de l'email
    const payload = editAction.payload as Record<string, string>;
    payload.body = text
      .split("\n")
      .map((line) => `<p>${line}</p>`)
      .join("");

    await supabase
      .from("telegram_pending_actions")
      .update({
        state:      "awaiting_confirmation",
        payload,
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      })
      .eq("id", editAction.id);

    // Renvoyer l'aperçu mis à jour
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

  // 2. Vérifier awaiting_selection (cas rare : texte à la place d'un bouton)
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

  // 3. Intent parser Groq
  const intent = await parseIntent(text, getActionDescriptions());

  if (intent.action === "unknown") {
    const msg = intent.params.fallback_message ?? "Je n'ai pas compris 🤷 Réessaie autrement.";
    await tgSend(chatId, msg);
    return;
  }

  const actionDef = ACTIONS[intent.action];

  if (!actionDef) {
    await tgSend(chatId, `⚠️ Action "<b>${intent.action}</b>" non implémentée.`);
    return;
  }

  await actionDef.handler(intent.params, chatId);
}

// ── handleAssistantCallback ───────────────────────────────────────────────────
export async function handleAssistantCallback(
  callbackQueryId: string,
  data:            string,
  chatId:          number
): Promise<void> {
  const supabase = createSupabaseAdmin();
  const parts = data.split(":");
  // Format : asst:<type>:<pendingId>[:<index>]
  const type      = parts[1];
  const pendingId = parts[2];
  const index     = parts[3] !== undefined ? parseInt(parts[3], 10) : undefined;

  // Répondre immédiatement au callback (dismiss spinner)
  await tgAnswer(callbackQueryId);

  // Récupérer la pending action
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

  const payload = action.payload as Record<string, unknown>;

  // ── asst:confirm:<pendingId> ─────────────────────────────────────────────
  if (type === "confirm") {
    try {
      await sendGmailEmail({
        to:        payload.to as string,
        subject:   payload.subject as string,
        htmlBody:  payload.body as string,
        signature: payload.signature as string,
      });

      await supabase
        .from("telegram_pending_actions")
        .delete()
        .eq("id", pendingId);

      await tgSend(chatId, `✅ Email envoyé à <b>${payload.to}</b>`);
    } catch (err) {
      console.error("[assistant] confirm send error:", err);
      await tgSend(chatId, "❌ Erreur lors de l'envoi. Réessaie 🔄");
    }
    return;
  }

  // ── asst:edit:<pendingId> ────────────────────────────────────────────────
  if (type === "edit") {
    await supabase
      .from("telegram_pending_actions")
      .update({
        state:      "awaiting_edit",
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      })
      .eq("id", pendingId);

    // Extraire le texte brut du corps HTML pour l'édition
    const bodyText = (payload.body as string)
      .replace(/<p>/g, "")
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

  // ── asst:select:<pendingId>:<index> ─────────────────────────────────────
  if (type === "select" && index !== undefined) {
    const candidates = payload.candidates as Array<{
      id: string; prenom: string; email: string; region: string; duree: number;
    }>;
    const selected = candidates[index];
    if (!selected) {
      await tgSend(chatId, "❓ Sélection invalide.");
      return;
    }

    // Supprimer la pending selection et lancer la génération
    await supabase
      .from("telegram_pending_actions")
      .delete()
      .eq("id", pendingId);

    await buildAndSendPreview(chatId, selected);
    return;
  }

  await tgSend(chatId, "❓ Action inconnue.");
}
