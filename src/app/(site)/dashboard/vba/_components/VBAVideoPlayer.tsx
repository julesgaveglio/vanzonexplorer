"use client";

import { useRef, useState, useEffect } from "react";
import VBAChapters from "./VBAChapters";

interface Chapter {
  title: string;
  time: number;
}

interface VBAVideoPlayerProps {
  libraryId: string;
  videoId: string;
  chapters: Chapter[];
}

export default function VBAVideoPlayer({
  libraryId,
  videoId,
  chapters,
}: VBAVideoPlayerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Keep captions to 1-2 lines max
  const captionSize = isMobile ? 12 : 16;

  return (
    <div className="mb-4 sm:mb-6">
      <iframe
        ref={iframeRef}
        src={`https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}?autoplay=false&loop=false&muted=false&preload=true&responsive=true&captions=fr&captionsFontSize=${captionSize}`}
        allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture"
        allowFullScreen
        className="w-full aspect-video rounded-xl border border-slate-200"
      />
      <VBAChapters chapters={chapters} iframeRef={iframeRef} />
    </div>
  );
}
