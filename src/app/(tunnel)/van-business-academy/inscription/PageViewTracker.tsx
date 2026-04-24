"use client";

import { useEffect, useRef } from "react";
import { trackFunnel } from "@/lib/funnel-tracking";

export default function PageViewTracker() {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    trackFunnel("page_view", "/van-business-academy/inscription");
  }, []);

  return null;
}
