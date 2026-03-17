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
  const desktopSectionRef = useRef<HTMLElement>(null);
  const desktopFloatRefs = useRef<(HTMLDivElement | null)[]>([]);

  const mobileSectionRef = useRef<HTMLElement>(null);
  const mobileOverlayRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let ctx: any;

    async function init() {
      const { default: gsap } = await import("gsap");
      const { ScrollTrigger } = await import("gsap/ScrollTrigger");
      gsap.registerPlugin(ScrollTrigger);

      ctx = gsap.context(() => {

        // ── MOBILE ───────────────────────────────────────────────────────
        // Pinned at natural image height, 3 overlays scrubbed in/out
        // end: +=120% = 40vh per image — tight, no wasted space
        // ────────────────────────────────────────────────────────────────
        if (mobileSectionRef.current) {
          const overlays = mobileOverlayRefs.current.filter(Boolean) as HTMLDivElement[];

          gsap.set(overlays, { opacity: 0, y: 14, scale: 0.97 });

          const tl = gsap.timeline();

          overlays.forEach((el, i) => {
            tl.fromTo(
              el,
              { opacity: 0, y: 14, scale: 0.97 },
              { opacity: 1, y: 0, scale: 1, duration: 0.3, ease: "power2.inOut" },
              i * 0.34  // evenly spaced: 0 / 0.34 / 0.68
            );
          });

          ScrollTrigger.create({
            trigger: mobileSectionRef.current,
            pin: true,
            pinSpacing: true,
            start: "top top",
            end: "+=120%", // 3 images × 40vh — snappy and tight
            scrub: 0.6,   // nearly instant response to scroll direction
            animation: tl,
          });
        }

        // ── DESKTOP ──────────────────────────────────────────────────────
        // Unchanged: 4 floats, 400% scroll, scrub 2.5
        // ────────────────────────────────────────────────────────────────
        if (!desktopSectionRef.current) return;
        const desktopFloats = desktopFloatRefs.current.filter(Boolean) as HTMLDivElement[];
        if (!desktopFloats.length) return;

        gsap.set(desktopFloats, { opacity: 0, scale: 0.82, filter: "blur(10px)" });

        const tl2 = gsap.timeline();
        const yOffsets = [-32, -32, 32, 32];

        desktopFloats.forEach((el, i) => {
          tl2.fromTo(
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
          animation: tl2,
        });
      });
    }

    init();
    return () => ctx?.revert();
  }, []);

  return (
    <>
      {/* ── MOBILE ────────────────────────────────────────────────────── */}
      {/* Natural height section — pinned by GSAP, no h-screen waste     */}
      <section
        ref={mobileSectionRef}
        aria-label="Formation Van Business Academy"
        className="md:hidden relative"
      >
        <div className="relative w-full px-4">
          {/* Base image — always visible, sets natural height */}
          <Image
            src={FLOATS[0].src}
            alt={FLOATS[0].alt}
            width={FLOATS[0].width}
            height={FLOATS[0].height}
            className="w-full h-auto"
            priority
            unoptimized
          />

          {/* Overlays — scrubbed in/out directly with scroll */}
          {[FLOATS[1], FLOATS[2], FLOATS[3]].map((f, i) => (
            <div
              key={i}
              ref={(el) => { mobileOverlayRefs.current[i] = el; }}
              className="absolute top-0 left-4 right-4"
              style={{ opacity: 0 }}
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
      </section>

      {/* ── DESKTOP ───────────────────────────────────────────────────── */}
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
