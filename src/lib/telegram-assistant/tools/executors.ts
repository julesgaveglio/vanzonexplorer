// src/lib/telegram-assistant/tools/executors.ts
// Exécute les appels d'outils demandés par Groq.
// Chaque fonction retourne une string JSON envoyée à Groq comme résultat d'outil.

import { createSupabaseAdmin } from "@/lib/supabase/server";
import { listRecentEmails, getEmailById } from "./gmail-reader";
import { fetchGmailSignature } from "@/lib/gmail";
import { getEmailExamples, formatExamplesForPrompt } from "../email-memory";
import { searchVanzonMemory } from "@/lib/vanzon-memory/search";

import Groq from "groq-sdk";

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

// ── Dispatcher principal ──────────────────────────────────────────────────────
export async function executeTool(
  name:   string,
  args:   Record<string, unknown>,
  chatId: number
): Promise<string> {
  try {
    switch (name) {
      case "search_road_trips":          return await searchRoadTrips(args);
      case "get_road_trip_stats":        return await getRoadTripStats();
      case "search_profiles":            return await searchProfiles(args);
      case "search_prospects":           return await searchProspects(args);
      case "send_email_to_road_tripper": return await sendEmailToRoadTripper(args, chatId);
      case "list_recent_emails":         return await listRecentEmailsTool(args);
      case "reply_to_email":             return await replyToEmailTool(args, chatId);
      case "search_memory": return await searchMemoryTool(args);
      default: return JSON.stringify({ error: `Outil inconnu: ${name}` });
    }
  } catch (err) {
    console.error(`[executor] ${name} error:`, err);
    return JSON.stringify({ error: String(err) });
  }
}

