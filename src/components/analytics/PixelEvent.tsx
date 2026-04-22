"use client";

import { useEffect, useRef } from "react";
import { trackEvent } from "@/lib/meta-pixel";

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

    trackEvent(event, Object.keys(params).length > 0 ? params : undefined);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}
