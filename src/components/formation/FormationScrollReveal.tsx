"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";

const LAPTOP = {
  src: "https://cdn.sanity.io/images/lewexa74/production/bfdc57ebcc01953c6b6cbee01e527f7062c786e9-1998x1392.png",
  alt: "Interface Van Business Academy",
  width: 1998,
  height: 1392,
};

const FLOATS = [
  {
    src: "https://cdn.sanity.io/images/lewexa74/production/d3f70a292bbf7b03e5e2dfe71ec413920e087f1f-1459x850.png",
    alt: "Module formation van — étape 1",
    width: 1459,
    height: 850,
    desktopStyle: { left: 0, top: 0 } as React.CSSProperties,
    desktopRotate: "-2.5deg",
  },
  {
    src: "https://cdn.sanity.io/images/lewexa74/production/5473f111cdb3199e8192ebd19c7c721c5b0ec77d-1459x784.png",
    alt: "Programme formation van — étape 2",
    width: 1459,
    height: 784,
    desktopStyle: { right: 0, top: "12px" } as React.CSSProperties,
    desktopRotate: "2.5deg",
  },
  {
    src: "https://cdn.sanity.io/images/lewexa74/production/d9c4c7fe7931c1be66649b8520bbefe4acda6091-1284x850.png",
    alt: "Ressources formation van — étape 3",
    width: 1284,
    height: 850,
    desktopStyle: { left: 0, bottom: 0 } as React.CSSProperties,
    desktopRotate: "2deg",
  },
  {
    src: "https://cdn.sanity.io/images/lewexa74/production/2f1f2a6a93df20af09a71176b79f82316d856447-1317x746.png",
    alt: "Outils formation van — étape 4",
    width: 1317,
    height: 746,
    desktopStyle: { right: 0, bottom: "12px" } as React.CSSProperties,
    desktopRotate: "-2deg",
  },
];

