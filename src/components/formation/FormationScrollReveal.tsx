"use client";

import { useRef, useState } from "react";
import Image from "next/image";

const HERO_IMG = {
  src: "https://cdn.sanity.io/images/lewexa74/production/e8d8a66703e846a5bd916e38bd9a488b663ce433-1920x1080.png",
  alt: "Aménagement intérieur de van - Van Business Academy",
  width: 1920,
  height: 1080,
};

const FLOATS = [
  {
    src: "https://cdn.sanity.io/images/lewexa74/production/d3f70a292bbf7b03e5e2dfe71ec413920e087f1f-1459x850.png",
    alt: "Module formation van",
    width: 1459,
    height: 850,
    rotate: "-2deg",
  },
  {
    src: "https://cdn.sanity.io/images/lewexa74/production/5473f111cdb3199e8192ebd19c7c721c5b0ec77d-1459x784.png",
    alt: "Programme formation van",
    width: 1459,
    height: 784,
    rotate: "2deg",
  },
  {
    src: "https://cdn.sanity.io/images/lewexa74/production/d9c4c7fe7931c1be66649b8520bbefe4acda6091-1284x850.png",
    alt: "Ressources formation van",
    width: 1284,
    height: 850,
    rotate: "1.5deg",
  },
  {
    src: "https://cdn.sanity.io/images/lewexa74/production/2f1f2a6a93df20af09a71176b79f82316d856447-1317x746.png",
    alt: "Outils formation van",
    width: 1317,
    height: 746,
    rotate: "-1.5deg",
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

      {/* Desktop */}
      <div className="hidden md:block relative">
        {/* Image centrale agrandie */}
        <div
          className="relative z-10 w-[65%] mx-auto"
          style={{ filter: "drop-shadow(0 24px 48px rgba(0,0,0,0.16))" }}
        >
          <Image
            src={HERO_IMG.src}
            alt={HERO_IMG.alt}
            width={HERO_IMG.width}
            height={HERO_IMG.height}
            className="w-full h-auto rounded-2xl"
            priority
            unoptimized
          />
        </div>

        {/* Screenshots flottants */}
        <div className="absolute inset-0 pointer-events-none">
          <div
            className="absolute w-[36%] top-0 left-0"
            style={{
              transform: `rotate(${FLOATS[0].rotate}) translateY(-12px)`,
              filter: "drop-shadow(0 12px 32px rgba(0,0,0,0.18))",
            }}
          >
            <Image src={FLOATS[0].src} alt={FLOATS[0].alt} width={FLOATS[0].width} height={FLOATS[0].height} className="w-full h-auto rounded-xl" unoptimized />
          </div>
          <div
            className="absolute w-[36%] top-0 right-0"
            style={{
              transform: `rotate(${FLOATS[1].rotate}) translateY(-8px)`,
              filter: "drop-shadow(0 12px 32px rgba(0,0,0,0.18))",
            }}
          >
            <Image src={FLOATS[1].src} alt={FLOATS[1].alt} width={FLOATS[1].width} height={FLOATS[1].height} className="w-full h-auto rounded-xl" unoptimized />
          </div>
          <div
            className="absolute w-[36%] bottom-0 left-0"
            style={{
              transform: `rotate(${FLOATS[2].rotate}) translateY(12px)`,
              filter: "drop-shadow(0 12px 32px rgba(0,0,0,0.18))",
            }}
          >
            <Image src={FLOATS[2].src} alt={FLOATS[2].alt} width={FLOATS[2].width} height={FLOATS[2].height} className="w-full h-auto rounded-xl" unoptimized />
          </div>
          <div
            className="absolute w-[36%] bottom-0 right-0"
            style={{
              transform: `rotate(${FLOATS[3].rotate}) translateY(8px)`,
              filter: "drop-shadow(0 12px 32px rgba(0,0,0,0.18))",
            }}
          >
            <Image src={FLOATS[3].src} alt={FLOATS[3].alt} width={FLOATS[3].width} height={FLOATS[3].height} className="w-full h-auto rounded-xl" unoptimized />
          </div>
        </div>
      </div>

      {/* Mobile : carousel horizontal */}
      <div className="md:hidden">
        {/* Image hero agrandie en premier */}
        <div
          className="w-full rounded-2xl overflow-hidden mb-4"
          style={{ filter: "drop-shadow(0 12px 32px rgba(0,0,0,0.14))" }}
        >
          <Image
            src={HERO_IMG.src}
            alt={HERO_IMG.alt}
            width={HERO_IMG.width}
            height={HERO_IMG.height}
            className="w-full h-auto"
            priority
            unoptimized
          />
        </div>

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
                unoptimized
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
