/**
 * telegram.ts — Utilitaire de notification Telegram
 *
 * Envoie un message à Jules sur Telegram via un bot.
 * Utilisé à la fin de chaque agent automatique pour notifier du statut.
 *
 * Variables d'environnement requises :
 *   TELEGRAM_BOT_TOKEN  — token du bot (via @BotFather)
 *   TELEGRAM_CHAT_ID    — ton chat ID personnel (via @userinfobot)
 *
 * Usage :
 *   import { notifyTelegram } from "../lib/telegram";
 *   await notifyTelegram("✅ Agent terminé — 3 articles publiés");
 */

export async function notifyTelegram(message: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.log("[Telegram] Variables manquantes (TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID) — notification ignorée");
    return;
  }

  try {
    const resp = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });

    if (!resp.ok) {
      const err = await resp.text();
      console.warn(`[Telegram] Erreur envoi : ${err}`);
    }
  } catch (err) {
    // Non-bloquant — une erreur Telegram ne doit pas faire échouer un agent
    console.warn(`[Telegram] Exception : ${err instanceof Error ? err.message : String(err)}`);
  }
}
