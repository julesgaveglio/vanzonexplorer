"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getFunnelData } from "@/lib/hooks/useUTMParams";
import { trackEvent } from "@/lib/meta-pixel";

const VIDEO_HLS_URL =
  "https://vz-c0494fd3-b7d.b-cdn.net/71157b6a-e2a6-408b-ba1c-b46550cf01ef/playlist.m3u8";
const VIDEO_POSTER =
  "https://vz-c0494fd3-b7d.b-cdn.net/71157b6a-e2a6-408b-ba1c-b46550cf01ef/thumbnail.jpg";
const CTA_DELAY_SECONDS = 440; // 7min20

export default function VSLClient() {
  const router = useRouter();
  const [firstname, setFirstname] = useState("");
  const [showCTA, setShowCTA] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastAllowedTimeRef = useRef(0);

  // --- Handlers ---

  const handlePlayPause = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) v.play();
    else v.pause();
  }, []);

  const handleSpeed = useCallback((rate: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.playbackRate = rate;
    setPlaybackRate(rate);
    setShowSpeedMenu(false);
  }, []);

  const handleFullscreen = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      el.requestFullscreen().catch(() => {});
    }
  }, []);

  // --- Effects ---

  // Fullscreen tracking
  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  // Funnel data + tracking
  useEffect(() => {
    const data = getFunnelData();
    if (!data) {
      router.replace("/van-business-academy/inscription");
      return;
    }
    setFirstname(data.firstname);
    trackEvent("ViewContent", { content_name: "vba-vsl" });
    fetch("/api/van-business-academy/inscription/step", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: data.email, step: "vsl" }),
    }).catch(() => {});
  }, [router]);

  // Load HLS.js for non-Safari browsers + autoplay
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    const startPlayback = () => {
      v.currentTime = 1; // skip first second
      v.muted = true; // browsers require muted for autoplay
      v.play().catch(() => {});
    };

    // Safari supports HLS natively
    if (v.canPlayType("application/vnd.apple.mpegurl")) {
      v.src = VIDEO_HLS_URL;
      v.addEventListener("loadedmetadata", startPlayback, { once: true });
      return;
    }

    // Other browsers: load hls.js dynamically
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/hls.js@latest";
    script.onload = () => {
      const Hls = (window as any).Hls; // eslint-disable-line @typescript-eslint/no-explicit-any
      if (Hls.isSupported()) {
        const hls = new Hls();
        hls.loadSource(VIDEO_HLS_URL);
        hls.attachMedia(v);
        hls.on(Hls.Events.MANIFEST_PARSED, startPlayback);
      }
    };
    document.head.appendChild(script);
  }, []);

  // Block seeking — only allow forward progress
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    const onTimeUpdate = () => {
      lastAllowedTimeRef.current = Math.max(lastAllowedTimeRef.current, v.currentTime);
      if (v.currentTime >= CTA_DELAY_SECONDS && !showCTA) {
        setShowCTA(true);
      }
    };
    const onSeeking = () => {
      if (v.currentTime > lastAllowedTimeRef.current + 1) {
        v.currentTime = lastAllowedTimeRef.current;
      }
    };
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);

    v.addEventListener("timeupdate", onTimeUpdate);
    v.addEventListener("seeking", onSeeking);
    v.addEventListener("play", onPlay);
    v.addEventListener("pause", onPause);
    return () => {
      v.removeEventListener("timeupdate", onTimeUpdate);
      v.removeEventListener("seeking", onSeeking);
      v.removeEventListener("play", onPlay);
      v.removeEventListener("pause", onPause);
    };
  }, [showCTA]);

  // Close speed menu on outside click
  useEffect(() => {
    if (!showSpeedMenu) return;
    const close = () => setShowSpeedMenu(false);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [showSpeedMenu]);

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
        .vsl-container:fullscreen {
          background: #000;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .vsl-container:fullscreen video {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }
      `}</style>

      {/* Greeting */}
      {firstname && (
        <p className="text-center text-sm font-semibold mb-2" style={{ color: "#B9945F" }}>
          Bravo {firstname} !
        </p>
      )}

      {/* Title */}
      <h1
        className="font-display text-2xl sm:text-3xl text-center leading-tight mb-3"
        style={{ color: "#0F172A" }}
      >
        Comment construire sa liberté avec les vans aménagés
      </h1>

      {/* Instruction — icon pulses gently */}
      <div className="flex items-center justify-center gap-2 mb-8">
        <svg className="sound-pulse" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#B9945F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
        </svg>
        <p className="text-slate-500 text-sm">Active le son et regarde jusqu&apos;à la fin</p>
      </div>

      {/* Video player */}
      <div
        ref={containerRef}
        className="vsl-container relative w-full rounded-2xl overflow-hidden shadow-lg mb-10 group bg-black"
      >
        <video
          ref={videoRef}
          className="w-full block"
          poster={VIDEO_POSTER}
          playsInline
          preload="auto"
          controlsList="nodownload noremoteplayback"
          disablePictureInPicture
          onClick={handlePlayPause}
          style={{ cursor: "pointer" }}
        />

        {/* Play overlay icon (centered) — visible when paused */}
        {!isPlaying && (
          <div
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
          >
            <div className="w-16 h-16 rounded-full bg-black/50 flex items-center justify-center backdrop-blur-sm">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
                <polygon points="6,3 20,12 6,21" />
              </svg>
            </div>
          </div>
        )}

        {/* Custom controls bar — appears on hover / tap */}
        <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-4 py-3 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          {/* Play/Pause */}
          <button onClick={handlePlayPause} className="text-white p-1.5 hover:bg-white/10 rounded-full transition" aria-label={isPlaying ? "Pause" : "Lecture"}>
            {isPlaying ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="white"><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="white"><polygon points="6,3 20,12 6,21" /></svg>
            )}
          </button>

          <div className="flex items-center gap-2">
            {/* Speed selector */}
            <div className="relative">
              <button
                onClick={(e) => { e.stopPropagation(); setShowSpeedMenu((v) => !v); }}
                className="text-white text-xs font-semibold px-2.5 py-1.5 rounded-md bg-white/10 hover:bg-white/20 transition"
              >
                x{playbackRate}
              </button>
              {showSpeedMenu && (
                <div className="absolute bottom-full right-0 mb-2 bg-black/90 rounded-lg overflow-hidden shadow-xl backdrop-blur-sm" onClick={(e) => e.stopPropagation()}>
                  {[0.75, 1, 1.5, 2].map((r) => (
                    <button
                      key={r}
                      onClick={() => handleSpeed(r)}
                      className={`block w-full text-left px-4 py-2.5 text-xs text-white hover:bg-white/10 transition ${playbackRate === r ? "bg-white/20 font-bold" : ""}`}
                    >
                      x{r}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Fullscreen */}
            <button onClick={handleFullscreen} className="text-white p-1.5 hover:bg-white/10 rounded-full transition" aria-label="Plein écran">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {isFullscreen ? (
                  <>
                    <polyline points="4 14 10 14 10 20" /><polyline points="20 10 14 10 14 4" />
                    <line x1="14" y1="10" x2="21" y2="3" /><line x1="3" y1="21" x2="10" y2="14" />
                  </>
                ) : (
                  <>
                    <polyline points="15 3 21 3 21 9" /><polyline points="9 21 3 21 3 15" />
                    <line x1="21" y1="3" x2="14" y2="10" /><line x1="3" y1="21" x2="10" y2="14" />
                  </>
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* CTA zone */}
      <div className="text-center mb-16">
        {showCTA ? (
          <div
            className="transition-all duration-1000"
            style={{ opacity: 1, transform: "translateY(0)" }}
          >
            <a
              href="/van-business-academy/diagnostic-offert"
              className="block w-full rounded-xl text-center font-bold text-white py-4 text-base sm:text-lg transition-all hover:scale-[1.02] hover:shadow-lg"
              style={{ background: "linear-gradient(135deg, #B9945F 0%, #E4D398 50%, #B9945F 100%)" }}
            >
              Réserver mon appel stratégique gratuit →
            </a>
            <p className="text-xs text-slate-400 mt-3">30 minutes &middot; Gratuit &middot; Sans engagement</p>
          </div>
        ) : (
          <p className="text-sm text-slate-400 italic animate-pulse">
            🎁 Une surprise apparaîtra juste ici…
          </p>
        )}
      </div>
    </div>
  );
}
