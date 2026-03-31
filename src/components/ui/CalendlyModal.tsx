"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";

const CALENDLY_URL = "https://calendly.com/vanzonexplorer/accompagnement";

type CalendlyWindow = Window & {
  Calendly?: { initInlineWidget: (opts: { url: string; parentElement: HTMLElement }) => void };
};

function loadCalendlyAssets(): Promise<void> {
  return new Promise((resolve) => {
    // CSS
    if (!document.querySelector('link[href*="calendly.com"]')) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "https://assets.calendly.com/assets/external/widget.css";
      document.head.appendChild(link);
    }

    // JS — already loaded
    if ((window as CalendlyWindow).Calendly) {
      resolve();
      return;
    }

    // JS — script tag exists but loading
    const existing = document.querySelector('script[src*="calendly.com"]');
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      return;
    }

    // JS — load fresh
    const script = document.createElement("script");
    script.src = "https://assets.calendly.com/assets/external/widget.js";
    script.async = true;
    script.onload = () => resolve();
    document.head.appendChild(script);
  });
}

interface CalendlyModalProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  asChild?: boolean;
}

export default function CalendlyModal({ children, className = "", style, asChild = false }: CalendlyModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const openModal = useCallback(async () => {
    setIsOpen(true);
    await loadCalendlyAssets();
    setLoaded(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
    setLoaded(false);
  }, []);

  // Initialise le widget inline après chargement
  useEffect(() => {
    if (!loaded || !containerRef.current) return;
    (window as CalendlyWindow).Calendly?.initInlineWidget({
      url: CALENDLY_URL,
      parentElement: containerRef.current,
    });
  }, [loaded]);

  // Fermer sur Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") closeModal(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, closeModal]);

  // Lock scroll
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  const trigger = asChild && React.isValidElement(children)
    ? React.cloneElement(children as React.ReactElement<{ onClick?: () => void }>, { onClick: openModal })
    : <button type="button" onClick={openModal} className={className} style={style}>{children}</button>;

  return (
    <>
      {trigger}

      {isOpen && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4"
          style={{ background: "rgba(15, 21, 58, 0.88)", backdropFilter: "blur(10px)" }}
        >
          {/* Clic backdrop → fermer */}
          <div className="absolute inset-0" onClick={closeModal} aria-hidden />

          {/* Modal */}
          <div
            className="relative w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl z-10"
            style={{ maxHeight: "92vh" }}
          >
            {/* Header doré */}
            <div
              className="relative flex items-center justify-between px-6 py-5 overflow-hidden"
              style={{ background: "linear-gradient(135deg, #B9945F 0%, #E4D398 100%)" }}
            >
              {/* Shimmer décoratif */}
              <div
                className="absolute -top-full -left-10 w-1/3 h-[300%] rotate-12 opacity-[0.18]"
                style={{ background: "linear-gradient(90deg, transparent, white, transparent)" }}
              />

              <div className="relative z-10">
                <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-amber-900/60">
                  Van Business Academy
                </p>
                <h2 className="text-xl font-black text-white mt-0.5 leading-tight">
                  Appel découverte gratuit
                </h2>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  {["⏱ 30 min", "✓ Gratuit", "✓ Sans engagement"].map((tag) => (
                    <span
                      key={tag}
                      className="text-[11px] font-semibold text-white/80 bg-white/15 rounded-full px-2.5 py-0.5"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <button
                onClick={closeModal}
                className="relative z-10 flex items-center justify-center w-9 h-9 rounded-full bg-white/20 hover:bg-white/35 transition-colors text-white flex-shrink-0 ml-4"
                aria-label="Fermer"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Zone Calendly */}
            <div className="overflow-y-auto" style={{ height: 580 }}>
              {loaded ? (
                <div ref={containerRef} style={{ minWidth: 320, height: 580 }} />
              ) : (
                <div className="flex flex-col items-center justify-center h-full gap-4">
                  <div
                    className="w-10 h-10 rounded-full border-[3px] animate-spin"
                    style={{ borderColor: "#E4D398", borderTopColor: "#B9945F" }}
                  />
                  <p className="text-slate-400 text-sm">Chargement du calendrier…</p>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
