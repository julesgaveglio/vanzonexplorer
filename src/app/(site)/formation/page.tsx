import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { sanityFetch } from "@/lib/sanity/client";
import { getFormationCardsQuery } from "@/lib/sanity/queries";
import type { FormationCardData } from "@/components/formation/FormationCardStack";
import FormationCardStack from "@/components/formation/FormationCardStack";
import ComparisonSection from "@/components/formation/ComparisonSection";

import LiquidButton from "@/components/ui/LiquidButton";
import GeoFaqSection, { type GeoFaqItem } from "@/components/seo/GeoFaqSection";
import FormationViewTracker from "./FormationViewTracker";

export const metadata: Metadata = {
  title: "Van Business Academy — Formation Business Van Aménagé",
  description:
    "Réaménage, loue, revends, recommence. Formation terrain par des loueurs en activité au Pays Basque. Lance ton business van dès maintenant.",
  alternates: {
    canonical: "https://vanzonexplorer.com/formation",
  },
  openGraph: {
    title: "Van Business Academy — Construis ta liberté van par van",
    description:
      "Réaménage. Loue. Revends. Recommence. Un accompagnement terrain pour lancer ton business de van aménagé.",
    type: "website",
  },
};

const courseJsonLd = {
  "@context": "https://schema.org",
  "@type": "Course",
  name: "Van Business Academy",
  description:
    "Accompagnement terrain pour réaménager ton van, le mettre en location, le revendre avec plus-value et recommencer. Créé par des loueurs en activité au Pays Basque.",
  url: "https://vanzonexplorer.com/formation",
  image:
    "https://cdn.sanity.io/images/lewexa74/production/16f9120e659bdd4bba47e663e9df9a1a9293fe3f-1170x2080.jpg?auto=format&q=82",
  provider: {
    "@type": "Organization",
    name: "Vanzon Explorer",
    url: "https://vanzonexplorer.com",
  },
  instructor: [
    {
      "@type": "Person",
      name: "Jules Gaveglio",
      jobTitle: "Fondateur Vanzon Explorer",
      url: "https://vanzonexplorer.com/a-propos",
    },
  ],
  hasCourseInstance: {
    "@type": "CourseInstance",
    courseMode: "online",
    inLanguage: "fr-FR",
    offers: {
      "@type": "Offer",
      price: "997",
      priceCurrency: "EUR",
      availability: "https://schema.org/InStock",
      seller: { "@type": "Organization", name: "Vanzon Explorer" },
    },
  },
  educationalLevel: "Beginner",
  inLanguage: "fr-FR",
};

// FAQ GEO — réponses autonomes et chiffrées, pensées pour être citées
// telles quelles par ChatGPT, Perplexity, Claude et les AI Overviews.
const formationFaqItems: GeoFaqItem[] = [
  {
    q: "Qu'est-ce que la Van Business Academy ?",
    a: "La Van Business Academy (VBA) est une formation en ligne créée par Jules Gaveglio, loueur de vans en activité au Pays Basque. Elle enseigne le cycle complet du business van : acheter le bon véhicule, l'aménager soi-même, le mettre en location sur des plateformes comme Yescapa ou Wikicampers, puis le revendre avec plus-value. Le programme compte 10 modules vidéo et une soixantaine de leçons.",
  },
  {
    q: "Combien rapporte un van aménagé mis en location ?",
    a: "D'après les chiffres réels de la flotte Vanzon Explorer au Pays Basque, un van aménagé loué entre 65 € et 95 € la nuit génère plusieurs centaines d'euros par mois en moyenne lissée sur l'année, avec l'essentiel des revenus concentré sur la haute saison (15 avril – 15 septembre). Les plateformes de location entre particuliers prélèvent une commission de l'ordre de 15 à 20 %.",
  },
  {
    q: "Faut-il homologuer son van en VASP ?",
    a: "L'homologation VASP (Véhicule Automoteur Spécialement Aménagé) n'est pas obligatoire pour voyager dans son van, mais elle présente trois avantages concrets : une meilleure valeur à la revente (environ +5 000 € constatés), des assurances moins chères, et une couverture complète de l'aménagement en cas de sinistre. La formation consacre un volet complet à l'homologation VASP.",
  },
  {
    q: "Peut-on se lancer sans expérience en bricolage ou en mécanique ?",
    a: "Oui. La méthode part de zéro : choix du véhicule (kilométrage, moteur, budget), plan d'aménagement, étapes de construction dans l'ordre, jusqu'à l'annonce de location. Jules Gaveglio a lui-même appris en autodidacte avant d'aménager les vans de sa propre flotte.",
  },
  {
    q: "En combien de temps peut-on rentabiliser un van acheté pour la location ?",
    a: "Avec un fourgon d'occasion acheté autour de 10 000 à 15 000 € et un aménagement fait soi-même, le budget total reste souvent sous les 20 000 €. Aux tarifs de location constatés au Pays Basque (65-95 €/nuit), les loueurs actifs couvrent généralement leur investissement en 2 à 3 saisons, tout en conservant un van revendable avec plus-value.",
  },
];

