import type { Metadata } from "next";
import { Suspense } from "react";
import Image from "next/image";
import OptinForm from "./OptinForm";

export const metadata: Metadata = {
  title: "Vidéo Gratuite | Sigma Factory — Stratégie IDRH",
  description:
    "La méthode qui permet de solder 60 à 100% de son crédit immobilier en moins de 12 mois.",
  robots: { index: false, follow: false },
};

/* ── Trustpilot stars ── */
function Stars() {
  return (
    <div className="flex gap-0.5">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="w-5 h-5 flex items-center justify-center" style={{ background: "#00B67A" }}>
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-white" fill="currentColor">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        </div>
      ))}
    </div>
  );
}

/* ── Gold CTA button (scroll to form) ── */
function ScrollCTA() {
  return (
    <a
      href="#optin-form"
      className="block w-full rounded-xl py-5 text-center hover:opacity-90 transition-opacity"
      style={{ background: "#B9945F" }}
    >
      <div className="flex items-center justify-center gap-2 mb-1">
        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M8 5v14l11-7z" />
        </svg>
        <span className="text-white font-black text-base sm:text-lg uppercase tracking-wider">
          Accéder à la vidéo
        </span>
      </div>
      <span className="text-white/70 text-xs uppercase tracking-widest">100% gratuite</span>
    </a>
  );
}

export default function SigmaOptinPage() {
  return (
    <div className="min-h-screen" style={{ background: "#0A0A0A" }}>
      <div className="max-w-lg mx-auto px-4 py-6">

        {/* ═══════ TITRE + OBJECTIONS ═══════ */}
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white text-center leading-tight mb-5">
          La méthode qui permet de solder{" "}
          <span style={{ color: "#B9945F" }}>60 à 100%</span> de son crédit
          immobilier en moins de{" "}
          <span style={{ color: "#B9945F" }}>12 mois</span>
        </h1>

        <ul className="flex flex-col gap-2 mb-8">
          {[
            "Sans apport",
            "Même refusé par ta banque",
            "Même avec un petit salaire",
            "Sans prendre de risque financier",
          ].map((text) => (
            <li key={text} className="flex items-center gap-3">
              <span className="text-sm flex-shrink-0 font-bold" style={{ color: "#B9945F" }}>&#10003;</span>
              <span className="text-white/70 text-sm">{text}</span>
            </li>
          ))}
        </ul>

        {/* ═══════ THUMBNAIL ═══════ */}
        <div className="w-full rounded-xl overflow-hidden mb-6">
          <Image
            src="/images/sigma-vsl-thumbnail.png"
            alt="Sigma Factory — Le plan précis pour devenir rentier"
            width={800}
            height={450}
            unoptimized
            className="w-full h-auto"
          />
        </div>

        {/* ═══════ CTA 1 ═══════ */}
        <ScrollCTA />

        {/* ═══════ BULLET POINTS ═══════ */}
        <div className="mt-8 mb-8">
          <p className="text-white/80 text-sm sm:text-base text-center mb-6">
            Vidéo <strong className="text-white">GRATUITE</strong> qui présente :
          </p>

          <div className="space-y-5 px-2">
            {[
              {
                bold: "Pourquoi l\u2019immobilier locatif classique te piège",
                rest: " — et la méthode hybride qui permet de solder ton crédit en 12 mois",
              },
              {
                bold: "Comment construire un patrimoine net de dette",
                rest: " sans apport, même refusé par ta banque, même avec un petit salaire",
              },
              {
                bold: "Le modèle exact utilisé par 50+ investisseurs",
                rest: " pour générer du cash-flow dès la première année sans gérer les travaux",
              },
              {
                bold: "Les 2 erreurs qui plantent 80% des investisseurs",
                rest: " — et comment les éviter pour sécuriser ton premier immeuble",
              },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <svg className="w-5 h-5 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none">
                  <path d="M9 12l2 2 4-4" stroke="#B9945F" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="12" cy="12" r="10" stroke="#B9945F" strokeWidth="1.5" />
                </svg>
                <p className="text-white/80 text-sm sm:text-base leading-relaxed">
                  <strong className="text-white">{item.bold}</strong>{item.rest}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ═══════ CTA 2 ═══════ */}
        <ScrollCTA />

        {/* ═══════ FORM ═══════ */}
        <div id="optin-form" className="mt-10 mb-8">
          <div
            className="rounded-xl p-6"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <Suspense>
              <OptinForm />
            </Suspense>
          </div>
        </div>

        {/* ═══════ TRUSTPILOT REVIEWS ═══════ */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-white text-center mb-6">
            Ce qu&apos;ils pensent de nous
          </h2>

          <div className="space-y-4">
            {[
              {
                initials: "T",
                name: "Thomas Raymond",
                location: "FR · 1 avis",
                date: "15 mars 2026",
                title: "Patrimoine sans sacrifier ma capacité d\u2019emprunt",
                quote: "J\u2019avais peur de m\u2019endetter sur 25 ans. La méthode Sigma m\u2019a permis de me constituer un patrimoine sans sacrifier ma capacité d\u2019emprunt. L\u2019équipe a tout géré, je n\u2019ai eu qu\u2019à signer chez le notaire.",
              },
              {
                initials: "C",
                name: "Christian Randria",
                location: "FR · 1 avis",
                date: "2 janv. 2026",
                title: "Modèle clé en main et rentabilité immédiate",
                quote: "En tant qu\u2019entrepreneur, je n\u2019ai pas le temps de gérer des travaux ou chercher des locataires. Ce qui m\u2019a convaincu, c\u2019est le modèle clé en main et la rentabilité immédiate.",
              },
              {
                initials: "B",
                name: "Ben",
                location: "FR · 1 avis",
                date: "18 nov. 2025",
                title: "Accompagnement exceptionnel de A à Z",
                quote: "Je cherchais un moyen de préparer ma retraite sereinement. L\u2019accompagnement de Mario et son équipe a été exceptionnel. Ils ont trouvé une pépite, géré la rénovation à distance.",
              },
            ].map((t) => (
              <div
                key={t.name}
                className="rounded-xl p-5"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold"
                      style={{ background: "#00B67A" }}
                    >
                      {t.initials}
                    </div>
                    <div>
                      <p className="text-white text-sm font-semibold">{t.name}</p>
                      <p className="text-white/40 text-xs">{t.location}</p>
                    </div>
                  </div>
                  <p className="text-white/40 text-xs">{t.date}</p>
                </div>
                <Stars />
                <p className="text-white/90 text-sm font-semibold mt-3 mb-2">{t.title}</p>
                <p className="text-white/60 text-sm leading-relaxed">{t.quote}</p>
              </div>
            ))}
          </div>

          {/* Trustpilot badge */}
          <div className="flex flex-col items-center gap-3 mt-8">
            <Image
              src="/images/trustpilot-logo.png"
              alt="Trustpilot"
              width={280}
              height={40}
              unoptimized
              className="opacity-70"
            />
            <span className="text-white/50 text-sm font-medium">5 sur 5</span>
          </div>
        </div>

      </div>
    </div>
  );
}
