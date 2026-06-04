"use client";

import { useEffect, useState, useRef, useCallback } from "react";

const CTA_DELAY_SECONDS = 420; // 7 min

export default function SigmaVSLClient() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const lastTimeRef = useRef(0);

  const [firstname, setFirstname] = useState("");
  const [showCTA, setShowCTA] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("sigma_funnel");
      if (raw) {
        const data = JSON.parse(raw);
        if (data.firstname) setFirstname(data.firstname);
      }
    } catch {}
  }, []);

  const onTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    lastTimeRef.current = video.currentTime;
    if (video.currentTime >= CTA_DELAY_SECONDS) {
      setShowCTA(true);
    }
  }, []);

  const onSeeking = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.currentTime > lastTimeRef.current + 2) {
      video.currentTime = lastTimeRef.current;
    }
  };

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    video.paused ? video.play() : video.pause();
  };

  return (
    <div className="min-h-screen bg-white pt-10 sm:pt-16">
      <div className="max-w-3xl mx-auto px-4 pb-16">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <img
            src="/images/sigma-factory-logo.png"
            alt="Sigma Factory"
            width={160}
            height={48}
          />
        </div>

        {/* Greeting */}
        {firstname && (
          <p className="text-center text-sm font-medium text-slate-500 mb-2">
            Bienvenue {firstname}
          </p>
        )}

        {/* Title */}
        <h1 className="text-center text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 leading-tight mb-3">
          Decouvre la{" "}
          <span style={{ color: "#B9945F" }}>strategie IDRH</span>{" "}
          pour solder ton credit immobilier en{" "}
          <span style={{ color: "#B9945F" }}>12 mois</span>
        </h1>

        {/* Instruction */}
        <p className="text-slate-400 text-sm text-center mb-8">
          Active le son et regarde jusqu&apos;a la fin
        </p>

        {/* Video player */}
        <div
          className="relative w-full rounded-xl overflow-hidden border border-slate-200 bg-slate-100 mb-10 cursor-pointer"
          style={{ aspectRatio: "16/9" }}
          onClick={togglePlay}
        >
          <video
            ref={videoRef}
            playsInline
            onTimeUpdate={onTimeUpdate}
            onSeeking={onSeeking}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            className="w-full h-full object-contain"
            controlsList="nodownload noplaybackrate"
          />

          {/* Play button overlay */}
          {!isPlaying && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900/10">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ background: "#B9945F" }}
              >
                <svg
                  className="w-7 h-7 text-white ml-1"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>
          )}

          {/* Placeholder text */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-slate-300 text-sm">Video a venir</p>
          </div>
        </div>

        {/* CTA zone */}
        <div className="text-center">
          {showCTA ? (
            <div>
              <a
                href="/sigmafactory/diagnostic-offert"
                className="inline-block w-full sm:w-auto px-8 py-4 rounded-lg text-white font-semibold text-sm uppercase tracking-wide hover:opacity-90 transition-opacity"
                style={{ background: "#B9945F" }}
              >
                Reserver mon appel strategique gratuit
              </a>
              <p className="text-xs text-slate-400 mt-3">
                30 minutes &middot; Gratuit &middot; Sans engagement
              </p>
            </div>
          ) : (
            <p className="text-slate-300 text-sm italic">
              Un bouton apparaitra ici apres quelques minutes...
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
