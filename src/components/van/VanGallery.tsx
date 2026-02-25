"use client";

import { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import type { SanityImage } from "@/lib/sanity/types";

interface VanGalleryProps {
  images: SanityImage[];
  vanName: string;
}

export default function VanGallery({ images, vanName }: VanGalleryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const openLightbox = useCallback((index: number) => {
    setCurrentIndex(index);
    setLightboxOpen(true);
  }, []);

  const closeLightbox = useCallback(() => setLightboxOpen(false), []);

  const goNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  }, [images.length]);

  const goPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  // Fermeture ESC + navigation clavier
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

  const mainImage = images[0];
  const sideImages = images.slice(1, 3);

  return (
    <>
      {/* ── Grille desktop : 1 grande + 2 petites ── */}
      <div className="hidden md:grid md:grid-cols-3 gap-3 rounded-2xl overflow-hidden">
        {/* Grande image gauche (2/3) */}
        <button
          onClick={() => openLightbox(0)}
          className="relative col-span-2 aspect-[16/10] overflow-hidden cursor-pointer group"
        >
          <Image
            src={mainImage.url}
            alt={mainImage.alt || vanName}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="66vw"
            priority
          />
        </button>

        {/* 2 images droite (1/3) */}
        <div className="flex flex-col gap-3">
          {sideImages.map((img, i) => (
            <button
              key={i}
              onClick={() => openLightbox(i + 1)}
              className="relative flex-1 overflow-hidden cursor-pointer group"
            >
              <Image
                src={img.url}
                alt={img.alt || `${vanName} - photo ${i + 2}`}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="33vw"
              />
            </button>
          ))}
          {/* Bouton "Voir toutes les photos" */}
          {images.length > 3 && (
            <button
              onClick={() => openLightbox(0)}
              className="absolute bottom-4 right-4 badge-glass !bg-white/95 shadow-md !text-slate-700 !px-4 !py-2 text-sm font-medium z-10"
            >
              Voir les {images.length} photos
            </button>
          )}
        </div>
      </div>

      {/* ── Scroll horizontal mobile ── */}
      <div className="md:hidden flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 -mx-4 px-4">
        {images.map((img, i) => (
          <button
            key={i}
            onClick={() => openLightbox(i)}
            className="relative flex-shrink-0 w-[85vw] aspect-[4/3] rounded-2xl overflow-hidden snap-center"
          >
            <Image
              src={img.url}
              alt={img.alt || `${vanName} - photo ${i + 1}`}
              fill
              className="object-cover"
              sizes="85vw"
              priority={i === 0}
            />
          </button>
        ))}
      </div>

      {/* ── Lightbox ── */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center"
          onClick={closeLightbox}
        >
          {/* Overlay */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          {/* Contenu */}
          <div
            className="relative z-10 max-w-5xl w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Fermer */}
            <button
              onClick={closeLightbox}
              className="absolute -top-12 right-0 text-white/80 hover:text-white text-sm font-medium flex items-center gap-1"
              aria-label="Fermer la galerie"
            >
              Fermer ✕
            </button>

            {/* Image */}
            <div className="relative aspect-[16/10] rounded-2xl overflow-hidden bg-white/10">
              <Image
                src={images[currentIndex].url}
                alt={images[currentIndex].alt || `${vanName} - photo ${currentIndex + 1}`}
                fill
                className="object-contain"
                sizes="90vw"
              />
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-4">
              <button
                onClick={goPrev}
                className="glass-card !rounded-full w-10 h-10 flex items-center justify-center text-slate-700 hover:bg-white/90"
                aria-label="Photo précédente"
              >
                ←
              </button>
              <span className="text-white/80 text-sm font-medium">
                {currentIndex + 1} / {images.length}
              </span>
              <button
                onClick={goNext}
                className="glass-card !rounded-full w-10 h-10 flex items-center justify-center text-slate-700 hover:bg-white/90"
                aria-label="Photo suivante"
              >
                →
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
