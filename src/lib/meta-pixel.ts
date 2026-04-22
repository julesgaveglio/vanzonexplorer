// Fire Meta Pixel events from client components
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
      return true
    }
    return false
  }

  if (fire()) return

  // Retry until fbq is available (max 10s)
  let attempts = 0
  const interval = setInterval(() => {
    attempts++
    if (fire() || attempts >= 50) clearInterval(interval)
  }, 200)
}
