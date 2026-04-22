'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Script from 'next/script'

const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID

export default function MetaPixel() {
  const pathname = usePathname()

  useEffect(() => {
    if (window.fbq) {
      window.fbq('track', 'PageView')
    }
  }, [pathname])

  if (!PIXEL_ID) return null

  return (
    <Script
      id="meta-pixel"
      strategy="afterInteractive"
      src="https://connect.facebook.net/en_US/fbevents.js"
      onLoad={() => {
        if (window.fbq) {
          window.fbq('init', PIXEL_ID)
          window.fbq('track', 'PageView')
        }
      }}
    />
  )
}