export default function FormationScrollReveal() {
  // Desktop refs
  const desktopSectionRef = useRef<HTMLElement>(null);
  const desktopFloatRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Mobile refs — pinned stack
  const mobileSectionRef = useRef<HTMLElement>(null);
  // overlays[0] = FLOATS[1], overlays[1] = FLOATS[2], overlays[2] = FLOATS[3]
  const mobileOverlayRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let ctx: any;

    async function init() {
      const { default: gsap } = await import("gsap");
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      gsap.registerPlugin(ScrollTrigger);

      ctx = gsap.context(() => {

        // ─────────────────────────────────────────────────────────────────
        // MOBILE — pinned section, 3 overlays revealed one by one on scroll
        // ─────────────────────────────────────────────────────────────────
        if (mobileSectionRef.current) {
          const overlays = mobileOverlayRefs.current.filter(Boolean) as HTMLDivElement[];

          // Hide all overlays initially
          gsap.set(overlays, { opacity: 0, y: 28, scale: 0.96, filter: "blur(6px)" });

          const tl = gsap.timeline();

          // 3 overlays, evenly spaced across the timeline
          // Each appears cleanly at its own 1/3 scroll milestone
          overlays.forEach((el, i) => {
            tl.fromTo(
              el,
              { opacity: 0, y: 28, scale: 0.96, filter: "blur(6px)" },
              { opacity: 1, y: 0, scale: 1, filter: "blur(0px)", duration: 0.3, ease: "power2.out" },
              i * 0.34 // 0 → 0.34 → 0.68
            );
          });

          ScrollTrigger.create({
            trigger: mobileSectionRef.current,
            pin: true,
            pinSpacing: true,
            start: "top top",
            end: "+=300%", // 3 scroll steps = 3 × 100vh
            scrub: 1.5,
            animation: tl,
          });
        }

        // ─────────────────────────────────────────────────────────────────
        // DESKTOP — pinned section, scrubbed timeline
        // ─────────────────────────────────────────────────────────────────
        if (!desktopSectionRef.current) return;
        const desktopFloats = desktopFloatRefs.current.filter(Boolean) as HTMLDivElement[];
        if (!desktopFloats.length) return;

        gsap.set(desktopFloats, { opacity: 0, scale: 0.82, filter: "blur(10px)" });

        const tl = gsap.timeline();
        const yOffsets = [-32, -32, 32, 32];

        desktopFloats.forEach((el, i) => {
          tl.fromTo(
            el,
            { opacity: 0, scale: 0.82, y: yOffsets[i], filter: "blur(10px)" },
            { opacity: 1, scale: 1, y: 0, filter: "blur(0px)", duration: 0.28, ease: "power2.out" },
            i * 0.26
          );
        });

        ScrollTrigger.create({
          trigger: desktopSectionRef.current,
          pin: true,
          pinSpacing: true,
          start: "top top",
          end: "+=400%",
          scrub: 2.5,
          animation: tl,
        });
      });
    }

    init();
    return () => ctx?.revert();
  }, []);

  return (
    <>
      {/* ═══════════════════════════════════════════════════════════════
          MOBILE — pinned stack
          FLOATS[0] as base image, FLOATS[1–3] overlay on scroll
      ════════════════════════════════════════════════════════════════ */}
      <section
        ref={mobileSectionRef}
        aria-label="Formation Van Business Academy — aperçu mobile"
        className="md:hidden relative mt-10 h-screen flex items-center justify-center overflow-hidden"
        style={{ background: "linear-gradient(160deg, #FFFFFF 0%, #FAF6F0 70%, #F5EDE5 100%)" }}
      >
        {/* Glow */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: "radial-gradient(ellipse 80% 60% at 50% 50%, rgba(205,167,123,0.10) 0%, transparent 70%)",
          }}
        />

        {/* Card stack container — all images share the same space */}
        <div className="relative w-full px-5 z-10">
          {/* Aspect-ratio wrapper based on FLOATS[0] (1459×850) */}
          <div
            className="relative w-full rounded-2xl overflow-hidden"
            style={{
              aspectRatio: "1459/850",
              boxShadow: "0 20px 60px rgba(0,0,0,0.18), 0 4px 16px rgba(0,0,0,0.10)",
            }}
          >
            {/* Base image — always visible */}
            <Image
              src={FLOATS[0].src}
              alt={FLOATS[0].alt}
              fill
              style={{ objectFit: "cover" }}
              priority
              unoptimized
            />

            {/* Overlay images — revealed one by one on scroll */}
            {[FLOATS[1], FLOATS[2], FLOATS[3]].map((f, i) => (
              <div
                key={i}
                ref={(el) => { mobileOverlayRefs.current[i] = el; }}
                className="absolute inset-0"
                style={{ opacity: 0 }}
              >
                <Image
                  src={f.src}
                  alt={f.alt}
                  fill
                  style={{ objectFit: "cover" }}
                  unoptimized
                />
              </div>
            ))}
          </div>

          {/* Progress dots */}
          <ProgressDots />
        </div>

        {/* Scroll hint */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 opacity-40">
          <span className="text-[10px] text-slate-400 tracking-widest uppercase font-semibold">Scroll</span>
          <div className="w-px h-6 bg-gradient-to-b from-slate-400 to-transparent" />
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          DESKTOP — pinned scroll section, unchanged
      ════════════════════════════════════════════════════════════════ */}
      <section
        ref={desktopSectionRef}
        aria-label="Système Van Business Academy"
        className="hidden md:flex relative mt-16 h-screen items-center justify-center overflow-hidden"
      >
        <div
          className="pointer-events-none absolute inset-0 z-0"
          style={{
            background:
              "radial-gradient(ellipse 70% 55% at 50% 52%, rgba(205,167,123,0.09) 0%, transparent 70%)",
          }}
        />

        <div className="relative z-10 w-full max-w-5xl mx-auto px-6">
          <div
            className="relative z-10 w-[50%] mx-auto"
            style={{ filter: "drop-shadow(0 24px 48px rgba(0,0,0,0.18))" }}
          >
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

          {FLOATS.map((f, i) => (
            <div
              key={i}
              ref={(el) => { desktopFloatRefs.current[i] = el; }}
              className="absolute z-20 w-[42%]"
              style={{
                ...f.desktopStyle,
                transform: `rotate(${f.desktopRotate})`,
                filter: "drop-shadow(0 16px 40px rgba(0,0,0,0.18))",
                opacity: 0,
              }}
            >
              <Image
                src={f.src}
                alt={f.alt}
                width={f.width}
                height={f.height}
                className="w-full h-auto rounded-xl"
                unoptimized
              />
            </div>
          ))}
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 opacity-40">
          <span className="text-[10px] text-slate-400 tracking-widest uppercase font-semibold">Scroll</span>
          <div className="w-px h-7 bg-gradient-to-b from-slate-400 to-transparent" />
        </div>
      </section>
    </>
  );
}

// ── Progress dots (4 total: 1 base + 3 overlays) ──────────────────────────
// Uses IntersectionObserver-free approach: just GSAP-driven opacity on overlays
function ProgressDots() {
  // Static dots — GSAP doesn't easily drive this sub-component
  // We render 4 dots, styling driven by CSS only (active = first one by default)
  // The real visual feedback comes from the images themselves
  return (
    <div className="flex justify-center gap-2 mt-4">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className={`rounded-full transition-all ${
            i === 0
              ? "w-5 h-1.5 bg-amber-500"
              : "w-1.5 h-1.5 bg-slate-300"
          }`}
        />
      ))}
    </div>
  );
}
