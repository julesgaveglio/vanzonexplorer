"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUTMParams, saveFunnelData } from "@/lib/hooks/useUTMParams";
import { trackFunnel } from "@/lib/funnel-tracking";

// --- Qualification questions ---
const QUESTIONS = [
  {
    key: "q_objective",
    label: "Quel est ton objectif avec le van aménagé ?",
    options: [
      "Générer un complément de revenus passifs avec la location",
      "Faire une plus-value à la revente et recommencer le process",
      "Les deux — location ET revente en boucle",
      "Je ne sais pas encore",
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

  const validateInputs = (): string | null => {
    // ── EMAIL VALIDATION ──

    const emailLower = email.toLowerCase().trim();
    const [localPart, domain] = emailLower.split("@");

    // Basic format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(emailLower)) {
      return "L'adresse email ne semble pas valide.";
    }

    // Block disposable/temporary email domains (extended list)
    const disposable = [
      "yopmail","tempmail","guerrillamail","mailinator","throwaway","fakeinbox",
      "sharklasers","guerrillamailblock","grr","pokemail","spam4","trashmail",
      "dispostable","maildrop","meltmail","temp-mail","10minutemail","mohmal",
      "getairmail","mailnesia","tempr","discard","filzmail","trash-me",
      "mytemp","tempinbox","getnada","burnermail","inboxkitten","33mail",
      "mintemail","emailondeck","tmail","spambox","crazymailing","jetable",
      "mailfence","mailcatch","fakemail","tmpmail","mailsac","anonbox",
      "deadfake","spamgourmet","mailexpire","tempail","nada","emailfake",
    ];
    if (domain && disposable.some((d) => domain.includes(d))) {
      return "Merci d'utiliser une adresse email personnelle (pas d'email temporaire).";
    }

    // Block suspicious TLDs (common for fake emails)
    const suspiciousTlds = [".tk", ".ml", ".ga", ".cf", ".gq", ".xyz", ".top", ".buzz", ".click"];
    if (suspiciousTlds.some((tld) => domain?.endsWith(tld))) {
      return "Cette extension d'email n'est pas acceptée. Utilise ton email personnel.";
    }

    // Must have a real domain (gmail, outlook, yahoo, hotmail, icloud, orange, free, sfr, etc.)
    const trustedDomains = [
      "gmail.com","googlemail.com","outlook.com","outlook.fr","hotmail.com","hotmail.fr",
      "yahoo.com","yahoo.fr","icloud.com","me.com","mac.com","live.com","live.fr",
      "msn.com","aol.com","protonmail.com","proton.me","zoho.com",
      "orange.fr","wanadoo.fr","free.fr","sfr.fr","laposte.net","bbox.fr",
      "numericable.fr","neuf.fr","club-internet.fr","alice.fr","cegetel.net",
    ];
    const isTrusted = trustedDomains.includes(domain ?? "");

    // If not trusted, check it has at least a proper structure (company email OK)
    if (!isTrusted && domain) {
      const parts = domain.split(".");
      // Must have at least 2 parts, TLD >= 2 chars, domain part >= 2 chars
      if (parts.length < 2 || parts[parts.length - 1].length < 2 || parts[0].length < 2) {
        return "L'adresse email ne semble pas valide.";
      }
    }

    // Block obvious fake local parts
    if (localPart) {
      // All same character: aaaa@, 1111@
      if (/^(.)\1{3,}$/.test(localPart)) {
        return "L'adresse email ne semble pas valide.";
      }
      // Keyboard smash: asdf, qwerty, azerty
      const smashes = ["asdf","qwerty","azerty","zxcv","azer","qsdf","wxcv","test","fake","null","none","nope","xxx","yyy","zzz"];
      if (smashes.some((s) => localPart === s || localPart.startsWith(s + "@"))) {
        return "Merci d'entrer ta vraie adresse email.";
      }
      // Too short
      if (localPart.length < 3) {
        return "L'adresse email semble trop courte.";
      }
    }

    // ── PHONE VALIDATION ──

    const phoneTrimmed = phone.trim();
    const digits = phoneTrimmed.replace(/\D/g, "");

    if (digits.length < 10) {
      return "Le numéro de téléphone doit contenir au moins 10 chiffres.";
    }
    if (digits.length > 15) {
      return "Le numéro de téléphone semble trop long.";
    }

    // Block all same digit (0000000000, 1111111111, etc.)
    if (/^(\d)\1{9,}$/.test(digits)) {
      return "Le numéro de téléphone ne semble pas valide.";
    }

    // Block sequential patterns (0123456789, 9876543210)
    if (/^0?1234567890?$/.test(digits) || /^0?9876543210?$/.test(digits)) {
      return "Le numéro de téléphone ne semble pas valide.";
    }

    // French numbers: must start with 0 or +33
    if (digits.startsWith("33")) {
      // +33 format OK
    } else if (digits.startsWith("0")) {
      // 0X format — check it's a valid French prefix
      const prefix2 = digits.slice(0, 2);
      const validPrefixes = ["06", "07", "01", "02", "03", "04", "05", "09"];
      if (!validPrefixes.includes(prefix2)) {
        return "Le numéro de téléphone ne semble pas valide pour la France.";
      }
    } else {
      // International number — allow if 10+ digits
    }

    // Block numbers with too many repeated groups (06 06 06 06 06)
    const pairs = digits.match(/.{2}/g) ?? [];
    const uniquePairs = new Set(pairs);
    if (pairs.length >= 5 && uniquePairs.size <= 2) {
      return "Le numéro de téléphone ne semble pas valide.";
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const validationError = validateInputs();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      // ── Server-side email verification (MX + ZeroBounce) ──
      const verifyRes = await fetch("/api/formation/tunnel/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const verify = await verifyRes.json();
      if (!verify.valid) {
        setError("Email incorrect. Merci de renseigner une adresse email valide.");
        setLoading(false);
        return;
      }

      // ── Server-side phone verification (libphonenumber) ──
      const verifyPhoneRes = await fetch("/api/formation/tunnel/verify-phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const verifyPhone = await verifyPhoneRes.json();
      if (!verifyPhone.valid) {
        setError("Numéro de téléphone incorrect. Merci de renseigner un numéro valide.");
        setLoading(false);
        return;
      }

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

      // Track: optin event to Supabase (all leads)
      trackFunnel("optin", "/van-business-academy/inscription", {
        email,
        firstname,
        ...utmParams,
        metadata: {
          q_objective: answers.q_objective,
          q_profile: answers.q_profile,
          q_budget: answers.q_budget,
          phone: phone || undefined,
          title_variant_id: (() => { try { return localStorage.getItem("vba_title_variant_id") ?? undefined; } catch { return undefined; } })(),
          is_hot: isHot,
        },
      });

      // Lead pixel fires on /presentation page load (not here)
      // Wait for Supabase tracking to complete before redirecting
      await new Promise((r) => setTimeout(r, 500));

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
