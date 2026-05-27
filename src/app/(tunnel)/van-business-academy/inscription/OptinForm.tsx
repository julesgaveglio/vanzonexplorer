"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUTMParams, saveFunnelData } from "@/lib/hooks/useUTMParams";
import { trackFunnel } from "@/lib/funnel-tracking";

// --- Qualification questions ---
const QUESTIONS = [
  {
    key: "q_objective",
    label: "Quel est ton objectif principal ?",
    options: [
      "Gagner un complément de revenu",
      "Construire un van pour voyager / vivre une vie de liberté",
      "Gagner de l'argent rapidement avec un van",
    ],
  },
  {
    key: "q_profile",
    label: "Quel est ton profil actuel ?",
    options: ["Salarié", "Entrepreneur", "Retraité", "Autre"],
  },
  {
    key: "q_budget",
    label: "Quel budget es-tu prêt à investir dans ton projet ?",
    options: [
      "Moins de 10 000 \u20AC",
      "10 000 \u2013 15 000 \u20AC",
      "15 000 \u2013 20 000 \u20AC",
      "Plus de 20 000 \u20AC",
    ],
  },
] as const;

type QKey = (typeof QUESTIONS)[number]["key"];

function computeIsHot(answers: Record<QKey, string>): boolean {
  if (answers.q_objective === "Gagner de l'argent rapidement avec un van") return false;
  if (answers.q_profile === "Retraité") return false;
  if (answers.q_budget === "Moins de 10 000 \u20AC") return false;
  return true;
}

export default function OptinForm() {
  const router = useRouter();
  const utmParams = useUTMParams();

  // Step 0,1,2 = questions, step 3 = contact info
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<QKey, string>>({
    q_objective: "",
    q_profile: "",
    q_budget: "",
  });

  const [firstname, setFirstname] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const totalSteps = 4; // 3 questions + 1 contact
  const progress = ((step + 1) / totalSteps) * 100;

  const handleSelect = (key: QKey, value: string) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
    // Auto-advance after selection
    setTimeout(() => setStep((s) => s + 1), 250);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/formation/tunnel/optin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstname,
          email,
          phone: phone || undefined,
          q_objective: answers.q_objective,
          q_profile: answers.q_profile,
          q_budget: answers.q_budget,
          ...utmParams,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Une erreur est survenue.");
        setLoading(false);
        return;
      }

      // Save to localStorage for subsequent pages (include is_hot for VSL CTA delay)
      const isHot = computeIsHot(answers);
      saveFunnelData({ firstname, email, ...utmParams });
      try { localStorage.setItem("vba_is_hot", isHot ? "1" : "0"); } catch {}

      // Track: Lead event (Pixel + Supabase)
      trackFunnel("optin", "/van-business-academy/inscription", {
        email,
        firstname,
        ...utmParams,
        metadata: {
          q_objective: answers.q_objective,
          q_profile: answers.q_profile,
          q_budget: answers.q_budget,
          phone: phone || undefined,
          is_hot: computeIsHot(answers),
        },
      });

      // Redirect to VSL
      router.push("/van-business-academy/presentation");
    } catch {
      setError("Une erreur est survenue. Veuillez r\u00E9essayer.");
      setLoading(false);
    }
  };

  // --- Render ---
  return (
    <div className="flex flex-col gap-4">
      {/* Progress bar */}
      <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${progress}%`,
            background: "linear-gradient(135deg, #B9945F 0%, #E4D398 100%)",
          }}
        />
      </div>
      <p className="text-white/40 text-xs text-center">
        {step < 3 ? `Question ${step + 1} / 3` : "Dernière étape"}
      </p>

      {/* Step 0-2: Questions */}
      {step < 3 && (
        <div className="flex flex-col gap-3">
          <p className="text-white text-sm sm:text-base font-semibold text-center mb-1">
            {QUESTIONS[step].label}
          </p>
          {QUESTIONS[step].options.map((opt) => {
            const key = QUESTIONS[step].key;
            const isSelected = answers[key] === opt;
            return (
              <button
                key={opt}
                type="button"
                onClick={() => handleSelect(key, opt)}
                className="w-full text-left px-4 py-3.5 rounded-xl text-sm transition-all"
                style={{
                  background: isSelected ? "rgba(185,148,95,0.15)" : "rgba(255,255,255,0.06)",
                  border: isSelected
                    ? "1px solid rgba(185,148,95,0.6)"
                    : "1px solid rgba(255,255,255,0.10)",
                  color: isSelected ? "#E4D398" : "rgba(255,255,255,0.8)",
                }}
              >
                {opt}
              </button>
            );
          })}
          {/* Back button */}
          {step > 0 && (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              className="text-white/30 text-xs mt-1 hover:text-white/60 transition-colors"
            >
              &larr; Retour
            </button>
          )}
        </div>
      )}

      {/* Step 3: Contact info */}
      {step === 3 && (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="text"
            placeholder="Ton prénom"
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
            placeholder="Ton email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-4 rounded-xl text-white text-sm placeholder:text-white/40 transition-all outline-none focus:ring-2 focus:ring-[#B9945F]/40"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.10)",
            }}
          />
          <input
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="Ton numéro de téléphone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            minLength={10}
            maxLength={15}
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
              <span>JE DÉCOUVRE LA MÉTHODE GRATUITE !</span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setStep(2)}
            className="text-white/30 text-xs mt-1 hover:text-white/60 transition-colors"
          >
            &larr; Retour
          </button>

          <p className="flex items-center justify-center gap-1.5 text-white/30 text-xs mt-2">
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor">
              <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM12 17c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1s3.1 1.39 3.1 3.1v2z" />
            </svg>
            Tes donn&eacute;es restent 100% confidentielles.
            <br />
            Pas de spam.
          </p>
        </form>
      )}
    </div>
  );
}
