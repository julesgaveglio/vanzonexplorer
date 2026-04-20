"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getFunnelData } from "@/lib/hooks/useUTMParams";
import { trackEvent } from "@/lib/meta-pixel";

const YOUTUBE_VSL_ID = "VpjD6V8FjKA";
const CTA_DELAY_SECONDS = 450; // 7min30

/* eslint-disable @typescript-eslint/no-explicit-any */

export default function VSLClient() {
  const router = useRouter();
  const [firstname, setFirstname] = useState("");
  const [showCTA, setShowCTA] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const watchTimeRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handlePlayPause = useCallback(() => {
    if (!playerRef.current) return;
    const state = playerRef.current.getPlayerState();
    if (state === 1) { // YT.PlayerState.PLAYING
      playerRef.current.pauseVideo();
    } else {
      playerRef.current.playVideo();
    }
  }, []);

  const handleSpeed = useCallback((rate: number) => {
    if (!playerRef.current) return;
    playerRef.current.setPlaybackRate(rate);
    setPlaybackRate(rate);
    setShowSpeedMenu(false);
  }, []);

  const handleFullscreen = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      el.requestFullscreen();
    }
  }, []);

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

  // Load YouTube IFrame API + create player
  useEffect(() => {
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(tag);

    const initPlayer = () => {
      playerRef.current = new (window as any).YT.Player("vsl-player", {
        videoId: YOUTUBE_VSL_ID,
        playerVars: {
          autoplay: 1,
          controls: 0,
          disablekb: 1,
          fs: 0,
          iv_load_policy: 3,
          modestbranding: 1,
          rel: 0,
          showinfo: 0,
          playsinline: 1,
        },
        events: {
          onReady: (e: any) => {
            e.target.playVideo();
          },
          onStateChange: (e: any) => {
            const playing = e.data === 1; // YT.PlayerState.PLAYING
            setIsPlaying(playing);

            if (playing) {
              intervalRef.current = setInterval(() => {
                watchTimeRef.current += 1;
                if (watchTimeRef.current >= CTA_DELAY_SECONDS) {
                  setShowCTA(true);
                  if (intervalRef.current) clearInterval(intervalRef.current);
                }
              }, 1000);
            } else {
              if (intervalRef.current) clearInterval(intervalRef.current);
            }
          },
        },
      });
    };

    if ((window as any).YT && (window as any).YT.Player) {
      initPlayer();
    } else {
      (window as any).onYouTubeIframeAPIReady = initPlayer;
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Close speed menu on outside click
  useEffect(() => {
    if (!showSpeedMenu) return;
    const close = () => setShowSpeedMenu(false);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [showSpeedMenu]);

  return (
    <div className="max-w-3xl mx-auto px-4 pb-16">
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
        Comment construire sa liberté
      </h1>

      {/* Instruction */}
      <div className="flex items-center justify-center gap-2 mb-8">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#B9945F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
        </svg>
        <p className="text-slate-500 text-sm">Active le son et regarde jusqu&apos;à la fin</p>
      </div>

      {/* Video player */}
      <div ref={containerRef} className="relative w-full rounded-2xl overflow-hidden shadow-lg mb-10 group" style={{ paddingBottom: "56.25%" }}>
        {/* YouTube iframe (injected by API) */}
        <div id="vsl-player" className="absolute inset-0 w-full h-full" />

        {/* Overlay to block YouTube click-through & branding */}
        <div
          className="absolute inset-0 z-10"
          onClick={handlePlayPause}
          style={{ cursor: "pointer" }}
        />

        {/* Hide YouTube logo bottom-right */}
        <div className="absolute bottom-0 right-0 w-40 h-12 z-10 bg-black" />
        {/* Hide YouTube top bar (title, share, etc.) */}
        <div className="absolute top-0 left-0 right-0 h-14 z-10 bg-black" />

        {/* Play/Pause overlay icon */}
        {!isPlaying && (
          <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
            <div className="w-16 h-16 rounded-full bg-black/50 flex items-center justify-center">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
                <polygon points="6,3 20,12 6,21" />
              </svg>
            </div>
          </div>
        )}

        {/* Custom controls bar */}
        <div className="absolute bottom-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-2 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
          {/* Play/Pause */}
          <button onClick={handlePlayPause} className="text-white p-1" aria-label={isPlaying ? "Pause" : "Lecture"}>
            {isPlaying ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="white"><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="white"><polygon points="6,3 20,12 6,21" /></svg>
            )}
          </button>

          <div className="flex items-center gap-3">
            {/* Speed */}
            <div className="relative">
              <button
                onClick={(e) => { e.stopPropagation(); setShowSpeedMenu((v) => !v); }}
                className="text-white text-xs font-semibold px-2 py-1 rounded bg-white/10 hover:bg-white/20 transition"
              >
                x{playbackRate}
              </button>
              {showSpeedMenu && (
                <div className="absolute bottom-full right-0 mb-2 bg-black/90 rounded-lg overflow-hidden shadow-lg" onClick={(e) => e.stopPropagation()}>
                  {[0.5, 1, 1.5, 2].map((r) => (
                    <button
                      key={r}
                      onClick={() => handleSpeed(r)}
                      className={`block w-full text-left px-4 py-2 text-xs text-white hover:bg-white/10 transition ${playbackRate === r ? "bg-white/20 font-bold" : ""}`}
                    >
                      x{r}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Fullscreen */}
            <button onClick={handleFullscreen} className="text-white p-1" aria-label="Plein écran">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 3 21 3 21 9" /><polyline points="9 21 3 21 3 15" /><line x1="21" y1="3" x2="14" y2="10" /><line x1="3" y1="21" x2="10" y2="14" />
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
            ✨ Une surprise apparaîtra juste ici…
          </p>
        )}
      </div>
    </div>
  );
}
