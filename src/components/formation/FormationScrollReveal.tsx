"use client";

import { useRef, useState } from "react";
import Image from "next/image";

const FLOATS = [
  {
    src: "https://cdn.sanity.io/images/lewexa74/production/d3f70a292bbf7b03e5e2dfe71ec413920e087f1f-1459x850.png?auto=format&q=80",
    alt: "Module formation van aménagé — Van Business Academy",
    width: 1459,
    height: 850,
    rotate: "-2deg",
    translateY: "-24px",
  },
  {
    src: "https://cdn.sanity.io/images/lewexa74/production/5473f111cdb3199e8192ebd19c7c721c5b0ec77d-1459x784.png?auto=format&q=80",
    alt: "Programme complet formation vanlife — Van Business Academy",
    width: 1459,
    height: 784,
    rotate: "2deg",
    translateY: "0px",
  },
  {
    src: "https://cdn.sanity.io/images/lewexa74/production/d9c4c7fe7931c1be66649b8520bbefe4acda6091-1284x850.png?auto=format&q=80",
    alt: "Ressources et outils formation aménagement van",
    width: 1284,
    height: 850,
    rotate: "1.5deg",
    translateY: "0px",
  },
  {
    src: "https://cdn.sanity.io/images/lewexa74/production/2f1f2a6a93df20af09a71176b79f82316d856447-1317x746.png?auto=format&q=80",
    alt: "Outils IA et Airtable inclus — formation van business",
    width: 1317,
    height: 746,
    rotate: "-1.5deg",
    translateY: "0px",
  },
];

export default function FormationScrollReveal() {
  const [activeIndex, setActiveIndex] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);

  function handleScroll() {
    const el = carouselRef.current;
    if (!el) return;
    const itemWidth = el.scrollWidth / FLOATS.length;
    const index = Math.round(el.scrollLeft / itemWidth);
    setActiveIndex(Math.min(Math.max(index, 0), FLOATS.length - 1));
  }

  return (
    <div className="w-full max-w-5xl mx-auto px-6 pb-16 pt-4">

      {/* Desktop : grille 2×2 */}
      <div className="hidden md:grid grid-cols-2 gap-5">
        {FLOATS.map((f, i) => (
          <div
            key={i}
            style={{
              transform: `rotate(${f.rotate}) translateY(${f.translateY})`,
              filter: "drop-shadow(0 12px 32px rgba(0,0,0,0.16))",
            }}
          >
            <Image
              src={f.src}
              alt={f.alt}
              width={f.width}
              height={f.height}
              className="w-full h-auto rounded-xl"
            />
          </div>
        ))}
      </div>

      {/* Mobile : carousel horizontal */}
      <div className="md:hidden">
        {/* Carousel des screenshots */}
        <div
          ref={carouselRef}
          onScroll={handleScroll}
          className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-4"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {FLOATS.map((f, i) => (
            <div
              key={i}
              className="flex-none w-[85vw] snap-center rounded-xl overflow-hidden"
              style={{ filter: "drop-shadow(0 8px 20px rgba(0,0,0,0.14))" }}
            >
              <Image
                src={f.src}
                alt={f.alt}
                width={f.width}
                height={f.height}
                className="w-full h-auto"
                />
            </div>
          ))}
        </div>

        {/* Dots animés */}
        <div className="flex justify-center items-center gap-2 mt-2">
          {FLOATS.map((_, i) => (
            <div
              key={i}
              className="rounded-full transition-all duration-300"
              style={{
                width: i === activeIndex ? "20px" : "6px",
                height: "6px",
                background: i === activeIndex ? "#B9945F" : "rgba(185,148,95,0.3)",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
