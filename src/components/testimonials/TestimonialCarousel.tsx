"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import type { Testimonial } from "@/lib/sanity/types";

interface TestimonialCarouselProps {
  testimonials: Testimonial[];
}

export default function TestimonialCarousel({ testimonials }: TestimonialCarouselProps) {
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const carouselRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();

  // Dupliquer les témoignages pour créer un effet infini
  const duplicatedTestimonials = [...testimonials, ...testimonials];

  useEffect(() => {
    const carousel = carouselRef.current;
    if (!carousel || testimonials.length === 0) return;

    let scrollPosition = 0;
    const scrollSpeed = 0.2; // pixels par frame

    const animate = () => {
      scrollPosition += scrollSpeed;
      
      // Reset à la moitié du scroll total pour boucle infinie
      if (scrollPosition >= carousel.scrollWidth / 2) {
        scrollPosition = 0;
      }
      
      carousel.scrollLeft = scrollPosition;
      animationRef.current = requestAnimationFrame(animate);
    };

    // Démarrer l'animation
    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [testimonials.length]);

  const toggleExpanded = (id: string) => {
    setExpandedCard(expandedCard === id ? null : id);
  };

  const truncateText = (text: string, maxLength: number = 120) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + "...";
  };

  if (testimonials.length === 0) {
    return <div className="text-center text-slate-400 py-8">Aucun témoignage à afficher</div>;
  }

  return (
    <div className="relative py-8">
      {/* Gradient pour effet de fade */}
      <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-bg-secondary to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-bg-secondary to-transparent z-10 pointer-events-none" />

      {/* Carrousel container */}
      <div
        ref={carouselRef}
        className="flex gap-6 overflow-x-hidden scrollbar-hide"
      >
        {duplicatedTestimonials.map((testimonial, index) => (
          <div
            key={`${testimonial._id}-${index}`}
            className="flex-shrink-0 w-80 bg-white rounded-2xl shadow-lg p-6 border border-slate-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
          >
            {/* Étoiles */}
            <div className="flex gap-0.5 mb-3">
              {Array.from({ length: testimonial.rating }).map((_, i) => (
                <span key={i} className="text-amber-400 text-lg">★</span>
              ))}
            </div>

            {/* Contenu du témoignage */}
            <div className="mb-4">
              <p className="text-slate-600 text-sm leading-relaxed">
                {expandedCard === testimonial._id ? (
                  <>
                    &ldquo;{testimonial.content}&rdquo;
                    <button
                      onClick={() => toggleExpanded(testimonial._id)}
                      className="text-blue-600 hover:text-blue-700 text-xs font-medium ml-2 underline"
                    >
                      Voir moins
                    </button>
                  </>
                ) : (
                  <>
                    &ldquo;{truncateText(testimonial.content)}&rdquo;
                    {testimonial.content.length > 120 && (
                      <button
                        onClick={() => toggleExpanded(testimonial._id)}
                        className="text-blue-600 hover:text-blue-700 text-xs font-medium ml-2 underline"
                      >
                        Voir plus
                      </button>
                    )}
                  </>
                )}
              </p>
            </div>

            {/* Infos de l'auteur */}
            <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
              {testimonial.photo?.url ? (
                <Image
                  src={testimonial.photo.url}
                  alt={testimonial.photo.alt || testimonial.name}
                  width={40}
                  height={40}
                  className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-sm font-semibold text-slate-500 flex-shrink-0">
                  {testimonial.name.charAt(0)}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-900 truncate">
                  {testimonial.name}
                </p>
                {testimonial.role && (
                  <p className="text-xs text-slate-400 truncate">
                    {testimonial.role}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* CSS pour cacher le scrollbar */}
      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
