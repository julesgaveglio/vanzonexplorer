import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";

const VALID_EVENTS = [
  "page_view",
  "formation_view",
  "optin",
  "vsl_view",
  "vsl_25",
  "vsl_50",
  "vsl_75",
  "vsl_100",
  "vsl_exit",
  "booking_start",
  "booking_confirmed",
  "appel_confirme",
  "checkout",
  "purchase",
] as const;

const IGNORED_EMAILS = ["gavegliojules@gmail.com", "mateogb.ads@gmail.com", "jules@vanzonexplorer.com"];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { session_id, event, page, email, firstname, referrer, metadata, ...utm } = body;

    if (!event || !page) {
      return NextResponse.json({ error: "event and page required" }, { status: 400 });
    }

    if (!VALID_EVENTS.includes(event)) {
      return NextResponse.json({ error: "invalid event" }, { status: 400 });
    }

    // Ignore admin/test emails
    if (email && IGNORED_EMAILS.includes(email.toLowerCase())) {
      return NextResponse.json({ ok: true, ignored: true });
    }

    const supabase = createSupabaseAdmin();

    // Deduplicate optin
    if (event === "optin" && email) {
      const { data: existing } = await supabase
        .from("funnel_events")
        .select("id")
        .eq("event", "optin")
        .eq("email", email)
        .limit(1);
      if (existing && existing.length > 0) {
        return NextResponse.json({ ok: true, deduplicated: true });
      }
    }

    // Skip vsl_exit if this user already has vsl_100 (avoid double notif)
    let skipExitNotif = false;
    if (event === "vsl_exit" && email) {
      const { data: completed } = await supabase
        .from("funnel_events")
        .select("id")
        .eq("event", "vsl_100")
        .eq("email", email)
        .limit(1);
      if (completed && completed.length > 0) {
        skipExitNotif = true;
      }
    }

    const { error } = await supabase.from("funnel_events").insert({
      session_id: session_id || null,
      email: email || null,
      firstname: firstname || null,
      event,
      page,
      utm_source: utm.utm_source || null,
      utm_medium: utm.utm_medium || null,
      utm_campaign: utm.utm_campaign || null,
      utm_content: utm.utm_content || null,
      utm_term: utm.utm_term || null,
      referrer: referrer || null,
      metadata: metadata || {},
    });

    if (error) {
      console.error("[funnel/track] Supabase error:", error);
      return NextResponse.json({ error: "tracking failed" }, { status: 500 });
    }

    // ── Telegram notifications ──
    // Skip: page_view (trop de bruit), optin (géré par /api/formation/tunnel/optin)
    // Skip: vsl_exit si déjà vsl_100
    const skipEvents = ["page_view", "formation_view", "optin", "vsl_25", "vsl_75", "booking_start"];
    if (skipEvents.includes(event) || (event === "vsl_exit" && skipExitNotif)) {
      return NextResponse.json({ ok: true });
    }

    const name = firstname || "—";
    const src = utm.utm_source ? ` (${utm.utm_source})` : "";

    let msg = "";
    switch (event) {
      case "vsl_view":
        msg = `🎥 <b>VSL lancée</b>\n${name} — ${email || "—"}`;
        break;
      case "vsl_50":
        msg = `⏱ <b>VSL 50%</b>\n${name} — ${email || "—"}`;
        break;
      case "vsl_100":
        msg = `✅ <b>VSL terminée !</b>\n${name} — ${email || "—"}`;
        break;
      case "vsl_exit": {
        const secs = metadata?.seconds ?? 0;
        const dur = metadata?.duration ?? 0;
        const watchMin = Math.floor(secs / 60);
        const watchSec = String(Math.round(secs % 60)).padStart(2, "0");
        const totalMin = Math.floor(dur / 60);
        const totalSec = String(Math.round(dur % 60)).padStart(2, "0");
        const pct = dur > 0 ? Math.round((secs / dur) * 100) : 0;
        msg = `⏹ <b>VSL quittée</b>\n${name} — ${email || "—"}\n⏱ ${watchMin}min${watchSec}s / ${totalMin}min${totalSec}s (${pct}%)`;
        break;
      }
      case "booking_confirmed":
        msg = `📞 <b>Call booké !</b>\n${name} — ${email || "—"}${src}`;
        break;
      case "checkout":
        msg = `💳 <b>Page paiement ouverte</b>\n${name} — ${email || "—"}`;
        break;
      case "purchase":
        msg = `🎉 <b>ACHAT VBA !</b>\n${name} — ${email || "—"}\n💰 997€`;
        break;
    }

    if (msg) notifyTelegram(msg).catch(() => {});

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "invalid request" }, { status: 400 });
  }
}

async function notifyTelegram(text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;

  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML", disable_web_page_preview: true }),
  });
}
