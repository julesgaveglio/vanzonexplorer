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

  const fire = () => {
    if (window.fbq) {
      window.fbq('track', eventName, params)
      console.log(`[Meta Pixel] ✅ ${eventName}`, params)
    } else {
      console.warn(`[Meta Pixel] ❌ fbq not available for ${eventName}`)
    }
  }

  // If fbq loaded and ready
  if (window.fbq) {
    fire()
    return
  }

  // Wait for fbevents.js to load (checks every 200ms for up to 10s)
  let attempts = 0
  const interval = setInterval(() => {
    attempts++
    if (window.fbq) {
      fire()
      clearInterval(interval)
    } else if (attempts >= 50) {
      console.warn(`[Meta Pixel] ❌ fbq never loaded for ${eventName}`)
      clearInterval(interval)
    }
  }, 200)
}
