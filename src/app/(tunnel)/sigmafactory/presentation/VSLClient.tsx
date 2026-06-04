"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Hls from "hls.js";
import Image from "next/image";

const CTA_DELAY_SECONDS = 420; // 7 min
const VIDEO_ID = "a317c285-9b95-409a-97c3-9ae61edef884";
const HLS_URL = `https://vz-bac05373-d10.b-cdn.net/${VIDEO_ID}/playlist.m3u8`;
const CAPTIONS_URL = `https://vz-bac05373-d10.b-cdn.net/${VIDEO_ID}/captions/fr-auto.vtt`;

export default function SigmaVSLClient() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const lastTimeRef = useRef(0);
  const milestonesRef = useRef(new Set<string>());
  const emailRef = useRef("");
  const cuesRef = useRef<{ start: number; end: number; text: string }[]>([]);

  const [firstname, setFirstname] = useState("");
  const [showCTA, setShowCTA] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [captionText, setCaptionText] = useState("");

  // --- Load funnel data + track view ---
  useEffect(() => {
    try {
      const raw = localStorage.getItem("sigma_funnel");
      if (raw) {
        const data = JSON.parse(raw);
        if (data.firstname) setFirstname(data.firstname);
        if (data.email) emailRef.current = data.email;

        fetch("/api/sigma/funnel/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            event: "vsl_view",
            page: "/sigmafactory/presentation",
            email: data.email,
            firstname: data.firstname,
          }),
        }).catch(() => {});
      }
    } catch {}
  }, []);

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
      video.src = HLS_URL;
    }
  }, []);

  // --- Fetch captions ---
  useEffect(() => {
    fetch(CAPTIONS_URL)
      .then((r) => r.text())
      .then((vtt) => {
        const cues: { start: number; end: number; text: string }[] = [];
        const blocks = vtt.split("\n\n");
        for (const block of blocks) {
          const lines = block.trim().split("\n");
          const timeLine = lines.find((l) => l.includes("-->"));
          if (!timeLine) continue;
          const [startStr, endStr] = timeLine.split("-->").map((s) => s.trim());
          const parseTime = (t: string) => {
            const parts = t.split(":");
            const [sec, ms] = parts.pop()!.split(".");
            const min = parts.pop() ?? "0";
            const hr = parts.pop() ?? "0";
            return +hr * 3600 + +min * 60 + +sec + (+ms || 0) / 1000;
          };
          const textIdx = lines.indexOf(timeLine) + 1;
          const text = lines.slice(textIdx).join("\n").trim();
          if (text) cues.push({ start: parseTime(startStr), end: parseTime(endStr), text });
        }
        cuesRef.current = cues;
      })
      .catch(() => {});
  }, []);

  // --- Caption sync ---
  const updateCaption = useCallback((currentTime: number) => {
    const cue = cuesRef.current.find((c) => currentTime >= c.start && currentTime <= c.end);
    setCaptionText(cue?.text ?? "");
  }, []);

  // --- Milestone tracking ---
  const trackMilestone = useCallback((event: string) => {
    fetch("/api/sigma/funnel/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event,
        page: "/sigmafactory/presentation",
        email: emailRef.current || undefined,
        metadata: { seconds: Math.round(lastTimeRef.current) },
      }),
    }).catch(() => {});
  }, []);

  // --- Time update handler ---
  const onTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (!video || !video.duration) return;
    lastTimeRef.current = video.currentTime;
    updateCaption(video.currentTime);

    if (video.currentTime >= CTA_DELAY_SECONDS) {
      setShowCTA(true);
    }

    const pct = (video.currentTime / video.duration) * 100;
    const ms = milestonesRef.current;
    if (pct >= 25 && !ms.has("25")) { ms.add("25"); trackMilestone("vsl_25"); }
    if (pct >= 50 && !ms.has("50")) { ms.add("50"); trackMilestone("vsl_50"); }
    if (pct >= 75 && !ms.has("75")) { ms.add("75"); trackMilestone("vsl_75"); }
    if (pct >= 95 && !ms.has("100")) { ms.add("100"); trackMilestone("vsl_100"); }
  }, [trackMilestone, updateCaption]);

  // --- Block seeking ---
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
    if (video.paused) { video.play(); } else { video.pause(); }
  };

  return (
    <div className="min-h-screen bg-white pt-10 sm:pt-16">
      <div className="max-w-3xl mx-auto px-4 pb-16">
        <style>{`
          video::-webkit-media-controls-timeline { display: none; }
          video::-webkit-media-controls-current-time-display { display: none; }
          video::-webkit-media-controls-time-remaining-display { display: none; }
        `}</style>

        {/* Logo */}
        <div className="flex justify-center mb-6">
          <Image
            src="/images/sigma-factory-logo.png"
            alt="Sigma Factory"
            width={160}
            height={48}
            unoptimized
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
          Découvre la{" "}
          <span style={{ color: "#B9945F" }}>stratégie IDRH</span>{" "}
          pour solder ton crédit immobilier en{" "}
          <span style={{ color: "#B9945F" }}>12 mois</span>
        </h1>

        {/* Instruction */}
        <p className="text-slate-400 text-sm text-center mb-8">
          Active le son et regarde jusqu&apos;à la fin
        </p>

        {/* Video player — HLS */}
        <div
          className="relative w-full rounded-xl overflow-hidden border border-slate-200 bg-black mb-10 cursor-pointer"
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

          {/* Captions overlay */}
          {captionText && (
            <div className="absolute bottom-4 left-0 right-0 flex justify-center pointer-events-none px-4">
              <span
                className="text-white text-sm sm:text-base leading-snug text-center px-3 py-1.5 rounded"
                style={{ background: "rgba(0,0,0,0.75)", maxWidth: "90%" }}
              >
                {captionText}
              </span>
            </div>
          )}

          {/* Play button overlay */}
          {!isPlaying && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
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
                Réserver mon appel stratégique gratuit
              </a>
              <p className="text-xs text-slate-400 mt-3">
                30 minutes &middot; Gratuit &middot; Sans engagement
              </p>
            </div>
          ) : (
            <p className="text-slate-300 text-sm italic">
              Un bouton apparaîtra ici après quelques minutes...
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
