"use client";

import { useState } from "react";
import Link from "next/link";

interface MarketplaceVanCardProps {
  id: string;
  title: string;
  van_brand: string;
  van_model: string;
  location_city: string;
  price_per_day: number;
  sleeps: number;
  seats: number | null;
  photos: string[];
  href: string;
}

export default function MarketplaceVanCard({
  title,
  location_city,
  price_per_day,
  sleeps,
  seats,
  photos,
  href,
}: MarketplaceVanCardProps) {
  const [photoIndex, setPhotoIndex] = useState(0);

  const goNext = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setPhotoIndex((prev) => (prev + 1) % photos.length);
  };

  const goPrev = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };

  const voyageurs = seats ?? sleeps;

  return (
    <Link
      href={href}
      className="group rounded-2xl overflow-hidden border border-slate-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-white flex flex-col"
    >
      {/* Photo */}
      <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden flex-shrink-0">
        {photos.length > 0 ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photos[photoIndex]}
              alt={title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />

            {/* Flèche gauche */}
            {photos.length > 1 && photoIndex > 0 && (
              <button
                onClick={goPrev}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/90 backdrop-blur-sm shadow-md flex items-center justify-center text-slate-700 hover:bg-white transition-colors opacity-0 group-hover:opacity-100"
                aria-label="Photo précédente"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}

            {/* Flèche droite */}
            {photos.length > 1 && photoIndex < photos.length - 1 && (
              <button
                onClick={goNext}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/90 backdrop-blur-sm shadow-md flex items-center justify-center text-slate-700 hover:bg-white transition-colors opacity-0 group-hover:opacity-100"
                aria-label="Photo suivante"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}

            {/* Indicateurs */}
            {photos.length > 1 && (
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                {photos.slice(0, 5).map((_, i) => (
                  <span
                    key={i}
                    className={`block rounded-full transition-all duration-200 ${
                      i === photoIndex
                        ? "w-4 h-1.5 bg-white"
                        : "w-1.5 h-1.5 bg-white/60"
                    }`}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-300 text-5xl">🚐</div>
        )}
      </div>

      {/* Infos */}
      <div className="p-4 flex flex-col gap-2">
        <h3 className="font-bold text-slate-900 text-sm line-clamp-1">{title}</h3>

        {/* Localisation */}
        <p className="flex items-center gap-1.5 text-slate-400 text-xs">
          {/* Pin filled */}
          <svg className="w-3.5 h-3.5 flex-shrink-0 text-slate-400" viewBox="0 0 24 24" fill="currentColor">
            <path fillRule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-2.079 3.218-4.396 3.218-6.327a8.5 8.5 0 10-17 0c0 1.93 1.274 4.248 3.218 6.327a19.58 19.58 0 002.856 2.874l.087.066.013.01zm0 0zM12 13.5a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
          </svg>
          {location_city.trim()}
        </p>

        {/* Prix + voyageurs */}
        <div className="flex items-center justify-between mt-1">
          <div className="flex items-baseline gap-0.5">
            <span className="text-xl font-black text-slate-900">{price_per_day}€</span>
            <span className="text-slate-400 text-xs">/jour</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-slate-500 bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-lg">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
            </svg>
            {voyageurs} voyageur{voyageurs > 1 ? "s" : ""}
          </div>
        </div>
      </div>
    </Link>
  );
}
