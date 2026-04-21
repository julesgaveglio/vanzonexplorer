"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { getFunnelData } from "@/lib/hooks/useUTMParams";
import { trackEvent } from "@/lib/meta-pixel";
import LiquidButton from "@/components/ui/LiquidButton";

const VIDEO_HLS_URL =
  "https://vz-c0494fd3-b7d.b-cdn.net/c35fca15-b9b4-4a39-8bcf-9db2ece00d43/playlist.m3u8";
const VIDEO_POSTER =
  "https://vz-c0494fd3-b7d.b-cdn.net/c35fca15-b9b4-4a39-8bcf-9db2ece00d43/thumbnail.jpg";
const CTA_DELAY_SECONDS = 180; // 3min

const QUALITY_OPTIONS = [
  { label: "Auto", value: -1 },
  { label: "720p", value: 720 },
  { label: "360p", value: 360 },
  { label: "180p", value: 180 },
];

const SPEED_OPTIONS = [0.75, 1, 1.5, 2];

export default function VSLClient() {
  const [firstname, setFirstname] = useState("");
  const [showCTA, setShowCTA] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [qualityLabel, setQualityLabel] = useState("Auto");
  const [showSettings, setShowSettings] = useState(false);
  const [settingsTab, setSettingsTab] = useState<"main" | "quality" | "speed">("main");
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
  const lastAllowedTimeRef = useRef(0);

  // --- Handlers ---

  const handlePlayPause = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.muted) {
      v.muted = false;
      setIsMuted(false);
    }
    if (v.paused) v.play();
    else v.pause();
  }, []);

  const handleSpeed = useCallback((rate: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.playbackRate = rate;
    setPlaybackRate(rate);
    setShowSettings(false);
    setSettingsTab("main");
  }, []);

  const handleQuality = useCallback((value: number, label: string) => {
    const hls = hlsRef.current;
    if (hls) {
      if (value === -1) {
        hls.currentLevel = -1;
      } else {
        const idx = hls.levels.findIndex((l: any) => l.height === value); // eslint-disable-line @typescript-eslint/no-explicit-any
        if (idx !== -1) hls.currentLevel = idx;
      }
    }
    setQualityLabel(label);
    setShowSettings(false);
    setSettingsTab("main");
  }, []);

  const toggleSettings = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setShowSettings((v) => !v);
    setSettingsTab("main");
  }, []);

  // --- Effects ---

  // Funnel data + tracking (optional — page accessible directly)
  useEffect(() => {
    const data = getFunnelData();
    if (data) {
      setFirstname(data.firstname);
      fetch("/api/van-business-academy/inscription/step", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email, step: "vsl" }),
      }).catch(() => {});
    }
    trackEvent("ViewContent", { content_name: "vba-vsl" });
  }, []);

  // Load HLS.js for non-Safari browsers + autoplay
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    const startPlayback = () => {
      v.currentTime = 1;
      // Try unmuted first (works if user already interacted with the domain)
      v.muted = false;
      v.play().then(() => {
        setIsMuted(false);
      }).catch(() => {
        // Browser blocked unmuted autoplay — fallback to muted
        v.muted = true;
        setIsMuted(true);
        v.play().catch(() => {});
      });
    };

    if (v.canPlayType("application/vnd.apple.mpegurl")) {
      v.src = VIDEO_HLS_URL;
      v.addEventListener("loadedmetadata", startPlayback, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/hls.js@latest";
    script.onload = () => {
      const Hls = (window as any).Hls; // eslint-disable-line @typescript-eslint/no-explicit-any
      if (Hls.isSupported()) {
        const hls = new Hls();
        hlsRef.current = hls;
        hls.loadSource(VIDEO_HLS_URL);
        hls.attachMedia(v);
        hls.on(Hls.Events.MANIFEST_PARSED, startPlayback);
      }
    };
    document.head.appendChild(script);
  }, []);

  // Block seeking + track watch time
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

  // Close settings on outside click (mousedown to avoid same-event conflicts)
  useEffect(() => {
    if (!showSettings) return;
    const close = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("[data-settings-menu]")) return;
      setShowSettings(false);
      setSettingsTab("main");
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("touchstart", close as any); // eslint-disable-line @typescript-eslint/no-explicit-any
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("touchstart", close as any); // eslint-disable-line @typescript-eslint/no-explicit-any
    };
  }, [showSettings]);

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
      <h1
        className="font-display text-2xl sm:text-3xl text-center leading-tight mb-3"
        style={{ color: "#0F172A" }}
      >
        Découvre la méthode pour construire ta liberté intérieure grâce aux vans aménagés
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

      {/* Video player */}
      <div
        ref={containerRef}
        className="relative w-full rounded-2xl overflow-hidden shadow-lg mb-10 group bg-black"
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

        {/* Unmute banner — compact, single line on mobile */}
        {isMuted && isPlaying && (
          <div
            className="absolute top-3 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-sm cursor-pointer animate-pulse whitespace-nowrap"
            onClick={handlePlayPause}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <line x1="23" y1="9" x2="17" y2="15" />
              <line x1="17" y1="9" x2="23" y2="15" />
            </svg>
            <span className="text-white text-[11px] font-medium">Activer le son</span>
          </div>
        )}

        {/* Play overlay */}
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-16 h-16 rounded-full bg-black/50 flex items-center justify-center backdrop-blur-sm">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
                <polygon points="6,3 20,12 6,21" />
              </svg>
            </div>
          </div>
        )}

        {/* Controls bar — always visible on mobile, hover on desktop */}
        <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-4 py-3 bg-gradient-to-t from-black/70 to-transparent opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300">
          {/* Play/Pause */}
          <button onClick={handlePlayPause} className="text-white p-1.5 hover:bg-white/10 rounded-full transition" aria-label={isPlaying ? "Pause" : "Lecture"}>
            {isPlaying ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="white"><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="white"><polygon points="6,3 20,12 6,21" /></svg>
            )}
          </button>

          {/* Settings gear */}
          <div className="relative" data-settings-menu>
            <button
              onClick={toggleSettings}
              className="text-white p-1.5 hover:bg-white/10 rounded-full transition"
              aria-label="Paramètres"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </button>

            {/* Settings dropdown — opens upward inside container */}
            {showSettings && (
              <div
                className="absolute bottom-12 right-0 w-44 bg-black/90 rounded-lg overflow-hidden shadow-xl backdrop-blur-sm z-40"
              >
                {settingsTab === "main" && (
                  <>
                    <button
                      onClick={() => setSettingsTab("quality")}
                      className="flex items-center justify-between w-full px-4 py-3 text-xs text-white hover:bg-white/10 transition"
                    >
                      <span>Qualité</span>
                      <span className="text-white/60">{qualityLabel} ›</span>
                    </button>
                    <button
                      onClick={() => setSettingsTab("speed")}
                      className="flex items-center justify-between w-full px-4 py-3 text-xs text-white hover:bg-white/10 transition"
                    >
                      <span>Vitesse</span>
                      <span className="text-white/60">x{playbackRate} ›</span>
                    </button>
                  </>
                )}

                {settingsTab === "quality" && (
                  <>
                    <button
                      onClick={() => setSettingsTab("main")}
                      className="flex items-center gap-2 w-full px-4 py-2.5 text-xs text-white/60 hover:bg-white/10 transition border-b border-white/10"
                    >
                      <span>‹</span><span>Qualité</span>
                    </button>
                    {QUALITY_OPTIONS.map((q) => (
                      <button
                        key={q.label}
                        onClick={() => handleQuality(q.value, q.label)}
                        className={`block w-full text-left px-4 py-2.5 text-xs text-white hover:bg-white/10 transition ${qualityLabel === q.label ? "bg-white/20 font-bold" : ""}`}
                      >
                        {q.label}
                      </button>
                    ))}
                  </>
                )}

                {settingsTab === "speed" && (
                  <>
                    <button
                      onClick={() => setSettingsTab("main")}
                      className="flex items-center gap-2 w-full px-4 py-2.5 text-xs text-white/60 hover:bg-white/10 transition border-b border-white/10"
                    >
                      <span>‹</span><span>Vitesse</span>
                    </button>
                    {SPEED_OPTIONS.map((r) => (
                      <button
                        key={r}
                        onClick={() => handleSpeed(r)}
                        className={`block w-full text-left px-4 py-2.5 text-xs text-white hover:bg-white/10 transition ${playbackRate === r ? "bg-white/20 font-bold" : ""}`}
                      >
                        x{r}
                      </button>
                    ))}
                  </>
                )}
              </div>
            )}
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
            <LiquidButton variant="gold" size="responsive" href="/van-business-academy/diagnostic-offert" fullWidth>
              Réserver mon appel stratégique gratuit →
            </LiquidButton>
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
