'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Script from 'next/script'

export default function MetaPixel() {
  const pathname = usePathname()

  // Track PageView on SPA route changes
  useEffect(() => {
    if (window.fbq) {
      window.fbq('track', 'PageView')
    }
  }, [pathname])

  return (
    <Script
      id="meta-pixel"
      src="/scripts/pixel.js"
      strategy="afterInteractive"
    />
  )
}
