import type { Metadata } from "next";
import { Suspense } from "react";
import Image from "next/image";
import OptinForm from "./OptinForm";

export const metadata: Metadata = {
  title: "Vidéo Gratuite | Sigma Factory — Stratégie IDRH",
  description:
    "Acheter un immeuble, en revendre 2 lots, garder 3 en cash-flow net de dette. La méthode pour construire un patrimoine immobilier rentable dès la deuxième année.",
  robots: { index: false, follow: false },
};

/* ── Reusable CTA block ── */
function CTABlock() {
  return (
    <div className="w-full max-w-lg mx-auto">
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

/* ── Step card ── */
function Step({ num, title, desc }: { num: string; title: string; desc: string }) {
  return (
    <div className="flex gap-4">
      <div
        className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
        style={{ background: "#B9945F" }}
      >
        {num}
      </div>
      <div>
        <p className="font-semibold text-slate-900 text-sm sm:text-base">{title}</p>
        <p className="text-slate-500 text-sm mt-1">{desc}</p>
      </div>
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
          <ul className="flex flex-col gap-2.5 mb-10 text-left max-w-md mx-auto">
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

      {/* ═══════════════════ PROBLÈME ═══════════════════ */}
      <section className="px-4 py-16 sm:py-20 bg-slate-50 border-y border-slate-200">
        <div className="max-w-2xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#B9945F" }}>
            Le problème
          </p>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight mb-6">
            Tu veux investir en immobilier. Mais tu ne veux pas te tromper.
          </h2>
          <div className="text-slate-600 text-sm sm:text-base leading-relaxed space-y-4">
            <p>
              Tu es salarié bien payé ou chef d&apos;entreprise. Tu as économisé. Tu sens que laisser
              ton argent dormir, c&apos;est perdre du terrain face à l&apos;inflation.
            </p>
            <p>Tu as regardé l&apos;immobilier locatif classique. Et tu as vite vu les limites :</p>
          </div>

          <div className="mt-6 space-y-4">
            {[
              "Un crédit sur 25 ans, qui plombe ta capacité d\u2019emprunt et te suit jusqu\u2019à la retraite.",
              "Un cash-flow ridicule, parfois négatif, qui te transforme en gestionnaire à temps partiel.",
              "Des biens à trouver, des travaux à gérer, des locataires à filtrer — alors que tu as déjà un boulot prenant.",
              "Des banques de plus en plus dures, qui refusent même les bons dossiers.",
            ].map((text) => (
              <div key={text} className="flex items-start gap-3">
                <span className="text-red-400 text-sm mt-0.5 flex-shrink-0">&#10005;</span>
                <p className="text-slate-600 text-sm sm:text-base">{text}</p>
              </div>
            ))}
          </div>

          <p className="text-slate-600 text-sm sm:text-base leading-relaxed mt-6">
            Pendant ce temps, les mois passent. Et le patrimoine que tu veux construire
            — pour lever le pied, préparer ta retraite ou transmettre à tes enfants —
            il reste une idée. Pas une réalité.
          </p>
        </div>
      </section>

      {/* ═══════════════════ LA MÉTHODE ═══════════════════ */}
      <section className="px-4 py-16 sm:py-20">
        <div className="max-w-2xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#B9945F" }}>
            La méthode
          </p>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight mb-4">
            Et s&apos;il existait une autre façon de faire ?
          </h2>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed mb-10">
            Pas un crédit sur 25 ans. Pas un bien à gérer seul. Pas un investissement
            qui ne rapporte que dans 20 ans. Une méthode différente, utilisée par les investisseurs
            qui veulent du cash-flow réel, vite, et un patrimoine net de dette.
          </p>

          <div className="space-y-8">
            <Step
              num="01"
              title="Tu acquiers un immeuble de 5 appartements à rénover."
              desc="Sélectionné dans une zone à fort potentiel, validé par notre équipe. On s'occupe de ton financement."
            />
            <Step
              num="02"
              title="On prend en charge la rénovation complète."
              desc="Tu ne lèves pas le petit doigt. Nos artisans, notre suivi, notre contrôle qualité."
            />
            <Step
              num="03"
              title="On revend 2 appartements une fois rénovés."
              desc="La plus-value rembourse l'intégralité du prêt."
            />
            <Step
              num="04"
              title="Il te reste 3 appartements payés, qui génèrent du cash-flow."
              desc="Pour le reste de ta vie."
            />
          </div>

          <div className="mt-10 p-5 rounded-xl border border-slate-200 bg-slate-50">
            <p className="text-slate-700 text-sm sm:text-base leading-relaxed">
              En <strong>12 mois</strong>, tu passes d&apos;épargnant à propriétaire d&apos;un patrimoine
              immobilier qui te paie. Sans avoir géré un seul chantier ni cherché un seul bien.
            </p>
          </div>
        </div>
      </section>

      {/* ═══════════════════ COMPARATIF ═══════════════════ */}
      <section className="px-4 py-16 sm:py-20 bg-slate-50 border-y border-slate-200">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-widest mb-3 text-center" style={{ color: "#B9945F" }}>
            Le comparatif
          </p>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 text-center leading-tight mb-10">
            Pourquoi cette méthode plutôt qu&apos;une autre ?
          </h2>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr>
                  <th className="text-left py-3 px-4 text-slate-400 font-medium"></th>
                  <th className="py-3 px-4 text-slate-400 font-medium">Locatif classique</th>
                  <th className="py-3 px-4 font-semibold" style={{ color: "#B9945F" }}>Méthode Sigma</th>
                  <th className="py-3 px-4 text-slate-400 font-medium">Achat-revente</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { label: "Endettement", classic: "20 à 25 ans", sigma: "12 mois", ar: "Variable" },
                  { label: "Cash-flow", classic: "Faible ou négatif", sigma: "3 loyers nets", ar: "Aucun" },
                  { label: "Patrimoine", classic: "1 bien endetté", sigma: "3 apparts payés", ar: "0 bien" },
                  { label: "Travaux", classic: "À ta charge", sigma: "100% délégué", ar: "Délégué" },
                  { label: "Accompagnement", classic: "Aucun", sigma: "Personnalisé", ar: "Standardisé" },
                ].map((row) => (
                  <tr key={row.label} className="border-t border-slate-200">
                    <td className="py-3 px-4 font-medium text-slate-700">{row.label}</td>
                    <td className="py-3 px-4 text-center text-slate-500">{row.classic}</td>
                    <td className="py-3 px-4 text-center font-semibold text-slate-900" style={{ background: "rgba(185,148,95,0.05)" }}>{row.sigma}</td>
                    <td className="py-3 px-4 text-center text-slate-500">{row.ar}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-slate-600 text-sm sm:text-base text-center mt-8 leading-relaxed max-w-xl mx-auto">
            Tu n&apos;achètes pas un bien. Tu construis un actif qui te paie pour le reste
            de ta vie — et qui ne te coûte plus rien dès le 13e mois.
          </p>
        </div>
      </section>

      {/* ═══════════════════ CE QUE TU VAS DÉCOUVRIR ═══════════════════ */}
      <section className="px-4 py-16 sm:py-20">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 text-center leading-tight mb-10">
            Ce que tu vas découvrir en 60 minutes :
          </h2>

          <div className="space-y-8">
            {[
              {
                num: "1",
                title: "Le modèle complet, chiffres à l\u2019appui.",
                desc: "Le détail d\u2019une opération réelle : prix d\u2019achat, travaux, reventes, cash-flow final. Tu repars avec les ordres de grandeur exacts pour ton propre projet.",
              },
              {
                num: "2",
                title: "Les 3 régions où la méthode performe le mieux en 2026.",
                desc: "Pas une carte théorique. Les villes précises où nos opérations cartonnent — et pourquoi.",
              },
              {
                num: "3",
                title: "Le profil financier qui passe en banque.",
                desc: "Comment présenter ton dossier pour décrocher le financement, même quand les banques sont en mode « refus systématique ».",
              },
              {
                num: "4",
                title: "Les 2 erreurs qui plantent 80% des investisseurs.",
                desc: "Celles que personne n\u2019ose te dire — et qui transforment un bon deal en cauchemar.",
              },
            ].map((item) => (
              <div key={item.num} className="flex gap-4">
                <div
                  className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs"
                  style={{ background: "#B9945F" }}
                >
                  {item.num}
                </div>
                <div>
                  <p className="font-semibold text-slate-900 text-sm sm:text-base">{item.title}</p>
                  <p className="text-slate-500 text-sm mt-1">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <p className="text-slate-600 text-sm sm:text-base text-center mt-10 leading-relaxed">
            À la fin de la vidéo, tu sauras si cette méthode est faite pour toi.
            Et si oui, comment démarrer ta première opération.
          </p>

          {/* CTA */}
          <div className="mt-10">
            <CTABlock />
          </div>
        </div>
      </section>

      {/* ═══════════════════ SOCIAL PROOF ═══════════════════ */}
      <section className="px-4 py-16 sm:py-20 bg-slate-50 border-y border-slate-200">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 text-center mb-10">
            Ils l&apos;ont fait avec nous :
          </h2>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mb-14">
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

          {/* Testimonials */}
          <div className="space-y-6">
            {[
              {
                name: "Thomas Raymond",
                role: "Cadre, Lyon",
                apport: "15 000 €",
                operation: "Immeuble 5 lots à Roanne",
                solde: "11 mois",
                cashflow: "1 250 € / mois",
                quote: "J\u2019avais peur de m\u2019endetter sur 25 ans. La méthode Sigma m\u2019a permis de me constituer un patrimoine sans sacrifier ma capacité d\u2019emprunt. L\u2019équipe a tout géré, je n\u2019ai eu qu\u2019à signer chez le notaire.",
              },
              {
                name: "Christian Randria",
                role: "Chef d\u2019entreprise, Paris",
                apport: "20 000 €",
                operation: "Immeuble 6 lots à Saint-Étienne",
                solde: "13 mois",
                cashflow: "1 580 € / mois",
                quote: "En tant qu\u2019entrepreneur, je n\u2019ai pas le temps de gérer des travaux ou chercher des locataires. Ce qui m\u2019a convaincu, c\u2019est le modèle clé en main et la rentabilité immédiate.",
              },
              {
                name: "Ben",
                role: "Ingénieur, Toulouse",
                apport: "12 000 €",
                operation: "Immeuble 4 lots à Perpignan",
                solde: "9 mois",
                cashflow: "950 € / mois",
                quote: "Je cherchais un moyen de préparer ma retraite sereinement. L\u2019accompagnement de Mario et son équipe a été exceptionnel. Ils ont trouvé une pépite, géré la rénovation à distance.",
              },
            ].map((t) => (
              <div key={t.name} className="rounded-xl border border-slate-200 bg-white p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-500">
                    {t.name.split(" ").map(w => w[0]).join("")}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{t.name}</p>
                    <p className="text-xs text-slate-400">{t.role}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                  {[
                    { label: "Apport", value: t.apport },
                    { label: "Opération", value: t.operation },
                    { label: "Crédit soldé en", value: t.solde },
                    { label: "Cash-flow net", value: t.cashflow },
                  ].map((d) => (
                    <div key={d.label}>
                      <p className="text-[10px] uppercase tracking-wider text-slate-400">{d.label}</p>
                      <p className="text-xs font-semibold text-slate-700">{d.value}</p>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-slate-600 leading-relaxed italic">&ldquo;{t.quote}&rdquo;</p>
              </div>
            ))}
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
