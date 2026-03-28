"use client";

import { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import type { SanityImage } from "@/lib/sanity/types";

interface VanGalleryProps {
  images: SanityImage[];
  vanName: string;
}

const MAX_THUMBS = 6;

export default function VanGallery({ images, vanName }: VanGalleryProps) {
  const [active, setActive] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const openLightbox = useCallback((index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  }, []);

  const closeLightbox = useCallback(() => setLightboxOpen(false), []);

  const goNext = useCallback(() => {
    setLightboxIndex((prev) => (prev + 1) % images.length);
  }, [images.length]);

  const goPrev = useCallback(() => {
    setLightboxIndex((prev) => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  useEffect(() => {
    if (!lightboxOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    };
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [lightboxOpen, closeLightbox, goNext, goPrev]);

  if (!images || images.length === 0) return null;

  const thumbImages = images.slice(0, MAX_THUMBS);
  const hasMore = images.length > MAX_THUMBS;

  return (
    <>
      <div className="flex flex-col gap-3">
        {/* ── Image principale ── */}
        <button
          onClick={() => openLightbox(active)}
          className="relative w-full aspect-[16/9] md:aspect-[3/2] rounded-2xl overflow-hidden bg-slate-100 cursor-pointer group"
          aria-label="Agrandir la photo"
        >
          <Image
            src={images[active].url}
            alt={images[active].alt || vanName}
            fill
            className="object-cover transition-all duration-500"
            sizes="(max-width: 768px) 100vw, 75vw"
            priority
          />

          {/* Overlay hover */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors duration-300 flex items-end justify-end p-4">
            <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-white text-xs font-semibold bg-black/50 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
              </svg>
              Agrandir
            </span>
          </div>

          {/* Compteur */}
          <div className="absolute bottom-3 left-3 bg-black/50 backdrop-blur-sm text-white text-xs font-semibold px-2.5 py-1 rounded-full">
            {active + 1} / {images.length}
          </div>
        </button>

        {/* ── Thumbnails ── */}
        <div className={`grid gap-2 ${thumbImages.length <= 4 ? "grid-cols-4" : thumbImages.length === 5 ? "grid-cols-5" : "grid-cols-6"}`}>
          {thumbImages.map((img, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`relative aspect-[4/3] rounded-xl overflow-hidden border-2 transition-all duration-200 ${
                i === active
                  ? "border-[#4D5FEC] scale-[1.02] shadow-sm"
                  : "border-transparent opacity-55 hover:opacity-85 hover:scale-[1.01]"
              }`}
              aria-label={`Photo ${i + 1}`}
            >
              <Image
                src={img.url}
                alt={img.alt || `${vanName} ${i + 1}`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 16vw, 120px"
              />
              {/* Overlay "voir plus" sur la dernière thumbnail */}
              {hasMore && i === MAX_THUMBS - 1 && (
                <button
                  onClick={(e) => { e.stopPropagation(); openLightbox(MAX_THUMBS - 1); }}
                  className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center text-white text-xs font-bold"
                >
                  +{images.length - MAX_THUMBS}
                </button>
              )}
            </button>
          ))}
        </div>

        {/* ── Bouton voir toutes les photos ── */}
        <button
          onClick={() => openLightbox(0)}
          className="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-slate-700 transition-colors self-start"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Voir les {images.length} photos
        </button>
      </div>

      {/* ── Mobile scroll (backup pour très petits écrans) ── */}
      <div className="hidden">
        <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => openLightbox(i)}
              className="relative flex-shrink-0 w-[85vw] aspect-[4/3] rounded-2xl overflow-hidden snap-center"
            >
              <Image src={img.url} alt={img.alt || `${vanName} - photo ${i + 1}`} fill className="object-cover" sizes="85vw" priority={i === 0} />
            </button>
          ))}
        </div>
      </div>

      {/* ── Lightbox ── */}
      {lightboxOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center" onClick={closeLightbox}>
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
          <div className="relative z-10 max-w-5xl w-full mx-4" onClick={(e) => e.stopPropagation()}>
            {/* Fermer */}
            <button
              onClick={closeLightbox}
              className="absolute -top-12 right-0 text-white/80 hover:text-white text-sm font-medium flex items-center gap-1.5 transition-colors"
              aria-label="Fermer la galerie"
            >
              Fermer
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Image */}
            <div className="relative aspect-[16/10] rounded-2xl overflow-hidden bg-slate-900">
              <Image
                src={images[lightboxIndex].url}
                alt={images[lightboxIndex].alt || `${vanName} - photo ${lightboxIndex + 1}`}
                fill
                className="object-contain"
                sizes="90vw"
              />
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-4">
              <button
                onClick={goPrev}
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm flex items-center justify-center text-white transition-colors"
                aria-label="Photo précédente"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <span className="text-white/70 text-sm font-medium tabular-nums">
                {lightboxIndex + 1} / {images.length}
              </span>
              <button
                onClick={goNext}
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm flex items-center justify-center text-white transition-colors"
                aria-label="Photo suivante"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Thumbnail strip dans lightbox */}
            {images.length > 1 && (
              <div className="flex gap-2 mt-4 overflow-x-auto pb-1">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setLightboxIndex(i)}
                    className={`relative flex-shrink-0 w-16 h-11 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                      i === lightboxIndex ? "border-white" : "border-white/20 opacity-50 hover:opacity-80"
                    }`}
                  >
                    <Image src={img.url} alt={`${vanName} — photo ${i + 1}`} fill className="object-cover" sizes="64px" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
