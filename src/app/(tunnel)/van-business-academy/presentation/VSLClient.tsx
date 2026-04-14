"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import LiquidButton from "@/components/ui/LiquidButton";
import GlassCard from "@/components/ui/GlassCard";
import { getFunnelData } from "@/lib/hooks/useUTMParams";
import { trackEvent } from "@/lib/meta-pixel";

// TODO: Remplacer par l'ID YouTube de la VSL quand elle sera prête
const YOUTUBE_VSL_ID = "PLACEHOLDER_VIDEO_ID";
const CTA_DELAY_SECONDS = 120;

export default function VSLClient() {
  const router = useRouter();
  const [firstname, setFirstname] = useState("");
  const [showCTA, setShowCTA] = useState(false);

  useEffect(() => {
    const data = getFunnelData();
    if (!data) {
      router.replace("/van-business-academy/inscription");
      return;
    }
    setFirstname(data.firstname);

    // Track step
    trackEvent("ViewContent", { content_name: "vba-vsl" });
    fetch("/api/van-business-academy/inscription/step", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: data.email, step: "vsl" }),
    }).catch(() => {});

    // Show CTA after delay
    const timer = setTimeout(() => setShowCTA(true), CTA_DELAY_SECONDS * 1000);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="max-w-3xl mx-auto px-4 pb-16">
      {/* Greeting */}
      {firstname && (
        <p className="text-center text-sm font-semibold mb-2" style={{ color: "#B9945F" }}>
          Bravo {firstname} !
        </p>
      )}

      {/* Title */}
      <h1
        className="font-display text-2xl sm:text-3xl text-center leading-tight mb-3"
        style={{ color: "#0F172A" }}
      >
        Regarde cette vidéo en entier
      </h1>

      {/* Instruction */}
      <div className="flex items-center justify-center gap-2 mb-8">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#B9945F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
        </svg>
        <p className="text-slate-500 text-sm">Active le son et regarde jusqu&apos;à la fin</p>
      </div>

      {/* Video embed */}
      <div className="relative w-full rounded-2xl overflow-hidden shadow-lg mb-10" style={{ paddingBottom: "56.25%" }}>
        <iframe
          className="absolute inset-0 w-full h-full"
          src={`https://www.youtube.com/embed/${YOUTUBE_VSL_ID}?rel=0&modestbranding=1`}
          title="Van Business Academy — Vidéo de présentation"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>

      {/* CTA (hidden then fade-in) */}
      <div
        className="text-center mb-16 transition-all duration-1000"
        style={{
          opacity: showCTA ? 1 : 0,
          pointerEvents: showCTA ? "auto" : "none",
          transform: showCTA ? "translateY(0)" : "translateY(8px)",
        }}
      >
        <LiquidButton variant="gold" size="lg" href="/van-business-academy/diagnostic-offert">
          Réserver mon appel stratégique gratuit →
        </LiquidButton>
        <p className="text-xs text-slate-400 mt-3">30 minutes &middot; Gratuit &middot; Sans engagement</p>
      </div>

      {/* Social proof — Avis Sylvain Trustpilot */}
      <div className="space-y-6">
        <div className="max-w-lg mx-auto">
          <GlassCard padding="p-6">
            {/* Trustpilot badge */}
            <div className="flex items-center gap-2 mb-3">
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <span key={i} className="text-amber-400 text-base">★</span>
                ))}
              </div>
              <span className="text-[11px] text-slate-400 font-medium">Trustpilot</span>
            </div>
            <p className="text-slate-600 text-sm leading-relaxed italic mb-4">
              &ldquo;Je tiens à remercier Jules pour sa formation dédiée à l&apos;aménagement de van.
              Avant, j&apos;étais un peu perdu. J&apos;avais regardé plusieurs vidéos sur Internet,
              mais rien n&apos;était vraiment structuré ni clair. Aujourd&apos;hui, je suis fier d&apos;avoir
              commencé mon propre aménagement. Le fait de créer son espace, de comprendre chaque détail
              et chaque choix, c&apos;est une fierté indescriptible.&rdquo;
            </p>
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                style={{ background: "linear-gradient(135deg, #B9945F, #8B6B3D)" }}
              >
                S
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">Sylvain Delonca</p>
                <p className="text-[11px] text-slate-400">Élève Van Business Academy</p>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Stats */}
        <div className="flex justify-center gap-8 pt-4">
          {[
            { value: "50+", label: "vidéos de formation" },
            { value: "9", label: "modules complets" },
            { value: "5-8k€", label: "revenus/an par van" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-2xl font-bold" style={{ color: "#B9945F" }}>{stat.value}</p>
              <p className="text-xs text-slate-400 mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
