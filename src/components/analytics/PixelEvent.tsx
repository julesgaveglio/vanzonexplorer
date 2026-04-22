"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/meta-pixel";

interface PixelEventProps {
  event: string;
  params?: Record<string, string | number>;
}

export default function PixelEvent({ event, params }: PixelEventProps) {
  useEffect(() => {
    trackEvent(event, params);
  }, [event, params]);

  return null;
}
