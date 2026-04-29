"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Clock } from "lucide-react";

interface Chapter {
  title: string;
  time: number;
}

interface VBAChaptersProps {
  chapters: Chapter[];
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function VBAChapters({ chapters, iframeRef }: VBAChaptersProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Listen to Bunny player time updates to highlight active chapter
  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      // Bunny.net may send data as string or object
      let msg = event.data;
      if (typeof msg === "string") {
        try { msg = JSON.parse(msg); } catch { return; }
      }
      if (msg?.event === "timeupdate" && typeof msg.data === "number") {
        const currentTime = msg.data;
        let idx = 0;
        for (let i = chapters.length - 1; i >= 0; i--) {
          if (currentTime >= chapters[i].time) {
            idx = i;
            break;
          }
        }
        setActiveIndex(idx);
      }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [chapters]);

  const seekTo = useCallback(
    (time: number, index: number) => {
      if (!iframeRef.current?.contentWindow) return;
      // Bunny.net player expects stringified JSON for postMessage commands
      iframeRef.current.contentWindow.postMessage(
        JSON.stringify({ event: "seek", data: time }),
        "*"
      );
      // Also send play command to resume after seeking
      setTimeout(() => {
        iframeRef.current?.contentWindow?.postMessage(
          JSON.stringify({ event: "play" }),
          "*"
        );
      }, 100);
      setActiveIndex(index);
    },
    [iframeRef]
  );

  if (chapters.length === 0) return null;

  return (
    <div className="mt-3">
      <div className="flex items-center gap-2 mb-2">
        <Clock className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Chapitres
        </span>
      </div>
      <div ref={scrollRef} className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {chapters.map((chapter, i) => (
          <button
            key={i}
            onClick={() => seekTo(chapter.time, i)}
            className={`flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all ${
              i === activeIndex
                ? "text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
            style={i === activeIndex ? { background: "linear-gradient(135deg, #B9945F 0%, #E4D398 100%)" } : undefined}
          >
            <span className="text-xs font-mono opacity-70">
              {formatTime(chapter.time)}
            </span>
            <span className="font-medium">{chapter.title}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
