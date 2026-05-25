import type { Metadata } from "next";
import LiquidButton from "@/components/ui/LiquidButton";
import ModuleAccordion from "./ModuleAccordion";

export const metadata: Metadata = {
  title: "Programme complet — Van Business Academy | Vanzon Explorer",
  description:
    "Découvre le programme détaillé de la Van Business Academy : 10 modules, +105 vidéos, du sourcing à la location. Formation terrain par des loueurs en activité.",
  alternates: { canonical: "https://vanzonexplorer.com/van-business-academy/programme" },
  openGraph: {
    title: "Programme complet — Van Business Academy",
    description: "10 modules, +105 vidéos, de l'achat du van à la mise en location. Tout le détail du programme.",
    type: "website",
  },
};

/* ── Module data ── */

export interface Lesson {
  title: string;
  duration?: number; // minutes
  tag?: "quiz" | "pdf" | "bonus" | "outil" | "nouveau";
}

export interface Module {
  number: number;
  title: string;
  emoji: string;
  description: string;
  lessons: Lesson[];
  badge?: string;
}

const MODULES: Module[] = [
  {
    number: 1,
    title: "Présentation",
    emoji: "🎬",
    description: "Comprends la vision, le plan d'action et quel projet van te correspond vraiment.",
    lessons: [
      { title: "Bienvenue", duration: 5 },
      { title: "Aperçu complet de la formation", duration: 8 },
      { title: "Ce qu'un van t'apporte VRAIMENT (bénéfices cachés)", duration: 12 },
      { title: "Quel projet van te correspond VRAIMENT ?", duration: 10 },
    ],
  },
  {
    number: 2,
    title: "Sourcing & Achat du Van",
    emoji: "🔍",
    description: "Trouve le bon véhicule, évite les arnaques, et négocie comme un pro.",
    lessons: [
      { title: "Quel modèle de véhicule choisir et pourquoi ?", duration: 15 },
      { title: "Comment trouver THE véhicule ?", duration: 12 },
      { title: "Les aspects mécanique à connaître avant achat", duration: 14 },
      { title: "ASTUCE : Contacter le vendeur vite et bien", duration: 6, tag: "bonus" },
      { title: "Les indispensables à vérifier pendant le RDV", duration: 12 },
      { title: "ASTUCE : Tester les pneus avec une pièce de 2€", duration: 3, tag: "bonus" },
      { title: "ASTUCE : Test de l'embrayage", duration: 4, tag: "bonus" },
      { title: "Comment négocier intelligemment ton véhicule ?", duration: 10 },
      { title: "Quiz Module 2", tag: "quiz" },
      { title: "Fiche récap PDF", tag: "pdf" },
    ],
  },
  {
    number: 3,
    title: "Conception & Budget",
    emoji: "📐",
    description: "Conçois ton aménagement sans erreur, choisis les bons matériaux et maîtrise ton budget.",
    lessons: [
      { title: "Trouver ses inspirations", duration: 10 },
      { title: "Les erreurs d'aménagement à éviter", duration: 12 },
      { title: "La cuisine parfaite sans prise de tête", duration: 8 },
      { title: "Les bonnes questions à se poser", duration: 10 },
      { title: "Airtable — L'outil pour tout organiser", duration: 8, tag: "outil" },
      { title: "Combien de temps prend les travaux", duration: 6 },
      { title: "Les outils indispensables", duration: 10 },
      { title: "Le bois : Choisir le bon matériau", duration: 8 },
      { title: "Ce qu'il faut savoir sur le VASP", duration: 12 },
      { title: "Quiz Module 3", tag: "quiz" },
      { title: "Fiche récap PDF", tag: "pdf" },
    ],
  },
  {
    number: 4,
    title: "Conception VASP L1H1",
    emoji: "📋",
    description: "Le plan d'aménagement spécifique pour un petit van homologable — budget et liste de course inclus.",
    badge: "VASP",
    lessons: [
      { title: "Présentation de l'aménagement VASP L1H1", duration: 15 },
      { title: "La liste de course complète (Airtable)", duration: 8, tag: "outil" },
    ],
  },
  {
    number: 5,
    title: "Les travaux",
    emoji: "🔨",
    description: "Passe à l'action : du nettoyage aux finitions, chaque étape filmée dans l'atelier.",
    lessons: [
      { title: "Le nettoyage", duration: 8 },
      { title: "La pose de la fenêtre", duration: 15 },
      { title: "L'isolation", duration: 12 },
      { title: "La structure en bois", duration: 15 },
      { title: "Les murs", duration: 10 },
      { title: "Le cadrant fenêtre", duration: 8 },
      { title: "Le sol", duration: 12 },
      { title: "La construction des meubles", duration: 18 },
      { title: "Construction de table coulissante", duration: 12 },
      { title: "Quiz Module 5", tag: "quiz" },
      { title: "Fiche récap PDF", tag: "pdf" },
    ],
  },
  {
    number: 6,
    title: "Électricité",
    emoji: "⚡",
    description: "Comprends les bases, calcule ta consommation et câble ton van en toute sécurité.",
    lessons: [
      { title: "Présentation de l'électricité dans le van", duration: 8 },
      { title: "Faire des raccords solides", duration: 10 },
      { title: "Les bases des bases (débutant)", duration: 12 },
      { title: "Calculer sa conso et choisir sa batterie", duration: 14 },
      { title: "Section de câble et sécurité", duration: 10 },
      { title: "Le circuit électrique", duration: 15 },
      { title: "Quiz Module 6", tag: "quiz" },
      { title: "Fiche récap PDF", tag: "pdf" },
    ],
  },
  {
    number: 7,
    title: "Homologation VASP",
    emoji: "📄",
    description: "Tout le processus administratif pour homologuer ton van — éligibilité, coûts et démarches.",
    badge: "VASP",
    lessons: [
      { title: "Introduction VASP", duration: 8 },
      { title: "Ce que ton aménagement DOIT comporter", duration: 12 },
      { title: "Le processus complet pour l'homologation", duration: 15 },
      { title: "Les coûts administratifs", duration: 8 },
      { title: "Avantages et inconvénients du VASP", duration: 10 },
      { title: "BONUS — L'outil IA qui va t'aider", duration: 6, tag: "bonus" },
    ],
  },
  {
    number: 8,
    title: "Les travaux VASP (L1H1)",
    emoji: "👷🏼‍♂️",
    description: "20 vidéos pratiques filmées en atelier — tout l'aménagement VASP d'un L1H1 de A à Z.",
    badge: "NOUVEAU",
    lessons: [
      { title: "Nettoyage", duration: 10, tag: "nouveau" },
      { title: "La pose de la fenêtre", duration: 10, tag: "nouveau" },
      { title: "La pose des aérations", duration: 10, tag: "nouveau" },
      { title: "La pose du lanterneau", duration: 10, tag: "nouveau" },
      { title: "La pose de la structure", duration: 10, tag: "nouveau" },
      { title: "L'isolation Armaflex", duration: 10, tag: "nouveau" },
      { title: "La pose de la moquette feutrine", duration: 10, tag: "nouveau" },
      { title: "Construire le robinet fixe", duration: 10, tag: "nouveau" },
      { title: "La plaque de cuisson", duration: 10, tag: "nouveau" },
      { title: "Le lit peigne", duration: 10, tag: "nouveau" },
      { title: "Le sol", duration: 10, tag: "nouveau" },
      { title: "Le plafond", duration: 10, tag: "nouveau" },
      { title: "La pose des rideaux", duration: 10, tag: "nouveau" },
      { title: "Fabrication du lit", duration: 10, tag: "nouveau" },
      { title: "Meuble d'entrée", duration: 10, tag: "nouveau" },
      { title: "Meuble de cuisine et eau", duration: 10, tag: "nouveau" },
      { title: "Étagère arrière", duration: 10, tag: "nouveau" },
      { title: "Le ponçage", duration: 10, tag: "nouveau" },
      { title: "Installation électrique", duration: 10, tag: "nouveau" },
      { title: "Le vernissage", duration: 10, tag: "nouveau" },
    ],
  },
  {
    number: 9,
    title: "Les normes VASP",
    emoji: "📏",
    description: "Toutes les normes à connaître AVANT de commencer les travaux pour être conforme du premier coup.",
    badge: "VASP",
    lessons: [
      { title: "Les normes d'aération", duration: 6 },
      { title: "Les normes pour l'aménagement", duration: 8 },
      { title: "Les normes pour le circuit d'eau", duration: 6 },
      { title: "Les normes pour l'électricité", duration: 8 },
      { title: "Les normes pour la plaque de cuisson", duration: 5 },
      { title: "Les normes pour le gaz", duration: 6 },
      { title: "Les normes pour l'issue de secours", duration: 5 },
      { title: "Les normes pour le marche-pied", duration: 4 },
      { title: "La norme sur la pesée", duration: 5 },
      { title: "Les étiquettes obligatoires", duration: 6 },
      { title: "Les objets obligatoires", duration: 5 },
    ],
  },
  {
    number: 10,
    title: "BUSINESS de location",
    emoji: "💰",
    description: "Lance ton activité : étude de marché, pricing, publication, automatisation et chiffres réels.",
    lessons: [
      { title: "Présentation du business modèle van", duration: 10 },
      { title: "Étude de marché simple & efficace", duration: 12 },
      { title: "Peur & croyances limitantes — Casser les mythes", duration: 10 },
      { title: "Assurance, caution & gestion des risques", duration: 14 },
      { title: "Fixer ses prix & maîtriser la saisonnalité", duration: 12 },
      { title: "Estimation (hyper) réaliste de vos revenus", duration: 10 },
      { title: "Publier son van en ligne comme un pro", duration: 12 },
      { title: "Optimiser son taux d'occupation", duration: 10 },
      { title: "Gestion client & communication", duration: 8 },
      { title: "Remise des clés & départ des locataires", duration: 8 },
      { title: "État des lieux & retour du véhicule", duration: 8 },
      { title: "Mon expérience & mes chiffres réels", duration: 15 },
      { title: "Automatisations pour gagner du temps", duration: 10 },
      { title: "Déclarations en tant que particulier", duration: 8 },
      { title: "Déclarations en tant que professionnel", duration: 10 },
      { title: "Quiz Module 10", tag: "quiz" },
      { title: "Fiche récap PDF", tag: "pdf" },
    ],
  },
];

