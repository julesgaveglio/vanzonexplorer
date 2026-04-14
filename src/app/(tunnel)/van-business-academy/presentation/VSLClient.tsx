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
        Regardez cette vidéo en entier
      </h1>

      {/* Instruction */}
      <div className="flex items-center justify-center gap-2 mb-8">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#B9945F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
        </svg>
        <p className="text-slate-500 text-sm">Activez le son et regardez jusqu&apos;à la fin</p>
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

      {/* Social proof */}
      <div className="space-y-6">
        <h2 className="font-display text-xl text-center mb-6" style={{ color: "#0F172A" }}>
          Ils ont lancé leur business de van
        </h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <GlassCard padding="p-5">
            <div className="flex gap-0.5 mb-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <span key={i} className="text-amber-400 text-sm">★</span>
              ))}
            </div>
            <p className="text-slate-600 text-sm leading-relaxed italic mb-3">
              &ldquo;Grâce à la formation, j&apos;ai pu aménager mon van et le mettre en location.
              En 3 mois, j&apos;avais déjà rentabilisé mon investissement initial.&rdquo;
            </p>
            <div className="flex items-center gap-2">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
                style={{ background: "linear-gradient(135deg, #B9945F, #8B6B3D)" }}
              >
                S
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-800">Sylvain D.</p>
                <p className="text-[11px] text-slate-400">Élève VBA</p>
              </div>
            </div>
          </GlassCard>

          <GlassCard padding="p-5">
            <div className="flex gap-0.5 mb-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <span key={i} className="text-amber-400 text-sm">★</span>
              ))}
            </div>
            <p className="text-slate-600 text-sm leading-relaxed italic mb-3">
              &ldquo;Je ne connaissais rien à la mécanique. La formation m&apos;a guidé étape par étape,
              du choix du véhicule jusqu&apos;à la mise en location.&rdquo;
            </p>
            <div className="flex items-center gap-2">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
                style={{ background: "linear-gradient(135deg, #3B82F6, #0EA5E9)" }}
              >
                M
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-800">Maxime R.</p>
                <p className="text-[11px] text-slate-400">Élève VBA</p>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Stats */}
        <div className="flex justify-center gap-8 pt-4">
          {[
            { value: "50+", label: "vidéos de formation" },
            { value: "9", label: "modules complets" },
            { value: "5-9k€", label: "revenus/an par van" },
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
