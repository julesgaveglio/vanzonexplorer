// src/lib/telegram-assistant/actions/send-email.ts
import Groq from "groq-sdk";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { fetchGmailSignature } from "@/lib/gmail";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;

// ── Helpers Telegram ──────────────────────────────────────────────────────────
async function tgSend(chatId: number, text: string, extra?: object) {
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML", ...extra }),
  });
}

// ── ID court (10 chars hex) ───────────────────────────────────────────────────
function shortId(): string {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 10);
  // ex: "f47ac10b8e" — callback_data max: "asst:confirm:f47ac10b8e" = 23 chars < 64 bytes Telegram ✓
}

// ── Génération email via Groq ─────────────────────────────────────────────────
interface EmailDraft {
  subject: string;
  body:    string; // HTML <p> uniquement
}

async function generateEmailDraft(
  prenom: string,
  region: string,
  duree:  number
): Promise<EmailDraft> {
  // Récupérer les exemples few-shot
  const { getEmailExamples, formatExamplesForPrompt } = await import("../email-memory");
  const examples    = await getEmailExamples("road_trip_feedback", 3);
  const examplesStr = formatExamplesForPrompt(examples);

  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });

  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "system",
        content:
          `Tu es Jules Gaveglio, fondateur de Vanzon Explorer (location de vans aménagés au Pays Basque).` +
          `\nGénère un email professionnel et chaleureux en français pour demander un retour sincère à ${prenom}` +
          `\nqui a utilisé notre outil de génération de road trip personnalisé pour ${duree} jours en ${region}.` +
          `\n\nRègles :` +
          `\n- Ton chaleureux et authentique, pas corporatif` +
          `\n- Mentionner leur road trip spécifique (région + durée)` +
          `\n- Demander un retour sincère et honnête sur l'outil` +
          `\n- 3-4 courts paragraphes maximum` +
          `\n- PAS de formule de politesse finale — la signature est ajoutée automatiquement` +
          `\n- Corps en HTML avec uniquement des balises <p>` +
          examplesStr +
          `\n\nRéponds UNIQUEMENT avec du JSON valide :` +
          `\n{"subject": "...", "body": "<p>...</p><p>...</p>"}`,
      },
      { role: "user", content: "Génère l'email." },
    ],
    temperature: 0.7,
    max_tokens:  600,
  });

  const raw     = completion.choices[0]?.message?.content ?? "{}";
  const cleaned = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
  const data    = JSON.parse(cleaned) as EmailDraft;
  return data;
}

// ── Handler principal ─────────────────────────────────────────────────────────
export async function sendEmailHandler(
  params: Record<string, string>,
  chatId: number
): Promise<void> {
  const prenom = params.prenom;
  if (!prenom) {
    await tgSend(chatId, "❓ Je n'ai pas compris à qui envoyer l'email. Précise le prénom.");
    return;
  }

  const supabase = createSupabaseAdmin();

  // 1. Chercher dans road_trip_requests (tous les statuts)
  const { data: results } = await supabase
    .from("road_trip_requests")
    .select("id, prenom, email, region, duree, created_at")
    .ilike("prenom", `%${prenom}%`)
    .order("created_at", { ascending: false });

  const rows = results ?? [];

  // 2a. Aucun résultat
  if (rows.length === 0) {
    await tgSend(chatId, `🤷 <b>${prenom}</b> introuvable dans les road trips.`);
    return;
  }

  // 2b. Plusieurs résultats — désambiguïsation
  if (rows.length > 1) {
    try {
      const pendingId = shortId();
      await supabase.from("telegram_pending_actions").insert({
        id:         pendingId,
        chat_id:    chatId,
        action:     "send_email",
        state:      "awaiting_selection",
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        payload: { candidates: rows.map((r) => ({
          id: r.id, prenom: r.prenom, email: r.email,
          region: r.region, duree: r.duree, created_at: r.created_at,
        })) },
      });

      const buttons = rows.slice(0, 5).map((r, i) => [{
        text:          `${r.prenom} — ${r.region} (${r.duree}j, ${new Date(r.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })})`,
        callback_data: `asst:select:${pendingId}:${i}`,
      }]);

      await tgSend(chatId, `📋 Plusieurs <b>${prenom}</b> trouvés. Lequel ?`, {
        reply_markup: { inline_keyboard: buttons },
      });
    } catch (err) {
      console.error("[send-email] disambiguation error:", err);
      await tgSend(chatId, "❌ Erreur serveur, réessaie 🔄");
    }
    return;
  }

  // 2c. Un seul résultat — continuer directement
  await buildAndSendPreview(chatId, rows[0]);
}

// ── Construire l'aperçu et stocker la pending action ─────────────────────────
export async function buildAndSendPreview(
  chatId: number,
  row: { id: string; prenom: string; email: string; region: string; duree: number }
): Promise<void> {
  const supabase = createSupabaseAdmin();

  await tgSend(chatId, "⏳ Génération de l'email en cours...");

  try {
    // Générer le brouillon
    let draft: EmailDraft;
    try {
      draft = await generateEmailDraft(row.prenom, row.region, row.duree);
    } catch (draftErr) {
      console.error("[send-email] generateEmailDraft error:", draftErr);
      await tgSend(chatId, `❌ Erreur génération Groq : ${String(draftErr).slice(0, 200)}`);
      return;
    }

    // Récupérer la signature Gmail
    const signature = await fetchGmailSignature("jules@vanzonexplorer.com");

    // Stocker la pending action
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
        subject:     draft.subject,
        body:        draft.body,
        signature,
        prenom:      row.prenom,
        region:      row.region,
        duree:       row.duree,
        context: {
          prenom: row.prenom,
          region: row.region,
          duree:  String(row.duree),
        },
      },
    });
    if (insertErr) {
      console.error("[send-email] insert pending_actions error:", insertErr);
      await tgSend(chatId, `❌ Erreur DB insert : ${insertErr.message}`);
      return;
    }

    // Construire le texte d'aperçu (HTML Telegram, pas d'HTML email ici)
    const bodyPreview = draft.body
      .replace(/<[^>]+>/g, "")   // strip HTML pour aperçu Telegram
      .slice(0, 400)
      .trim();

    // Échapper les caractères HTML pour Telegram parse_mode HTML
    const escaped = bodyPreview
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    const preview =
      `📧 <b>Aperçu de l'email</b>\n` +
      `─────────────────────\n` +
      `<b>À :</b> ${row.email}\n` +
      `<b>Objet :</b> ${draft.subject}\n\n` +
      `${escaped}${bodyPreview.length >= 400 ? "…" : ""}\n\n` +
      `<i>${signature ? "[signature configurée ✓]" : "[aucune signature trouvée]"}</i>\n` +
      `─────────────────────`;

    await tgSend(chatId, preview, {
      reply_markup: {
        inline_keyboard: [[
          { text: "✅ Envoyer",   callback_data: `asst:confirm:${pendingId}` },
          { text: "✏️ Modifier", callback_data: `asst:edit:${pendingId}` },
        ]],
      },
    });
  } catch (err) {
    console.error("[send-email] error:", err);
    await tgSend(chatId, "❌ Erreur lors de la génération de l'email. Réessaie 🔄");
  }
}
