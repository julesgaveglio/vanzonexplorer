"use client";

import { useState } from "react";

interface Props {
  photos: string[];
  title: string;
}

export default function MarketplaceVanGallery({ photos, title }: Props) {
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState(false);

  if (!photos.length) {
    return (
      <div className="w-full aspect-[16/7] rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 text-6xl">
        🚐
      </div>
    );
  }

  return (
    <>
      {/* Grid galerie */}
      <div className="grid grid-cols-4 grid-rows-2 gap-2 rounded-2xl overflow-hidden h-[420px]">
        {/* Image principale */}
        <div
          className="col-span-3 row-span-2 relative cursor-pointer group"
          onClick={() => setLightbox(true)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photos[active]}
            alt={title}
            className="w-full h-full object-cover group-hover:brightness-95 transition-all"
          />
          {photos.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); setLightbox(true); }}
              className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm text-slate-700 text-xs font-semibold px-3 py-1.5 rounded-xl shadow-sm hover:bg-white transition-colors"
            >
              Voir les {photos.length} photos
            </button>
          )}
        </div>

        {/* Thumbnails droite (max 4) */}
        {photos.slice(1, 5).map((url, i) => (
          <div
            key={i}
            className={`relative cursor-pointer overflow-hidden ${i === active - 1 ? "ring-2 ring-blue-500" : ""}`}
            onClick={() => setActive(i + 1)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt={`${title} — photo ${i + 2}`}
              className="w-full h-full object-cover hover:brightness-90 transition-all"
            />
            {i === 3 && photos.length > 5 && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <span className="text-white font-bold text-lg">+{photos.length - 5}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={() => setLightbox(false)}
        >
          <button
            className="absolute top-4 right-4 text-white/70 hover:text-white text-3xl font-light"
            onClick={() => setLightbox(false)}
          >
            ✕
          </button>
          <button
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white text-4xl font-light"
            onClick={(e) => { e.stopPropagation(); setActive((prev) => (prev - 1 + photos.length) % photos.length); }}
          >
            ‹
          </button>
          <button
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white text-4xl font-light"
            onClick={(e) => { e.stopPropagation(); setActive((prev) => (prev + 1) % photos.length); }}
          >
            ›
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photos[active]}
            alt={title}
            className="max-h-[90vh] max-w-[90vw] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/60 text-sm">
            {active + 1} / {photos.length}
          </div>
        </div>
      )}
    </>
  );
}