export default async function FormationPage() {
  const cards = await sanityFetch<FormationCardData[]>(getFormationCardsQuery) ?? [];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(courseJsonLd) }}
      />
      <FormationViewTracker />

      {/* ── HERO (bandeau académie) ── */}
      <section
        className="border-b"
        style={{
          background: "linear-gradient(180deg, #FFFFFF 0%, #FAF6F0 100%)",
          borderColor: "rgba(185,148,95,0.18)",
        }}
      >
        <div className="max-w-4xl mx-auto px-6 pt-10 pb-10">
          {/* Fil d'ariane */}
          <nav aria-label="Fil d'ariane" className="flex items-center gap-1.5 text-xs font-medium text-slate-400 mb-6">
            <Link href="/" className="hover:text-slate-600 transition-colors">Accueil</Link>
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
            <span className="text-slate-600">Formation</span>
          </nav>

          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-xl">
              <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "var(--gold)" }}>
                Van Business Academy
              </p>
              <h1 className="font-sans text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                Formation aménagement van &amp; business de la location
              </h1>
              <p className="text-slate-500 text-base leading-relaxed mt-3">
                Apprenez à acheter, aménager, louer puis revendre un van avec
                plus-value — la méthode complète, enseignée sur le terrain par des
                loueurs en activité au Pays Basque.
              </p>

              {/* Le cycle en 4 étapes */}
              <div className="flex flex-wrap gap-2 mt-5">
                {["Acheter", "Aménager", "Louer", "Revendre"].map((step, i) => (
                  <span
                    key={step}
                    className="flex items-center gap-1.5 bg-white text-xs font-semibold text-slate-600 px-3 py-1.5 rounded-full"
                    style={{ border: "1px solid rgba(185,148,95,0.3)" }}
                  >
                    <span className="font-bold" style={{ color: "var(--gold)" }}>
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    {step}
                  </span>
                ))}
              </div>
            </div>

            <div className="hidden md:block text-right pb-1">
              <p className="font-sans text-4xl font-black text-slate-900 leading-none">10</p>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mt-1">
                modules · 60 leçons vidéo
              </p>
            </div>
          </div>

          {/* CTA */}
          <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3">
            <LiquidButton variant="gold" size="lg" href="/van-business-academy/presentation">Découvrir la méthode (vidéo 12 min) →</LiquidButton>
            <p className="text-slate-400 text-xs max-w-xs leading-relaxed">
              Gratuit — puis appel diagnostic offert. Tu sais exactement où tu vas
              avant de payer quoi que ce soit.
            </p>
          </div>

          {/* Preuve immédiate */}
          <div className="mt-7 grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { value: "4 ans", label: "de terrain, pas de théorie" },
              { value: "2 vans", label: "exploités en location" },
              { value: "5/5", label: "sur Google" },
              { value: "+12 500 €", label: "sur un cycle complet*" },
            ].map((s) => (
              <div
                key={s.label}
                className="bg-white rounded-xl px-4 py-3.5"
                style={{ border: "1px solid rgba(185,148,95,0.18)" }}
              >
                <p className="font-sans text-xl md:text-2xl font-black text-slate-900 leading-none">{s.value}</p>
                <p className="text-xs text-slate-500 font-medium mt-1.5 leading-snug">{s.label}</p>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            *Van acheté 9 000 €, aménagé pour 5 000 €, loué 8 mois (+5 500 € nets), revente estimée 21 000 €.
          </p>
        </div>

        {/* Card stack formation */}
        {cards.length > 0 && <FormationCardStack cards={cards} />}
      </section>

      {/* ── LE CYCLE — la promesse découpée en étapes visibles ── */}
      <section className="py-16 md:py-20 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "var(--gold)" }}>
              La méthode
            </p>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 leading-tight">
              Un cycle, quatre étapes.
            </h2>
            <p className="text-slate-500 text-lg mt-3 max-w-xl mx-auto">
              Le même que celui qu&apos;on applique à notre propre flotte depuis 4 ans.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-slate-200 rounded-2xl overflow-hidden border border-slate-200">
            {[
              { num: "01", title: "Acheter malin", desc: "Trouver le bon fourgon au bon prix — kilométrage, moteur, négociation. C'est ici que se joue ta marge." },
              { num: "02", title: "Aménager toi-même", desc: "De zéro compétence à un aménagement solide, homologable VASP. Sans savoir planter un clou au départ." },
              { num: "03", title: "Louer", desc: "Mettre ton van en location et optimiser ton taux d'occupation, ton annonce et tes tarifs saison par saison." },
              { num: "04", title: "Revendre avec plus-value", desc: "Un van bien aménagé et homologué se revend plus cher qu'il ne t'a coûté. Puis tu recommences — en plus grand." },
            ].map((step) => (
              <div key={step.num} className="bg-white p-6 md:p-8">
                <span className="text-xs font-bold tracking-widest" style={{ color: "var(--gold)" }}>{step.num}</span>
                <h3 className="text-lg font-black text-slate-900 mt-3 mb-2">{step.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CURIOSITÉ SPÉCIFIQUE — ce que la vidéo révèle ── */}
      <section className="py-16 md:py-20" style={{ background: "#FAF6F0" }}>
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 leading-tight">
              Dans la vidéo, tu vas découvrir :
            </h2>
          </div>

          <ul className="space-y-4 mb-10">
            {[
              "Pourquoi 90 % des aménagements amateurs perdent 5 000 € à la revente — et le document administratif qui inverse la donne.",
              "Le vrai chiffre que rapporte un van en location au Pays Basque (pas celui des vendeurs de rêve — le nôtre, relevés bancaires à l'appui).",
              "Comment on a acheté un utilitaire 9 000 € et pourquoi il en vaut 21 000 aujourd'hui — étape par étape.",
              "La peur n°1 qui bloque tout le monde (« les locataires vont tout casser ») et ce que 2 ans de location nous ont vraiment coûté : 15 €.",
            ].map((item) => (
              <li key={item} className="flex items-start gap-4 bg-white rounded-2xl px-6 py-5" style={{ border: "1px solid rgba(185,148,95,0.15)" }}>
                <svg className="w-5 h-5 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="var(--gold)" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-slate-700 text-sm md:text-base leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>

          <div className="text-center">
            <LiquidButton variant="gold" size="lg" href="/van-business-academy/presentation">Regarder la vidéo (12 min) →</LiquidButton>
            <p className="text-slate-400 text-xs mt-3">Sans inscription payante. Sans engagement.</p>
          </div>
        </div>
      </section>

      {/* ── CARTE FORMATION ── */}
      <section
        className="py-16 md:py-20"
        style={{ background: "#FAF6F0" }}
      >
        <div className="max-w-xl mx-auto px-6">
          <div
            className="rounded-3xl overflow-hidden shadow-lg"
            style={{
              background: "#FFFFFF",
              border: "1px solid rgba(185,148,95,0.12)",
            }}
          >
            {/* Image */}
            <div className="relative aspect-[16/9]">
              <Image
                src="/images/construis-ta-liberte.jpg"
                alt="Vue depuis un van aménagé au coucher de soleil — Construis ta liberté"
                fill
                className="object-cover"
                unoptimized
              />
            </div>

            {/* Contenu */}
            <div className="px-6 py-8 sm:px-8">
              <div className="space-y-5">
                {/* Bullet 1 - Pour qui */}
                <div className="flex items-start gap-3">
                  <span
                    className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-base mt-0.5"
                    style={{ background: "rgba(185,148,95,0.10)" }}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="var(--gold)" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  </span>
                  <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
                    <strong>Le point de départ :</strong> un utilitaire acheté 9 000 €,
                    zéro compétence en bricolage, zéro diplôme technique.
                  </p>
                </div>

                {/* Bullet 2 - Comment */}
                <div className="flex items-start gap-3">
                  <span
                    className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-base mt-0.5"
                    style={{ background: "rgba(185,148,95,0.10)" }}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="var(--gold)" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  </span>
                  <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
                    <strong>8 mois de location plus tard :</strong> +5 500 € nets
                    encaissés, un van estimé 21 000 € à la revente.
                  </p>
                </div>

                {/* Bullet 3 - Promesse */}
                <div className="flex items-start gap-3">
                  <span
                    className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-base mt-0.5"
                    style={{ background: "rgba(185,148,95,0.10)" }}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="var(--gold)" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  </span>
                  <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
                    <strong>La formation :</strong> exactement cette méthode,
                    documentée étape par étape par des loueurs en activité au
                    Pays Basque — pas par des théoriciens.
                  </p>
                </div>
              </div>

              {/* CTA */}
              <div className="mt-8">
                <LiquidButton variant="gold" size="lg" href="/van-business-academy/presentation" fullWidth>Voir comment (vidéo 12 min) →</LiquidButton>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── COMPARAISON ── */}
      <ComparisonSection />

      {/* ── FAQ (GEO) ── */}
      <GeoFaqSection
        accent="gold"
        subtitle="Ce qu'il faut savoir avant de se lancer dans le business du van aménagé."
        items={formationFaqItems}
      />
    </>
  );
}
