"use client";

import { useState } from "react";
import { Loader2, CheckCircle2, CreditCard, Tag } from "lucide-react";

interface FormationPaywallProps {
  formationName: string;
  formationSlug: string;
  description: string;
  priceCents: number;
  emoji: string;
}

export default function FormationPaywall({
  formationName,
  formationSlug,
  description,
  priceCents,
  emoji,
}: FormationPaywallProps) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [stripeLoading, setStripeLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showPromo, setShowPromo] = useState(false);

  const handleActivatePromo = async () => {
    if (!code.trim()) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/formations/activate-promo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erreur lors de l'activation");
        return;
      }

      setSuccess(true);
      setTimeout(() => window.location.reload(), 1000);
    } catch {
      setError("Erreur réseau");
    } finally {
      setLoading(false);
    }
  };

  const handleStripeCheckout = async () => {
    setStripeLoading(true);
    setError("");

    try {
      const res = await fetch("/api/stripe/formation-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ formationSlug }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erreur lors du paiement");
        setStripeLoading(false);
        return;
      }

      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch {
      setError("Erreur réseau");
      setStripeLoading(false);
    }
  };

  const price = (priceCents / 100).toFixed(0);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="glass-card max-w-lg w-full p-8 sm:p-10 text-center">
        <div className="text-4xl mb-4">{emoji}</div>

        <h2 className="text-2xl font-bold mb-3 text-slate-900">
          {formationName}
        </h2>

        <p className="text-slate-600 mb-6 text-sm leading-relaxed">
          {description}
        </p>

        {success ? (
          <div className="flex items-center justify-center gap-2 text-emerald-600 font-semibold py-4">
            <CheckCircle2 className="w-5 h-5" />
            Accès activé — redirection...
          </div>
        ) : (
          <div className="space-y-4">
            {/* Price */}
            <p className="text-3xl font-bold text-slate-900">{price} €</p>

            {/* Stripe CTA */}
            <button
              onClick={handleStripeCheckout}
              disabled={stripeLoading}
              className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50 active:scale-[0.98]"
              style={{
                background:
                  "linear-gradient(135deg, var(--gold) 0%, var(--gold-light) 100%)",
              }}
            >
              {stripeLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <CreditCard className="w-4 h-4" />
                  Accéder à la formation — {price} €
                </>
              )}
            </button>

            {/* Promo code toggle */}
            {!showPromo ? (
              <button
                onClick={() => setShowPromo(true)}
                className="text-xs text-slate-400 hover:text-slate-600 transition-colors flex items-center gap-1 mx-auto"
              >
                <Tag className="w-3 h-3" />
                J&apos;ai un code promo
              </button>
            ) : (
              <div className="pt-2 border-t border-slate-100">
                <div className="flex gap-2 max-w-xs mx-auto">
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="CODE PROMO"
                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-mono uppercase tracking-wider text-center focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                    onKeyDown={(e) => e.key === "Enter" && handleActivatePromo()}
                    autoFocus
                  />
                  <button
                    onClick={handleActivatePromo}
                    disabled={loading || !code.trim()}
                    className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50 active:scale-95 bg-slate-900 hover:bg-slate-700"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Appliquer"
                    )}
                  </button>
                </div>
              </div>
            )}

            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}

            <p className="text-xs text-slate-400">
              Paiement sécurisé par Stripe. Accès immédiat après paiement.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
