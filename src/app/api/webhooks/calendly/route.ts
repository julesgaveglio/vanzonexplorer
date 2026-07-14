/**
 * Calendly Webhook — receives booking events and stores them in Supabase
 *
 * Events handled:
 * - invitee.created  → upsert closing_calls with status "upcoming"
 * - invitee.canceled → set status to "cancelled"
 *
 * Sends Telegram notification on new bookings.
 */

import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { createSupabaseAdmin } from "@/lib/supabase/server";

export const runtime = "nodejs";

// Le WhatsApp de confirmation au prospect part 10 minutes après la
// réservation (plus humain qu'une réponse instantanée de robot). Le plan
// Vercel Hobby plafonne maxDuration à 300s — impossible d'attendre 10 min
// dans la fonction elle-même. À la place : le webhook se contente
// d'enregistrer la réservation, et l'envoi différé est déclenché par
// /api/cron/send-pending-whatsapp-confirmations, appelé toutes les 2 min
// par calendly-poller.mjs sur la VM (même mécanisme que le poller Calendly).
const WELCOME_DELAY_MS = 10 * 60 * 1000; // 10 minutes

// ── Types ──

interface CalendlyPayload {
  event: string;
  payload: {
    event: string; // Calendly event URI
    name: string;
    email: string;
    text_reminder_number?: string;
    questions_and_answers?: Array<{
      question: string;
      answer: string;
    }>;
    scheduled_event: {
      start_time: string;
      end_time: string;
      name: string;
    };
  };
}

// ── Helpers ──

function extractPhone(payload: CalendlyPayload["payload"]): string | null {
  // Priority 1: text_reminder_number
  if (payload.text_reminder_number) return payload.text_reminder_number;

  // Priority 2: "Phone Number" question
  if (payload.questions_and_answers) {
    const phoneQ = payload.questions_and_answers.find(
      (q) =>
        q.question.toLowerCase().includes("phone") ||
        q.question.toLowerCase().includes("téléphone") ||
        q.question.toLowerCase().includes("numéro")
    );
    if (phoneQ?.answer) return phoneQ.answer;
  }

  return null;
}

function extractNotes(payload: CalendlyPayload["payload"]): string | null {
  if (!payload.questions_and_answers) return null;

  const noteQ = payload.questions_and_answers.find(
    (q) =>
      q.question.toLowerCase().includes("partager") ||
      q.question.toLowerCase().includes("utile") ||
      q.question.toLowerCase().includes("anything")
  );
  return noteQ?.answer || null;
}

function formatDateFR(dateStr: string): string {
  const d = new Date(dateStr);
  const date = d.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Paris",
  });
  const time = d.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Paris",
  });
  return `${date} à ${time}`;
}

// ── WhatsApp ──

function formatPhoneForWhatsApp(phone: string): string {
  let cleaned = phone.replace(/[\s\-\.]/g, "");
  if (cleaned.startsWith("+")) cleaned = cleaned.slice(1);
  if (cleaned.startsWith("0")) cleaned = "33" + cleaned.slice(1);
  return cleaned;
}

async function sendWhatsApp(
  name: string,
  phone: string,
  scheduledAt: string,
  supabase: ReturnType<typeof createSupabaseAdmin>
) {
  const firstName = name.split(" ")[0];
  const formatted = formatDateFR(scheduledAt);
  const message = `Salut ${firstName}, je viens de voir que tu as réservé un appel pour ${formatted}, je te confirme que je serai au rendez-vous ! Au plaisir d'échanger ! 😁`;
  const recipient = formatPhoneForWhatsApp(phone);

  try {
    const res = await fetch("https://vanzon-wa.unhinged-lab.com/api/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipient, message }),
      signal: AbortSignal.timeout(5000),
    });

    if (res.ok) {
      // Mark as sent in DB
      await supabase
        .from("closing_calls")
        .update({ whatsapp_sent_at: new Date().toISOString(), whatsapp_message: message })
        .eq("email", name) // Will be caught by cron if this fails
        .eq("phone", phone);
      console.log(`[calendly] WhatsApp sent to ${recipient}`);
    }
  } catch {
    // Bridge unreachable — cron at 7am will retry
    console.warn(`[calendly] WhatsApp bridge unreachable for ${recipient}`);
  }
}

// ── WhatsApp notification to Jules ──

async function notifyJulesWhatsApp(data: {
  name: string;
  phone: string | null;
  scheduledAt: string;
}) {
  const recipients = [
    process.env.JULES_WHATSAPP_NUMBER,   // Jules
    "33643935830",                        // Matteo (media buyer)
  ].filter(Boolean) as string[];

  if (recipients.length === 0) return;

  const firstName = data.name.split(" ")[0];
  const formatted = formatDateFR(data.scheduledAt);

  const message =
    `📞 ${firstName} vient de book un call !\n` +
    `📅 ${formatted}\n` +
    `${data.phone ? `📱 ${data.phone}` : "📱 Pas de numéro"}`;

  for (const recipient of recipients) {
    try {
      await fetch("https://vanzon-wa.unhinged-lab.com/api/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipient, message }),
        signal: AbortSignal.timeout(5000),
      });
      console.log(`[calendly] WhatsApp notification sent to ${recipient}`);
    } catch {
      console.warn(`[calendly] WhatsApp bridge unreachable for ${recipient}`);
    }
  }
}

