"use client";

import { useState } from "react";
import Image from "next/image";
import { Shield, CheckCircle, Zap, BookOpen, Headphones, Tag } from "lucide-react";
import LiquidButton from "@/components/ui/LiquidButton";

const FEATURES = [
  { icon: BookOpen, text: "8 modules, 60+ videos terrain" },
  { icon: Zap, text: "De l'achat du van a la mise en location" },
  { icon: Headphones, text: "Acces a vie, mises a jour incluses" },
];

const PROMO_PRICES: Record<string, { total: number; label: string; savings: string }> = {
  LANCEMENT: { total: 99700, label: "997", savings: "500" },
};

const DEFAULT_TOTAL = 149700;
const DEFAULT_LABEL = "1 497";

export default function CheckoutClient() {
  const [loading, setLoading] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [appliedCode, setAppliedCode] = useState("");
  const [promoError, setPromoError] = useState("");
  const [paymentMode, setPaymentMode] = useState<"1x" | "4x">("1x");

  const promo = PROMO_PRICES[appliedCode];
  const totalAmount = promo ? promo.total : DEFAULT_TOTAL;
  const displayPrice = promo ? promo.label : DEFAULT_LABEL;
  const installmentPrice = Math.ceil(totalAmount / 4 / 100);

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
        body: JSON.stringify({
          promoCode: appliedCode,
          installments: paymentMode === "4x" ? 4 : undefined,
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("Erreur lors de la redirection vers le paiement.");
        setLoading(false);
      }
    } catch {
      alert("Erreur reseau. Reessaie.");
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
        <div className="relative aspect-[3/1] max-h-[180px]">
          <Image
            src="https://cdn.sanity.io/images/lewexa74/production/e8d8a66703e846a5bd916e38bd9a488b663ce433-1920x1080.png?w=600&h=450&fit=crop&auto=format&q=80"
            alt="Van Business Academy"
            fill
            className="object-cover"
            unoptimized
          />
        </div>

        <div className="px-6 py-8 sm:px-8">
          {/* Payment mode selector */}
          <div className="flex gap-3 mb-8">
            <button
              onClick={() => setPaymentMode("1x")}
              className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold border-2 transition-all ${
                paymentMode === "1x"
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
              }`}
            >
              Paiement unique
            </button>
            <button
              onClick={() => setPaymentMode("4x")}
              className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold border-2 transition-all ${
                paymentMode === "4x"
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
              }`}
            >
              4x sans frais
            </button>
          </div>

          {/* Price */}
          <div className="text-center mb-8">
            {paymentMode === "1x" ? (
              <>
                <div className="flex items-baseline justify-center gap-2">
                  {promo && (
                    <span className="text-2xl font-bold text-slate-300 line-through">
                      1 497 EUR
                    </span>
                  )}
                  <span className="text-5xl font-black text-slate-900">{displayPrice}</span>
                  <span className="text-xl font-bold text-slate-400">EUR</span>
                </div>
                <p className="text-sm text-slate-400 mt-2">Paiement unique</p>
              </>
            ) : (
              <>
                <div className="flex items-baseline justify-center gap-2">
                  <span className="text-5xl font-black text-slate-900">{installmentPrice}</span>
                  <span className="text-xl font-bold text-slate-400">EUR/mois</span>
                </div>
                <p className="text-sm text-slate-400 mt-2">
                  4 mensualites de {installmentPrice} EUR soit {displayPrice} EUR au total
                </p>
              </>
            )}
            {promo && (
              <div className="flex items-center justify-center gap-1.5 mt-2">
                <Tag className="w-3.5 h-3.5" style={{ color: "#22C55E" }} />
                <span className="text-sm font-semibold" style={{ color: "#22C55E" }}>
                  Code {appliedCode} - {promo.savings} EUR de reduction
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
              "Methode progressive : acheter, amenager, louer, revendre",
              "Outils IA et templates inclus",
              "Creee par des loueurs en activite au Pays Basque",
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
                  style={{ background: "#0F172A" }}
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
            {loading
              ? "Redirection..."
              : paymentMode === "4x"
                ? `Payer ${installmentPrice} EUR/mois pendant 4 mois`
                : "Acceder a la formation"}
          </LiquidButton>

          {/* Trust */}
          <div className="flex items-center justify-center gap-2 mt-4">
            <Shield className="w-4 h-4 text-slate-400" />
            <p className="text-xs text-slate-400">
              Paiement securise par Stripe
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
