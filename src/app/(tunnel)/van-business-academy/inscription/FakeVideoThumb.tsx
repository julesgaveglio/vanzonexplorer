"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

const THUMBS = [
  "https://cdn.sanity.io/images/lewexa74/production/f1762567ba424110250e3562fa24c548cef9ecbb-1915x1069.png",
  "https://cdn.sanity.io/images/lewexa74/production/caea4e7e4de49d405a74e0bcccafb57b095b46e2-1901x1059.png",
];

export default function FakeVideoThumb() {
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIdx((prev) => (prev === 0 ? 1 : 0));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleClick = () => {
    const form = document.getElementById("optin-form");
    if (form) {
      form.scrollIntoView({ behavior: "smooth", block: "center" });
      const firstInput = form.querySelector("input");
      if (firstInput) setTimeout(() => firstInput.focus(), 500);
    }
  };

  return (
    <button
      onClick={handleClick}
      className="relative w-full max-w-md mx-auto block rounded-2xl overflow-hidden shadow-lg mb-6 group cursor-pointer"
      style={{ aspectRatio: "16/9" }}
      aria-label="Voir la vidéo gratuite"
    >
      {/* Images with crossfade */}
      {THUMBS.map((src, i) => (
        <Image
          key={i}
          src={src}
          alt="Aperçu vidéo Van Business Academy"
          fill
          unoptimized
          className="object-cover transition-opacity duration-1000"
          style={{ opacity: activeIdx === i ? 1 : 0 }}
          priority={i === 0}
        />
      ))}

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors" />

      {/* Play button */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white/90 flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="#0F172A"
            className="ml-1"
          >
            <polygon points="6,3 20,12 6,21" />
          </svg>
        </div>
      </div>
    </button>
  );
}
