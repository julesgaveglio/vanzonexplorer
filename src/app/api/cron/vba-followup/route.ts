/**
 * Cron: VBA follow-up email sequence
 * Runs daily at 10h Paris (8h UTC)
 *
 * - E2 (J+1): leads who opted in ~24h ago and haven't viewed VSL
 * - E3 (J+3): leads who opted in ~72h ago and haven't viewed VSL
 *
 * Protected by CRON_SECRET header (Vercel Cron)
 */

import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { buildFollowupE2, buildFollowupE3 } from "@/emails/vba-funnel-followup";

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
  const results = { e2_sent: 0, e3_sent: 0, skipped: 0 };

  // ── Get all leads who opted in 20-28h ago (E2) or 68-76h ago (E3) ──
  const e2WindowStart = new Date(now.getTime() - 28 * 60 * 60 * 1000).toISOString();
  const e2WindowEnd = new Date(now.getTime() - 20 * 60 * 60 * 1000).toISOString();
  const e3WindowStart = new Date(now.getTime() - 76 * 60 * 60 * 1000).toISOString();
  const e3WindowEnd = new Date(now.getTime() - 68 * 60 * 60 * 1000).toISOString();

  // Get E2 candidates
  const { data: e2Leads } = await supabase
    .from("vba_funnel_leads")
    .select("email, firstname")
    .gte("created_at", e2WindowStart)
    .lte("created_at", e2WindowEnd);

  // Get E3 candidates
  const { data: e3Leads } = await supabase
    .from("vba_funnel_leads")
    .select("email, firstname")
    .gte("created_at", e3WindowStart)
    .lte("created_at", e3WindowEnd);

  // Get all emails that have already viewed the VSL
  const { data: vslViewers } = await supabase
    .from("funnel_events")
    .select("email")
    .eq("event", "vsl_view");

  const viewerEmails = new Set((vslViewers ?? []).map((v) => v.email).filter(Boolean));

  // ── Send E2 ──
  for (const lead of e2Leads ?? []) {
    if (!lead.email || viewerEmails.has(lead.email)) {
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

  // ── Send E3 ──
  for (const lead of e3Leads ?? []) {
    if (!lead.email || viewerEmails.has(lead.email)) {
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

  // ── Telegram recap ──
  if (results.e2_sent > 0 || results.e3_sent > 0) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    if (token && chatId) {
      const text =
        `📧 <b>Séquence email VBA</b>\n` +
        `E2 (J+1) : ${results.e2_sent} envoyé(s)\n` +
        `E3 (J+3) : ${results.e3_sent} envoyé(s)\n` +
        `Skippés (VSL déjà vue) : ${results.skipped}`;
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
