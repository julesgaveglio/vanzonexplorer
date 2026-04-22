// Helper to fire Meta Pixel events from client components
// Usage: import { trackEvent } from '@/lib/meta-pixel'
//        trackEvent('Lead', { content_name: 'road-trip' })

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void
  }
}

export function trackEvent(
  eventName: string,
  params?: Record<string, unknown>
) {
  if (typeof window === 'undefined') return

  // If fbq is ready, fire immediately
  if (window.fbq) {
    window.fbq('track', eventName, params)
    return
  }

  // Otherwise wait for the pixel script to load (retry up to 5s)
  let attempts = 0
  const interval = setInterval(() => {
    attempts++
    if (window.fbq) {
      window.fbq('track', eventName, params)
      clearInterval(interval)
    } else if (attempts >= 50) {
      clearInterval(interval)
    }
  }, 100)
}
