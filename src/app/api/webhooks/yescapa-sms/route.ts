import { NextRequest, NextResponse } from "next/server";
import { sendWhatsAppMessage } from "@/lib/whatsapp";

// Webhook for iPhone Shortcut → parses Yescapa SMS → sends Telegram notification
// Format SMS: "Milian a confirmé et payé la location du 27 juillet 2026 14:00 au 6 aout 2026 12:00 sur Yescapa.fr. Téléphonez-lui au +33 6 95 07 56 10 pour organiser le départ."

interface ReservationInfo {
  clientName: string;
  phone: string;
  startDate: string;
  endDate: string;
  rawMessage: string;
}

function parseSMS(text: string): ReservationInfo | null {
  // Extract client name: first word before " a confirmé"
  const nameMatch = text.match(/^(.+?)\s+a confirmé/i);
  // Extract phone: +33 format
  const phoneMatch = text.match(/(\+\d[\d\s]{8,})/);
  // Extract dates: "du X au Y"
  const dateMatch = text.match(/du\s+(.+?)\s+au\s+(.+?)\s+sur/i);

  if (!nameMatch || !phoneMatch) return null;

  return {
    clientName: nameMatch[1].trim(),
    phone: phoneMatch[1].replace(/\s/g, ""),
    startDate: dateMatch?.[1]?.trim() ?? "",
    endDate: dateMatch?.[2]?.trim() ?? "",
    rawMessage: text,
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const smsText = body.message || body.text || body.sms || "";

    if (!smsText) {
      return NextResponse.json({ error: "message requis" }, { status: 400 });
    }

    const info = parseSMS(smsText);
    if (!info) {
      return NextResponse.json({ error: "SMS non reconnu" }, { status: 400 });
    }

    // Notify Telegram
    await notifyTelegram(info);

    // Send WhatsApp auto-message to the client
    const whatsappMessage =
      `Bonjour ${info.clientName} ! 🚐\n\n` +
      `Merci pour votre réservation du ${info.startDate} au ${info.endDate} !\n\n` +
      `Je suis Jules de Vanzon Explorer. Je vous contacterai très vite pour organiser le départ et répondre à toutes vos questions.\n\n` +
      `À très bientôt ! 😊`;

    const whatsappSent = await sendWhatsAppMessage(info.phone, whatsappMessage);

    return NextResponse.json({ ok: true, parsed: info, whatsapp_sent: whatsappSent });
  } catch (err) {
    console.error("[yescapa-sms] Error:", err);
    return NextResponse.json({ error: "Erreur" }, { status: 500 });
  }
}

async function notifyTelegram(info: ReservationInfo) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;

  const text =
    `🚐 <b>Nouvelle réservation Yescapa !</b>\n` +
    `─────────────────────\n` +
    `<b>Client :</b> ${info.clientName}\n` +
    `<b>Tél :</b> ${info.phone}\n` +
    `<b>Du :</b> ${info.startDate}\n` +
    `<b>Au :</b> ${info.endDate}\n` +
    `─────────────────────\n` +
    `<a href="https://wa.me/${info.phone.replace('+', '')}">📱 Ouvrir WhatsApp</a>`;

  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
  });
}
