import type { Metadata } from "next";
import { Suspense } from "react";
import Image from "next/image";
import OptinForm from "./OptinForm";
import VideoPreview from "./VideoPreview";

export const metadata: Metadata = {
  title: "Vidéo Gratuite | Sigma Factory — Stratégie IDRH",
  description:
    "La méthode qui permet de solder 60 à 100% de son crédit immobilier en moins de 12 mois.",
  robots: { index: false, follow: false },
};

/* ── Reusable CTA block ── */
function CTABlock() {
  return (
    <div id="optin-form" className="w-full max-w-lg mx-auto">
      <div className="rounded-xl p-6 sm:p-8 border border-slate-200 bg-slate-50">
        <Suspense>
          <OptinForm />
        </Suspense>
      </div>
      <p className="text-slate-400 text-xs text-center mt-3">
        Vidéo 100% gratuite &middot; 60 minutes &middot; Aucune carte demandée
      </p>
    </div>
  );
}

/* ── Trustpilot-style star row ── */
function Stars() {
  return (
    <div className="flex gap-0.5">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="w-5 h-5 flex items-center justify-center"
          style={{ background: "#00B67A" }}
        >
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-white" fill="currentColor">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        </div>
      ))}
    </div>
  );
}

export default function SigmaOptinPage() {
  return (
    <div className="min-h-screen bg-white">

      {/* ═══════════════════ HERO ═══════════════════ */}
      <section className="px-4 pt-10 pb-16 sm:pt-16 sm:pb-20">
        <div className="max-w-3xl mx-auto text-center">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <Image
              src="/images/sigma-factory-logo.png"
              alt="Sigma Factory"
              width={180}
              height={54}
              unoptimized
            />
          </div>

          {/* Badge */}
          <span
            className="inline-block text-xs font-semibold uppercase tracking-widest px-4 py-1.5 rounded-full mb-6"
            style={{ background: "rgba(185,148,95,0.1)", color: "#B9945F" }}
          >
            Vidéo gratuite — Disponible maintenant
          </span>

          {/* Headline */}
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 leading-tight mb-6">
            La méthode qui permet de solder{" "}
            <span style={{ color: "#B9945F" }}>60 à 100%</span> de son crédit
            immobilier en moins de{" "}
            <span style={{ color: "#B9945F" }}>12 mois</span>
          </h1>

          {/* Objections */}
          <ul className="flex flex-col gap-2.5 mb-8 text-left max-w-md mx-auto">
            {[
              "Sans apport",
              "Même refusé par ta banque",
              "Même avec un petit salaire",
              "Sans prendre de risque financier",
            ].map((text) => (
              <li key={text} className="flex items-center gap-3">
                <span className="text-sm flex-shrink-0 font-bold" style={{ color: "#B9945F" }}>&#10003;</span>
                <span className="text-slate-600 text-sm sm:text-base">{text}</span>
              </li>
            ))}
          </ul>

          {/* Video preview — muted, click scrolls to form */}
          <div className="w-full max-w-2xl mx-auto mb-10">
            <VideoPreview />
          </div>

          {/* CTA */}
          <CTABlock />

          {/* Presenters */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mt-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-sm font-bold text-slate-500">MM</div>
              <div className="text-left">
                <p className="text-sm font-semibold text-slate-900">Mario Mouri</p>
                <p className="text-xs text-slate-400">Co-fondateur, 71 biens, libre depuis 2021</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-sm font-bold text-slate-500">MC</div>
              <div className="text-left">
                <p className="text-sm font-semibold text-slate-900">Marie Cabut</p>
                <p className="text-xs text-slate-400">Ex-Société Générale, experte méthode Sigma</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════ SOCIAL PROOF — TRUSTPILOT STYLE ═══════════════════ */}
      <section className="px-4 py-16 sm:py-20 bg-slate-50 border-y border-slate-200">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 text-center mb-4">
            Ce qu&apos;ils pensent de nous
          </h2>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-12">
            {[
              { num: "50+", label: "investisseurs accompagnés" },
              { num: "120+", label: "opérations finalisées" },
              { num: "15M€", label: "de patrimoine généré" },
              { num: "98%", label: "livrées dans les délais" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-2xl sm:text-3xl font-bold" style={{ color: "#B9945F" }}>{stat.num}</p>
                <p className="text-xs text-slate-500 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Testimonials — Trustpilot style */}
          <div className="space-y-5">
            {[
              {
                initials: "T",
                name: "Thomas Raymond",
                location: "FR · 1 avis",
                date: "15 mars 2026",
                title: "Patrimoine sans sacrifier ma capacité d\u2019emprunt",
                quote: "J\u2019avais peur de m\u2019endetter sur 25 ans. La méthode Sigma m\u2019a permis de me constituer un patrimoine sans sacrifier ma capacité d\u2019emprunt. L\u2019équipe a tout géré, je n\u2019ai eu qu\u2019à signer chez le notaire. Aujourd\u2019hui, j\u2019ai 3 appartements qui me rapportent tous les mois.",
                detail: "Cadre, Lyon · Apport 15 000 € · Crédit soldé en 11 mois · Cash-flow : 1 250 €/mois",
              },
              {
                initials: "C",
                name: "Christian Randria",
                location: "FR · 1 avis",
                date: "2 janv. 2026",
                title: "Modèle clé en main et rentabilité immédiate",
                quote: "En tant qu\u2019entrepreneur, je n\u2019ai pas le temps de gérer des travaux ou chercher des locataires. Ce qui m\u2019a convaincu, c\u2019est le modèle clé en main et la rentabilité immédiate. Une fois les 2 lots revendus, le stress du crédit a disparu.",
                detail: "Chef d\u2019entreprise, Paris · Apport 20 000 € · Crédit soldé en 13 mois · Cash-flow : 1 580 €/mois",
              },
              {
                initials: "B",
                name: "Ben",
                location: "FR · 1 avis",
                date: "18 nov. 2025",
                title: "Accompagnement exceptionnel de A à Z",
                quote: "Je cherchais un moyen de préparer ma retraite sereinement. L\u2019accompagnement de Mario et son équipe a été exceptionnel. Ils ont trouvé une pépite, géré la rénovation à distance, et j\u2019ai récupéré mon capital de départ après la première revente.",
                detail: "Ingénieur, Toulouse · Apport 12 000 € · Crédit soldé en 9 mois · Cash-flow : 950 €/mois",
              },
            ].map((t) => (
              <div
                key={t.name}
                className="rounded-xl p-5 sm:p-6 bg-white border border-slate-200"
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
                      <p className="text-slate-900 text-sm font-semibold">{t.name}</p>
                      <p className="text-slate-400 text-xs">{t.location}</p>
                    </div>
                  </div>
                  <p className="text-slate-400 text-xs">{t.date}</p>
                </div>
                <Stars />
                <p className="text-slate-900 text-sm font-semibold mt-3 mb-2">{t.title}</p>
                <p className="text-slate-600 text-sm leading-relaxed">{t.quote}</p>
                <p className="text-slate-400 text-xs mt-3 italic">{t.detail}</p>
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
            <span className="text-slate-400 text-sm font-medium">5 sur 5</span>
          </div>
        </div>
      </section>

      {/* ═══════════════════ FAQ ═══════════════════ */}
      <section className="px-4 py-16 sm:py-20">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 text-center mb-10">
            Les questions qu&apos;on nous pose le plus souvent :
          </h2>

          <div className="space-y-4">
            {[
              {
                q: "Concrètement, c\u2019est possible d\u2019avoir du cash-flow sans s\u2019endetter 25 ans ?",
                a: "Oui. La revente de lots après rénovation rembourse le crédit en 12 mois environ. Les lots conservés génèrent du cash-flow net, sans dette.",
              },
              {
                q: "Je n\u2019ai jamais investi en immobilier, c\u2019est pour moi ?",
                a: "C\u2019est justement le profil idéal. Notre équipe gère tout : recherche, financement, travaux, mise en location. Tu n\u2019as pas besoin d\u2019être expert.",
              },
              {
                q: "Il faut combien d\u2019apport pour démarrer ?",
                a: "À partir de 10 000 €. L\u2019essentiel du financement passe par le crédit bancaire, que nous optimisons pour toi.",
              },
              {
                q: "Les banques refusent en ce moment, comment ça passe ?",
                a: "Notre écosystème inclut des courtiers partenaires qui connaissent les montages IDRH. Le dossier est préparé pour maximiser l\u2019acceptation.",
              },
              {
                q: "Quelle est la différence avec les autres acteurs du marché ?",
                a: "Sigma Factory maîtrise toute la chaîne : recherche, financement, travaux, gestion, fiscalité. Ce n\u2019est pas une formation — c\u2019est un accompagnement opérationnel.",
              },
              {
                q: "La vidéo dure combien de temps et c\u2019est vraiment gratuit ?",
                a: "60 minutes. 100% gratuit. Aucune carte bancaire demandée. Tu peux te désinscrire à tout moment.",
              },
            ].map((faq) => (
              <details key={faq.q} className="group rounded-xl border border-slate-200 bg-white">
                <summary className="px-5 py-4 cursor-pointer text-sm font-semibold text-slate-900 flex items-center justify-between">
                  {faq.q}
                  <svg className="w-4 h-4 text-slate-400 flex-shrink-0 ml-3 group-open:rotate-180 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="px-5 pb-4">
                  <p className="text-sm text-slate-500 leading-relaxed">{faq.a}</p>
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════ FINAL CTA ═══════════════════ */}
      <section className="px-4 py-16 sm:py-20 bg-slate-50 border-t border-slate-200">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight mb-4">
            60 minutes. Le modèle complet, les chiffres, les zones.
          </h2>
          <p className="text-slate-500 text-sm sm:text-base mb-10">
            Tu sors avec la marche à suivre pour ta première opération.
            Sans engagement. Sans replay. Tout se joue maintenant.
          </p>

          <CTABlock />

          {/* Trust badges */}
          <div className="flex items-center justify-center gap-6 mt-10">
            {["SNPI", "AMF", "ORIAS"].map((badge) => (
              <span
                key={badge}
                className="text-xs font-semibold tracking-wider text-slate-300"
              >
                {badge}
              </span>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
