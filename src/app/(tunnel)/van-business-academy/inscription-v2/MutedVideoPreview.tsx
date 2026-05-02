"use client";

import { useEffect, useRef } from "react";

const VIDEO_HLS_URL =
  "https://vz-bac05373-d10.b-cdn.net/7739a3f1-ad32-4839-ba56-e4dc60a27a47/playlist.m3u8";
const VIDEO_POSTER =
  "https://vz-bac05373-d10.b-cdn.net/7739a3f1-ad32-4839-ba56-e4dc60a27a47/thumbnail.jpg";

export default function MutedVideoPreview() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    // Disable all text tracks (subtitles/captions)
    const disableTracks = () => {
      for (let i = 0; i < v.textTracks.length; i++) {
        v.textTracks[i].mode = "disabled";
      }
    };

    if (v.canPlayType("application/vnd.apple.mpegurl")) {
      v.src = VIDEO_HLS_URL;
      v.muted = true;
      disableTracks();
      v.play().catch(() => {});
    } else {
      import("hls.js").then(({ default: Hls }) => {
        if (!Hls.isSupported()) return;
        const hls = new Hls({ startLevel: 0, enableWebVTT: false, enableCEA708Captions: false });
        hls.loadSource(VIDEO_HLS_URL);
        hls.attachMedia(v);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          v.muted = true;
          disableTracks();
          v.play().catch(() => {});
        });
        hls.on(Hls.Events.SUBTITLE_TRACKS_UPDATED, disableTracks);
      });
    }

    v.addEventListener("loadedmetadata", disableTracks);
    return () => v.removeEventListener("loadedmetadata", disableTracks);
  }, []);

  return (
    <video
      ref={videoRef}
      poster={VIDEO_POSTER}
      muted
      autoPlay
      playsInline
      loop
      className="w-full aspect-video object-cover"
    />
  );
}
