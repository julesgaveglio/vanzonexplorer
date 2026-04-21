"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import LiquidButton from "@/components/ui/LiquidButton";
import { useUTMParams, saveFunnelData } from "@/lib/hooks/useUTMParams";
import { trackEvent } from "@/lib/meta-pixel";

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

      // Track Meta Pixel event
      trackEvent("Lead", { content_name: "vba-funnel" });

      // Redirect to VSL
      router.push("/van-business-academy/presentation");
    } catch {
      setError("Une erreur est survenue. Veuillez réessayer.");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <input
          type="text"
          placeholder="Ton prénom"
          value={firstname}
          onChange={(e) => setFirstname(e.target.value)}
          required
          minLength={2}
          maxLength={50}
          className="w-full px-4 py-3.5 rounded-xl border text-slate-800 text-sm placeholder:text-slate-400 transition-all outline-none"
          style={{
            borderColor: "rgba(0,0,0,0.10)",
            background: "#FAFAFA",
          }}
          onFocus={(e) => (e.target.style.borderColor = "#B9945F")}
          onBlur={(e) => (e.target.style.borderColor = "rgba(0,0,0,0.10)")}
        />
      </div>
      <div>
        <input
          type="email"
          placeholder="Ton email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-4 py-3.5 rounded-xl border text-slate-800 text-sm placeholder:text-slate-400 transition-all outline-none"
          style={{
            borderColor: "rgba(0,0,0,0.10)",
            background: "#FAFAFA",
          }}
          onFocus={(e) => (e.target.style.borderColor = "#B9945F")}
          onBlur={(e) => (e.target.style.borderColor = "rgba(0,0,0,0.10)")}
        />
      </div>

      {error && (
        <p className="text-red-500 text-sm text-center">{error}</p>
      )}

      <LiquidButton
        variant="gold"
        size="lg"
        fullWidth
        type="submit"
        disabled={loading}
      >
        {loading ? "Chargement..." : "Accéder à la vidéo gratuite →"}
      </LiquidButton>
    </form>
  );
}
