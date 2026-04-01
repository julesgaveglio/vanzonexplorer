"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";

interface Slide {
  url: string;
  alt?: string;
}

interface VanImageCarouselProps {
  slides: Slide[];
  name: string;
}

// Détecte un vrai appareil tactile (mobile/tablette) indépendamment de la largeur d'écran
function isTouchDevice(): boolean {
  return window.matchMedia("(hover: none) and (pointer: coarse)").matches;
}

export default function VanImageCarousel({ slides, name }: VanImageCarouselProps) {
  const [current, setCurrent] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const total = slides.length;

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startAutoPlay = useCallback(() => {
    stopTimer();
    if (total <= 1) return;
    timerRef.current = setInterval(() => {
      setCurrent((c) => (c + 1) % total);
    }, 2500);
  }, [total, stopTimer]);

  // IntersectionObserver — animation mobile uniquement, réinitialisée à chaque apparition
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!isTouchDevice()) return;
        const entry = entries[0];
        if (entry.isIntersecting) {
          setCurrent(0);      // repart toujours de la première image
          startAutoPlay();
        } else {
          stopTimer();
        }
      },
      { threshold: 0.4 }     // déclenche quand 40% de la carte est visible
    );

    observer.observe(el);
    return () => {
      observer.disconnect();
      stopTimer();
    };
  }, [startAutoPlay, stopTimer]);

  // ── Swipe tactile ────────────────────────────────────────────────────────────
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) {
      setCurrent((c) => diff > 0 ? (c + 1) % total : (c - 1 + total) % total);
      startAutoPlay(); // redémarre le timer après un swipe manuel
    }
    touchStartX.current = null;
  };

  // ── Navigation ───────────────────────────────────────────────────────────────
  const goTo = (idx: number) => setCurrent((idx + total) % total);
  const prev = () => goTo(current - 1);
  const next = () => goTo(current + 1);

  if (total === 0) {
    return (
      <div className="w-full h-full bg-slate-100 flex items-center justify-center">
        <span className="text-4xl">🚐</span>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full select-none"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Slides */}
      {slides.map((slide, idx) => (
        <div
          key={idx}
          className={`absolute inset-0 transition-opacity duration-500 ${
            idx === current ? "opacity-100 z-10" : "opacity-0 z-0"
          }`}
        >
          <Image
            src={slide.url}
            alt={slide.alt || name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            priority={idx === 0}
          />
        </div>
      ))}

      {/* Flèches — visibles au hover sur desktop */}
      {total > 1 && (
        <>
          <button
            onClick={(e) => { e.preventDefault(); prev(); }}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-7 h-7 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            aria-label="Image précédente"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={(e) => { e.preventDefault(); next(); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-7 h-7 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            aria-label="Image suivante"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}

      {/* Points de navigation */}
      {total > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex gap-1.5">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={(e) => { e.preventDefault(); goTo(idx); }}
              className={`rounded-full transition-all duration-300 ${
                idx === current
                  ? "w-4 h-1.5 bg-white"
                  : "w-1.5 h-1.5 bg-white/50 hover:bg-white/80"
              }`}
              aria-label={`Image ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
