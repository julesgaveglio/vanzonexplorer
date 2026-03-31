"use client";

import { useEffect, useState } from "react";
import { MeshGradient } from "@paper-design/shaders-react";

const COLORS = ["#72b9bb", "#b5d9d9", "#ffd1bd", "#ffebe0", "#8cc5b8", "#dbf4a4"];

const FEATURES = [
  { icon: "✨", label: "Généré par IA" },
  { icon: "📍", label: "Toute la France" },
  { icon: "⚡", label: "En 60 secondes" },
  { icon: "🎁", label: "100% gratuit" },
];

export default function RoadTripHero() {
  const [dimensions, setDimensions] = useState({ width: 1920, height: 1080 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const update = () =>
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  function scrollToWizard() {
    document.getElementById("wizard")?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <section className="relative w-full min-h-screen overflow-hidden flex items-center justify-center">
      {/* Gradient animé plein écran */}
      <div className="fixed inset-0 w-screen h-screen -z-10">
        {mounted && (
          <>
            <MeshGradient
              width={dimensions.width}
              height={dimensions.height}
              colors={COLORS}
              distortion={0.8}
              swirl={0.6}
              grainMixer={0}
              grainOverlay={0}
              speed={0.42}
              offsetX={0.08}
            />
            {/* Voile léger pour lisibilité texte */}
            <div className="absolute inset-0 bg-white/20 pointer-events-none" />
          </>
        )}
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 w-full py-32 md:py-40">
        <div className="text-center">
          {/* Badge IA */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8 text-sm font-medium bg-white/50 backdrop-blur-sm border border-white/60 text-slate-700 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse inline-block" />
            Propulsé par l&apos;intelligence artificielle
          </div>

          {/* Titre */}
          <h1
            className="font-bold text-slate-900 text-balance text-5xl sm:text-6xl md:text-7xl xl:text-[80px] leading-tight mb-6"
            style={{ fontFamily: "var(--font-bebas-neue, 'Bebas Neue', sans-serif)", letterSpacing: "0.01em" }}
          >
            Ton road trip van
            <br />
            <span
              style={{
                background: "linear-gradient(135deg, #0d9488 0%, #0ea5e9 50%, #B9945F 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              ultra-personnalisé
            </span>
            <br />
            partout en France
          </h1>

          {/* Accroche */}
          <p className="text-lg sm:text-xl text-slate-700 max-w-2xl mx-auto leading-relaxed mb-10 px-4">
            Dis-nous où tu veux aller — l&apos;IA génère ton itinéraire jour par jour.
            Spots secrets, campings, conseils van.{" "}
            <span className="font-semibold text-slate-900">Reçu par email en 60 secondes.</span>
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap justify-center gap-3 mb-12">
            {FEATURES.map((f) => (
              <span
                key={f.label}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-white/60 backdrop-blur-sm text-slate-700 border border-white/70 shadow-sm"
              >
                {f.icon} {f.label}
              </span>
            ))}
          </div>

          {/* CTA */}
          <button
            onClick={scrollToWizard}
            className="px-8 py-4 sm:px-10 sm:py-5 rounded-full text-sm sm:text-base font-semibold text-white transition-all hover:scale-[1.03] active:scale-[0.97] shadow-xl"
            style={{
              background: "rgba(15, 23, 42, 0.88)",
              border: "1.5px solid rgba(255,255,255,0.2)",
              backdropFilter: "blur(8px)",
              boxShadow: "0 8px 32px rgba(15,23,42,0.25), 0 1px 0 rgba(255,255,255,0.1) inset",
            }}
          >
            Créer mon Road Trip Gratuit →
          </button>

          {/* Scroll hint */}
          <div className="mt-12 flex flex-col items-center gap-2 opacity-50">
            <span className="text-xs text-slate-600 font-medium tracking-wide uppercase">Défiler</span>
            <div className="w-px h-8 bg-slate-400 animate-pulse" />
          </div>
        </div>
      </div>
    </section>
  );
}
