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

  const messageBody =
    `Bonjour ${row.prenom},\n\n` +
    `Je suis Jules de Vanzon Explorer, enchanté ! Je suis ravi que vous ayez utilisé notre outil de génération de road trips personnalisés pour planifier votre aventure.\n\n` +
    `Vous faites partie des premières personnes à le tester, et afin de continuer à l'améliorer, nous aimerions recueillir votre retour sincère et honnête sur le road trip que vous avez reçu par email.\n\n` +
    `💬 Quelques questions pour vous guider :\n` +
    `• Avez-vous trouvé toutes les informations que vous recherchiez ?\n` +
    `• Peut-être avez-vous eu le sentiment qu'il manquait certains éléments ?\n\n` +
    `Votre retour est très précieux pour nous. Il nous permettra d'identifier les points à améliorer et de continuer à faire évoluer notre outil.\n\n` +
    `Si vous avez quelques instants pour partager vos impressions, nous vous en serions très reconnaissants.\n\n` +
    `À bientôt sur la route,\nJules`

  const preview =
    `📧 <b>Aperçu de l'email</b>\n` +
    `─────────────────────\n` +
    `<b>À :</b> ${row.email}\n` +
    `<b>Objet :</b> ${subject}\n` +
    `─────────────────────\n\n` +
    `${messageBody}\n\n` +
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
