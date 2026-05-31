"use client";

import { useEffect, useRef } from "react";
import { trackFunnel } from "@/lib/funnel-tracking";

export default function PageViewTracker() {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;

    // Poll for title_variant_id (set by DynamicTitle after fetch)
    // Max 3s, check every 200ms
    let attempts = 0;
    const maxAttempts = 15;

    const poll = setInterval(() => {
      attempts++;
      let titleVariantId: string | undefined;
      try {
        titleVariantId = localStorage.getItem("vba_title_variant_id") ?? undefined;
      } catch {}

      if (titleVariantId || attempts >= maxAttempts) {
        clearInterval(poll);
        trackFunnel("page_view", "/van-business-academy/inscription", {
          metadata: { title_variant_id: titleVariantId || "unknown" },
        });
      }
    }, 200);

    return () => clearInterval(poll);
  }, []);

  return null;
}
