"use client";

import { useEffect } from "react";
import { trackFunnel } from "@/lib/funnel-tracking";

// Tracking de la page /formation (événement formation_view) — permet de
// mesurer le taux de clic vers la VSL dans /admin/funnel.
export default function FormationViewTracker() {
  useEffect(() => {
    trackFunnel("formation_view", "/formation");
  }, []);

  return null;
}