// ── search_road_trips ─────────────────────────────────────────────────────────
async function searchRoadTrips(args: Record<string, unknown>): Promise<string> {
  const supabase = createSupabaseAdmin();
  const prenom  = args.prenom  as string | undefined;
  const status  = args.status  as string | undefined;
  const region  = args.region  as string | undefined;
  const limit   = (args.limit  as number | undefined) ?? 10;

  let query = supabase
    .from("road_trip_requests")
    .select("id, prenom, email, region, duree, status, created_at, sent_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (prenom)               query = query.ilike("prenom", `%${prenom}%`);
  if (status && status !== "all") query = query.eq("status", status);
  if (region)               query = query.ilike("region", `%${region}%`);

  const { data, error } = await query;
  if (error) return JSON.stringify({ error: error.message });
  return JSON.stringify({ count: data?.length ?? 0, results: data ?? [] });
}

// ── get_road_trip_stats ───────────────────────────────────────────────────────
async function getRoadTripStats(): Promise<string> {
  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("road_trip_requests")
    .select("status");
  if (error) return JSON.stringify({ error: error.message });

  const rows    = data ?? [];
  const total   = rows.length;
  const sent    = rows.filter(r => r.status === "sent").length;
  const pending = rows.filter(r => r.status === "pending").length;
  const errors  = rows.filter(r => r.status === "error").length;

  return JSON.stringify({
    total,
    sent,
    pending,
    errors,
    success_rate: total > 0 ? `${Math.round((sent / total) * 100)}%` : "0%",
  });
}

// ── search_profiles ───────────────────────────────────────────────────────────
async function searchProfiles(args: Record<string, unknown>): Promise<string> {
  const supabase = createSupabaseAdmin();
  const prenom = args.prenom as string | undefined;
  const plan   = args.plan   as string | undefined;

  let query = supabase
    .from("profiles")
    .select("id, full_name, plan, created_at")
    .order("created_at", { ascending: false })
    .limit(10);

  if (prenom) query = query.ilike("full_name", `%${prenom}%`);
  if (plan)   query = query.eq("plan", plan);

  const { data, error } = await query;
  if (error) return JSON.stringify({ error: error.message });
  return JSON.stringify({ count: data?.length ?? 0, results: data ?? [] });
}

// ── search_prospects ──────────────────────────────────────────────────────────
async function searchProspects(args: Record<string, unknown>): Promise<string> {
  const supabase = createSupabaseAdmin();
  const name   = args.name   as string | undefined;
  const status = args.status as string | undefined;

  let query = supabase
    .from("prospects")
    .select("id, name, website, category, status, strategic_interest, relevance_score")
    .order("relevance_score", { ascending: false })
    .limit(10);

  if (name)   query = query.ilike("name", `%${name}%`);
  if (status) query = query.eq("status", status);

  const { data, error } = await query;
  if (error) return JSON.stringify({ error: error.message });
  return JSON.stringify({ count: data?.length ?? 0, results: data ?? [] });
}

// ── send_email_to_road_tripper ────────────────────────────────────────────────
async function sendEmailToRoadTripper(
  args:   Record<string, unknown>,
  chatId: number
): Promise<string> {
  const prenom = args.prenom as string;
  // Import dynamique pour éviter la dépendance circulaire
  const { sendEmailHandler } = await import("../actions/send-email");
  await sendEmailHandler({ prenom }, chatId);
  return JSON.stringify({
    status: "preview_sent",
    message: "Aperçu de l'email envoyé à Jules. Il peut confirmer ou modifier.",
  });
}

// ── list_recent_emails ────────────────────────────────────────────────────────
async function listRecentEmailsTool(args: Record<string, unknown>): Promise<string> {
  const query      = (args.query      as string | undefined) ?? "in:inbox";
  const maxResults = (args.max_results as number | undefined) ?? 5;
  const emails = await listRecentEmails(query, maxResults);
  return JSON.stringify({ count: emails.length, emails });
}

// ── reply_to_email ────────────────────────────────────────────────────────────
async function replyToEmailTool(
  args:   Record<string, unknown>,
  chatId: number
): Promise<string> {
  const messageId = args.message_id as string;
  const context   = (args.context   as string | undefined) ?? "";

  await tgSend(chatId, "⏳ Génération de la réponse en cours...");

  // Récupérer l'email original complet
  const original = await getEmailById(messageId);

  // Récupérer des exemples few-shot
  const examples    = await getEmailExamples("gmail_reply", 3);
  const examplesStr = formatExamplesForPrompt(examples);

  // Générer la réponse avec Groq
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });
  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          `Tu es Jules Gaveglio, fondateur de Vanzon Explorer (vans aménagés, Pays Basque).` +
          `\nTu réponds à un email reçu de : ${original.from}` +
          `\nSujet original : ${original.subject}` +
          `\nContenu original :\n${original.body.slice(0, 1000)}` +
          (context ? `\n\nInstructions supplémentaires : ${context}` : "") +
          `\n\nRègles :` +
          `\n- Ton chaleureux et authentique, pas corporatif` +
          `\n- Réponse directe et utile` +
          `\n- 2-3 paragraphes maximum` +
          `\n- PAS de formule de politesse finale — la signature est ajoutée automatiquement` +
          `\n- Corps en HTML avec uniquement des balises <p>` +
          examplesStr,
      },
      { role: "user", content: `Génère la réponse. Réponds avec un JSON {"subject": "Re: ${original.subject}", "body": "<p>...</p>"}` },
    ],
    temperature: 0.7,
    max_tokens:  600,
  });

  const raw   = completion.choices[0]?.message?.content ?? "{}";
  const draft = JSON.parse(raw) as { subject: string; body: string };

  // Récupérer signature
  const signature = await fetchGmailSignature("jules@vanzonexplorer.com");

  // Stocker la pending action
  const supabase  = createSupabaseAdmin();
  const pendingId = shortId();
  await supabase.from("telegram_pending_actions").insert({
    id:         pendingId,
    chat_id:    chatId,
    action:     "reply_email",
    state:      "awaiting_confirmation",
    expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    payload: {
      action_type:  "gmail_reply",
      to:           original.from,
      subject:      draft.subject,
      body:         draft.body,
      signature,
      in_reply_to:  original.message_id_header,
      references:   original.references,
      thread_id:    original.thread_id,
      context: {
        from:             original.from,
        subject_original: original.subject,
      },
    },
  });

  // Aperçu Telegram
  const bodyPreview = draft.body
    .replace(/<[^>]+>/g, "")
    .slice(0, 400)
    .trim();
  const escaped = bodyPreview
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  const preview =
    `📧 <b>Aperçu de la réponse</b>\n` +
    `─────────────────────\n` +
    `<b>À :</b> ${original.from}\n` +
    `<b>Objet :</b> ${draft.subject}\n\n` +
    `${escaped}${bodyPreview.length >= 400 ? "…" : ""}\n\n` +
    `<i>${signature ? "[signature configurée ✓]" : "[aucune signature]"}</i>\n` +
    `─────────────────────`;

  await tgSend(chatId, preview, {
    reply_markup: {
      inline_keyboard: [[
        { text: "✅ Envoyer",    callback_data: `asst:confirm:${pendingId}` },
        { text: "✏️ Modifier", callback_data: `asst:edit:${pendingId}` },
      ]],
    },
  });

  return JSON.stringify({
    status:  "preview_sent",
    to:      original.from,
    subject: draft.subject,
  });
}

// ── search_memory ─────────────────────────────────────────────────────────────
async function searchMemoryTool(args: Record<string, unknown>): Promise<string> {
  const results = await searchVanzonMemory({
    query:      (args.query      as string)                  ?? "",
    category:   (args.category   as string | undefined),
    after_date: (args.after_date as string | undefined),
    limit:      (args.limit      as number | undefined) ?? 5,
  });

  if (results.length === 0) {
    return JSON.stringify({ count: 0, message: "Aucune note trouvée pour cette recherche." });
  }

  return JSON.stringify({
    count: results.length,
    notes: results.map(r => ({
      title:    r.title,
      category: r.category,
      content:  r.content,
      tags:     r.tags,
      date:     r.created_at.split("T")[0],
    })),
  });
}
