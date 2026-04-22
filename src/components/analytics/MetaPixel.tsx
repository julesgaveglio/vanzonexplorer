'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'

// Pixel is loaded in root layout <head>. This component only tracks SPA navigations.
export default function MetaPixel() {
  const pathname = usePathname()
  const isFirst = useRef(true)

  useEffect(() => {
    // Skip first render (PageView already fired from head script)
    if (isFirst.current) {
      isFirst.current = false
      return
    }
    if (window.fbq) {
      window.fbq('track', 'PageView')
    }
  }, [pathname])

  return null
}
