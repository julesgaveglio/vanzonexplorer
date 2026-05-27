"use client";

import { useEffect, useRef } from "react";
import { trackFunnel } from "@/lib/funnel-tracking";

export default function PageViewTracker() {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    // Wait a tick for DynamicTitle to store the variant_id
    setTimeout(() => {
      let titleVariantId: string | undefined;
      try { titleVariantId = localStorage.getItem("vba_title_variant_id") ?? undefined; } catch {}
      trackFunnel("page_view", "/van-business-academy/inscription", {
        metadata: titleVariantId ? { title_variant_id: titleVariantId } : undefined,
      });
    }, 500);
  }, []);

  return null;
}
