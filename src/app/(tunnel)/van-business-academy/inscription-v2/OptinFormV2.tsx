"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUTMParams, saveFunnelData } from "@/lib/hooks/useUTMParams";
import { trackFunnel } from "@/lib/funnel-tracking";

export default function OptinFormV2() {
  const router = useRouter();
  const utmParams = useUTMParams();
  const [firstname, setFirstname] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/formation/tunnel/optin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstname, email, ...utmParams }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Une erreur est survenue.");
        setLoading(false);
        return;
      }

      saveFunnelData({ firstname, email, ...utmParams });

      trackFunnel("optin", "/van-business-academy/inscription-v2", {
        email,
        firstname,
        ...utmParams,
      });

      router.push("/van-business-academy/presentation");
    } catch {
      setError("Une erreur est survenue. Veuillez reessayer.");
      setLoading(false);
    }
  };

  return (
    <form id="optin-form-v2" onSubmit={handleSubmit}>
      <div className="flex flex-col sm:flex-row gap-2.5">
        <input
          type="text"
          placeholder="Ton prenom"
          value={firstname}
          onChange={(e) => setFirstname(e.target.value)}
          required
          minLength={2}
          maxLength={50}
          className="flex-1 px-4 py-3.5 rounded-xl border text-slate-800 text-sm placeholder:text-slate-400 transition-all outline-none focus:ring-2 focus:ring-[#B9945F]/30"
          style={{
            borderColor: "rgba(0,0,0,0.10)",
            background: "#FAFAFA",
          }}
        />
        <input
          type="email"
          placeholder="Ton email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="flex-1 px-4 py-3.5 rounded-xl border text-slate-800 text-sm placeholder:text-slate-400 transition-all outline-none focus:ring-2 focus:ring-[#B9945F]/30"
          style={{
            borderColor: "rgba(0,0,0,0.10)",
            background: "#FAFAFA",
          }}
        />
      </div>

      {error && (
        <p className="text-red-500 text-sm text-center mt-2">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full mt-3 px-6 py-4 rounded-xl text-white font-semibold text-sm sm:text-base transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
        style={{
          background: "linear-gradient(135deg, #B9945F 0%, #D4B878 100%)",
          boxShadow: "0 4px 14px rgba(185,148,95,0.35)",
        }}
      >
        {loading ? (
          <span className="inline-flex items-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Chargement...
          </span>
        ) : (
          "Acceder a la video gratuite →"
        )}
      </button>
    </form>
  );
}
