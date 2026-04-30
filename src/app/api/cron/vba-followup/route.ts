/**
 * Cron: VBA follow-up email sequence
 * Runs daily at 10h Paris (8h UTC)
 *
 * - E2 (J+1): leads who opted in ~24h ago and haven't viewed VSL
 * - E3 (J+3): leads who opted in ~72h ago and haven't viewed VSL
 * - E4 (J+1 post-VSL): leads who watched VSL 100% but didn't book a call
 *
 * Protected by CRON_SECRET header (Vercel Cron)
 */

import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import {
  buildFollowupE2,
  buildFollowupE3,
  buildFollowupE4,
} from "@/emails/vba-funnel-followup";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(req: Request) {
  // Verify cron secret
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createSupabaseAdmin();
  const resend = new Resend(process.env.RESEND_API_KEY);
  const now = new Date();
  const results = { e2_sent: 0, e3_sent: 0, e4_sent: 0, skipped: 0 };

  // ── Time windows ──
  const e2WindowStart = new Date(now.getTime() - 28 * 60 * 60 * 1000).toISOString();
  const e2WindowEnd = new Date(now.getTime() - 20 * 60 * 60 * 1000).toISOString();
  const e3WindowStart = new Date(now.getTime() - 76 * 60 * 60 * 1000).toISOString();
  const e3WindowEnd = new Date(now.getTime() - 68 * 60 * 60 * 1000).toISOString();

  // ── Get leads ──
  const { data: e2Leads } = await supabase
    .from("vba_funnel_leads")
    .select("email, firstname")
    .gte("created_at", e2WindowStart)
    .lte("created_at", e2WindowEnd);

  const { data: e3Leads } = await supabase
    .from("vba_funnel_leads")
    .select("email, firstname")
    .gte("created_at", e3WindowStart)
    .lte("created_at", e3WindowEnd);

  // ── Get funnel events for filtering ──
  const { data: allEvents } = await supabase
    .from("funnel_events")
    .select("email, event");

  const eventsByEmail = new Map<string, Set<string>>();
  for (const e of allEvents ?? []) {
    if (!e.email) continue;
    if (!eventsByEmail.has(e.email)) eventsByEmail.set(e.email, new Set());
    eventsByEmail.get(e.email)!.add(e.event);
  }

  function hasEvent(email: string, event: string): boolean {
    return eventsByEmail.get(email)?.has(event) ?? false;
  }

  // ── Send E2 (optin J+1, pas de vsl_view) ──
  for (const lead of e2Leads ?? []) {
    if (!lead.email || hasEvent(lead.email, "vsl_view")) {
      results.skipped++;
      continue;
    }
    try {
      const { subject, html } = buildFollowupE2(lead.firstname || "");
      await resend.emails.send({
        from: "Vanzon Explorer <noreply@vanzonexplorer.com>",
        to: lead.email,
        subject,
        html,
      });
      results.e2_sent++;
    } catch (err) {
      console.error(`[vba-followup] E2 error for ${lead.email}:`, err);
    }
  }

  // ── Send E3 (optin J+3, pas de vsl_view) ──
  for (const lead of e3Leads ?? []) {
    if (!lead.email || hasEvent(lead.email, "vsl_view")) {
      results.skipped++;
      continue;
    }
    try {
      const { subject, html } = buildFollowupE3(lead.firstname || "");
      await resend.emails.send({
        from: "Vanzon Explorer <noreply@vanzonexplorer.com>",
        to: lead.email,
        subject,
        html,
      });
      results.e3_sent++;
    } catch (err) {
      console.error(`[vba-followup] E3 error for ${lead.email}:`, err);
    }
  }

  // ── Send E4 (VSL 100% dans les dernieres 28h, pas de booking_start) ──
  // Find emails who triggered vsl_100 recently but never triggered booking_start
  const e4WindowStart = new Date(now.getTime() - 28 * 60 * 60 * 1000).toISOString();
  const { data: recentVsl100 } = await supabase
    .from("funnel_events")
    .select("email")
    .eq("event", "vsl_100")
    .gte("created_at", e4WindowStart);

  const e4Emails = new Set<string>();
  for (const e of recentVsl100 ?? []) {
    if (e.email && !hasEvent(e.email, "booking_start")) {
      e4Emails.add(e.email);
    }
  }

  for (const email of Array.from(e4Emails)) {
    // Get firstname from leads table
    const { data: lead } = await supabase
      .from("vba_funnel_leads")
      .select("firstname")
      .eq("email", email)
      .maybeSingle();

    try {
      const { subject, html } = buildFollowupE4(lead?.firstname || "");
      await resend.emails.send({
        from: "Vanzon Explorer <noreply@vanzonexplorer.com>",
        to: email,
        subject,
        html,
      });
      results.e4_sent++;
    } catch (err) {
      console.error(`[vba-followup] E4 error for ${email}:`, err);
    }
  }

  // ── Telegram recap ──
  if (results.e2_sent > 0 || results.e3_sent > 0 || results.e4_sent > 0) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    if (token && chatId) {
      const text =
        `📧 <b>Séquence email VBA</b>\n` +
        `E2 (J+1, pas vu VSL) : ${results.e2_sent}\n` +
        `E3 (J+3, pas vu VSL) : ${results.e3_sent}\n` +
        `E4 (VSL 100%, pas de call) : ${results.e4_sent}\n` +
        `Skippés : ${results.skipped}`;
      await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
      }).catch(() => {});
    }
  }

  console.log("[vba-followup]", results);
  return NextResponse.json(results);
}
