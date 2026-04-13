'use client'

import { useEffect } from 'react'
import { trackEvent } from '@/lib/meta-pixel'

export function PixelLeadEvent() {
  useEffect(() => {
    trackEvent('Lead', { content_name: 'road-trip-personnalise' })
  }, [])

  return null
}
