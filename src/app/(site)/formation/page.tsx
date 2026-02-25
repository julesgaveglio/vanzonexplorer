import type { Metadata } from "next";
import Image from "next/image";
import GlassCard from "@/components/ui/GlassCard";
import FormationHero from "@/components/formation/FormationHero";
import FormateurCard from "@/components/formation/FormateurCard";
import ProgrammeAccordion from "@/components/formation/ProgrammeAccordion";
import MockupSection from "@/components/formation/MockupSection";
import FormationFAQ from "@/components/formation/FormationFAQ";
import FormationCTA from "@/components/formation/FormationCTA";

export const metadata: Metadata = {
  title: "Van Business Academy — Formation Vanlife | Vanzon Explorer",
  description:
    "Apprends à aménager ton fourgon et lancer ton business de location de van. Formation complète par Jules & Elio de Vanzon Explorer — de l'achat au premier euro généré.",
  openGraph: {
    title: "Van Business Academy",
    description: "De l'achat du fourgon à ton premier euro en location.",
    images: ["https://iili.io/qFW0c8v.png"],
  },
};

// ── Section 3 — Promesse ──
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
  blue: "bg-blue-50 text-blue-600",
  amber: "bg-amber-50 text-amber-600",
  teal: "bg-sky-50 text-sky-600",
};

// ── Section 4 — Pour qui ──
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

// ── Section 7 — Différenciateurs ──
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

// ── Section 8 — Témoignages ──
const testimonials = [
  {
    stars: 5,
    content:
      "Je suis parti de zéro, sans jamais avoir bricolé de ma vie. Grâce à Jules et Elio, j'ai construit mon van en 3 mois et il est en location depuis juillet. Incroyable.",
    name: "Thomas K.",
    age: "28 ans",
  },
  {
    stars: 5,
    content:
      "La partie VASP m'a sauvé. Les templates Airtable et les vidéos sur la DREAL sont une mine d'or. J'ai été homologué du premier coup.",
    name: "Camille R.",
    age: "31 ans",
  },
  {
    stars: 5,
    content:
      "Ce qui m'a convaincu c'est le côté moderne — les outils IA, les prompts ChatGPT pour les annonces Leboncoin... On est vraiment dans 2024, pas dans une formation des années 2010.",
    name: "Alexandre M.",
    age: "25 ans",
  },
];

export default function FormationPage() {
  return (
    <>
      {/* ━━━ SECTION 1 — Hero ━━━ */}
      <FormationHero />

      
      {/* ━━━ SECTION 3 — La promesse en détail ━━━ */}
      <section className="bg-[#F8FAFC] py-20">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 text-center">
            Ce qu&apos;on t&apos;apprend à construire
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            {promiseCards.map((card) => (
              <GlassCard key={card.title}>
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl ${promiseIconBg[card.color]}`}
                >
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

      {/* ━━━ SECTION 4 — Pour qui ? ━━━ */}
      <section className="bg-white py-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            {/* Texte */}
            <div>
              <h2 className="text-3xl font-bold text-slate-900">
                L'accompagnement est fait pour toi si…
              </h2>

              <ul className="space-y-3 mt-6">
                {forYou.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-3 text-slate-600"
                  >
                    <span className="text-emerald-500 mt-0.5 flex-shrink-0 font-bold">
                      ✓
                    </span>
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
                    <li
                      key={item}
                      className="flex items-start gap-3 text-slate-400 text-sm"
                    >
                      <span className="text-red-400 mt-0.5 flex-shrink-0">
                        ✗
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Image / illustration */}
            <div className="flex justify-center">
              <Image
                src="https://iili.io/q2Y3F4f.png?v=1"
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

      {/* ━━━ SECTION 5 — Les formateurs ━━━ */}
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <FormateurCard
              name="Jules"
              role="Président & Co-fondateur"
              badge="Marketing & Digital"
              badgeColor="blue"
              description="Tour du monde à 22 ans, van construit en autodidacte. Aujourd'hui expert en location et transmet son expérience concrète du terrain."
              tags={["Tour du monde", "Van autodidacte", "Location active"]}
            />
            <FormateurCard
              name="Elio"
              role="Directeur Général & Co-fondateur"
              badge="Mécanique & Travaux"
              badgeColor="amber"
              description="Mécanicien pro, co-constructeur des vans Vanzon. T'enseigne les gestes techniques, les bons produits et comment éviter les erreurs coûteuses."
              tags={["Mécanicien pro", "Expert travaux", "Mindset d'acier"]}
              imageUrl="https://iili.io/qF7VM8X.png"
            />
          </div>
        </div>
      </section>

      {/* ━━━ SECTION 6 — Programme (9 modules) ━━━ */}
      <ProgrammeAccordion />

      {/* ━━━ SECTION 6.5 — Mockup présentation ━━━ */}
      <MockupSection />

      {/* ━━━ SECTION 7 — Ce qui nous différencie ━━━ */}
      <section className="bg-[#F8FAFC] py-20">
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

      {/* ━━━ SECTION 8 — Témoignages Trustpilot ━━━ */}
      <section className="bg-white py-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900">
              Ce que disent nos élèves
            </h2>
            <p className="text-slate-500 mt-2">Avis vérifiés sur Trustpilot</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <GlassCard key={t.name}>
                {/* Étoiles */}
                <div className="flex gap-0.5 mb-3">
                  {Array.from({ length: t.stars }).map((_, i) => (
                    <span key={i} className="text-amber-400 text-lg">
                      ★
                    </span>
                  ))}
                </div>
                <p className="text-slate-600 text-sm leading-relaxed italic">
                  &ldquo;{t.content}&rdquo;
                </p>
                <div className="mt-4 pt-4 border-t border-border-default">
                  <p className="text-sm font-semibold text-slate-900">
                    {t.name}
                  </p>
                  <p className="text-xs text-slate-400">{t.age}</p>
                </div>
              </GlassCard>
            ))}
          </div>

          {/* Lien Trustpilot */}
          <div className="text-center mt-8">
            <a
              href="https://www.trustpilot.com/review/vanzonexplorer.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-accent-blue font-medium hover:underline"
            >
              Voir tous les avis sur Trustpilot →
            </a>
          </div>
        </div>
      </section>

      {/* ━━━ SECTION 9 — FAQ ━━━ */}
      <FormationFAQ />

      {/* ━━━ SECTION 10 — CTA Final ━━━ */}
      <FormationCTA />
    </>
  );
}
