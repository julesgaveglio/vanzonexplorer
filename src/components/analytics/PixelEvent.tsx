"use client";

import Script from "next/script";

interface PixelEventProps {
  event: string;
  contentName?: string;
  value?: number;
  currency?: string;
}

export default function PixelEvent({ event, contentName, value, currency }: PixelEventProps) {
  const params: Record<string, unknown> = {};
  if (contentName) params.content_name = contentName;
  if (value !== undefined) params.value = value;
  if (currency) params.currency = currency;

  const paramsStr = Object.keys(params).length > 0 ? `, ${JSON.stringify(params)}` : "";

  return (
    <Script
      id={`pixel-${event}`}
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: `
          (function() {
            function fire() {
              if (typeof fbq === 'function') {
                fbq('track', '${event}'${paramsStr});
                console.log('[Meta Pixel] fired: ${event}');
              } else {
                setTimeout(fire, 300);
              }
            }
            fire();
          })();
        `,
      }}
    />
  );
}
