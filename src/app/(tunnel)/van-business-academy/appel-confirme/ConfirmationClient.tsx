"use client";

import { useEffect, useState, useRef } from "react";
import GlassCard from "@/components/ui/GlassCard";
import LiquidButton from "@/components/ui/LiquidButton";
import { getFunnelData } from "@/lib/hooks/useUTMParams";
import { trackFunnel } from "@/lib/funnel-tracking";

export default function ConfirmationClient() {
  const [firstname, setFirstname] = useState("");
  const tracked = useRef(false);

  useEffect(() => {
    const data = getFunnelData();
    if (data) {
      setFirstname(data.firstname);
    }
    // Track SubmitApplication → Meta
    if (!tracked.current) {
      tracked.current = true;
      trackFunnel("appel_confirme", "/van-business-academy/appel-confirme", {
        email: data?.email,
        firstname: data?.firstname,
      });
    }
  }, []);

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
            "Note tes questions sur le business de van aménagé",
            "Pense à ta timeline idéale pour démarrer",
            "Réfléchis à ton budget disponible pour te lancer",
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

      {/* Link back */}
      <div className="text-center">
        <LiquidButton variant="ghost" size="md" href="/">
          Découvrir Vanzon Explorer en attendant →
        </LiquidButton>
      </div>
    </div>
  );
}
