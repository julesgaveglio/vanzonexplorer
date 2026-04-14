"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import GlassCard from "@/components/ui/GlassCard";
import LiquidButton from "@/components/ui/LiquidButton";
import { getFunnelData } from "@/lib/hooks/useUTMParams";
import { trackEvent } from "@/lib/meta-pixel";

export default function ConfirmationClient() {
  const router = useRouter();
  const [firstname, setFirstname] = useState("");

  useEffect(() => {
    const data = getFunnelData();
    if (!data) {
      router.replace("/van-business-academy/inscription");
      return;
    }
    setFirstname(data.firstname);

    // Track pixel (may already have fired from booking page postMessage,
    // but safe to fire again — Meta deduplicates)
    trackEvent("CompleteRegistration", { content_name: "vba-confirmation" });
  }, [router]);

  return (
    <div className="max-w-lg mx-auto px-4 pb-16">
      {/* Checkmark */}
      <div className="flex justify-center mb-6">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center"
          style={{
            background: "linear-gradient(135deg, #10B981 0%, #34D399 100%)",
            boxShadow: "0 8px 30px rgba(16,185,129,0.3)",
          }}
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </div>
      </div>

      {/* Title */}
      <h1
        className="font-display text-2xl sm:text-3xl text-center leading-tight mb-3"
        style={{ color: "#0F172A" }}
      >
        C&apos;est confirmé{firstname ? ` ${firstname}` : ""} !
      </h1>
      <p className="text-center text-slate-500 text-base mb-8">
        Ton appel stratégique est réservé. Vérifie ta boîte email pour les détails.
      </p>

      {/* What to expect */}
      <GlassCard padding="p-6" className="mb-6">
        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4">
          Ce qui t&apos;attend
        </h2>
        <div className="space-y-3">
          {[
            {
              icon: "🎯",
              text: "On analyse ta situation actuelle et ton projet de van",
            },
            {
              icon: "🗺️",
              text: "On définit ensemble ta feuille de route personnalisée",
            },
            {
              icon: "💡",
              text: "On voit si l'accompagnement Van Business Academy est fait pour toi",
            },
          ].map((item) => (
            <div key={item.text} className="flex items-start gap-3">
              <span className="text-lg flex-shrink-0">{item.icon}</span>
              <p className="text-sm text-slate-600 leading-relaxed">{item.text}</p>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* How to prepare */}
      <GlassCard padding="p-6" className="mb-8">
        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4">
          Comment te préparer
        </h2>
        <div className="space-y-3">
          {[
            "Réfléchis à ton budget disponible pour te lancer",
            "Note tes questions sur le business de van aménagé",
            "Pense à ta timeline idéale pour démarrer",
            "Installe-toi dans un endroit calme le jour de l'appel",
          ].map((item) => (
            <div key={item} className="flex items-start gap-3">
              <span
                className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5"
                style={{ background: "rgba(185,148,95,0.12)" }}
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#B9945F" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </span>
              <p className="text-sm text-slate-600 leading-relaxed">{item}</p>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Testimonial — Avis Sylvain Trustpilot */}
      <div
        className="rounded-2xl px-6 py-5 mb-8"
        style={{
          background: "rgba(255,255,255,0.85)",
          border: "1px solid rgba(185,148,95,0.15)",
        }}
      >
        <div className="flex items-center gap-2 mb-2">
          <div className="flex gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <span key={i} className="text-amber-400 text-sm">★</span>
            ))}
          </div>
          <span className="text-[11px] text-slate-400 font-medium">Trustpilot</span>
        </div>
        <p className="text-slate-600 text-sm leading-relaxed italic mb-3">
          &ldquo;Je tiens à remercier Jules pour sa formation dédiée à l&apos;aménagement de van.
          Avant, j&apos;étais un peu perdu. J&apos;avais regardé plusieurs vidéos sur Internet,
          mais rien n&apos;était vraiment structuré. Aujourd&apos;hui, je suis fier d&apos;avoir
          commencé mon propre aménagement. C&apos;est une fierté indescriptible.&rdquo;
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
      </div>

      {/* Link back */}
      <div className="text-center">
        <LiquidButton variant="ghost" size="md" href="/">
          Découvrir Vanzon Explorer en attendant →
        </LiquidButton>
      </div>
    </div>
  );
}