// ── Telegram ──

async function notifyTelegram(data: {
  name: string;
  email: string;
  phone: string | null;
  scheduledAt: string;
  notes: string | null;
}) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;

  const formattedDate = formatDateFR(data.scheduledAt);
  const phoneLine = data.phone
    ? `<b>Tel :</b> ${data.phone}`
    : `<b>Tel :</b> Non renseigné`;
  const whatsappLink = data.phone
    ? `\n<a href="https://wa.me/${data.phone.replace(/[\s\-\+\.]/g, "")}">📱 Ouvrir WhatsApp</a>`
    : "";

  const text =
    `📞 <b>Nouveau Closing Call !</b>\n` +
    `─────────────────────\n` +
    `<b>Nom :</b> ${data.name}\n` +
    `<b>Email :</b> ${data.email}\n` +
    `${phoneLine}\n` +
    `<b>Date :</b> ${formattedDate}\n` +
    `<b>Notes :</b> ${data.notes || "Aucune"}\n` +
    `─────────────────────\n` +
    `💬 WhatsApp auto dans 1h` +
    whatsappLink;

  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
  });
}

// ── Route ──

// Vérifie la signature Calendly (header "Calendly-Webhook-Signature: t=...,v1=...")
// Activée uniquement si CALENDLY_WEBHOOK_SIGNING_KEY est définie — la clé se
// récupère à la création du webhook via l'API Calendly (webhook_subscriptions).
function verifyCalendlySignature(rawBody: string, header: string | null, signingKey: string): boolean {
  if (!header) return false;
  const parts = Object.fromEntries(
    header.split(",").map((p) => p.split("=", 2) as [string, string])
  );
  const { t: timestamp, v1: signature } = parts;
  if (!timestamp || !signature) return false;
  const expected = createHmac("sha256", signingKey)
    .update(`${timestamp}.${rawBody}`)
    .digest("hex");
  const a = Buffer.from(expected, "hex");
  const b = Buffer.from(signature, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();

    const signingKey = process.env.CALENDLY_WEBHOOK_SIGNING_KEY;
    if (signingKey) {
      const header = req.headers.get("calendly-webhook-signature");
      if (!verifyCalendlySignature(rawBody, header, signingKey)) {
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    }

    const body = JSON.parse(rawBody) as CalendlyPayload;

    // Validate payload structure
    if (!body?.event || !body?.payload?.email || !body?.payload?.scheduled_event) {
      return NextResponse.json(
        { error: "Invalid payload structure" },
        { status: 400 }
      );
    }

    const supabase = createSupabaseAdmin();
    const { payload } = body;

    // ── Handle cancellation ──
    if (body.event === "invitee.canceled") {
      const { error } = await supabase
        .from("closing_calls")
        .update({ status: "cancelled" })
        .eq("email", payload.email)
        .eq("calendar_event_id", payload.event);

      if (error) console.error("[calendly] Cancel update error:", error);

      return NextResponse.json({ ok: true, action: "cancelled" });
    }

    // ── Handle new booking (invitee.created) ──
    if (body.event !== "invitee.created") {
      return NextResponse.json({ ok: true, action: "ignored" });
    }

    const phone = extractPhone(payload);
    const notes = extractNotes(payload);

    const record = {
      name: payload.name,
      email: payload.email,
      phone,
      scheduled_at: payload.scheduled_event.start_time,
      notes,
      status: "upcoming" as const,
      calendar_event_id: payload.event,
          };

    // Upsert using email + calendar_event_id as conflict resolution
    const { error } = await supabase.from("closing_calls").upsert(record, {
      onConflict: "calendar_event_id",
    });

    if (error) {
      console.error("[calendly] Upsert error:", error);
      // Fallback: try insert without conflict key
      const { error: insertError } = await supabase
        .from("closing_calls")
        .insert(record);
      if (insertError) {
        console.error("[calendly] Insert fallback error:", insertError);
        return NextResponse.json({ error: "DB error" }, { status: 500 });
      }
    }

    // Notify Jules via Telegram
    await notifyTelegram({
      name: payload.name,
      email: payload.email,
      phone,
      scheduledAt: payload.scheduled_event.start_time,
      notes,
    });

    // Notify Jules via WhatsApp (personal)
    notifyJulesWhatsApp({
      name: payload.name,
      phone,
      scheduledAt: payload.scheduled_event.start_time,
    }).catch((err) => console.warn("[calendly] Jules WhatsApp notify failed:", err));

    // Le WhatsApp de confirmation au prospect n'est PAS envoyé ici — voir le
    // commentaire en haut de fichier. /api/cron/send-pending-whatsapp-confirmations
    // le prendra dans 10 minutes (whatsapp_sent_at reste null pour l'instant).

    return NextResponse.json({ ok: true, action: "created", email: payload.email });
  } catch (err) {
    console.error("[calendly] Webhook error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
