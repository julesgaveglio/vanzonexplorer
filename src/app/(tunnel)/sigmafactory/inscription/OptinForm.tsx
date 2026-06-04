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

      await new Promise((r) => setTimeout(r, 300));
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
        className="w-full px-4 py-3.5 rounded-lg text-slate-900 text-sm placeholder:text-slate-400 outline-none border border-slate-200 bg-white focus:border-[#B9945F] transition-colors"
      />
      <input
        type="email"
        placeholder="Ton email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        className="w-full px-4 py-3.5 rounded-lg text-slate-900 text-sm placeholder:text-slate-400 outline-none border border-slate-200 bg-white focus:border-[#B9945F] transition-colors"
      />

      {error && <p className="text-red-500 text-sm text-center">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full mt-2 px-6 py-3.5 rounded-lg text-white font-semibold text-sm uppercase tracking-wide disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
        style={{ background: "#B9945F" }}
      >
        {loading ? "Chargement..." : "ACCÉDER À LA VIDÉO GRATUITE"}
      </button>

      <p className="text-slate-400 text-xs text-center mt-2">
        Tes données restent 100% confidentielles. Pas de spam.
      </p>
    </form>
  );
}
