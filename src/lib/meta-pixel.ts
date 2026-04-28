// Fire Meta Pixel events from client components — with deduplication
// Usage: import { trackEvent } from '@/lib/meta-pixel'
//        trackEvent('Lead', { content_name: 'vba-optin' })

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

/**
 * Fire a Meta Pixel event with automatic deduplication.
 * The eventID ensures Meta ignores duplicate events with the same ID.
 */
export function trackEvent(
  eventName: string,
  params?: Record<string, unknown>,
  eventId?: string
) {
  if (typeof window === "undefined") return;

  const id = eventId ?? crypto.randomUUID();

  const fire = () => {
    if (window.fbq) {
      window.fbq("track", eventName, params ?? {}, { eventID: id });
      return true;
    }
    return false;
  };

  if (fire()) return;

  // Retry until fbq is available (max 5s)
  let attempts = 0;
  const interval = setInterval(() => {
    attempts++;
    if (fire() || attempts >= 25) clearInterval(interval);
  }, 200);
}
