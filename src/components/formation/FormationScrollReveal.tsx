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

  // Mobile: CSS sticky wrapper (no GSAP pin)
  const mobileWrapperRef = useRef<HTMLDivElement>(null);
  // 3 invisible sentinels — each triggers one overlay pop
  const sentinelRefs = useRef<(HTMLDivElement | null)[]>([]);
  // 3 overlay image refs (FLOATS[1], [2], [3])
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
        // MOBILE — no pin, CSS sticky + sentinel-based pop animations
        // ─────────────────────────────────────────────────────────────────
        const overlays = mobileOverlayRefs.current.filter(Boolean) as HTMLDivElement[];
        const sentinels = sentinelRefs.current.filter(Boolean) as HTMLDivElement[];

        // Set overlays invisible initially
        gsap.set(overlays, { opacity: 0, scale: 0.86, y: 18, filter: "blur(5px)" });

        // Each sentinel fires when it enters the viewport — triggers a distinct pop
        sentinels.forEach((sentinel, i) => {
          gsap.fromTo(
            overlays[i],
            { opacity: 0, scale: 0.86, y: 18, filter: "blur(5px)" },
            {
              opacity: 1,
              scale: 1,
              y: 0,
              filter: "blur(0px)",
              duration: 0.55,
              ease: "back.out(1.6)", // bouncy pop feel
              scrollTrigger: {
                trigger: sentinel,
                start: "top 85%",
                toggleActions: "play none none reverse",
              },
            }
          );
        });

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
          MOBILE — no pin, no section, images directly in page flow
          CSS sticky keeps images visible while sentinels scroll past
      ════════════════════════════════════════════════════════════════ */}
      <div ref={mobileWrapperRef} className="md:hidden relative">

        {/* Sticky image stack — stays visible as sentinels scroll by */}
        <div className="sticky top-8 z-10">
          <div className="relative w-full px-4">

            {/* Base image — always visible, defines height */}
            <Image
              src={FLOATS[0].src}
              alt={FLOATS[0].alt}
              width={FLOATS[0].width}
              height={FLOATS[0].height}
              className="w-full h-auto"
              priority
              unoptimized
            />

            {/* Overlay images — pop in one by one */}
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
        </div>

        {/*
          Invisible sentinels — scrolled past to trigger each pop.
          Each is ~110px below the previous, giving 3 distinct scroll steps.
          This spacing adds ~330px of height below the image stack.
        */}
        <div className="relative" style={{ height: 340 }}>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              ref={(el) => { sentinelRefs.current[i] = el; }}
              className="absolute w-full"
              style={{ top: i * 110 }}
            />
          ))}
        </div>
      </div>

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
