"use client";

import { useState } from "react";
import { Loader2, CheckCircle2 } from "lucide-react";

interface FormationPaywallProps {
  formationName: string;
  description: string;
  priceCents: number;
  emoji: string;
}

export default function FormationPaywall({
  formationName,
  description,
  priceCents,
  emoji,
}: FormationPaywallProps) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleActivate = async () => {
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

  const price = (priceCents / 100).toFixed(0);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="glass-card max-w-lg w-full p-10 text-center">
        <div className="text-4xl mb-4">{emoji}</div>

        <h2 className="text-2xl font-bold mb-3 text-slate-900">
          {formationName}
        </h2>

        <p className="text-slate-600 mb-2 text-sm leading-relaxed">
          {description}
        </p>

        <p className="text-2xl font-bold text-slate-900 mb-6">{price} €</p>

        {success ? (
          <div className="flex items-center justify-center gap-2 text-emerald-600 font-semibold">
            <CheckCircle2 className="w-5 h-5" />
            Accès activé !
          </div>
        ) : (
          <>
            <div className="flex gap-2 max-w-xs mx-auto mb-3">
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="Code promo"
                className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-sm font-mono uppercase tracking-wider text-center focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                onKeyDown={(e) => e.key === "Enter" && handleActivate()}
              />
              <button
                onClick={handleActivate}
                disabled={loading || !code.trim()}
                className="px-5 py-3 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50 active:scale-95"
                style={{
                  background:
                    "linear-gradient(135deg, #B9945F 0%, #E4D398 100%)",
                }}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Activer"
                )}
              </button>
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
          </>
        )}
      </div>
    </div>
  );
}
