"use client";

import { useState } from "react";
import { Shield, CheckCircle, Zap, BookOpen, Headphones } from "lucide-react";

const FEATURES = [
  { icon: BookOpen, text: "8 modules, 60+ vidéos terrain" },
  { icon: Zap, text: "De l'achat du van à la mise en location" },
  { icon: Headphones, text: "Accès à vie, mises à jour incluses" },
];

export default function CheckoutClient() {
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("Erreur lors de la redirection vers le paiement.");
        setLoading(false);
      }
    } catch {
      alert("Erreur réseau. Réessaie.");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto px-4 pb-16">
      {/* Header */}
      <div className="text-center mb-8">
        <span
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-6"
          style={{
            background: "rgba(205,167,123,0.12)",
            border: "1px solid rgba(205,167,123,0.35)",
            color: "#B9945F",
          }}
        >
          Van Business Academy
        </span>

        <h1
          className="font-display text-3xl sm:text-4xl font-black leading-tight mb-3"
          style={{ color: "#0F172A" }}
        >
          Rejoins la formation
        </h1>
        <p className="text-slate-500 text-base">
          Paiement unique, accès à vie.
        </p>
      </div>

      {/* Card */}
      <div
        className="rounded-3xl overflow-hidden shadow-lg"
        style={{
          background: "#FFFFFF",
          border: "1px solid rgba(185,148,95,0.15)",
        }}
      >
        <div className="px-6 py-8 sm:px-8">
          {/* Price */}
          <div className="text-center mb-8">
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-5xl font-black text-slate-900">1 497</span>
              <span className="text-xl font-bold text-slate-400">€</span>
            </div>
            <p className="text-sm text-slate-400 mt-2">Paiement unique</p>
          </div>

          {/* Features */}
          <div className="space-y-4 mb-8">
            {FEATURES.map((f) => (
              <div key={f.text} className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "rgba(185,148,95,0.10)" }}
                >
                  <f.icon className="w-4 h-4" style={{ color: "#B9945F" }} />
                </div>
                <span className="text-sm text-slate-700">{f.text}</span>
              </div>
            ))}
          </div>

          {/* Separator */}
          <div className="border-t border-slate-100 mb-8" />

          {/* What you get */}
          <div className="space-y-2.5 mb-8">
            {[
              "Méthode progressive : acheter, aménager, louer, revendre",
              "Outils IA et templates inclus",
              "Créée par des loueurs en activité au Pays Basque",
            ].map((item) => (
              <div key={item} className="flex items-start gap-2.5">
                <CheckCircle
                  className="w-4 h-4 mt-0.5 flex-shrink-0"
                  style={{ color: "#22C55E" }}
                />
                <span className="text-sm text-slate-600">{item}</span>
              </div>
            ))}
          </div>

          {/* CTA */}
          <button
            onClick={handleCheckout}
            disabled={loading}
            className="block w-full text-center font-bold text-white py-4 rounded-xl text-base sm:text-lg transition-all hover:scale-[1.02] hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
            style={{
              background:
                "linear-gradient(135deg, #B9945F 0%, #E4D398 100%)",
              boxShadow: "0 4px 18px rgba(185, 148, 95, 0.45)",
            }}
          >
            {loading ? "Redirection..." : "Accéder à la formation →"}
          </button>

          {/* Trust */}
          <div className="flex items-center justify-center gap-2 mt-4">
            <Shield className="w-4 h-4 text-slate-400" />
            <p className="text-xs text-slate-400">
              Paiement sécurisé par Stripe
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
