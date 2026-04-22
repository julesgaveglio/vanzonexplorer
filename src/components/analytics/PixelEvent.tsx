"use client";

import Script from "next/script";

interface PixelEventProps {
  event: string;
  contentName?: string;
  value?: number;
  currency?: string;
}

export default function PixelEvent({ event, contentName, value, currency }: PixelEventProps) {
  const parts: string[] = [];
  if (contentName) parts.push(`content_name:'${contentName}'`);
  if (value !== undefined) parts.push(`value:${value}`);
  if (currency) parts.push(`currency:'${currency}'`);
  const paramsStr = parts.length > 0 ? `,{${parts.join(",")}}` : "";

  // Unique ID per event to avoid deduplication by next/script
  const scriptId = `pixel-${event}-${contentName || "default"}-${Date.now()}`;

  return (
    <Script id={scriptId} strategy="lazyOnload">
      {`(function(){var f=function(){if(typeof fbq==='function'){fbq('track','${event}'${paramsStr});return}setTimeout(f,500)};f()})();`}
    </Script>
  );
}
