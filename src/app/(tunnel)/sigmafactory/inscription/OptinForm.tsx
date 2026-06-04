"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SigmaOptinForm() {
  const router = useRouter();

  const [firstname, setFirstname] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const emailLower = email.toLowerCase().trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(emailLower)) {
      setError("L\u2019adresse email ne semble pas valide.");
      return;
    }

    setLoading(true);

    try {
      localStorage.setItem(
        "sigma_funnel",
        JSON.stringify({ firstname, email: emailLower })
      );

      await fetch("/api/sigma/optin/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstname, email: emailLower }),
      });

      router.push("/sigmafactory/presentation");
    } catch {
      setError("Une erreur est survenue. Veuillez réessayer.");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <input
        type="text"
        placeholder="Ton prénom"
        value={firstname}
        onChange={(e) => setFirstname(e.target.value)}
        required
        minLength={2}
        maxLength={50}
        className="w-full px-4 py-3.5 rounded-lg text-white text-sm placeholder:text-white/40 outline-none transition-colors"
        style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }}
      />
      <input
        type="email"
        placeholder="Ton email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        className="w-full px-4 py-3.5 rounded-lg text-white text-sm placeholder:text-white/40 outline-none transition-colors"
        style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }}
      />

      {error && <p className="text-red-400 text-sm text-center">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full mt-1 rounded-xl py-5 text-center disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
        style={{ background: "#B9945F" }}
      >
        <div className="flex items-center justify-center gap-2 mb-1">
          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
          <span className="text-white font-black text-base uppercase tracking-wider">
            {loading ? "Chargement..." : "Accéder à la vidéo"}
          </span>
        </div>
        <span className="text-white/70 text-xs uppercase tracking-widest">100% gratuite</span>
      </button>

      <p className="text-white/25 text-xs text-center mt-2">
        Tes données restent 100% confidentielles. Pas de spam.
      </p>
    </form>
  );
}
