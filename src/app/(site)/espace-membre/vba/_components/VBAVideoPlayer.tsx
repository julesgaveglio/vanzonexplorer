"use client";

import { useRef } from "react";

interface VBAVideoPlayerProps {
  libraryId: string;
  videoId: string;
}

export default function VBAVideoPlayer({
  libraryId,
  videoId,
}: VBAVideoPlayerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  return (
    <div className="mb-4 sm:mb-6">
      <iframe
        ref={iframeRef}
        src={`https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}?autoplay=false&loop=false&muted=false&preload=true&responsive=true&playerColor=%23B9945F`}
        allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture"
        allowFullScreen
        className="w-full aspect-video rounded-xl border border-slate-200"
      />
    </div>
  );
}
