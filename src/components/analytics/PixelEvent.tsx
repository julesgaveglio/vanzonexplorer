"use client";

import { useEffect, useRef } from "react";

interface PixelEventProps {
  event: string;
  contentName?: string;
  value?: number;
  currency?: string;
}

export default function PixelEvent({ event, contentName, value, currency }: PixelEventProps) {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;

    const params: Record<string, unknown> = {};
    if (contentName) params.content_name = contentName;
    if (value !== undefined) params.value = value;
    if (currency) params.currency = currency;

    const fire = () => {
      if (typeof window !== "undefined" && typeof window.fbq === "function") {
        window.fbq("track", event, Object.keys(params).length > 0 ? params : undefined);
        return true;
      }
      return false;
    };

    // Try immediately, then retry
    if (!fire()) {
      let attempts = 0;
      const interval = setInterval(() => {
        attempts++;
        if (fire() || attempts >= 30) clearInterval(interval);
      }, 200);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}
