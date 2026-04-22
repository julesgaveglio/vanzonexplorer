import type { Metadata } from "next";
import Image from "next/image";
import { sanityFetch } from "@/lib/sanity/client";
import { getFormationCardsQuery } from "@/lib/sanity/queries";
import type { FormationCardData } from "@/components/formation/FormationCardStack";
import FormationCardStack from "@/components/formation/FormationCardStack";
import ComparisonSection from "@/components/formation/ComparisonSection";

import CTAButton from "@/components/formation/CTAButton";

export const metadata: Metadata = {
  title: "Van Business Academy — Construis ta liberté van par van",
  description:
    "Apprends à réaménager ton van, le mettre en location, le revendre avec plus-value et recommencer. Accompagnement terrain créé par des loueurs en activité au Pays Basque.",
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
    "https://cdn.sanity.io/images/lewexa74/production/28a2c5acbe2ee16169d4ace1ab0522481c43d356-1170x2080.jpg?auto=format&q=82",
  provider: {
    "@type": "Organization",
    name: "Vanzon Explorer",
    url: "https://vanzonexplorer.com",
  },
  instructor: [
    {
      "@type": "Person",
      name: "Jules Gaveglio",
      jobTitle: "Co-fondateur Vanzon Explorer",
      url: "https://vanzonexplorer.com/a-propos",
    },
    {
      "@type": "Person",
      name: "Elio Dubernet",
      jobTitle: "Co-fondateur Vanzon Explorer",
      url: "https://vanzonexplorer.com/a-propos",
    },
  ],
  hasCourseInstance: {
    "@type": "CourseInstance",
    courseMode: "online",
    inLanguage: "fr-FR",
    offers: {
      "@type": "Offer",
      priceCurrency: "EUR",
      availability: "https://schema.org/InStock",
      seller: { "@type": "Organization", name: "Vanzon Explorer" },
    },
  },
  educationalLevel: "Beginner",
  inLanguage: "fr-FR",
};

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

          {/* H1 */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-slate-900 leading-[1.08] tracking-tight">
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
          </h1>

          {/* Sous-titre */}
          <p className="text-lg sm:text-xl text-slate-500 mt-6 max-w-2xl mx-auto leading-relaxed">
            Un accompagnement terrain pour apprendre à réaménager ton van, le
            mettre en location, le revendre avec plus-value, et recommencer.
            Créé par des loueurs en activité au Pays Basque.
          </p>

          {/* CTA visible sans scroll */}
          <div className="mt-8">
            <CTAButton>En savoir plus →</CTAButton>
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

          <CTAButton>En savoir plus →</CTAButton>
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
                src="https://cdn.sanity.io/images/lewexa74/production/28a2c5acbe2ee16169d4ace1ab0522481c43d356-1170x2080.jpg?auto=format&q=82&w=800"
                alt="Jules et Elio, fondateurs de Van Business Academy"
                fill
                className="object-cover"
                unoptimized
              />
              {/* Badge overlay */}
              <div className="absolute bottom-4 left-4">
                <span
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold text-white backdrop-blur-sm"
                  style={{
                    background: "rgba(0,0,0,0.60)",
                  }}
                >
                  🎓 Van Business Academy™
                </span>
              </div>
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
                <CTAButton fullWidth>En savoir plus →</CTAButton>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── COMPARAISON ── */}
      <ComparisonSection />
    </>
  );
}
