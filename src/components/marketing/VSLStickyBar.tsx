"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { buildVslUrl, VSL_SHORT_TITLE } from "@/lib/constants/vsl";

interface VSLStickyBarProps {
  articleSlug: string;
}

export default function VSLStickyBar({ articleSlug }: VSLStickyBarProps) {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (dismissed) return;

    const handleScroll = () => {
      const scrollPercent =
        window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);
      setVisible(scrollPercent > 0.4);
    };

    // Hide when footer is visible
    const footer = document.querySelector("footer");
    let observer: IntersectionObserver | null = null;
    if (footer) {
      observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setVisible(false);
        },
        { threshold: 0.1 }
      );
      observer.observe(footer);
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      observer?.disconnect();
    };
  }, [dismissed]);

  if (dismissed) return null;

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-40 lg:hidden transition-transform duration-300 ${
        visible ? "translate-y-0" : "translate-y-full"
      }`}
    >
      <div
        className="flex items-center justify-between gap-3 px-4 py-3"
        style={{
          background: "rgba(15, 23, 42, 0.95)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="#E4D398" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
          <span className="text-xs text-white/80 truncate">
            {VSL_SHORT_TITLE}
          </span>
        </div>

        <Link
          href={buildVslUrl(4, articleSlug)}
          className="flex-shrink-0 px-4 py-2 rounded-full text-xs font-bold text-white transition-all"
          style={{
            background: "linear-gradient(135deg, #B9945F 0%, #E4D398 100%)",
          }}
        >
          Regarder
        </Link>

        <button
          onClick={() => setDismissed(true)}
          className="flex-shrink-0 text-white/40 hover:text-white/70 transition p-1"
          aria-label="Fermer"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
