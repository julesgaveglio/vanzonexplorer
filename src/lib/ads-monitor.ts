// Ads Monitor — tracks verification events and alerts via Telegram
// Used by verify-email, verify-phone routes + daily cron

import { createSupabaseAdmin } from "@/lib/supabase/server";

// ── Track a verification event in funnel_events ──
export async function trackVerification(type: "email" | "phone", email: string | null, valid: boolean, reason: string) {
  try {
    const sb = createSupabaseAdmin();
    await sb.from("funnel_events").insert({
      event: valid ? `verify_${type}_ok` : `verify_${type}_rejected`,
      email: email || null,
      page: "/van-business-academy/inscription",
      metadata: { type, valid, reason },
    });
  } catch {
    // Don't crash the verification flow
  }
}

// ── Check rejection rate and alert if too high ──
export async function checkRejectionRateAndAlert() {
  try {
    const sb = createSupabaseAdmin();
    const oneHourAgo = new Date(Date.now() - 3600000).toISOString();

    // Count rejections vs successes in the last hour
    const { data: recentEvents } = await sb
      .from("funnel_events")
      .select("event")
      .in("event", ["verify_email_ok", "verify_email_rejected", "verify_phone_ok", "verify_phone_rejected"])
      .gte("created_at", oneHourAgo);

    if (!recentEvents || recentEvents.length < 5) return; // Not enough data to judge

    const emailRejected = recentEvents.filter((e) => e.event === "verify_email_rejected").length;
    const emailTotal = recentEvents.filter((e) => e.event.startsWith("verify_email")).length;
    const phoneRejected = recentEvents.filter((e) => e.event === "verify_phone_rejected").length;
    const phoneTotal = recentEvents.filter((e) => e.event.startsWith("verify_phone")).length;

    const emailRejectRate = emailTotal > 0 ? Math.round((emailRejected / emailTotal) * 100) : 0;
    const phoneRejectRate = phoneTotal > 0 ? Math.round((phoneRejected / phoneTotal) * 100) : 0;

    // Alert if rejection rate > 40% (means we're blocking too many real leads)
    if (emailRejectRate > 40 || phoneRejectRate > 40) {
      await sendTelegramAlert(
        `⚠️ <b>ADS MONITOR — Taux de rejet élevé</b>\n` +
        `─────────────────────\n` +
        `📧 Email : <b>${emailRejected}/${emailTotal}</b> rejetés (${emailRejectRate}%)\n` +
        `📱 Tél : <b>${phoneRejected}/${phoneTotal}</b> rejetés (${phoneRejectRate}%)\n` +
        `⏰ Dernière heure\n` +
        `─────────────────────\n` +
        `${emailRejectRate > 40 ? "🔴 La vérification email bloque trop de leads !" : "✅ Email OK"}\n` +
        `${phoneRejectRate > 40 ? "🔴 La vérification téléphone bloque trop de leads !" : "✅ Tél OK"}\n` +
        `─────────────────────\n` +
        `<a href="https://vanzonexplorer.com/ads/formulaire">👉 Voir les leads</a>`
      );
    }
  } catch {
    // Silent fail
  }
}

