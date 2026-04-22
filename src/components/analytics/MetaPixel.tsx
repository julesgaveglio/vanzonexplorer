'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import Script from 'next/script'

const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void
  }
}

export default function MetaPixel() {
  const [loaded, setLoaded] = useState(false)
  const pathname = usePathname()

  // Track PageView on SPA route changes
  useEffect(() => {
    if (!loaded || !window.fbq) return
    window.fbq('track', 'PageView')
  }, [pathname, loaded])

  if (!PIXEL_ID) return null

  return (
    <>
      <Script
        id="meta-pixel"
        strategy="afterInteractive"
        onLoad={() => setLoaded(true)}
      >
        {`
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '${PIXEL_ID}');
          fbq('track', 'PageView');
        `}
      </Script>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: 'none' }}
          src={`https://www.facebook.com/tr?id=${PIXEL_ID}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  )
}
