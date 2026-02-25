"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { imagePresets } from "@/lib/sanity/client";

interface HeroImage {
  url: string;
  alt: string;
  title?: string;
  metadata?: {
    dimensions?: {
      width: number;
      height: number;
    };
  };
}

interface HeroCarouselProps {
  images: HeroImage[];
  interval?: number;
  className?: string;
}

export default function HeroCarousel({ 
  images, 
  interval = 6000, 
  className = "" 
}: HeroCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [nextIndex, setNextIndex] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    if (images.length <= 1) return;

    const timer = setInterval(() => {
      setIsTransitioning(true);
      
      setTimeout(() => {
        setCurrentIndex(nextIndex);
        setNextIndex((prev) => (prev + 1) % images.length);
        setIsTransitioning(false);
      }, 2000);
    }, interval);

    return () => clearInterval(timer);
  }, [images.length, interval, nextIndex]);

  if (!images || images.length === 0) {
    return (
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900 to-slate-900" />
    );
  }

  if (images.length === 1) {
    return (
      <div className="absolute inset-0">
        <Image
          src={imagePresets.hero(images[0].url)}
          alt={images[0].alt || "Vanzon Explorer - Location de vans"}
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/40 to-slate-900/60" />
      </div>
    );
  }

  return (
    <div className={`absolute inset-0 overflow-hidden ${className}`}>
      {/* Container pour les images */}
      <div className="relative w-full h-full">
        {/* Image actuelle */}
        <div 
          className={`absolute inset-0 transition-opacity duration-2000 ease-in-out ${
            isTransitioning ? 'opacity-0' : 'opacity-100'
          }`}
        >
          <Image
            src={imagePresets.hero(images[currentIndex].url)}
            alt={images[currentIndex].alt || `Image ${currentIndex + 1} - Vanzon Explorer`}
            fill
            className="object-cover"
            priority={currentIndex === 0}
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/40 to-slate-900/60" />
        </div>

        {/* Image suivante (préchargée) */}
        {images.length > 1 && (
          <div 
            className={`absolute inset-0 transition-opacity duration-2000 ease-in-out ${
              isTransitioning ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <Image
              src={imagePresets.hero(images[nextIndex].url)}
              alt={`Image suivante - Vanzon Explorer`}
              fill
              className="object-cover"
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-blue-900/40 to-slate-900/60" />
          </div>
        )}
      </div>

      {/* Indicateurs de progression */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20">
        <div className="flex space-x-2">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                if (!isTransitioning) {
                  setCurrentIndex(index);
                  setNextIndex((index + 1) % images.length);
                }
              }}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === currentIndex
                  ? 'bg-white w-8'
                  : 'bg-white/50 hover:bg-white/70'
              }`}
              aria-label={`Aller à l'image ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
