// src/lib/telegram-assistant/router.ts
// Gère les messages et callbacks de l'assistant Telegram.
// handleAssistantMessage → runAgent() (nouveau)
// handleAssistantCallback → confirm/edit/select, supporte road_trip_feedback + gmail_reply

import { createSupabaseAdmin } from "@/lib/supabase/server";
import { runAgent } from "./agent";
import { sendGmailEmail, replyGmailEmail } from "@/lib/gmail";
import { saveEmailToMemory } from "./email-memory";
import { saveMemoryNote } from "@/lib/vanzon-memory/writer";
import { categorizeMemory } from "@/lib/vanzon-memory/categorizer";
import type { MemorySavePayload } from "@/lib/vanzon-memory/types";

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

  // 0. Vérifier awaiting_memory_edit — AVANT awaiting_edit ET awaiting_selection
  const { data: memEditAction } = await supabase
    .from("telegram_pending_actions")
    .select("*")
    .eq("chat_id", chatId)
    .eq("state", "awaiting_memory_edit")
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  if (memEditAction) {
    const payload = memEditAction.payload as MemorySavePayload;
    let updated;
    try {
      updated = await categorizeMemory(payload.transcript, text);
    } catch {
      await tgSend(chatId, "⚠️ Catégorisation échouée. Réessaie.");
      return;
    }
    const newPayload: MemorySavePayload = { ...payload, ...updated };
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    await supabase
      .from("telegram_pending_actions")
      .update({ state: "awaiting_confirmation", payload: newPayload, expires_at: expiresAt })
      .eq("id", memEditAction.id as string);

    const tagsDisplay = updated.tags.map((t: string) => `#${t}`).join(" ");
    const htmlEscape = (s: string) =>
      s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const preview =
      `🎙️ <b>Note mise à jour</b>\n\n` +
      `📂 <b>Destination :</b> ${updated.category}/${updated.obsidian_file}\n` +
      `🏷️ <b>Tags :</b> ${tagsDisplay || "(aucun)"}\n\n` +
      `✍️ <b>Note formatée :</b>\n` +
      `<code>## 📝 ${new Date().toISOString().split("T")[0]}\n${htmlEscape(updated.content)}\nTags : ${htmlEscape(tagsDisplay)}</code>`;

    const pendingId = memEditAction.id as string;
    await tgSend(chatId, preview, {
      reply_markup: {
        inline_keyboard: [[
          { text: "✅ Sauvegarder", callback_data: `asst:confirm:${pendingId}` },
          { text: "✏️ Modifier",   callback_data: `asst:edit:${pendingId}`    },
          { text: "❌ Annuler",    callback_data: `asst:cancel:${pendingId}`  },
        ]],
      },
    });
    return;
  }

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
    await tgSend(chatId, "⏱ Demande expirée. Recommence 🔄");
    return;
  }

  const payload    = action.payload as Record<string, unknown>;
  const actionType = (payload.action_type as string) ?? "road_trip_feedback";

  // ── asst:confirm ─────────────────────────────────────────────────────────
  if (type === "confirm") {
    // Branch memory_save — AVANT gmail_reply
    if (actionType === "memory_save") {
      try {
        await saveMemoryNote(payload as unknown as MemorySavePayload);
        await supabase.from("telegram_pending_actions").delete().eq("id", pendingId);
        await tgSend(chatId, `✅ Noté dans <b>${(payload as Record<string,string>).category}</b> › ${(payload as Record<string,string>).obsidian_file}`);
      } catch (err) {
        console.error("[router] memory confirm error:", err);
        await tgSend(chatId, "❌ Erreur sauvegarde. Réessaie 🔄");
      }
      return;
    }

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
    if (actionType === "memory_save") {
      // Memory edit → awaiting_memory_edit (TTL 60 min)
      await supabase
        .from("telegram_pending_actions")
        .update({
          state:      "awaiting_memory_edit",
          expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        })
        .eq("id", pendingId);
      await tgSend(chatId, "✏️ Envoie ta correction en texte libre (ex: \"change la destination vers anecdotes\")");
      return;
    }

    // Email edit → awaiting_edit (TTL 10 min) — comportement existant inchangé
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

  // ── asst:cancel ──────────────────────────────────────────────────────────
  if (type === "cancel") {
    await supabase.from("telegram_pending_actions").delete().eq("id", pendingId);
    const cancelMsg = actionType === "memory_save" ? "❌ Note annulée." : "❌ Envoi annulé.";
    await tgSend(chatId, cancelMsg);
    return;
  }

  await tgSend(chatId, "❓ Action inconnue.");
}
