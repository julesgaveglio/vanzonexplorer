import type { Metadata } from "next";
import Image from "next/image";
import { sanityFetch } from "@/lib/sanity/client";
import { getFormationCardsQuery } from "@/lib/sanity/queries";
import type { FormationCardData } from "@/components/formation/FormationCardStack";
import FormationCardStack from "@/components/formation/FormationCardStack";
import ComparisonSection from "@/components/formation/ComparisonSection";

import LiquidButton from "@/components/ui/LiquidButton";
import GeoFaqSection, { type GeoFaqItem } from "@/components/seo/GeoFaqSection";

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

      {/* ── HERO ── */}
      <section
        className="relative overflow-hidden"
        style={{
          background:
            "linear-gradient(160deg, #FFFFFF 0%, #FAF6F0 60%, #F5EDE5 100%)",
        }}
      >
        {/* Blobs décoratifs */}
        <div
          className="absolute top-20 -left-40 w-[500px] h-[500px] rounded-full opacity-[0.12] blur-3xl"
          style={{ background: "#CDA77B" }}
        />
        <div
          className="absolute top-60 right-0 w-96 h-96 rounded-full opacity-[0.10] blur-3xl"
          style={{ background: "#B9945F" }}
        />

        <div className="relative max-w-4xl mx-auto px-6 pt-24 pb-10 md:pt-36 md:pb-12 text-center">
          {/* Badge */}
          <span
            className="inline-flex items-center gap-2 badge-glass !px-5 !py-2 text-sm font-medium mb-8"
            style={{
              background: "rgba(205,167,123,0.12)",
              border: "1px solid rgba(205,167,123,0.35)",
              color: "#B9945F",
            }}
          >
            🎓 Van Business Academy
          </span>

          {/* Slogan visuel */}
          <p className="text-4xl sm:text-5xl md:text-6xl font-black text-slate-900 leading-[1.08] tracking-tight" aria-hidden="true">
            Réaménage. Loue. Revends. Recommence.
            <br />
            <span
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage:
                  "linear-gradient(135deg, #B9945F 0%, #E4D398 100%)",
              }}
            >
              Construis ta liberté van par van.
            </span>
          </p>

          {/* H1 SEO */}
          <h1 className="text-lg sm:text-xl text-slate-500 mt-6 max-w-2xl mx-auto leading-relaxed">
            Formation aménagement van : apprenez à réaménager, louer et revendre un van avec plus-value.
            Accompagnement terrain par des loueurs en activité au Pays Basque.
          </h1>

          {/* CTA visible sans scroll */}
          <div className="mt-8">
            <LiquidButton variant="gold" size="lg" href="/van-business-academy/presentation">En savoir plus →</LiquidButton>
          </div>
        </div>

        {/* Card stack formation */}
        {cards.length > 0 && <FormationCardStack cards={cards} />}
      </section>

      {/* ── CTA SECTION ── */}
      <section className="py-16 md:py-20 bg-white">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed mb-8">
            Un accompagnement terrain pour apprendre à réaménager ton van, le
            mettre en location, le revendre avec plus-value, et recommencer.
            Créé par des loueurs en activité au Pays Basque.
          </p>

          <LiquidButton variant="gold" size="lg" href="/van-business-academy/presentation">En savoir plus →</LiquidButton>
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
                    🎯
                  </span>
                  <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
                    Pour celles et ceux qui veulent réaménager leur van,
                    l&apos;exploiter intelligemment et construire leur liberté
                    projet après projet.
                  </p>
                </div>

                {/* Bullet 2 - Comment */}
                <div className="flex items-start gap-3">
                  <span
                    className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-base mt-0.5"
                    style={{ background: "rgba(185,148,95,0.10)" }}
                  >
                    🗺️
                  </span>
                  <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
                    Une méthode progressive : du choix du van à la revente, en
                    passant par l&apos;aménagement, l&apos;homologation et
                    l&apos;exploitation.
                  </p>
                </div>

                {/* Bullet 3 - Promesse */}
                <div className="flex items-start gap-3">
                  <span
                    className="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-base mt-0.5"
                    style={{ background: "rgba(185,148,95,0.10)" }}
                  >
                    🔧
                  </span>
                  <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
                    Une formation 100% terrain, créée par des loueurs de vans en
                    activité au Pays Basque.
                  </p>
                </div>
              </div>

              {/* CTA */}
              <div className="mt-8">
                <LiquidButton variant="gold" size="lg" href="/van-business-academy/presentation" fullWidth>En savoir plus →</LiquidButton>
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
