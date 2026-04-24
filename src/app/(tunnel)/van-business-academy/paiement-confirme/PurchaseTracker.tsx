"use client";

import { useEffect, useRef } from "react";
import { getFunnelData } from "@/lib/hooks/useUTMParams";
import { trackFunnel } from "@/lib/funnel-tracking";

export default function PurchaseTracker() {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;

    const data = getFunnelData();
    trackFunnel("purchase", "/van-business-academy/paiement-confirme", {
      email: data?.email,
      firstname: data?.firstname,
      value: 997,
      currency: "EUR",
    });
  }, []);

  return null;
}
