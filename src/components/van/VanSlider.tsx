"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";

const VANS = [
  {
    id: "yoni",
    name: "Yoni",
    model: "Renault Trafic III",
    price: "à partir de 65 € / nuit",
    href: "https://www.yescapa.fr/campers/89215",
    images: [
      { src: "https://cdn.sanity.io/images/lewexa74/production/2e9214211ef5a235dcf2aa639d0feafcc867c88f-1080x750.png", alt: "van aménagé renault trafic III Yoni fermé Vanzon Explorer" },
      { src: "https://cdn.sanity.io/images/lewexa74/production/660105a28e577c33f642a8fdff528d88925642e3-1080x750.png", alt: "van aménagé renault trafic III Yoni ouvert Vanzon Explorer" },
      { src: "https://cdn.sanity.io/images/lewexa74/production/f93fa16ab46d8934dcc3092a8e86fc80ebce4305-1080x750.png", alt: "van aménagé renault trafic III Yoni océan Vanzon Explorer" },
    ],
    features: ["3 sièges", "2+1 couchages", "Cuisine coulissante", "Glacière portative", "Toilette sèche"],
  },
  {
    id: "xalbat",
    name: "Xalbat",
    model: "Renault Trafic III",
    price: "à partir de 65 € / nuit",
    href: "https://www.yescapa.fr/campers/98869",
    images: [
      { src: "https://cdn.sanity.io/images/lewexa74/production/e9664378c5fdc652c33ae7342dfc52cc4960c8bf-1080x750.png", alt: "van aménagé renault trafic III Xalbat fermé Vanzon Explorer" },
      { src: "https://cdn.sanity.io/images/lewexa74/production/e07cf63507850084bee14fca9a91b4efe5b7d18a-1080x750.png", alt: "van aménagé renault trafic III Xalbat ouvert Vanzon Explorer" },
      { src: "https://cdn.sanity.io/images/lewexa74/production/04d93973d30c5eede51f954d1432a50a5f82ef9b-1080x750.png", alt: "van aménagé renault trafic III Xalbat montagne Vanzon Explorer" },
    ],
    features: ["3 sièges", "2+1 couchages", "Cuisine coulissante", "Glacière portative", "Toilette sèche"],
  },
];

