"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUTMParams, saveFunnelData } from "@/lib/hooks/useUTMParams";
import { trackFunnel } from "@/lib/funnel-tracking";

export default function OptinForm() {
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

      // Save to localStorage for subsequent pages
      saveFunnelData({ firstname, email, ...utmParams });

      // Track: Lead event (Pixel + Supabase)
      trackFunnel("optin", "/van-business-academy/inscription", {
        email,
        firstname,
        ...utmParams,
      });

      // Redirect to VSL
      router.push("/van-business-academy/presentation");
    } catch {
      setError("Une erreur est survenue. Veuillez réessayer.");
      setLoading(false);
    }
  };

  return (
    <form id="optin-form" onSubmit={handleSubmit} className="flex flex-col gap-3">
      <input
        type="text"
        placeholder="Votre prénom"
        value={firstname}
        onChange={(e) => setFirstname(e.target.value)}
        required
        minLength={2}
        maxLength={50}
        className="w-full px-4 py-4 rounded-xl text-white text-sm placeholder:text-white/40 transition-all outline-none focus:ring-2 focus:ring-[#B9945F]/40"
        style={{
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.10)",
        }}
      />
      <input
        type="email"
        placeholder="Votre mail"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        className="w-full px-4 py-4 rounded-xl text-white text-sm placeholder:text-white/40 transition-all outline-none focus:ring-2 focus:ring-[#B9945F]/40"
        style={{
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.10)",
        }}
      />

      {error && (
        <p className="text-red-400 text-sm text-center">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full mt-1 px-6 py-4 rounded-xl text-white font-bold text-sm sm:text-base uppercase tracking-wide transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
        style={{
          background: "linear-gradient(135deg, #B9945F 0%, #E4D398 100%)",
          boxShadow: "0 4px 20px rgba(185,148,95,0.4)",
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
          <span className="flex flex-col items-center">
            <span>JE DÉCOUVRE LA MÉTHODE GRATUITE !</span>
            <span className="text-xs font-normal normal-case tracking-normal opacity-80 mt-0.5">
              (places limitées)
            </span>
          </span>
        )}
      </button>

      <p className="flex items-center justify-center gap-1.5 text-white/30 text-xs mt-2">
        <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor">
          <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM12 17c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1s3.1 1.39 3.1 3.1v2z" />
        </svg>
        Tes données restent 100% confidentielles.
        <br />
        Pas de spam.
      </p>
    </form>
  );
}
