// src/lib/vanzon-memory/handler.ts
// Reçoit une transcription vocale, catégorise avec Groq, insère pending_action,
// et envoie un aperçu Telegram avec boutons Sauvegarder / Modifier / Annuler.

import { createSupabaseAdmin } from "@/lib/supabase/server";
import { categorizeMemory } from "./categorizer";
import type { MemorySavePayload } from "./types";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;

async function tgSend(chatId: number, text: string, extra?: object) {
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML", ...extra }),
  });
}

export async function handleVoiceMemory(
  transcript: string,
  chatId:     number
): Promise<void> {
  await tgSend(chatId, "🧠 Catégorisation en cours...");

  let result;
  try {
    result = await categorizeMemory(transcript);
  } catch (err) {
    console.error("[memory] categorize error:", err);
    await tgSend(chatId, "⚠️ Catégorisation échouée. Réessaie ou envoie une note texte.");
    return;
  }

  const payload: MemorySavePayload = {
    action_type:   "memory_save",
    transcript,
    obsidian_file: result.obsidian_file,
    category:      result.category,
    title:         result.title,
    content:       result.content,
    tags:          result.tags,
  };

  const supabase   = createSupabaseAdmin();
  const pendingId  = crypto.randomUUID().replace(/-/g, "").slice(0, 10);
  const expiresAt  = new Date(Date.now() + 60 * 60 * 1000).toISOString();

  const { error } = await supabase.from("telegram_pending_actions").insert({
    id:         pendingId,
    chat_id:    chatId,
    action:     "memory_save",
    state:      "awaiting_confirmation",
    expires_at: expiresAt,
    payload,
  });

  if (error) {
    console.error("[memory] insert pending_action error:", error);
    await tgSend(chatId, "❌ Erreur sauvegarde. Réessaie 🔄");
    return;
  }

  const tagsDisplay = result.tags.map(t => `#${t}`).join(" ");

  // HTML-escape le contenu markdown pour éviter les tags HTML parasites dans <code>
  const htmlEscape = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const preview =
    `🎙️ <b>Note vocale transcrite</b>\n\n` +
    `📝 <b>Transcription :</b>\n<i>"${htmlEscape(transcript.slice(0, 300))}${transcript.length > 300 ? "…" : ""}"</i>\n\n` +
    `📂 <b>Destination :</b> ${result.category}/${result.obsidian_file}\n` +
    `🏷️ <b>Tags :</b> ${tagsDisplay || "(aucun)"}\n\n` +
    `✍️ <b>Note formatée :</b>\n` +
    `<code>## 📝 ${new Date().toISOString().split("T")[0]}\n` +
    `${htmlEscape(result.content)}\n` +
    `Tags : ${htmlEscape(tagsDisplay)}</code>`;

  await tgSend(chatId, preview, {
    reply_markup: {
      inline_keyboard: [[
        { text: "✅ Sauvegarder", callback_data: `asst:confirm:${pendingId}` },
        { text: "✏️ Modifier",   callback_data: `asst:edit:${pendingId}`    },
        { text: "❌ Annuler",    callback_data: `asst:cancel:${pendingId}`  },
      ]],
    },
  });
}
