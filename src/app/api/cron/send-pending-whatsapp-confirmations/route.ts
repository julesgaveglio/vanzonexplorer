/**
 * Cron : envoie le WhatsApp de confirmation aux prospects Calendly dont la
 * réservation date de 10+ minutes (whatsapp_sent_at encore null).
 *
 * Le webhook Calendly n'envoie plus ce message lui-même : sur le plan
 * Vercel Hobby, maxDuration est plafonné à 300s — trop court pour attendre
 * 10 minutes dans la fonction. Ce cron est donc appelé toutes les 2 minutes
 * par calendly-poller.mjs (VM Mia), qui fait déjà le même travail de
 * polling pour relayer les webhooks Calendly.
 *
 * Protégé par CRON_SECRET, comme les autres crons du projet.
 */

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const DELAY_MS = 10 * 60 * 1000; // 10 minutes

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

function formatPhoneForWhatsApp(phone: string): string {
  let cleaned = phone.replace(/[\s\-.]/g, "");
  if (cleaned.startsWith("+")) cleaned = cleaned.slice(1);
  if (cleaned.startsWith("0")) cleaned = "33" + cleaned.slice(1);
  return cleaned;
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createSupabaseAdmin();
  const cutoff = new Date(Date.now() - DELAY_MS).toISOString();

  const { data: due, error } = await supabase
    .from("closing_calls")
    .select("id, name, phone, scheduled_at")
    .is("whatsapp_sent_at", null)
    .not("phone", "is", null)
    .eq("status", "upcoming")
    .lte("created_at", cutoff)
    .limit(20);

  if (error) {
    console.error("[cron/whatsapp-confirmations] Query error:", error);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }

  if (!due || due.length === 0) {
    return NextResponse.json({ ok: true, sent: 0 });
  }

  let sent = 0;
  for (const call of due) {
    if (!call.phone) continue;
    try {
      const firstName = call.name.split(" ")[0];
      const formatted = formatDateFR(call.scheduled_at);
      const message = `Salut ${firstName}, je viens de voir que tu as réservé un appel pour ${formatted}, je te confirme que je serai au rendez-vous ! Au plaisir d'échanger ! 😁`;
      const recipient = formatPhoneForWhatsApp(call.phone);

      const res = await fetch("https://vanzon-wa.unhinged-lab.com/api/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipient, message }),
        signal: AbortSignal.timeout(8000),
      });

      if (res.ok) {
        await supabase
          .from("closing_calls")
          .update({ whatsapp_sent_at: new Date().toISOString(), whatsapp_message: message })
          .eq("id", call.id);
        sent++;
        console.log(`[cron/whatsapp-confirmations] Envoyé à ${firstName} (${call.id})`);
      } else {
        console.warn(`[cron/whatsapp-confirmations] Échec WhatsApp pour ${call.id}: ${res.status}`);
      }
    } catch (err) {
      console.warn(`[cron/whatsapp-confirmations] Erreur pour ${call.id}:`, err);
    }
  }

  return NextResponse.json({ ok: true, sent, checked: due.length });
}
