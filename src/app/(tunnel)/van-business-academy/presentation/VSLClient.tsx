"use client";

import { useEffect, useState, useRef } from "react";
import { getFunnelData } from "@/lib/hooks/useUTMParams";
import { trackFunnel } from "@/lib/funnel-tracking";
import LiquidButton from "@/components/ui/LiquidButton";

const CTA_DELAY_SECONDS = 144; // 2min24

interface VSLClientProps {
  videoId: string;
  libraryId: string;
  vslVersionId: string;
}

export default function VSLClient({ videoId, libraryId, vslVersionId }: VSLClientProps) {
  const EMBED_URL = `https://player.mediadelivery.net/embed/${libraryId}/${videoId}?autoplay=false&loop=false&muted=false&preload=true&responsive=true&showHeatmap=false&seekBar=false`;

  const [firstname, setFirstname] = useState("");
  const [showCTA, setShowCTA] = useState(false);
  const ctaTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const videoMilestonesRef = useRef(new Set<string>());
  const lastTimeRef = useRef(0);
  const durationRef = useRef(0);
  const exitTrackedRef = useRef(false);

  // --- Effects ---

  // Funnel data + tracking
  useEffect(() => {
    const data = getFunnelData();
    if (data) {
      setFirstname(data.firstname);
      fetch("/api/van-business-academy/inscription/step", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email, step: "vsl" }),
      }).catch(() => {});

      trackFunnel("vsl_view", "/van-business-academy/presentation", {
        email: data.email,
        firstname: data.firstname,
        metadata: { vsl_version_id: vslVersionId },
      });
    }
  }, [vslVersionId]);

  // CTA delay — show after 3 minutes
  useEffect(() => {
    ctaTimerRef.current = setTimeout(() => setShowCTA(true), CTA_DELAY_SECONDS * 1000);
    return () => { if (ctaTimerRef.current) clearTimeout(ctaTimerRef.current); };
  }, []);

  // Track milestones + position via postMessage from Bunny player
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (typeof e.data !== "string") return;
      try {
        const msg = JSON.parse(e.data);
        if (msg.event !== "timeupdate" || !msg.data?.duration) return;

        // Store current position for exit tracking
        lastTimeRef.current = msg.data.currentTime;
        durationRef.current = msg.data.duration;

        const pct = (msg.data.currentTime / msg.data.duration) * 100;
        const funnelData = getFunnelData();
        const opts = { email: funnelData?.email, firstname: funnelData?.firstname, metadata: { vsl_version_id: vslVersionId } };
        const milestones = videoMilestonesRef.current;

        if (pct >= 25 && !milestones.has("25")) { milestones.add("25"); trackFunnel("vsl_25", "/van-business-academy/presentation", opts); }
        if (pct >= 50 && !milestones.has("50")) { milestones.add("50"); trackFunnel("vsl_50", "/van-business-academy/presentation", opts); }
        if (pct >= 75 && !milestones.has("75")) { milestones.add("75"); trackFunnel("vsl_75", "/van-business-academy/presentation", opts); }
        if (pct >= 95 && !milestones.has("100")) { milestones.add("100"); trackFunnel("vsl_100", "/van-business-academy/presentation", opts); }
      } catch { /* ignore non-Bunny messages */ }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [vslVersionId]);

  // Track vsl_exit when user leaves the page
  useEffect(() => {
    const trackExit = () => {
      if (exitTrackedRef.current || lastTimeRef.current === 0) return;
      exitTrackedRef.current = true;

      const funnelData = getFunnelData();
      trackFunnel("vsl_exit", "/van-business-academy/presentation", {
        email: funnelData?.email,
        firstname: funnelData?.firstname,
        metadata: {
          vsl_version_id: vslVersionId,
          seconds: Math.round(lastTimeRef.current),
          duration: Math.round(durationRef.current),
        },
      });
    };

    window.addEventListener("beforeunload", trackExit);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") trackExit();
    });

    return () => {
      window.removeEventListener("beforeunload", trackExit);
    };
  }, [vslVersionId]);

  return (
    <div className="max-w-3xl mx-auto px-4 pb-16">
      <style>{`
        @keyframes gentle-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        .sound-pulse {
          animation: gentle-pulse 2.5s ease-in-out infinite;
        }
      `}</style>

      {/* Greeting */}
      {firstname && (
        <p className="text-center text-sm font-semibold mb-2" style={{ color: "#B9945F" }}>
          Bienvenue {firstname} !
        </p>
      )}

      {/* Title */}
      <h1 className="text-center leading-tight mb-3">
        <span className="block text-xs sm:text-sm tracking-widest uppercase text-slate-400 font-bold mb-2">
          Découvre la méthode pour
        </span>
        <span
          className="block font-display text-2xl sm:text-3xl md:text-4xl font-black bg-clip-text text-transparent"
          style={{ backgroundImage: "linear-gradient(135deg, #B9945F 0%, #E4D398 100%)" }}
        >
          Construire ta liberté
        </span>
        <span className="block font-display text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 mt-1">
          grâce aux vans aménagés
        </span>
      </h1>

      {/* Instruction */}
      <div className="flex items-center justify-center gap-2 mb-8">
        <svg className="sound-pulse" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#B9945F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
        </svg>
        <p className="text-slate-500 text-sm">Active le son et regarde jusqu&apos;à la fin</p>
      </div>

      {/* Video player — Bunny embed iframe */}
      <div className="relative w-full rounded-2xl overflow-hidden shadow-lg mb-10" style={{ paddingTop: "56.25%" }}>
        <iframe
          src={EMBED_URL}
          loading="lazy"
          style={{ border: 0, position: "absolute", top: 0, left: 0, height: "100%", width: "100%" }}
          allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture;"
          allowFullScreen
        />
      </div>

      {/* CTA zone */}
      <div className="text-center mb-16">
        {showCTA ? (
          <div
            className="transition-all duration-1000"
            style={{ opacity: 1, transform: "translateY(0)" }}
          >
            <LiquidButton variant="gold" size="responsive" href="/van-business-academy/diagnostic-offert" fullWidth>
              Réserver mon appel stratégique gratuit →
            </LiquidButton>
            <p className="text-xs text-slate-400 mt-3">30 minutes &middot; Gratuit &middot; Sans engagement</p>
          </div>
        ) : (
          <p className="text-base text-slate-400 italic animate-pulse">
            &#127873; Une surprise apparaitra juste ici...
          </p>
        )}
      </div>
    </div>
  );
}
