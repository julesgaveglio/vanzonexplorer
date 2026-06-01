"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Hls from "hls.js";
import { getFunnelData } from "@/lib/hooks/useUTMParams";
import { trackFunnel } from "@/lib/funnel-tracking";
import LiquidButton from "@/components/ui/LiquidButton";

const CTA_WATCH_COLD = 420; // 7 min de visionnage réel pour les leads froids

interface VSLClientProps {
  videoId: string;
  libraryId: string;
  vslVersionId: string;
}

export default function VSLClient({ videoId, vslVersionId }: VSLClientProps) {
  const HLS_URL = `https://vz-bac05373-d10.b-cdn.net/${videoId}/playlist.m3u8`;
  const CAPTIONS_URL = `https://vz-bac05373-d10.b-cdn.net/${videoId}/captions/fr-auto.vtt`;
  const POSTER_URL = "/images/vsl2-thumbnail.png";

  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const milestonesRef = useRef(new Set<string>());
  const exitTrackedRef = useRef(false);
  const lastTimeRef = useRef(0);
  const durationRef = useRef(0);

  const [firstname, setFirstname] = useState("");
  const [showCTA, setShowCTA] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  // --- Get tracking opts ---
  const getTrackOpts = useCallback(
    (extraMeta?: Record<string, unknown>) => {
      const data = getFunnelData();
      return {
        email: data?.email,
        firstname: data?.firstname,
        metadata: {
          vsl_version_id: vslVersionId,
          seconds: Math.round(lastTimeRef.current),
          duration: Math.round(durationRef.current),
          ...extraMeta,
        },
      };
    },
    [vslVersionId]
  );

  // --- Initialize HLS player ---
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (Hls.isSupported()) {
      const hls = new Hls({ startLevel: -1 });
      hls.loadSource(HLS_URL);
      hls.attachMedia(video);
      hlsRef.current = hls;
      return () => { hls.destroy(); };
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      // Safari native HLS
      video.src = HLS_URL;
    }
  }, [HLS_URL]);

  // --- Track vsl_view on mount ---
  useEffect(() => {
    const data = getFunnelData();
    if (data?.firstname) setFirstname(data.firstname);

    if (data?.email) {
      fetch("/api/van-business-academy/inscription/step", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email, step: "vsl" }),
      }).catch(() => {});
    }

    trackFunnel("vsl_view", "/van-business-academy/presentation", {
      email: data?.email,
      firstname: data?.firstname,
      metadata: { vsl_version_id: vslVersionId },
    });
  }, [vslVersionId]);

  // --- CTA: instant for hot leads, after 7min of real watch time for cold ---
  // --- Lead pixel: fires ONLY for hot leads when they land on this page ---
  const isHotRef = useRef(false);
  const leadFiredRef = useRef(false);
  useEffect(() => {
    try {
      isHotRef.current = localStorage.getItem("vba_is_hot") === "1";
    } catch {}
    if (isHotRef.current) {
      setShowCTA(true);
      // Fire Meta Lead for hot leads arriving on presentation page
      if (!leadFiredRef.current) {
        leadFiredRef.current = true;
        const eid = crypto.randomUUID();
        const fireLead = () => {
          if (window.fbq) {
            window.fbq("track", "Lead", { content_name: "optin" }, { eventID: eid });
            return true;
          }
          return false;
        };
        if (!fireLead()) {
          let attempts = 0;
          const interval = setInterval(() => {
            attempts++;
            if (fireLead() || attempts >= 20) clearInterval(interval);
          }, 100);
        }
      }
    }
  }, []);

  // --- Video timeupdate handler (the actual tracking) ---
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onTimeUpdate = () => {
      const currentTime = video.currentTime;
      const duration = video.duration;
      if (!duration || isNaN(duration)) return;

      lastTimeRef.current = currentTime;
      durationRef.current = duration;

      // Show CTA for cold leads after 7 min of real watch time
      if (!isHotRef.current && currentTime >= CTA_WATCH_COLD) {
        setShowCTA(true);
      }

      const pct = (currentTime / duration) * 100;
      const milestones = milestonesRef.current;
      const page = "/van-business-academy/presentation";

      if (pct >= 25 && !milestones.has("25")) {
        milestones.add("25");
        trackFunnel("vsl_25", page, getTrackOpts());
      }
      if (pct >= 50 && !milestones.has("50")) {
        milestones.add("50");
        trackFunnel("vsl_50", page, getTrackOpts());
      }
      if (pct >= 75 && !milestones.has("75")) {
        milestones.add("75");
        trackFunnel("vsl_75", page, getTrackOpts());
      }
      if (pct >= 95 && !milestones.has("100")) {
        milestones.add("100");
        trackFunnel("vsl_100", page, getTrackOpts());
      }
    };

    const onPlay = () => {
      setIsPlaying(true);
};
    const onPause = () => setIsPlaying(false);

    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);

    return () => {
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
    };
  }, [getTrackOpts]);

  // --- Track vsl_exit on page leave (sendBeacon for reliability) ---
  useEffect(() => {
    const trackExit = () => {
      if (exitTrackedRef.current || lastTimeRef.current === 0) return;
      exitTrackedRef.current = true;

      const opts = getTrackOpts();
      const payload = {
        session_id: sessionStorage.getItem("vba_session_id") ?? "",
        event: "vsl_exit",
        page: "/van-business-academy/presentation",
        email: opts.email,
        firstname: opts.firstname,
        metadata: opts.metadata,
        referrer: document.referrer || undefined,
      };

      // sendBeacon is reliable during page unload (unlike fetch)
      const sent = navigator.sendBeacon(
        "/api/funnel/track",
        new Blob([JSON.stringify(payload)], { type: "application/json" })
      );
      // Fallback to fetch if sendBeacon fails
      if (!sent) {
        fetch("/api/funnel/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          keepalive: true,
        }).catch(() => {});
      }
    };

    const onVisChange = () => {
      if (document.visibilityState === "hidden") trackExit();
    };

    window.addEventListener("beforeunload", trackExit);
    document.addEventListener("visibilitychange", onVisChange);

    return () => {
      window.removeEventListener("beforeunload", trackExit);
      document.removeEventListener("visibilitychange", onVisChange);
    };
  }, [getTrackOpts]);

  // --- Play/pause toggle ---
  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play();
    } else {
      video.pause();
    }
  };

  // --- Block seeking ---
  const onSeeking = () => {
    const video = videoRef.current;
    if (!video) return;
    // Only allow seeking forward up to lastTimeRef (prevent skipping ahead)
    if (video.currentTime > lastTimeRef.current + 2) {
      video.currentTime = lastTimeRef.current;
    }
  };

  return (
    <div className="min-h-screen pt-10 sm:pt-16" style={{ background: "#0A0A0A" }}>
    <div className="max-w-3xl mx-auto px-4 pb-16">
      <style>{`
        @keyframes gentle-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        .sound-pulse {
          animation: gentle-pulse 2.5s ease-in-out infinite;
        }
        video::-webkit-media-controls-timeline { display: none; }
        video::-webkit-media-controls-current-time-display { display: none; }
        video::-webkit-media-controls-time-remaining-display { display: none; }
        video::cue {
          background: rgba(0, 0, 0, 0.7);
          color: #fff;
          font-size: 16px;
          line-height: 1.4;
          border-radius: 4px;
          padding: 2px 6px;
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
        <span className="block text-xl sm:text-2xl md:text-3xl font-semibold text-white">
          Donne-moi <span style={{ backgroundImage: "linear-gradient(135deg, #B9945F 0%, #E4D398 100%)" }} className="bg-clip-text text-transparent">13 minutes</span> et je te partage (vraiment) tout le process pour générer{" "}
          <span style={{ backgroundImage: "linear-gradient(135deg, #B9945F 0%, #E4D398 100%)" }} className="bg-clip-text text-transparent">600&euro;/mois</span> de revenu locatif avec un van aménagé
        </span>
      </h1>

      {/* Instruction */}
      <div className="flex items-center justify-center gap-2 mb-8">
        <svg className="sound-pulse" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#B9945F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
        </svg>
        <p className="text-white/50 text-sm">Active le son et regarde jusqu&apos;à la fin</p>
      </div>

      {/* Video player — HLS native */}
      <div
        className="relative w-full rounded-2xl overflow-hidden shadow-lg mb-10 bg-black cursor-pointer"
        style={{ aspectRatio: "16/9" }}
        onClick={togglePlay}
      >
        <video
          ref={videoRef}
          poster={POSTER_URL}
          playsInline
          onSeeking={onSeeking}
          className="w-full h-full object-contain"
          controlsList="nodownload noplaybackrate"
          crossOrigin="anonymous"
        >
          <track
            kind="captions"
            src={CAPTIONS_URL}
            srcLang="fr"
            label="Français"
            default
          />
        </video>

        {/* Play button overlay */}
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 transition-opacity">
            <div
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #B9945F 0%, #E4D398 100%)", boxShadow: "0 4px 20px rgba(185,148,95,0.5)" }}
            >
              <svg className="w-7 h-7 sm:w-8 sm:h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>
        )}
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
            <p className="text-xs text-white/40 mt-3">30 minutes &middot; Gratuit &middot; Sans engagement</p>
          </div>
        ) : (
          <p className="text-base text-white/40 italic animate-pulse">
            &#127873; Une surprise apparaitra juste ici...
          </p>
        )}
      </div>
    </div>
    </div>
  );
}
