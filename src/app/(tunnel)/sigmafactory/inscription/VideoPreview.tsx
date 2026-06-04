"use client";

import { useEffect, useRef } from "react";
import Hls from "hls.js";

const VIDEO_ID = "a317c285-9b95-409a-97c3-9ae61edef884";
const HLS_URL = `https://vz-bac05373-d10.b-cdn.net/${VIDEO_ID}/playlist.m3u8`;

export default function VideoPreview() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (Hls.isSupported()) {
      const hls = new Hls({ startLevel: -1 });
      hls.loadSource(HLS_URL);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => {});
      });
      return () => { hls.destroy(); };
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = HLS_URL;
      video.play().catch(() => {});
    }
  }, []);

  const scrollToForm = () => {
    document.getElementById("optin-form")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div
      className="relative w-full rounded-xl overflow-hidden border border-slate-200 cursor-pointer"
      style={{ aspectRatio: "16/9" }}
      onClick={scrollToForm}
    >
      <video
        ref={videoRef}
        muted
        playsInline
        loop
        className="w-full h-full object-cover"
      />

      {/* Play overlay — hint to click */}
      <div className="absolute inset-0 flex items-center justify-center bg-black/10 hover:bg-black/20 transition-colors">
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center"
          style={{ background: "#B9945F" }}
        >
          <svg className="w-6 h-6 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
      </div>

      {/* Label */}
      <div className="absolute bottom-3 left-0 right-0 flex justify-center">
        <span className="text-xs text-white font-medium px-3 py-1 rounded-full" style={{ background: "rgba(0,0,0,0.6)" }}>
          Clique pour accéder à la vidéo complète
        </span>
      </div>
    </div>
  );
}
