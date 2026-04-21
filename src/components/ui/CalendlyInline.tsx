"use client";

import { useEffect, useRef, useState } from "react";
import { loadCalendlyAssets, CALENDLY_URL, type CalendlyWindow, type CalendlyPrefill } from "@/lib/calendly";

interface CalendlyInlineProps {
  url?: string;
  height?: number;
  prefill?: CalendlyPrefill;
}

export default function CalendlyInline({ url = CALENDLY_URL, height = 700, prefill }: CalendlyInlineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    loadCalendlyAssets().then(() => setLoaded(true));
  }, []);

  useEffect(() => {
    if (!loaded || !containerRef.current) return;
    (window as CalendlyWindow).Calendly?.initInlineWidget({
      url,
      parentElement: containerRef.current,
      prefill,
    });
  }, [loaded, url, prefill]);

  if (!loaded) {
    return (
      <div className="flex flex-col items-center justify-center gap-4" style={{ height }}>
        <div
          className="w-10 h-10 rounded-full border-[3px] animate-spin"
          style={{ borderColor: "#E4D398", borderTopColor: "#B9945F" }}
        />
        <p className="text-slate-400 text-sm">Chargement du calendrier...</p>
      </div>
    );
  }

  return <div ref={containerRef} style={{ minWidth: 320, height }} />;
}
