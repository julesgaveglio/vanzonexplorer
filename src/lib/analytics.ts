// Analytics first-party — tracking site-wide (tous canaux).
// CLIENT uniquement. Persiste un identifiant visiteur + le first-touch dans
// localStorage (survit entre les sessions = vraie attribution d'origine), puis
// envoie chaque page vue / conversion à /api/funnel/track.
//
// Indépendant du tracking du tunnel VBA (funnel-tracking.ts) — les deux
// alimentent la même table funnel_events, mais ce module couvre TOUT le site.

const VISITOR_KEY = "vz_visitor_id";
const FIRST_TOUCH_KEY = "vz_first_touch";

interface FirstTouch {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  gclid?: string;
  fbclid?: string;
  referrer?: string;
  landing_page?: string;
}

function getVisitorId(): string {
  if (typeof window === "undefined") return "";
  try {
    let id = localStorage.getItem(VISITOR_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(VISITOR_KEY, id);
    }
    return id;
  } catch {
    return "";
  }
}

// First-touch : figé au TOUT PREMIER passage sur le site, jamais réécrit.
// C'est ce qui permet d'attribuer une conversion au canal d'origine même
// plusieurs visites plus tard.
function getFirstTouch(): FirstTouch {
  if (typeof window === "undefined") return {};
  try {
    const stored = localStorage.getItem(FIRST_TOUCH_KEY);
    if (stored) return JSON.parse(stored) as FirstTouch;

    const params = new URLSearchParams(window.location.search);
    const ft: FirstTouch = {};
    for (const k of ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "gclid", "fbclid"] as const) {
      const v = params.get(k);
      if (v) ft[k] = v;
    }
    if (document.referrer && !document.referrer.includes(window.location.hostname)) {
      ft.referrer = document.referrer;
    }
    ft.landing_page = window.location.pathname;
    localStorage.setItem(FIRST_TOUCH_KEY, JSON.stringify(ft));
    return ft;
  } catch {
    return {};
  }
}

function send(event: string, page: string, metadata?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  const ft = getFirstTouch();
  const payload = {
    session_id: getVisitorId(),
    event,
    page,
    utm_source: ft.utm_source,
    utm_medium: ft.utm_medium,
    utm_campaign: ft.utm_campaign,
    utm_content: ft.utm_content,
    utm_term: ft.utm_term,
    referrer: ft.referrer,
    // First-touch complet pour la classification serveur
    first_touch: ft,
    landing_page: ft.landing_page,
    metadata,
  };
  // keepalive : garantit l'envoi même si un clic déclenche une navigation
  fetch("/api/funnel/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    keepalive: true,
  }).catch(() => {});
}

/** Page vue — appelé sur chaque navigation par AnalyticsTracker. */
export function trackPageView(path: string) {
  send("page_view", path);
}

/** Conversion (clic Yescapa, WhatsApp, lead form, etc.). */
export function trackConversion(event: string, metadata?: Record<string, unknown>) {
  const page = typeof window !== "undefined" ? window.location.pathname : "";
  send(event, page, metadata);
}
