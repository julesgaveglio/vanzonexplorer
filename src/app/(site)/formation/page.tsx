import type { Metadata } from "next";
import Image from "next/image";
import GlassCard from "@/components/ui/GlassCard";
import OtherServices from "@/components/ui/OtherServices";
import FormationHero from "@/components/formation/FormationHero";
import ProgrammeAccordion from "@/components/formation/ProgrammeAccordion";
import FormationFAQ from "@/components/formation/FormationFAQ";
import FormationCTA from "@/components/formation/FormationCTA";
import ComparisonSection from "@/components/formation/ComparisonSection";
import SylvainTestimonial from "@/components/formation/SylvainTestimonial";

export const metadata: Metadata = {
  title: "Van Business Academy — Formation Vanlife | Vanzon Explorer",
  description:
    "Apprends à aménager ton fourgon et lancer ton business de location de van. Formation complète par Jules & Elio de Vanzon Explorer — de l'achat au premier euro généré.",
  alternates: {
    canonical: "https://vanzonexplorer.com/formation",
  },
  openGraph: {
    title: "Van Business Academy — Formation Vanlife | Vanzon Explorer",
    description: "Apprends à aménager ton fourgon et lancer ton business de location de van. Formation complète par Jules & Elio — de l'achat au premier euro généré.",
    type: "website",
  },
};

const promiseCards = [
  {
    icon: "🚐",
    title: "Ton van aménagé",
    color: "blue" as const,
    description:
      "On t'accompagne dans le choix du fourgon, l'achat malin, et chaque étape de l'aménagement intérieur — de l'isolation à l'électricité. Même si tu n'as jamais tenu une perceuse.",
  },
  {
    icon: "📋",
    title: "Ton homologation VASP",
    color: "amber" as const,
    description:
      "Pour ceux qui veulent aller plus loin : on te guide dans tout le processus VASP, les normes, la DREAL, Qualigaz — avec nos templates et outils IA pour ne rien oublier.",
  },
  {
    icon: "💰",
    title: "Ton business de location",
    color: "teal" as const,
    description:
      "Comment fixer tes prix, créer ton annonce qui convertit, gérer tes locataires, optimiser ton taux d'occupation, et déclarer tes revenus.",
  },
];

const promiseIconBg = {
  blue:  "bg-blue-50 text-blue-600",
  amber: "bg-[#F5EDE5] text-[#B9945F]",
  teal:  "bg-[#F5EDE5] text-[#CDA77B]",
};

const forYou = [
  "Tu rêves de plus de liberté et de revenus complémentaires",
  "Tu veux voyager plus souvent, autrement, à ton rythme",
  "Tu n'as aucune compétence en bricolage (on t'apprend tout)",
  "Tu veux aménager ton fourgon et/ou en faire un business",
  "Tu veux une formation moderne avec de vrais outils",
];

const notForYou = [
  "Tu cherches une formation magistrale théorique (c'est 100% pratique)",
  "Tu cherches à faire de l'argent rapidement et facilement",
];

const differentiators = [
  {
    icon: "🤖",
    title: "Outils IA intégrés",
    description:
      "Prompts ChatGPT, Perplexity pour les dossiers admin, Airtable configuré pour ton budget — les meilleurs outils modernes sont inclus dans la formation.",
  },
  {
    icon: "🎯",
    title: "Double parcours",
    description:
      "VASP ou non-VASP selon ton projet. On adapte la formation à tes objectifs — juste aménager, ou aller jusqu'au business complet.",
  },
  {
    icon: "🔧",
    title: "100% pratique & terrain",
    description:
      "Chaque vidéo a été filmée pendant de vrais chantiers. On te montre nos erreurs, nos astuces, les produits qu'on utilise vraiment.",
  },
  {
    icon: "👥",
    title: "Créée par ceux qui vivent ça",
    description:
      "Jules et Elio ont 22 ans et ont tout construit eux-mêmes. Tu apprends de personnes qui font exactement ce qu'elles enseignent.",
  },
  {
    icon: "📊",
    title: "Airtable du budget inclus",
    description:
      "Un tableau de bord complet avec tous les matériaux, les coûts, les fournisseurs — pour ne rien oublier et commander intelligent.",
  },
  {
    icon: "🌊",
    title: "Ancrée au Pays Basque",
    description:
      "Une formation créée depuis le Pays Basque, par une équipe qui connaît le marché local et les meilleures pratiques pour la location estivale.",
  },
];


