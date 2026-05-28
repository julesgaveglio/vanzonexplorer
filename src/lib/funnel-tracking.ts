// Dual tracking: Meta Pixel (deduplicated) + Supabase (server)
// Meta events fire ONLY on actual conversions with unique eventID.
// Usage: trackFunnel('optin', '/van-business-academy/inscription', { email, firstname })

import { trackEvent } from "@/lib/meta-pixel";

const SESSION_KEY = "vba_session_id";

function getSessionId(): string {
  if (typeof window === "undefined") return "";
  let id = sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

// ViewContent fires for EVERYONE on the inscription page (before form)
// All other events fire ONLY for hot leads (after form qualification)
const META_ALL_LEADS: Record<string, string> = {
  page_view: "ViewContent",
};
// Lead is fired DIRECTLY in OptinForm.tsx (not here) to guarantee it fires before redirect
const META_HOT_ONLY: Record<string, string> = {
  booking_start: "Schedule",
  appel_confirme: "SubmitApplication",
  checkout: "InitiateCheckout",
  purchase: "Purchase",
};

interface TrackOptions {
  email?: string;
  firstname?: string;
  value?: number;
  currency?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  metadata?: Record<string, unknown>;
}

export function trackFunnel(
  event: string,
  page: string,
  options: TrackOptions = {}
) {
  if (typeof window === "undefined") return;

  // Unique event ID for Meta deduplication
  const eventId = crypto.randomUUID();

  const pixelParams: Record<string, unknown> = { content_name: event };
  if (options.value !== undefined) pixelParams.value = options.value;
  if (options.currency) pixelParams.currency = options.currency;

  // 1a. Meta Pixel — ViewContent for ALL visitors (page inscription)
  const allEvent = META_ALL_LEADS[event];
  if (allEvent) {
    trackEvent(allEvent, pixelParams, eventId);
  }

  // 1b. Meta Pixel — Lead, Schedule, etc. ONLY for hot leads
  const hotEvent = META_HOT_ONLY[event];
  if (hotEvent) {
    let isHot = true;
    try {
      const stored = localStorage.getItem("vba_is_hot");
      if (stored === "0") isHot = false;
    } catch {}

    if (isHot) {
      trackEvent(hotEvent, pixelParams, eventId);
    }
  }

  // 2. Supabase — all events (powers /admin/funnel dashboard)
  const payload = {
    session_id: getSessionId(),
    event,
    page,
    email: options.email,
    firstname: options.firstname,
    utm_source: options.utm_source,
    utm_medium: options.utm_medium,
    utm_campaign: options.utm_campaign,
    utm_content: options.utm_content,
    utm_term: options.utm_term,
    referrer: document.referrer || undefined,
    metadata: options.metadata,
  };

  fetch("/api/funnel/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).catch(() => {});
}
