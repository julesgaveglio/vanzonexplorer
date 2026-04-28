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

// Only REAL conversions are sent to Meta — no page views, no intermediate steps
const META_EVENT_MAP: Record<string, string> = {
  formation_view: "ViewContent",
  optin: "Lead",
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

  // 1. Meta Pixel — only for mapped conversion events
  const metaEvent = META_EVENT_MAP[event];
  if (metaEvent) {
    const pixelParams: Record<string, unknown> = {
      content_name: event,
    };
    if (options.value !== undefined) pixelParams.value = options.value;
    if (options.currency) pixelParams.currency = options.currency;
    trackEvent(metaEvent, pixelParams, eventId);
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
