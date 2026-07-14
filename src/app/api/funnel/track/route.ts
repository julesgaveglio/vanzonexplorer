import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { classifyChannel } from "@/lib/channel-classifier";

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
  // ── Conversions site-wide (Phase 2 analytics) ──
  "booking_click",     // clic vers Yescapa/Wikicampers depuis une page location
  "whatsapp_click",    // clic WhatsApp depuis une fiche achat
  "roadtrip_lead",     // soumission du générateur de road trip
  "resource_download", // téléchargement d'une ressource PDF
  "vsl_cta_click",     // clic vers la VSL depuis /formation
  "contact_submit",    // formulaire de contact
] as const;

// Events de conversion site-wide : pas de notif Telegram, juste de la data
const SITEWIDE_CONVERSIONS = [
  "booking_click",
  "whatsapp_click",
  "roadtrip_lead",
  "resource_download",
  "vsl_cta_click",
  "contact_submit",
];

const IGNORED_EMAILS = ["gavegliojules@gmail.com", "mateogb.ads@gmail.com", "jules@vanzonexplorer.com"];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { session_id, event, page, email, firstname, referrer, metadata, first_touch, landing_page, ...utm } = body;

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

    // Classification du canal d'acquisition à partir du first-touch.
    // Priorité au first_touch envoyé par le client (analytics.ts), fallback
    // sur les UTM/referrer de l'événement courant (tunnel VBA legacy).
    const channel = classifyChannel({
      utm_source: first_touch?.utm_source ?? utm.utm_source,
      utm_medium: first_touch?.utm_medium ?? utm.utm_medium,
      utm_campaign: first_touch?.utm_campaign ?? utm.utm_campaign,
      referrer: first_touch?.referrer ?? referrer,
      gclid: first_touch?.gclid,
      fbclid: first_touch?.fbclid,
    });

    const { error } = await supabase.from("funnel_events").insert({
      session_id: session_id || null,
      email: email || null,
      firstname: firstname || null,
      event,
      page,
      utm_source: utm.utm_source || first_touch?.utm_source || null,
      utm_medium: utm.utm_medium || first_touch?.utm_medium || null,
      utm_campaign: utm.utm_campaign || first_touch?.utm_campaign || null,
      utm_content: utm.utm_content || first_touch?.utm_content || null,
      utm_term: utm.utm_term || first_touch?.utm_term || null,
      referrer: referrer || first_touch?.referrer || null,
      channel,
      landing_page: landing_page || first_touch?.landing_page || null,
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
    if (
      skipEvents.includes(event) ||
      SITEWIDE_CONVERSIONS.includes(event) ||
      (event === "vsl_exit" && skipExitNotif)
    ) {
      return NextResponse.json({ ok: true });
    }

    // ── Enrichissement identité + attribution ──
    // Si l'événement arrive sans email/UTM (ex : visiteur direct sur la VSL,
    // ou UTMs perdus après navigation dans le tunnel), on remonte le fil de la
    // session : premier passage = source d'origine, et tout événement antérieur
    // portant un email identifie la personne.
    let bestEmail: string | null = email || null;
    let bestName: string | null = firstname || null;
    let attr = {
      source: utm.utm_source || null,
      medium: utm.utm_medium || null,
      campaign: utm.utm_campaign || null,
      content: utm.utm_content || null,
      referrer: referrer || null,
    };

    if (session_id && (!bestEmail || !attr.source)) {
      const { data: history } = await supabase
        .from("funnel_events")
        .select("email, firstname, utm_source, utm_medium, utm_campaign, utm_content, referrer")
        .eq("session_id", session_id)
        .order("created_at", { ascending: true })
        .limit(25);

      for (const ev of history ?? []) {
        if (!bestEmail && ev.email) bestEmail = ev.email;
        if (!bestName && ev.firstname) bestName = ev.firstname;
        if (!attr.source && ev.utm_source) {
          attr = {
            source: ev.utm_source,
            medium: ev.utm_medium,
            campaign: ev.utm_campaign,
            content: ev.utm_content,
            referrer: attr.referrer ?? ev.referrer,
          };
        }
        if (!attr.referrer && ev.referrer) attr.referrer = ev.referrer;
      }
    }

    const sourceLine = formatSource(attr);

    // Géolocalisation IP (headers Vercel, gratuits) + appareil
    const city = decodeURIComponent(req.headers.get("x-vercel-ip-city") ?? "");
    const country = req.headers.get("x-vercel-ip-country") ?? "";
    const ua = req.headers.get("user-agent") ?? "";
    const device = /iPhone|iPad|Android|Mobile/i.test(ua) ? "mobile" : "ordinateur";
    const geoLine = [city, country].filter(Boolean).join(", ");
    const contextLine = `🌍 ${geoLine || "localisation inconnue"} · ${device}`;

    const name = bestName || "—";
    const identityLine = `${name} — ${bestEmail || "visiteur anonyme"}`;
    const src = attr.source ? ` (${attr.source})` : "";

    let msg = "";
    switch (event) {
      case "vsl_view":
        msg = `🎥 <b>VSL lancée</b>\n${identityLine}\n${sourceLine}\n${contextLine}`;
        break;
      case "vsl_50":
        msg = `⏱ <b>VSL 50%</b>\n${identityLine}\n${sourceLine}\n${contextLine}`;
        break;
      case "vsl_100":
        msg = `✅ <b>VSL terminée !</b>\n${identityLine}\n${sourceLine}\n${contextLine}`;
        break;
      case "vsl_exit": {
        const secs = metadata?.seconds ?? 0;
        const dur = metadata?.duration ?? 0;
        const watchMin = Math.floor(secs / 60);
        const watchSec = String(Math.round(secs % 60)).padStart(2, "0");
        const totalMin = Math.floor(dur / 60);
        const totalSec = String(Math.round(dur % 60)).padStart(2, "0");
        const pct = dur > 0 ? Math.round((secs / dur) * 100) : 0;
        msg = `⏹ <b>VSL quittée</b>\n${identityLine}\n⏱ ${watchMin}min${watchSec}s / ${totalMin}min${totalSec}s (${pct}%)\n${sourceLine}\n${contextLine}`;
        break;
      }
      case "booking_confirmed":
        msg = `📞 <b>Call booké !</b>\n${identityLine}${src}\n${sourceLine}\n${contextLine}`;
        break;
      case "appel_confirme":
        // Filet de sécurité : notifie même si le webhook Calendly est en panne
        msg = `📞 <b>Call réservé !</b> (page confirmation)\n${identityLine}\n${sourceLine}\n${contextLine}`;
        break;
      case "checkout":
        msg = `💳 <b>Page paiement ouverte</b>\n${identityLine}\n${sourceLine}\n${contextLine}`;
        break;
      case "purchase":
        msg = `🎉 <b>ACHAT VBA !</b>\n${identityLine}\n💰 997€\n${sourceLine}\n${contextLine}`;
        break;
    }

    // IMPORTANT : await obligatoire — sans lui, Vercel peut geler la fonction
    // après la réponse et l'appel Telegram part... ou pas (notifs intermittentes).
    if (msg) await notifyTelegram(msg).catch(() => {});

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "invalid request" }, { status: 400 });
  }
}

