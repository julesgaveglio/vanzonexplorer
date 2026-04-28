// Dual tracking: Meta Pixel (client, deduplicated) + Supabase (server)
// Meta events fire ONLY on actual conversions, NOT on page views.
// Each event has a unique eventID → Meta deduplicates automatically.
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

// Maps our conversion events to Meta Pixel standard events
// ONLY real conversions — page views are NOT mapped
const META_EVENT_MAP: Record<string, string> = {
  optin: "Lead",
  booking_confirmed: "Schedule",
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

  // Generate a unique event ID for deduplication
  const eventId = crypto.randomUUID();

  // 1. Fire Meta Pixel event (only for actual conversions, with dedup ID)
  const metaEvent = META_EVENT_MAP[event];
  if (metaEvent) {
    const pixelParams: Record<string, unknown> = {
      content_name: event,
    };
    if (options.value !== undefined) pixelParams.value = options.value;
    if (options.currency) pixelParams.currency = options.currency;
    trackEvent(metaEvent, pixelParams, eventId);
  }

  // 2. Server-side event → Supabase (100% reliable, powers /admin/funnel dashboard)
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