const courseJsonLd = {
  "@context": "https://schema.org",
  "@type": "Course",
  name: "Van Business Academy",
  description:
    "Formation complète pour aménager ton fourgon et lancer un business de location de van. De l'achat du véhicule à la mise en location rentable — homologation VASP incluse.",
  url: "https://vanzonexplorer.com/formation",
  image:
    "https://cdn.sanity.io/images/lewexa74/production/28a2c5acbe2ee16169d4ace1ab0522481c43d356-1170x2080.jpg",
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
      name: "Elio",
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
  teaches: [
    "Choix et achat d'un fourgon aménageable",
    "Aménagement intérieur van (isolation, électricité, menuiserie)",
    "Homologation VASP",
    "Création d'un business de location de van",
    "Mise en ligne sur Yescapa et optimisation des annonces",
    "Fiscalité et déclaration des revenus vanlife",
  ],
};

export default function FormationPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(courseJsonLd) }}
      />
      {/* CSS Calendly — chargé uniquement sur cette page car le widget n'est utilisé qu'ici */}
      <link
        href="https://assets.calendly.com/assets/external/widget.css"
        rel="stylesheet"
        media="print"
        // @ts-expect-error onLoad est valide pour les éléments link HTML
        onLoad="this.media='all'"
      />
      <FormationHero />

      <section className="py-20" style={{ background: '#FAF6F0' }}>
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 text-center">
            Ce qu&apos;on t&apos;apprend à construire
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            {promiseCards.map((card) => (
              <GlassCard key={card.title}>
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl ${promiseIconBg[card.color]}`}>
                  {card.icon}
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mt-4">
                  {card.title}
                </h3>
                <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                  {card.description}
                </p>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-slate-900">
                L&apos;accompagnement est fait pour toi si…
              </h2>

              <ul className="space-y-3 mt-6">
                {forYou.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-slate-600">
                    <span className="mt-0.5 flex-shrink-0 font-bold" style={{ color: '#B9945F' }}>✓</span>
                    {item}
                  </li>
                ))}
              </ul>

              <div className="mt-8 pt-6 border-t border-border-default">
                <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
                  Et NON fait pour toi si :
                </p>
                <ul className="space-y-2">
                  {notForYou.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-slate-400 text-sm">
                      <span className="text-red-400 mt-0.5 flex-shrink-0">✗</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="flex justify-center">
              <Image
                src="https://cdn.sanity.io/images/lewexa74/production/e8d8a66703e846a5bd916e38bd9a488b663ce433-1920x1080.png?v=1"
                alt="Aménagement intérieur de van - Van Business Academy"
                width={800}
                height={600}
                className="w-full h-auto max-w-lg"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#F8FAFC] py-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900">
              Apprenez de ceux qui l&apos;ont fait
            </h2>
            <p className="text-slate-500 mt-3 max-w-xl mx-auto">
              Jules et Elio n&apos;enseignent que ce qu&apos;ils ont construit,
              testé et vécu eux-mêmes.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 md:gap-4 rounded-2xl overflow-hidden">
            <div className="relative aspect-[3/4] rounded-2xl overflow-hidden">
              <Image
                src="https://cdn.sanity.io/images/lewexa74/production/16f9120e659bdd4bba47e663e9df9a1a9293fe3f-1170x2080.jpg"
                alt="Jules co-fondateur Vanzon Explorer - formateur vanlife et aménagement van Pays Basque"
                fill
                className="object-cover hover:scale-105 transition-transform duration-500"
              />
            </div>
            <div className="relative aspect-[3/4] rounded-2xl overflow-hidden">
              <Image
                src="https://cdn.sanity.io/images/lewexa74/production/28a2c5acbe2ee16169d4ace1ab0522481c43d356-1170x2080.jpg"
                alt="Jules et Elio fondateurs Vanzon Explorer - experts location van aménagé Pays Basque"
                fill
                className="object-cover hover:scale-105 transition-transform duration-500"
              />
            </div>
            <div className="relative aspect-[3/4] rounded-2xl overflow-hidden">
              <Image
                src="https://cdn.sanity.io/images/lewexa74/production/325f3ebf1d68fd890487229864c73cc65bef20d3-1186x1654.png"
                alt="Elio co-fondateur Vanzon Explorer - expert mécanique et construction van aménagé"
                fill
                className="object-cover hover:scale-105 transition-transform duration-500"
              />
            </div>
          </div>

          <div className="mt-8 text-center max-w-2xl mx-auto">
            <p className="text-slate-600 leading-relaxed">
              <span className="font-semibold text-slate-900">Jules &amp; Elio</span> — Deux passionnés de vanlife et de liberté. Elio maîtrise la mécanique et l&apos;aménagement. Jules pilote le business et la rentabilité. Ensemble, ils t&apos;accompagnent pour transformer ton van en projet solide et rentable.
            </p>
          </div>
        </div>
      </section>

      <ProgrammeAccordion />

      <section className="py-20" style={{ background: '#FAF6F0' }}>
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900">
              Pourquoi Van Business Academy ?
            </h2>
            <p className="text-slate-500 mt-3 max-w-xl mx-auto">
              Pas un accompagnement de plus. Une méthode moderne créée par des
              jeunes qui vivent la vanlife.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {differentiators.map((d) => (
              <GlassCard key={d.title}>
                <span className="text-2xl">{d.icon}</span>
                <h3 className="text-base font-semibold text-slate-900 mt-3">
                  {d.title}
                </h3>
                <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                  {d.description}
                </p>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      <ComparisonSection />

      <section className="bg-white py-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900">
              Ce que disent nos élèves
            </h2>
            <p className="text-slate-500 mt-2">Avis vérifiés sur Trustpilot</p>
          </div>

          <SylvainTestimonial />

          <div className="text-center mt-8">
            <a
              href="https://www.trustpilot.com/review/vanzonexplorer.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium hover:underline"
              style={{ color: '#B9945F' }}
            >
              Voir tous les avis sur Trustpilot →
            </a>
          </div>
        </div>
      </section>

      <FormationFAQ />

      <FormationCTA />

      <OtherServices current="formation" bgColor="#FAF6F0" />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Course",
            name: "Van Business Academy",
            description:
              "Formation complète pour aménager son fourgon et lancer un business de location de van. De l'achat du véhicule à la mise en location rentable — homologation VASP incluse.",
            url: "https://vanzonexplorer.com/formation",
            provider: {
              "@type": "Organization",
              name: "Vanzon Explorer",
              url: "https://vanzonexplorer.com",
            },
            instructor: [
              {
                "@type": "Person",
                name: "Jules Gaveglio",
                jobTitle: "Président & Co-fondateur",
                url: "https://vanzonexplorer.com/a-propos",
              },
              {
                "@type": "Person",
                name: "Elio",
                jobTitle: "Directeur Général & Co-fondateur",
                url: "https://vanzonexplorer.com/a-propos",
              },
            ],
            courseMode: "online",
            educationalLevel: "Beginner",
            inLanguage: "fr-FR",
            teaches: [
              "Aménagement de fourgon",
              "Homologation VASP",
              "Mise en location de van",
              "Rentabilité van aménagé",
            ],
          }),
        }}
      />
    </>
  );
}