// Classe la provenance du visiteur en une ligne lisible.
// Priorité : UTM (campagne payée ou trackée) > referrer (organique) > direct.
function formatSource(attr: {
  source: string | null;
  medium: string | null;
  campaign: string | null;
  content: string | null;
  referrer: string | null;
}): string {
  if (attr.source) {
    const src = attr.source.toLowerCase();
    const medium = (attr.medium ?? "").toLowerCase();
    const isPaid = /paid|cpc|ppc|ads?$/.test(medium) || medium === "paid_social";
    const isMeta = /facebook|^fb$|instagram|^ig$|meta/.test(src);
    const label = isMeta
      ? (isPaid ? "📣 Pub Meta" : "🌱 Meta organique")
      : isPaid
        ? `📣 Pub ${attr.source}`
        : `🔗 ${attr.source}${attr.medium ? ` / ${attr.medium}` : ""}`;
    const details = [attr.campaign, attr.content].filter(Boolean).join(" · ");
    return details ? `${label} — ${details}` : label;
  }

  if (attr.referrer) {
    try {
      const host = new URL(attr.referrer).hostname.replace(/^(www|m|l|lm)\./, "");
      if (/facebook\.com/.test(host)) return "🌱 Organique Facebook";
      if (/instagram\.com/.test(host)) return "🌱 Organique Instagram";
      if (/google\./.test(host)) return "🔍 Recherche Google (SEO)";
      if (/ecosia\.org/.test(host)) return "🔍 Recherche Ecosia (SEO)";
      if (/bing\.com/.test(host)) return "🔍 Recherche Bing (SEO)";
      if (/duckduckgo\.com/.test(host)) return "🔍 Recherche DuckDuckGo (SEO)";
      if (/qwant\.com/.test(host)) return "🔍 Recherche Qwant (SEO)";
      if (/search\.brave\.com/.test(host)) return "🔍 Recherche Brave (SEO)";
      if (/youtube\.com|youtu\.be/.test(host)) return "🌱 YouTube";
      if (/tiktok\.com/.test(host)) return "🌱 TikTok";
      if (/vanzonexplorer\.com/.test(host)) return "🏠 Navigation interne (site)";
      return `🔗 via ${host}`;
    } catch {
      return `🔗 via ${attr.referrer.slice(0, 40)}`;
    }
  }

  return "🚪 Accès direct (DM, favori ou lien copié)";
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
