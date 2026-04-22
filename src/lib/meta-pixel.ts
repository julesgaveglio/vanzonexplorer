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
      console.log(`[Meta Pixel] ✅ ${eventName}`, params || '')
      return true
    }
    return false
  }

  // Try immediately
  if (fire()) return

  // Retry until fbq is available
  let attempts = 0
  const retry = () => {
    attempts++
    if (fire()) return
    if (attempts < 30) setTimeout(retry, 300)
    else console.warn(`[Meta Pixel] ❌ fbq never loaded for ${eventName}`)
  }
  setTimeout(retry, 300)
}