const TOTAL_LESSONS = MODULES.reduce((sum, m) => sum + m.lessons.length, 0);
const TOTAL_MODULES = MODULES.length;
const TOTAL_MINUTES = MODULES.reduce(
  (sum, m) => sum + m.lessons.reduce((s, l) => s + (l.duration ?? 0), 0),
  0
);
const TOTAL_HOURS = Math.floor(TOTAL_MINUTES / 60);
const REMAINING_MINUTES = TOTAL_MINUTES % 60;

/* ── Page ── */

export default function ProgrammePage() {
  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(180deg, #FFFFFF 0%, #FAF6F0 100%)" }}>
      {/* ── Hero ── */}
      <section className="relative overflow-hidden">
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(185,148,95,0.10) 0%, rgba(228,211,152,0.05) 40%, transparent 70%)",
            filter: "blur(100px)",
          }}
        />
        <div className="relative z-10 max-w-4xl mx-auto px-5 pt-20 pb-12 md:pt-28 md:pb-16 text-center">
          <a
            href="/formation"
            className="inline-flex items-center gap-2 text-sm mb-8 transition-colors hover:opacity-80"
            style={{ color: "#B9945F" }}
          >
            ← Retour
          </a>

          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold tracking-wider uppercase mb-6"
            style={{ background: "rgba(185,148,95,0.08)", border: "1px solid rgba(185,148,95,0.25)", color: "#B9945F" }}
          >
            🎓 Programme détaillé
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 leading-tight tracking-tight">
            {TOTAL_MODULES} modules.{" "}
            <span className="bg-clip-text text-transparent" style={{ backgroundImage: "linear-gradient(135deg, #B9945F 0%, #E4D398 100%)" }}>
              {TOTAL_LESSONS}+ leçons.
            </span>
            <br />
            De l&apos;achat du van à la mise en location.
          </h1>

          <p className="text-base sm:text-lg text-slate-500 mt-6 max-w-2xl mx-auto leading-relaxed">
            Chaque vidéo est filmée en conditions réelles, dans notre atelier au Pays Basque.
            Pas de théorie creuse — que du concret, étape par étape.
          </p>

          {/* Stats bar */}
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 mt-10">
            {[
              { value: `${TOTAL_MODULES}`, label: "modules" },
              { value: `${TOTAL_LESSONS}+`, label: "vidéos" },
              { value: `${TOTAL_HOURS}h${REMAINING_MINUTES > 0 ? `${REMAINING_MINUTES.toString().padStart(2, "0")}` : ""}`, label: "de contenu" },
              { value: "100%", label: "terrain" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl sm:text-3xl font-black bg-clip-text text-transparent" style={{ backgroundImage: "linear-gradient(135deg, #B9945F 0%, #E4D398 100%)" }}>
                  {stat.value}
                </div>
                <div className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Modules ── */}
      <section className="max-w-3xl mx-auto px-5 pb-20">
        <ModuleAccordion modules={MODULES} />

        {/* ── Bonus exclusifs ── */}
        <div className="mt-16">
          <div className="text-center mb-8">
            <span
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold tracking-wider uppercase"
              style={{ background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.20)", color: "#10B981" }}
            >
              ✦ Inclus dans la formation
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-5">
              Ce que tu obtiens{" "}
              <span className="bg-clip-text text-transparent" style={{ backgroundImage: "linear-gradient(135deg, #B9945F 0%, #E4D398 100%)" }}>
                en plus des vidéos
              </span>
            </h2>
          </div>

          <div className="grid gap-4 sm:gap-5">
            {[
              {
                emoji: "🤝",
                title: "Programme de parrainage",
                iconBg: "rgba(185,148,95,0.08)",
                text: (
                  <>
                    Tu obtiens un <span className="text-slate-900 font-semibold">code promo personnalisé</span> à partager autour de toi.
                    Chaque personne qui rejoint la formation grâce à ton code bénéficie d&apos;une réduction —
                    et toi, tu touches <span className="text-slate-900 font-semibold">10% de commission</span> sur chaque vente.
                    Un moyen concret de rentabiliser ta formation avant même d&apos;avoir terminé les travaux.
                  </>
                ),
              },
              {
                emoji: "📣",
                title: "Campagne de publicité offerte",
                iconBg: "rgba(59,130,246,0.08)",
                text: (
                  <>
                    Une fois tes travaux terminés, tu accèdes au <span className="text-slate-900 font-semibold">réseau de média buyers de Vanzon Explorer</span>.
                    On lance gratuitement une campagne publicitaire pour toi — que ce soit pour
                    optimiser la <span className="text-slate-900 font-semibold">location</span> ou accélérer la <span className="text-slate-900 font-semibold">revente</span> de ton van.
                    Tu n&apos;as rien à gérer, on s&apos;occupe de tout.
                  </>
                ),
              },
              {
                emoji: "🌐",
                title: "Ton van publié sur Vanzon Explorer",
                iconBg: "rgba(168,85,247,0.08)",
                text: (
                  <>
                    Ton van terminé ? On publie ton annonce directement sur <span className="text-slate-900 font-semibold">vanzonexplorer.com</span> et
                    tu profites de notre référencement SEO. En bonus, on publie une <span className="text-slate-900 font-semibold">série d&apos;articles de blog</span> ciblés
                    sur ta zone géographique pour attirer des locataires intéressés par ta région.
                    Du trafic qualifié, gratuitement.
                  </>
                ),
              },
            ].map((bonus) => (
              <div
                key={bonus.title}
                className="rounded-2xl p-5 sm:p-6 bg-white border border-slate-100 shadow-sm"
              >
                <div className="flex items-start gap-4">
                  <div
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                    style={{ background: bonus.iconBg }}
                  >
                    {bonus.emoji}
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900">{bonus.title}</h3>
                    <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">{bonus.text}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── CTA final ── */}
        <div className="mt-16 text-center">
          <div
            className="rounded-2xl p-8 sm:p-10"
            style={{
              background: "linear-gradient(135deg, rgba(185,148,95,0.06) 0%, rgba(228,211,152,0.03) 100%)",
              border: "1px solid rgba(185,148,95,0.15)",
            }}
          >
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3">
              Prêt à construire ta liberté van par van ?
            </h3>
            <p className="text-sm text-slate-500 mb-6 max-w-md mx-auto">
              {TOTAL_MODULES} modules, {TOTAL_LESSONS}+ vidéos, une méthode testée sur nos propres vans.
              Le tout accessible à vie.
            </p>
            <LiquidButton variant="gold" size="lg" href="/van-business-academy/inscription">
              Accéder à la formation →
            </LiquidButton>
            <p className="text-xs text-slate-400 mt-4">
              997 € — Tarif lancement (au lieu de 1 497 €)
            </p>
          </div>
        </div>
      </section>

      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Course",
            name: "Van Business Academy — Programme complet",
            description: `Formation complète : ${TOTAL_MODULES} modules, ${TOTAL_LESSONS}+ vidéos, ${TOTAL_HOURS}h+ de contenu. Du sourcing du van à la mise en location.`,
            url: "https://vanzonexplorer.com/van-business-academy/programme",
            provider: { "@type": "Organization", name: "Vanzon Explorer", url: "https://vanzonexplorer.com" },
            instructor: { "@type": "Person", name: "Jules Gaveglio" },
            hasCourseInstance: {
              "@type": "CourseInstance",
              courseMode: "online",
              inLanguage: "fr-FR",
              offers: { "@type": "Offer", price: "997", priceCurrency: "EUR", availability: "https://schema.org/InStock" },
            },
          }),
        }}
      />
    </div>
  );
}
