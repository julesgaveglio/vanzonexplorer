// src/lib/telegram-assistant/actions/send-email.ts
// Envoie l'email de feedback road trip via le template officiel buildRoadTripFeedbackEmail.
// Pas de génération Groq — le contenu est toujours celui du template.

import { createSupabaseAdmin } from "@/lib/supabase/server";
import { buildRoadTripFeedbackEmail } from "@/emails/road-trip-feedback";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;

async function tgSend(chatId: number, text: string, extra?: object) {
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML", ...extra }),
  });
}

function shortId(): string {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 10);
}

// Convertit le HTML email en texte lisible pour l'aperçu Telegram
function htmlToTelegramText(html: string): string {
  return html
    // Sauts de ligne seulement sur les balises de bloc textuelles
    .replace(/<\/p>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/h[1-6]>/gi, "\n")
    // Supprimer tout le reste (tables, divs, spans, attributs…)
    .replace(/<[^>]+>/g, "")
    // Entités HTML
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    // Supprimer les lignes vides ou purement composées d'espaces
    .split("\n")
    .map(l => l.trim())
    .filter(l => l.length > 0)
    .join("\n")
    // Max 2 sauts de ligne consécutifs
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

// ── Handler principal ─────────────────────────────────────────────────────────
export async function sendEmailHandler(
  params: { prenom: string; email?: string },
  chatId: number
): Promise<void> {
  const { prenom, email } = params;

  if (!prenom) {
    await tgSend(chatId, "❓ Je n'ai pas compris à qui envoyer l'email. Précise le prénom.");
    return;
  }

  // Si un email est fourni directement, on l'utilise sans chercher en DB
  if (email) {
    await buildAndSendPreview(chatId, { prenom, email });
    return;
  }

  // Sinon, cherche par prénom dans road_trip_requests
  const supabase = createSupabaseAdmin();
  const { data: results } = await supabase
    .from("road_trip_requests")
    .select("id, prenom, email, region, duree, created_at")
    .ilike("prenom", `%${prenom}%`)
    .order("created_at", { ascending: false });

  const rows = results ?? [];

  if (rows.length === 0) {
    await tgSend(chatId, `🤷 <b>${prenom}</b> introuvable dans les road trips. Tu peux préciser l'adresse email directement.`);
    return;
  }

  if (rows.length > 1) {
    const pendingId = shortId();
    await supabase.from("telegram_pending_actions").insert({
      id:         pendingId,
      chat_id:    chatId,
      action:     "send_email",
      state:      "awaiting_selection",
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      payload: {
        candidates: rows.slice(0, 5).map((r) => ({
          id: r.id, prenom: r.prenom, email: r.email,
          region: r.region, duree: r.duree, created_at: r.created_at,
        })),
      },
    });

    const buttons = rows.slice(0, 5).map((r, i) => [{
      text:          `${r.prenom} — ${r.region} (${r.duree}j, ${new Date(r.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })})`,
      callback_data: `asst:select:${pendingId}:${i}`,
    }]);

    await tgSend(chatId, `📋 Plusieurs <b>${prenom}</b> trouvés. Lequel ?`, {
      reply_markup: { inline_keyboard: buttons },
    });
    return;
  }

  await buildAndSendPreview(chatId, rows[0]);
}

// ── Construire l'aperçu via le template officiel et stocker la pending action ──
export async function buildAndSendPreview(
  chatId: number,
  row: { prenom: string; email: string }
): Promise<void> {
  const supabase = createSupabaseAdmin();

  const emailEncoded        = encodeURIComponent(row.email);
  const { subject, html }   = buildRoadTripFeedbackEmail({ prenom: row.prenom, emailEncoded });

  const pendingId = shortId();
  const { error: insertErr } = await supabase.from("telegram_pending_actions").insert({
    id:         pendingId,
    chat_id:    chatId,
    action:     "send_email",
    state:      "awaiting_confirmation",
    expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    payload: {
      action_type: "road_trip_feedback",
      to:          row.email,
      subject,
      body:        html,
      signature:   "",        // le template a déjà son propre footer
      context: { prenom: row.prenom },
    },
  });

  if (insertErr) {
    console.error("[send-email] insert pending_actions error:", insertErr);
    await tgSend(chatId, `❌ Erreur DB : ${insertErr.message}`);
    return;
  }

  // Corps complet lisible (Telegram max 4096 chars — réservons ~200 pour l'entête)
  const bodyText = htmlToTelegramText(html)
  const MAX_BODY = 3800
  const bodyDisplay = bodyText.length > MAX_BODY
    ? bodyText.slice(0, MAX_BODY) + "\n…"
    : bodyText

  // Échapper les caractères HTML Telegram dans le corps
  const bodyEscaped = bodyDisplay
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")

  const preview =
    `📧 <b>Aperçu de l'email</b>\n` +
    `─────────────────────\n` +
    `<b>À :</b> ${row.email}\n` +
    `<b>Objet :</b> ${subject}\n` +
    `─────────────────────\n\n` +
    `${bodyEscaped}\n\n` +
    `─────────────────────`;

  await tgSend(chatId, preview, {
    reply_markup: {
      inline_keyboard: [[
        { text: "✅ Envoyer",   callback_data: `asst:confirm:${pendingId}` },
        { text: "❌ Annuler",  callback_data: `asst:cancel:${pendingId}` },
      ]],
    },
  });
}
