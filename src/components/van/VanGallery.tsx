"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Image from "next/image";
import type { SanityImage } from "@/lib/sanity/types";

interface VanGalleryProps {
  images: SanityImage[];
  vanName: string;
}

export default function VanGallery({ images, vanName }: VanGalleryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [mobileActive, setMobileActive] = useState(0);
  const [desktopActive, setDesktopActive] = useState(0);
  const thumbsRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);

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

  // Swipe handlers mobile
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(delta) < 40) return;
    setMobileActive((prev) => {
      if (delta < 0) return Math.min(prev + 1, images.length - 1);
      return Math.max(prev - 1, 0);
    });
  }, [images.length]);

  // Auto-scroll thumbnail strip to keep active thumb visible
  useEffect(() => {
    const el = thumbsRef.current?.children[mobileActive] as HTMLElement | undefined;
    el?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [mobileActive]);

  if (!images || images.length === 0) return null;

  const img1 = images[1 % images.length];
  const img2 = images[2 % images.length];

  return (
    <>
      {/* ── Desktop : grande image à gauche + 2 empilées à droite ─── */}
      <div className="hidden lg:grid grid-cols-[63fr_37fr] gap-3 rounded-3xl overflow-hidden h-[500px]">
        {/* Image principale */}
        <button
          onClick={() => openLightbox(desktopActive)}
          className="relative overflow-hidden group"
          aria-label="Voir toutes les photos"
        >
          <Image
            src={images[desktopActive].url}
            alt={images[desktopActive].alt || vanName}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
            sizes="63vw"
            priority
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
          {/* Compteur */}
          <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
            </svg>
            Agrandir
          </div>
        </button>

        {/* Colonne droite : 2 images empilées */}
        <div className="flex flex-col gap-3">
          <button
            onClick={() => openLightbox(1 % images.length)}
            className="relative flex-1 overflow-hidden group"
            aria-label="Photo 2"
          >
            <Image
              src={img1.url}
              alt={img1.alt || `${vanName} 2`}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
              sizes="37vw"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
          </button>

          <button
            onClick={() => openLightbox(2 % images.length)}
            className="relative flex-1 overflow-hidden group"
            aria-label="Voir toutes les photos"
          >
            <Image
              src={img2.url}
              alt={img2.alt || `${vanName} 3`}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
              sizes="37vw"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />

            {/* Overlay "voir toutes" sur la dernière tuile */}
            {images.length > 3 && (
              <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <span className="text-white text-sm font-bold flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  +{images.length - 3} photos
                </span>
              </div>
            )}
          </button>
        </div>

        {/* Bouton "voir toutes les photos" — coin bas droit du grid */}
      </div>

      {/* Thumbnails sous le grid desktop */}
      {images.length > 3 && (
        <div className="hidden lg:flex gap-2 mt-3 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setDesktopActive(i)}
              className={`relative flex-shrink-0 w-20 h-14 rounded-xl overflow-hidden border-2 transition-all duration-200 ${
                i === desktopActive
                  ? "border-[#4D5FEC] opacity-100 scale-[1.03]"
                  : "border-transparent opacity-60 hover:opacity-100 hover:scale-[1.03]"
              }`}
              aria-label={`Photo ${i + 1}`}
            >
              <Image src={img.url} alt={img.alt || `${vanName} ${i + 1}`} fill className="object-cover" sizes="80px" />
            </button>
          ))}
        </div>
      )}

      {/* ── Mobile : image principale swipable + thumbnails ─────── */}
      <div className="lg:hidden flex flex-col gap-3">
        {/* Image principale — swipable, pas de lightbox au tap */}
        <div
          className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-slate-100 select-none"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <Image
            src={images[mobileActive].url}
            alt={images[mobileActive].alt || vanName}
            fill
            className="object-cover transition-opacity duration-300"
            sizes="100vw"
            priority={mobileActive === 0}
          />
          {/* Compteur */}
          <div className="absolute bottom-3 left-3 bg-black/50 backdrop-blur-sm text-white text-xs font-semibold px-2.5 py-1 rounded-full pointer-events-none">
            {mobileActive + 1} / {images.length}
          </div>
          {/* Flèches discrètes */}
          {mobileActive > 0 && (
            <button
              onClick={() => setMobileActive((p) => p - 1)}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white"
              aria-label="Photo précédente"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          {mobileActive < images.length - 1 && (
            <button
              onClick={() => setMobileActive((p) => p + 1)}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white"
              aria-label="Photo suivante"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </div>

        {/* Thumbnails — toutes les images, scroll horizontal */}
        {/* outer div gère overflow-x, inner div a du padding pour que le zoom ne soit pas coupé */}
        <div
          className="overflow-x-auto"
          style={{ scrollbarWidth: "none" }}
        >
          <div
            ref={thumbsRef}
            className="flex gap-2 px-1 pt-2 pb-2"
          >
            {images.map((img, i) => {
              const isActive = i === mobileActive;
              return (
                <div key={i} className="relative flex-shrink-0 flex flex-col items-center gap-1">
                  <button
                    onClick={() => setMobileActive(i)}
                    aria-label={`Photo ${i + 1}`}
                    className="relative rounded-xl overflow-hidden transition-all duration-200"
                    style={{
                      width: isActive ? "68px" : "58px",
                      height: isActive ? "51px" : "43px",
                      transform: isActive ? "scale(1.06)" : "scale(1)",
                      transformOrigin: "bottom center",
                    }}
                  >
                    <Image
                      src={img.url}
                      alt={img.alt || `${vanName} ${i + 1}`}
                      fill
                      className="object-cover"
                      sizes="68px"
                    />
                    {/* Overlay atténué sur les non-sélectionnées */}
                    {!isActive && (
                      <div className="absolute inset-0 bg-white/40" />
                    )}
                  </button>
                  {/* Indicateur actif : petit trait en dessous */}
                  <div
                    className="h-[3px] rounded-full transition-all duration-200"
                    style={{
                      width: isActive ? "28px" : "0px",
                      background: isActive ? "#4D5FEC" : "transparent",
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Lightbox ─────────────────────────────────────────────── */}
      {lightboxOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center" onClick={closeLightbox}>
          <div className="absolute inset-0 bg-black/85 backdrop-blur-sm" />
          <div className="relative z-10 max-w-5xl w-full mx-4" onClick={(e) => e.stopPropagation()}>
            {/* Fermer */}
            <button
              onClick={closeLightbox}
              className="absolute -top-12 right-0 text-white/80 hover:text-white text-sm font-medium flex items-center gap-1.5 transition-colors"
              aria-label="Fermer"
            >
              Fermer
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Image active */}
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

            {/* Strip thumbnails */}
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
