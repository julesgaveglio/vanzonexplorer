/**
 * Cron: WhatsApp confirmation for closing calls
 * Runs every 5 minutes — sends WhatsApp message 1h after booking
 *
 * Uses the WhatsApp bridge at localhost:8080 (Mac must be on).
 * If bridge is unreachable, silently skips — will retry next run.
 *
 * Protected by CRON_SECRET header (Vercel Cron)
 */

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 30;

// ── Helpers ──

function formatPhoneForWhatsApp(phone: string): string {
  // Remove spaces, dashes, dots
  let cleaned = phone.replace(/[\s\-\.]/g, "");
  // Remove leading +
  if (cleaned.startsWith("+")) cleaned = cleaned.slice(1);
  // Convert 06/07 to 336/337
  if (cleaned.startsWith("0")) cleaned = "33" + cleaned.slice(1);
  return cleaned;
}

function formatCallDate(dateStr: string): { date: string; time: string } {
  const d = new Date(dateStr);
  const date = d.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "Europe/Paris",
  });
  const time = d.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Paris",
  });
  return { date, time };
}

function buildMessage(name: string, scheduledAt: string): string {
  const firstName = name.split(" ")[0];
  const { date, time } = formatCallDate(scheduledAt);

  return (
    `Salut ${firstName} ! C'est Jules de Vanzon, merci d'avoir réservé ton appel avec moi. ` +
    `Je te confirme notre créneau le ${date} à ${time} ! À très vite !`
  );
}

// ── Route ──

export async function GET(req: NextRequest) {
  // Verify cron secret
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createSupabaseAdmin();
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  // Fetch pending calls: upcoming, phone present, no WhatsApp yet, created > 1h ago
  const { data: calls, error } = await supabase
    .from("closing_calls")
    .select("id, name, email, phone, scheduled_at")
    .eq("status", "upcoming")
    .is("whatsapp_sent_at", null)
    .not("phone", "is", null)
    .lt("created_at", oneHourAgo);

  if (error) {
    console.error("[whatsapp-closing] Query error:", error);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }

  if (!calls || calls.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, skipped: 0 });
  }

  let sent = 0;
  let skipped = 0;

  for (const call of calls) {
    const formattedPhone = formatPhoneForWhatsApp(call.phone);
    const message = buildMessage(call.name, call.scheduled_at);

    try {
      const res = await fetch("http://localhost:8080/api/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipient: formattedPhone, message }),
        signal: AbortSignal.timeout(5000),
      });

      if (!res.ok) {
        console.warn(
          `[whatsapp-closing] Bridge returned ${res.status} for ${call.email}`
        );
        skipped++;
        continue;
      }

      // Mark as sent
      await supabase
        .from("closing_calls")
        .update({
          whatsapp_sent_at: new Date().toISOString(),
          whatsapp_message: message,
        })
        .eq("id", call.id);

      console.log(`[whatsapp-closing] Sent to ${call.email} (${formattedPhone})`);
      sent++;
    } catch (err) {
      // Bridge unreachable (Mac off) — skip, will retry next cron run
      console.warn(`[whatsapp-closing] Bridge unreachable for ${call.email}:`, err);
      skipped++;
    }
  }

  return NextResponse.json({ ok: true, sent, skipped, total: calls.length });
}
