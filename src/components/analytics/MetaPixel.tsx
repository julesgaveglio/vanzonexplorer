'use client'

import Script from 'next/script'

const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID

export default function MetaPixel() {
  if (!PIXEL_ID) return null

  return (
    <>
      {/* Load fbevents.js as a proper external script */}
      <Script
        id="meta-pixel-script"
        src="https://connect.facebook.net/en_US/fbevents.js"
        strategy="afterInteractive"
        onLoad={() => {
          if (typeof window !== 'undefined' && window.fbq) {
            window.fbq('init', PIXEL_ID)
            window.fbq('track', 'PageView')
          }
        }}
      />

      {/* Init the fbq queue so calls before script loads get queued */}
      <Script id="meta-pixel-queue" strategy="afterInteractive">
        {`
          if(!window.fbq){
            var n=window.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];
            window._fbq=n;
            fbq('init','${PIXEL_ID}');
            fbq('track','PageView');
          }
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
