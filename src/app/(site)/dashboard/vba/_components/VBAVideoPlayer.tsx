"use client";

import { useRef } from "react";
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

  return (
    <div className="mb-6">
      <iframe
        ref={iframeRef}
        src={`https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}?autoplay=false&loop=false&muted=false&preload=true&responsive=true&captions=fr`}
        allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture"
        allowFullScreen
        className="w-full aspect-video rounded-xl border border-slate-200"
      />
      <VBAChapters chapters={chapters} iframeRef={iframeRef} />
    </div>
  );
}