export default function VanSlider() {
  const [slides, setSlides] = useState<number[]>(VANS.map(() => 0));
  const [activeCard, setActiveCard] = useState(0);
  const sliderRef = useRef<HTMLDivElement>(null);

  // Auto-advance slides
  useEffect(() => {
    const id = setInterval(() => {
      setSlides((prev) => prev.map((s, i) => (s + 1) % VANS[i].images.length));
    }, 3000);
    return () => clearInterval(id);
  }, []);

  const centerCard = useCallback((index: number) => {
    const el = sliderRef.current;
    if (!el) return;
    const card = el.children[index] as HTMLElement;
    if (!card) return;
    el.scrollTo({ left: card.offsetLeft + card.offsetWidth / 2 - el.clientWidth / 2, behavior: "smooth" });
  }, []);

  const updateActive = useCallback(() => {
    const el = sliderRef.current;
    if (!el) return;
    const center = el.scrollLeft + el.clientWidth / 2;
    let best = 0;
    let bestDist = Infinity;
    Array.from(el.children).forEach((child, i) => {
      const c = child as HTMLElement;
      const dist = Math.abs(c.offsetLeft + c.offsetWidth / 2 - center);
      if (dist < bestDist) { bestDist = dist; best = i; }
    });
    setActiveCard(best);
  }, []);

  useEffect(() => {
    const el = sliderRef.current;
    if (!el) return;
    setTimeout(() => centerCard(0), 100);

    let t: NodeJS.Timeout;
    const onScroll = () => { clearTimeout(t); t = setTimeout(updateActive, 60); };

    let startX = 0;
    const onTouchStart = (e: TouchEvent) => { startX = e.touches[0].clientX; };
    const onTouchEnd = (e: TouchEvent) => {
      const diff = startX - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 50) {
        setActiveCard((prev) => {
          const next = diff > 0 ? Math.min(prev + 1, VANS.length - 1) : Math.max(prev - 1, 0);
          centerCard(next);
          return next;
        });
      } else {
        setTimeout(updateActive, 100);
      }
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchend", onTouchEnd);
    return () => {
      clearTimeout(t);
      el.removeEventListener("scroll", onScroll);
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchend", onTouchEnd);
    };
  }, [centerCard, updateActive]);

  return (
    <>
      <style jsx global>{`
        .vs-section {
          padding: 2rem 1rem;
          display: flex;
          justify-content: center;
        }
        .vs-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 320px));
          justify-content: center;
          gap: 2rem;
          max-width: 1080px;
          width: 100%;
        }
        .vs-card {
          background: #fff;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 3px 10px rgba(0,0,0,0.08);
          display: flex;
          flex-direction: column;
          transition: transform 0.3s, box-shadow 0.3s;
        }
        .vs-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.13);
        }
        .vs-slideshow {
          position: relative;
          width: 100%;
          aspect-ratio: 4/3;
          overflow: hidden;
          background: #f1f5f9;
        }
        .vs-slide {
          position: absolute;
          inset: 0;
          opacity: 0;
          transition: opacity 0.9s ease-in-out;
        }
        .vs-slide.active { opacity: 1; }
        .vs-dots {
          position: absolute;
          bottom: 10px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 6px;
          z-index: 2;
        }
        .vs-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: rgba(255,255,255,0.5);
          border: none;
          cursor: pointer;
          padding: 0;
          transition: background 0.2s, transform 0.2s;
        }
        .vs-dot.active {
          background: #fff;
          transform: scale(1.3);
        }
        .vs-body {
          padding: 1rem 1rem 1.2rem;
          display: flex;
          flex-direction: column;
          gap: 0.3rem;
          flex: 1;
        }
        .vs-name {
          font-size: 1.3rem;
          font-weight: 700;
          color: #111;
        }
        .vs-model {
          font-size: 0.9rem;
          color: #666;
          padding-bottom: 0.6rem;
          border-bottom: 1px solid #eee;
        }
        .vs-features {
          list-style: none;
          margin: 0.8rem 0 0;
          padding: 0;
          display: grid;
          gap: 0.45rem;
          font-size: 0.93rem;
          color: #444;
        }
        .vs-features li {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .vs-features li::before {
          content: '';
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #9CA3AF;
          flex-shrink: 0;
        }
        .vs-footer {
          margin-top: auto;
          padding-top: 0.8rem;
          border-top: 1px solid #eee;
          text-align: center;
        }
        .vs-price {
          font-size: 1rem;
          font-weight: 700;
          color: #111;
          margin-bottom: 0.5rem;
        }
        .vs-btn {
          display: inline-block;
          padding: 0.45rem 1rem;
          background: #f0f0f0;
          color: #333;
          font-weight: 600;
          font-size: 0.85rem;
          text-decoration: none;
          border-radius: 8px;
          border: 1px solid #ddd;
          transition: background 0.2s;
        }
        .vs-btn:hover { background: #e2e8f0; }

        @media (max-width: 768px) {
          .vs-section { padding: 1.5rem 0; }
          .vs-grid {
            display: flex;
            overflow-x: auto;
            scroll-snap-type: x mandatory;
            -webkit-overflow-scrolling: touch;
            gap: 1rem;
            padding: 1rem 0 1.5rem;
            scrollbar-width: none;
          }
          .vs-grid::-webkit-scrollbar { display: none; }
          .vs-grid::before,
          .vs-grid::after {
            content: '';
            flex: 0 0 calc(50vw - 150px);
          }
          .vs-card {
            flex: 0 0 300px;
            scroll-snap-align: center;
            scroll-snap-stop: always;
            opacity: 0.45;
          }
          .vs-card.active {
            opacity: 1;
            transform: scale(1.02);
            box-shadow: 0 8px 24px rgba(0,0,0,0.14);
          }
        }
      `}</style>

      <section className="vs-section">
        <div className="vs-grid" ref={sliderRef}>
          {VANS.map((van, vi) => (
            <div key={van.id} className={`vs-card${vi === activeCard ? " active" : ""}`}>
              {/* Slideshow */}
              <div className="vs-slideshow">
                {van.images.map((img, ii) => (
                  <div key={img.src} className={`vs-slide${ii === slides[vi] ? " active" : ""}`}>
                    <Image src={img.src} alt={img.alt} fill className="object-cover" unoptimized />
                  </div>
                ))}
                <div className="vs-dots">
                  {van.images.map((_, ii) => (
                    <button
                      key={ii}
                      className={`vs-dot${ii === slides[vi] ? " active" : ""}`}
                      onClick={() => setSlides((prev) => prev.map((s, i) => i === vi ? ii : s))}
                      aria-label={`Photo ${ii + 1}`}
                    />
                  ))}
                </div>
              </div>

              {/* Content */}
              <div className="vs-body">
                <div className="vs-name">{van.name}</div>
                <div className="vs-model">{van.model}</div>
                <ul className="vs-features">
                  {van.features.map((f) => <li key={f}>{f}</li>)}
                </ul>
                <div className="vs-footer">
                  <div className="vs-price">{van.price}</div>
                  <a href={van.href} target="_blank" rel="noopener noreferrer" className="vs-btn">
                    Plus d&apos;informations
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
