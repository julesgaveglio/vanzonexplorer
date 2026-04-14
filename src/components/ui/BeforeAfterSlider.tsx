"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";

interface BeforeAfterSliderProps {
  beforeSrc: string;
  afterSrc: string;
  beforeAlt?: string;
  afterAlt?: string;
  width?: number;
  height?: number;
}

export default function BeforeAfterSlider({
  beforeSrc,
  afterSrc,
  beforeAlt = "Avant",
  afterAlt = "Après",
  width = 600,
  height = 668,
}: BeforeAfterSliderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [hasWiggled, setHasWiggled] = useState(false);

  const updatePosition = useCallback(
    (clientX: number) => {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const x = clientX - rect.left;
      const pct = Math.max(0, Math.min(100, (x / rect.width) * 100));
      setPosition(pct);
    },
    []
  );

  // Mouse events
  const handleMouseDown = useCallback(() => setIsDragging(true), []);

  useEffect(() => {
    if (!isDragging) return;
    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      updatePosition(e.clientX);
    };
    const handleMouseUp = () => setIsDragging(false);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, updatePosition]);

  // Touch events
  const handleTouchStart = useCallback(() => setIsDragging(true), []);

  useEffect(() => {
    if (!isDragging) return;
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches[0]) updatePosition(e.touches[0].clientX);
    };
    const handleTouchEnd = () => setIsDragging(false);
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("touchend", handleTouchEnd);
    return () => {
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [isDragging, updatePosition]);

  // Wiggle animation on scroll into view
  useEffect(() => {
    if (hasWiggled) return;
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setHasWiggled(true);
        observer.disconnect();

        // Wiggle: center → left → right → center
        const steps = [42, 58, 50];
        let i = 0;
        const interval = setInterval(() => {
          if (i >= steps.length) {
            clearInterval(interval);
            return;
          }
          setPosition(steps[i]);
          i++;
        }, 250);
      },
      { threshold: 0.5 }
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, [hasWiggled]);

  return (
    <div
      ref={containerRef}
      className="relative select-none overflow-hidden rounded-2xl shadow-lg mx-auto"
      style={{
        aspectRatio: `${width} / ${height}`,
        maxWidth: width,
        cursor: isDragging ? "grabbing" : "grab",
      }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    >
      {/* After image (full, behind) */}
      <Image
        src={afterSrc}
        alt={afterAlt}
        width={width}
        height={height}
        unoptimized
        className="absolute inset-0 w-full h-full object-cover"
        draggable={false}
      />

      {/* Before image (clipped) */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ width: `${position}%` }}
      >
        <Image
          src={beforeSrc}
          alt={beforeAlt}
          width={width}
          height={height}
          unoptimized
          className="absolute inset-0 w-full h-full object-cover"
          style={{ minWidth: containerRef.current?.offsetWidth ?? "100%" }}
          draggable={false}
        />
      </div>

      {/* Labels */}
      <span
        className="absolute top-3 left-3 text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-black/50 text-white backdrop-blur-sm"
        style={{ opacity: position > 15 ? 1 : 0, transition: "opacity 0.2s" }}
      >
        Avant
      </span>
      <span
        className="absolute top-3 right-3 text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-black/50 text-white backdrop-blur-sm"
        style={{ opacity: position < 85 ? 1 : 0, transition: "opacity 0.2s" }}
      >
        Après
      </span>

      {/* Divider line */}
      <div
        className="absolute top-0 bottom-0 w-[2px] bg-white/90 shadow-md"
        style={{ left: `${position}%`, transform: "translateX(-50%)" }}
      >
        {/* Handle button */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center gap-1"
          style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.25)" }}
        >
          <svg width="10" height="16" viewBox="0 0 10 16" fill="none" stroke="#475569" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 2L2 8L8 14" />
          </svg>
          <svg width="10" height="16" viewBox="0 0 10 16" fill="none" stroke="#475569" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 2L8 8L2 14" />
          </svg>
        </div>
      </div>
    </div>
  );
}
