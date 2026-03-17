"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";

// ─── Assets ────────────────────────────────────────────────────────────────

const LAPTOP = {
  src: "https://cdn.sanity.io/images/lewexa74/production/bfdc57ebcc01953c6b6cbee01e527f7062c786e9-1998x1392.png",
  alt: "Interface Van Business Academy",
  width: 1998,
  height: 1392,
};

// 4 floating windows — revealed one by one on scroll
// Positions: TL → TR → BL → BR
const FLOATS = [
  {
    src: "https://cdn.sanity.io/images/lewexa74/production/d3f70a292bbf7b03e5e2dfe71ec413920e087f1f-1459x850.png",
    alt: "Module formation van — étape 1",
    width: 1459,
    height: 850,
    rotate: "-2.5deg",
    // Desktop absolute position (% of scene container)
    style: { left: 0, top: 0 } as React.CSSProperties,
    mobileOrder: 1,
  },
  {
    src: "https://cdn.sanity.io/images/lewexa74/production/5473f111cdb3199e8192ebd19c7c721c5b0ec77d-1459x784.png",
    alt: "Programme formation van — étape 2",
    width: 1459,
    height: 784,
    rotate: "2.5deg",
    style: { right: 0, top: "12px" } as React.CSSProperties,
    mobileOrder: 2,
  },
  {
    src: "https://cdn.sanity.io/images/lewexa74/production/d9c4c7fe7931c1be66649b8520bbefe4acda6091-1284x850.png",
    alt: "Ressources formation van — étape 3",
    width: 1284,
    height: 850,
    rotate: "2deg",
    style: { left: 0, bottom: 0 } as React.CSSProperties,
    mobileOrder: 3,
  },
  {
    src: "https://cdn.sanity.io/images/lewexa74/production/2f1f2a6a93df20af09a71176b79f82316d856447-1317x746.png",
    alt: "Outils formation van — étape 4",
    width: 1317,
    height: 746,
    rotate: "-2deg",
    style: { right: 0, bottom: "12px" } as React.CSSProperties,
    mobileOrder: 4,
  },
];

// ─── Component ─────────────────────────────────────────────────────────────

export default function FormationScrollReveal() {
  const sectionRef = useRef<HTMLElement>(null);
  const floatRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (!sectionRef.current) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let ctx: any;

    async function init() {
      const { default: gsap } = await import("gsap");
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      gsap.registerPlugin(ScrollTrigger);

      const isMobile = window.innerWidth < 768;
      const floats = floatRefs.current.filter(Boolean) as HTMLDivElement[];

      ctx = gsap.context(() => {
        // ── Mobile: simple stagger on scroll into view ──────────────────
        if (isMobile) {
          gsap.from(floats, {
            opacity: 0,
            y: 24,
            stagger: 0.12,
            duration: 0.65,
            ease: "power2.out",
            scrollTrigger: {
              trigger: sectionRef.current,
              start: "top 85%",
            },
          });
          return;
        }

        // ── Desktop: pin + scrubbed timeline ────────────────────────────
        // Set all floats invisible before animation starts
        gsap.set(floats, { opacity: 0, scale: 0.84, y: 0, filter: "blur(8px)" });

        const tl = gsap.timeline();

        // Each float animates in at evenly spaced scroll milestones
        // Floats 0,1 (top) slide in from above (negative y offset at start)
        // Floats 2,3 (bottom) slide in from below (positive y offset at start)
        const yOffsets = [-28, -28, 28, 28];

        floats.forEach((el, i) => {
          tl.fromTo(
            el,
            { opacity: 0, scale: 0.84, y: yOffsets[i], filter: "blur(8px)" },
            {
              opacity: 1,
              scale: 1,
              y: 0,
              filter: "blur(0px)",
              duration: 0.3,
              ease: "power2.out",
            },
            // Start each float at 25% intervals with 5% overlap for flow
            i * 0.22
          );
        });

        ScrollTrigger.create({
          trigger: sectionRef.current,
          pin: true,
          pinSpacing: true,
          start: "top top",
          end: "+=220%", // 220% of viewport = total scroll distance while pinned
          scrub: 1.8,    // slight lag for premium feel
          animation: tl,
        });
      }, sectionRef);
    }

    init();

    return () => ctx?.revert();
  }, []);

  return (
    <>
      {/* ── Desktop layout ────────────────────────────────────────────── */}
      <section
        ref={sectionRef}
        aria-label="Système Van Business Academy"
        className="
          hidden md:flex
          relative mt-16 h-screen items-center justify-center
          overflow-hidden
        "
      >
        {/* Subtle radial glow behind the scene */}
        <div
          className="pointer-events-none absolute inset-0 z-0"
          style={{
            background:
              "radial-gradient(ellipse 70% 55% at 50% 52%, rgba(205,167,123,0.10) 0%, transparent 70%)",
          }}
        />

        {/* Scene — relative parent for absolute-positioned floats */}
        <div className="relative z-10 w-full max-w-5xl mx-auto px-6">

          {/* ── Laptop (center, z-10) ───────────────────────────────── */}
          <div className="relative z-10 w-[50%] mx-auto drop-shadow-2xl">
            <Image
              src={LAPTOP.src}
              alt={LAPTOP.alt}
              width={LAPTOP.width}
              height={LAPTOP.height}
              className="w-full h-auto rounded-lg"
              priority
              unoptimized
            />
          </div>

          {/* ── Floating windows (z-20, animated by GSAP) ─────────── */}
          {FLOATS.map((f, i) => (
            <div
              key={i}
              ref={(el) => { floatRefs.current[i] = el; }}
              className="absolute z-20 w-[42%]"
              style={{
                ...f.style,
                transform: `rotate(${f.rotate})`,
                // shadow rendered here so it's not affected by the blur filter animation
                filter: "drop-shadow(0 16px 40px rgba(0,0,0,0.18))",
                opacity: 0, // hidden until GSAP takes over
              }}
            >
              {/* Inner wrapper carries the blur/scale animation via GSAP */}
              <div>
                <Image
                  src={f.src}
                  alt={f.alt}
                  width={f.width}
                  height={f.height}
                  className="w-full h-auto rounded-xl"
                  unoptimized
                />
              </div>
            </div>
          ))}
        </div>

        {/* Scroll hint — fades out once user starts scrolling */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 opacity-50">
          <span className="text-xs text-slate-400 tracking-widest uppercase font-medium">Scroll</span>
          <div className="w-px h-8 bg-gradient-to-b from-slate-400 to-transparent" />
        </div>
      </section>

      {/* ── Mobile layout — static stacked reveal ─────────────────────── */}
      <div className="md:hidden mt-12 px-4 space-y-4">
        {/* Laptop first */}
        <div className="w-full drop-shadow-xl">
          <Image
            src={LAPTOP.src}
            alt={LAPTOP.alt}
            width={LAPTOP.width}
            height={LAPTOP.height}
            className="w-full h-auto rounded-xl"
            priority
            unoptimized
          />
        </div>

        {/* 4 floats in 2-column grid */}
        <div className="grid grid-cols-2 gap-3">
          {FLOATS.map((f, i) => (
            <div
              key={i}
              className="drop-shadow-md"
            >
              <Image
                src={f.src}
                alt={f.alt}
                width={f.width}
                height={f.height}
                className="w-full h-auto rounded-lg"
                unoptimized
              />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