// ── Daily health check — full tunnel analysis ──
export async function dailyHealthCheck() {
  const sb = createSupabaseAdmin();
  const now = new Date();
  const today = new Date(now.getTime() - 24 * 3600000).toISOString();
  const lastWeek = new Date(now.getTime() - 7 * 24 * 3600000).toISOString();

  // Get last 24h events
  const { data: todayEvents } = await sb
    .from("funnel_events")
    .select("event, email, created_at")
    .gte("created_at", today);

  // Get last 7 days for comparison
  const { data: weekEvents } = await sb
    .from("funnel_events")
    .select("event")
    .gte("created_at", lastWeek);

  const events24h = todayEvents ?? [];
  const events7d = weekEvents ?? [];

  // Count by event type
  const count = (arr: { event: string }[], event: string) =>
    new Set(arr.filter((e) => e.event === event).map((e) => (e as { email?: string }).email || "anon")).size;

  const today_pageviews = count(events24h, "page_view");
  const today_optins = count(events24h, "optin");
  const today_vsl_views = events24h.filter((e) => e.event === "vsl_view").length;
  const today_vsl_complete = events24h.filter((e) => e.event === "vsl_100").length;
  const today_bookings = count(events24h, "booking_confirmed");
  const today_email_rejected = events24h.filter((e) => e.event === "verify_email_rejected").length;
  const today_phone_rejected = events24h.filter((e) => e.event === "verify_phone_rejected").length;
  const today_email_ok = events24h.filter((e) => e.event === "verify_email_ok").length;
  const today_phone_ok = events24h.filter((e) => e.event === "verify_phone_ok").length;

  // 7-day daily average
  const avg_pageviews = Math.round(count(events7d, "page_view") / 7);
  const avg_optins = Math.round(count(events7d, "optin") / 7);

  // Optin rate
  const optinRate = today_pageviews > 0 ? Math.round((today_optins / today_pageviews) * 100) : 0;
  const emailRejectRate = (today_email_ok + today_email_rejected) > 0
    ? Math.round((today_email_rejected / (today_email_ok + today_email_rejected)) * 100) : 0;
  const phoneRejectRate = (today_phone_ok + today_phone_rejected) > 0
    ? Math.round((today_phone_rejected / (today_phone_ok + today_phone_rejected)) * 100) : 0;

  // Detect anomalies
  const alerts: string[] = [];

  if (today_pageviews === 0 && avg_pageviews > 5) {
    alerts.push("🔴 ZERO vues aujourd'hui — le tunnel est peut-être cassé !");
  }
  if (today_optins === 0 && today_pageviews > 10) {
    alerts.push("🔴 ZERO opt-in malgré des vues — le formulaire est probablement cassé !");
  }
  if (optinRate < 10 && today_pageviews > 20) {
    alerts.push(`🟡 Taux d'opt-in très bas : ${optinRate}% (${today_optins}/${today_pageviews})`);
  }
  if (emailRejectRate > 30) {
    alerts.push(`🟡 Vérification email rejette ${emailRejectRate}% des tentatives`);
  }
  if (phoneRejectRate > 30) {
    alerts.push(`🟡 Vérification téléphone rejette ${phoneRejectRate}% des tentatives`);
  }
  if (today_pageviews > 0 && today_pageviews < avg_pageviews * 0.3 && avg_pageviews > 5) {
    alerts.push(`🟡 Trafic en chute : ${today_pageviews} vues vs ${avg_pageviews}/jour en moyenne`);
  }

  // Build message
  const status = alerts.length === 0 ? "✅" : "⚠️";
  const msg =
    `${status} <b>ADS MONITOR — Rapport quotidien</b>\n` +
    `─────────────────────\n` +
    `📊 <b>Dernières 24h</b>\n` +
    `  Vues opt-in : <b>${today_pageviews}</b> (moy. ${avg_pageviews}/j)\n` +
    `  Leads : <b>${today_optins}</b> (moy. ${avg_optins}/j)\n` +
    `  Taux opt-in : <b>${optinRate}%</b>\n` +
    `  VSL vues : <b>${today_vsl_views}</b> | complétées : <b>${today_vsl_complete}</b>\n` +
    `  Calls bookés : <b>${today_bookings}</b>\n` +
    `─────────────────────\n` +
    `🔍 <b>Vérifications</b>\n` +
    `  Email : ${today_email_ok} OK / ${today_email_rejected} rejetés (${emailRejectRate}%)\n` +
    `  Tél : ${today_phone_ok} OK / ${today_phone_rejected} rejetés (${phoneRejectRate}%)\n` +
    (alerts.length > 0
      ? `─────────────────────\n🚨 <b>Alertes</b>\n${alerts.map((a) => `  ${a}`).join("\n")}\n`
      : "") +
    `─────────────────────\n` +
    `<a href="https://vanzonexplorer.com/ads">👉 Dashboard</a>`;

  await sendTelegramAlert(msg);

  return { alerts, today_pageviews, today_optins, optinRate, emailRejectRate, phoneRejectRate };
}

// ── Telegram helper ──
async function sendTelegramAlert(text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;

  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
  }).catch(() => {});
}
