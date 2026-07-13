"use client";

import Image from "next/image";

const VIDEO_POSTER = "/images/vsl2-thumbnail.png";

export default function VideoThumb() {
  const handleClick = () => {
    const card = document.getElementById("optin-form-card");
    if (card) {
      card.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <button
      onClick={handleClick}
      className="relative w-full block rounded-2xl overflow-hidden group cursor-pointer"
      style={{ aspectRatio: "16/9" }}
      aria-label="Voir la vidéo gratuite"
    >
      <Image
        src={VIDEO_POSTER}
        alt="Aperçu vidéo Van Business Academy"
        fill
        unoptimized
        className="object-cover"
        priority
      />

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors" />

      {/* Play button */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className="w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform opacity-70"
          style={{
            background: "linear-gradient(135deg, var(--gold) 0%, var(--gold-light) 100%)",
          }}
        >
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="#fff"
            className="ml-1"
          >
            <polygon points="6,3 20,12 6,21" />
          </svg>
        </div>
      </div>
    </button>
  );
}
