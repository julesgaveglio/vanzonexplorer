"use client";

import { useState } from "react";
import Image from "next/image";
import { Shield, CheckCircle, Zap, BookOpen, Headphones, Tag } from "lucide-react";
import LiquidButton from "@/components/ui/LiquidButton";

const FEATURES = [
  { icon: BookOpen, text: "8 modules, 60+ vidéos terrain" },
  { icon: Zap, text: "De l'achat du van à la mise en location" },
  { icon: Headphones, text: "Accès à vie, mises à jour incluses" },
];

const PROMO_PRICES: Record<string, { price: string; amount: number }> = {
  LANCEMENT: { price: "997", amount: 99700 },
};

const DEFAULT_PRICE = "1 497";

export default function CheckoutClient() {
  const [loading, setLoading] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [appliedCode, setAppliedCode] = useState("");
  const [promoError, setPromoError] = useState("");

  const promo = PROMO_PRICES[appliedCode];
  const displayPrice = promo ? promo.price : DEFAULT_PRICE;

  const handleApplyPromo = () => {
    const code = promoCode.toUpperCase().trim();
    if (PROMO_PRICES[code]) {
      setAppliedCode(code);
      setPromoError("");
    } else if (code) {
      setPromoError("Code invalide");
      setAppliedCode("");
    }
  };

  const handleRemovePromo = () => {
    setAppliedCode("");
    setPromoCode("");
    setPromoError("");
  };

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ promoCode: appliedCode }),
      });
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
        {/* Image */}
        <div className="relative aspect-[3/2]">
          <Image
            src="https://cdn.sanity.io/images/lewexa74/production/323c9f640fbc20593e70cca82009bfc8ab353fcd-1459x955.png?auto=format&fit=max&q=82"
            alt="Van Business Academy — Formation complète"
            fill
            className="object-cover"
            unoptimized
          />
        </div>

        <div className="px-6 py-8 sm:px-8">
          {/* Price */}
          <div className="text-center mb-8">
            <div className="flex items-baseline justify-center gap-2">
              {promo && (
                <span className="text-2xl font-bold text-slate-300 line-through">
                  1 497 €
                </span>
              )}
              <span className="text-5xl font-black text-slate-900">{displayPrice}</span>
              <span className="text-xl font-bold text-slate-400">€</span>
            </div>
            <p className="text-sm text-slate-400 mt-2">Paiement unique</p>
            {promo && (
              <div className="flex items-center justify-center gap-1.5 mt-2">
                <Tag className="w-3.5 h-3.5" style={{ color: "#22C55E" }} />
                <span className="text-sm font-semibold" style={{ color: "#22C55E" }}>
                  Code {appliedCode} appliqué — 500 € de réduction
                </span>
              </div>
            )}
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

          {/* Promo code */}
          <div className="mb-6">
            {appliedCode ? (
              <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-100">
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-emerald-600" />
                  <span className="text-sm font-semibold text-emerald-700">{appliedCode}</span>
                </div>
                <button
                  onClick={handleRemovePromo}
                  className="text-xs text-slate-400 hover:text-slate-600 transition"
                >
                  Retirer
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={promoCode}
                  onChange={(e) => { setPromoCode(e.target.value); setPromoError(""); }}
                  onKeyDown={(e) => e.key === "Enter" && handleApplyPromo()}
                  placeholder="Code promo"
                  className="flex-1 px-4 py-3 rounded-xl border text-sm text-slate-800 placeholder:text-slate-400 outline-none transition-all"
                  style={{ borderColor: promoError ? "#EF4444" : "rgba(0,0,0,0.10)", background: "#FAFAFA" }}
                  onFocus={(e) => (e.target.style.borderColor = "#B9945F")}
                  onBlur={(e) => (e.target.style.borderColor = promoError ? "#EF4444" : "rgba(0,0,0,0.10)")}
                />
                <button
                  onClick={handleApplyPromo}
                  className="px-4 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
                  style={{ background: "linear-gradient(135deg, #B9945F 0%, #E4D398 100%)" }}
                >
                  Appliquer
                </button>
              </div>
            )}
            {promoError && (
              <p className="text-xs text-red-500 mt-1.5 pl-1">{promoError}</p>
            )}
          </div>

          {/* CTA */}
          <LiquidButton
            variant="gold"
            size="responsive"
            fullWidth
            onClick={handleCheckout}
            disabled={loading}
          >
            {loading ? "Redirection..." : "Accéder à la formation →"}
          </LiquidButton>

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
