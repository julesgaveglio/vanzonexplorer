"use client";

import { useEffect, useRef } from "react";
import { trackFunnel } from "@/lib/funnel-tracking";

export default function FormationViewTracker() {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    trackFunnel("formation_view", "/formation");
  }, []);

  return null;
}
