import type { Metadata } from "next";
import LiquidButton from "@/components/ui/LiquidButton";

export const metadata: Metadata = {
  title: "Programme complet — Van Business Academy | Vanzon Explorer",
  description:
    "Découvre le programme détaillé de la Van Business Academy : 10 modules, +70 vidéos, du sourcing à la location. Formation terrain par des loueurs en activité.",
  alternates: { canonical: "https://vanzonexplorer.com/van-business-academy/programme" },
  openGraph: {
    title: "Programme complet — Van Business Academy",
    description: "10 modules, +70 vidéos, de l'achat du van à la mise en location. Tout le détail du programme.",
    type: "website",
  },
};

/* ── Module data ── */

interface Lesson {
  title: string;
  tag?: "vidéo" | "quiz" | "pdf" | "bonus" | "outil" | "nouveau";
}

interface Module {
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
      { title: "Bienvenue" },
      { title: "Aperçu complet de la formation" },
      { title: "Ce qu'un van t'apporte VRAIMENT (bénéfices cachés)" },
      { title: "Quel projet van te correspond VRAIMENT ?" },
    ],
  },
  {
    number: 2,
    title: "Sourcing & Achat du Van",
    emoji: "🔍",
    description: "Trouve le bon véhicule, évite les arnaques, et négocie comme un pro.",
    lessons: [
      { title: "Quel modèle de véhicule choisir et pourquoi ?" },
      { title: "Comment trouver THE véhicule ?" },
      { title: "Les aspects mécanique à connaître avant achat" },
      { title: "ASTUCE : Contacter le vendeur vite et bien", tag: "bonus" },
      { title: "Les indispensables à vérifier pendant le RDV" },
      { title: "ASTUCE : Tester les pneus avec une pièce de 2€", tag: "bonus" },
      { title: "ASTUCE : Test de l'embrayage", tag: "bonus" },
      { title: "Comment négocier intelligemment ton véhicule ?" },
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
      { title: "Trouver ses inspirations" },
      { title: "Les erreurs d'aménagement à éviter" },
      { title: "La cuisine parfaite sans prise de tête" },
      { title: "Les bonnes questions à se poser" },
      { title: "Airtable — L'outil pour tout organiser", tag: "outil" },
      { title: "Combien de temps prend les travaux" },
      { title: "Les outils indispensables" },
      { title: "Le bois : Choisir le bon matériau" },
      { title: "Ce qu'il faut savoir sur le VASP" },
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
      { title: "Présentation de l'aménagement VASP L1H1" },
      { title: "La liste de course complète (Airtable)", tag: "outil" },
    ],
  },
  {
    number: 5,
    title: "Les travaux",
    emoji: "🔨",
    description: "Passe à l'action : du nettoyage aux finitions, chaque étape filmée dans l'atelier.",
    lessons: [
      { title: "Le nettoyage" },
      { title: "La pose de la fenêtre" },
      { title: "L'isolation" },
      { title: "La structure en bois" },
      { title: "Les murs" },
      { title: "Le cadrant fenêtre" },
      { title: "Le sol" },
      { title: "La construction des meubles" },
      { title: "Construction de table coulissante" },
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
      { title: "Présentation de l'électricité dans le van" },
      { title: "Faire des raccords solides" },
      { title: "Les bases des bases (débutant)" },
      { title: "Calculer sa conso et choisir sa batterie" },
      { title: "Section de câble et sécurité" },
      { title: "Le circuit électrique" },
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
      { title: "Introduction VASP" },
      { title: "Ce que ton aménagement DOIT comporter" },
      { title: "Le processus complet pour l'homologation" },
      { title: "Les coûts administratifs" },
      { title: "Avantages et inconvénients du VASP" },
      { title: "BONUS — L'outil IA qui va t'aider", tag: "bonus" },
    ],
  },
  {
    number: 8,
    title: "Les travaux VASP (L1H1)",
    emoji: "👷🏼‍♂️",
    description: "20 vidéos pratiques filmées en atelier — tout l'aménagement VASP d'un L1H1 de A à Z.",
    badge: "NOUVEAU",
    lessons: [
      { title: "Nettoyage", tag: "nouveau" },
      { title: "La pose de la fenêtre", tag: "nouveau" },
      { title: "La pose des aérations", tag: "nouveau" },
      { title: "La pose du lanterneau", tag: "nouveau" },
      { title: "La pose de la structure", tag: "nouveau" },
      { title: "L'isolation Armaflex", tag: "nouveau" },
      { title: "La pose de la moquette feutrine", tag: "nouveau" },
      { title: "Construire le robinet fixe", tag: "nouveau" },
      { title: "La plaque de cuisson", tag: "nouveau" },
      { title: "Le lit peigne", tag: "nouveau" },
      { title: "Le sol", tag: "nouveau" },
      { title: "Le plafond", tag: "nouveau" },
      { title: "La pose des rideaux", tag: "nouveau" },
      { title: "Fabrication du lit", tag: "nouveau" },
      { title: "Meuble d'entrée", tag: "nouveau" },
      { title: "Meuble de cuisine et eau", tag: "nouveau" },
      { title: "Étagère arrière", tag: "nouveau" },
      { title: "Le ponçage", tag: "nouveau" },
      { title: "Installation électrique", tag: "nouveau" },
      { title: "Le vernissage", tag: "nouveau" },
    ],
  },
  {
    number: 9,
    title: "Les normes VASP",
    emoji: "📏",
    description: "Toutes les normes à connaître AVANT de commencer les travaux pour être conforme du premier coup.",
    badge: "VASP",
    lessons: [
      { title: "Les normes d'aération" },
      { title: "Les normes pour l'aménagement" },
      { title: "Les normes pour le circuit d'eau" },
      { title: "Les normes pour l'électricité" },
      { title: "Les normes pour la plaque de cuisson" },
      { title: "Les normes pour le gaz" },
      { title: "Les normes pour l'issue de secours" },
      { title: "Les normes pour le marche-pied" },
      { title: "La norme sur la pesée" },
      { title: "Les étiquettes obligatoires" },
      { title: "Les objets obligatoires" },
    ],
  },
  {
    number: 10,
    title: "BUSINESS de location",
    emoji: "💰",
    description: "Lance ton activité : étude de marché, pricing, publication, automatisation et chiffres réels.",
    lessons: [
      { title: "Présentation du business modèle van" },
      { title: "Étude de marché simple & efficace" },
      { title: "Peur & croyances limitantes — Casser les mythes" },
      { title: "Assurance, caution & gestion des risques" },
      { title: "Fixer ses prix & maîtriser la saisonnalité" },
      { title: "Estimation (hyper) réaliste de vos revenus" },
      { title: "Publier son van en ligne comme un pro" },
      { title: "Optimiser son taux d'occupation" },
      { title: "Gestion client & communication" },
      { title: "Remise des clés & départ des locataires" },
      { title: "État des lieux & retour du véhicule" },
      { title: "Mon expérience & mes chiffres réels" },
      { title: "Automatisations pour gagner du temps" },
      { title: "Déclarations en tant que particulier" },
      { title: "Déclarations en tant que professionnel" },
      { title: "Quiz Module 10", tag: "quiz" },
      { title: "Fiche récap PDF", tag: "pdf" },
    ],
  },
];

const TOTAL_LESSONS = MODULES.reduce((sum, m) => sum + m.lessons.length, 0);
const TOTAL_MODULES = MODULES.length;

/* ── Tag styles ── */

const TAG_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  vidéo: { bg: "rgba(59,130,246,0.10)", text: "#3B82F6", label: "Vidéo" },
  quiz: { bg: "rgba(168,85,247,0.10)", text: "#A855F7", label: "Quiz" },
  pdf: { bg: "rgba(239,68,68,0.10)", text: "#EF4444", label: "PDF" },
  bonus: { bg: "rgba(16,185,129,0.10)", text: "#10B981", label: "Bonus" },
  outil: { bg: "rgba(245,158,11,0.10)", text: "#F59E0B", label: "Outil" },
  nouveau: { bg: "rgba(185,148,95,0.12)", text: "#B9945F", label: "Nouveau" },
};

/* ── Page ── */

export default function ProgrammePage() {
  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(180deg, #0A0A0A 0%, #111827 100%)" }}>
      {/* ── Hero ── */}
      <section className="relative overflow-hidden">
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(185,148,95,0.18) 0%, rgba(228,211,152,0.08) 40%, transparent 70%)",
            filter: "blur(100px)",
          }}
        />
        <div className="relative z-10 max-w-4xl mx-auto px-5 pt-20 pb-12 md:pt-28 md:pb-16 text-center">
          <a
            href="/formation"
            className="inline-flex items-center gap-2 text-sm mb-8 transition-colors"
            style={{ color: "rgba(185,148,95,0.7)" }}
          >
            ← Retour
          </a>

          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold tracking-wider uppercase mb-6"
            style={{ background: "rgba(185,148,95,0.12)", border: "1px solid rgba(185,148,95,0.3)", color: "#B9945F" }}
          >
            🎓 Programme détaillé
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white leading-tight tracking-tight">
            {TOTAL_MODULES} modules.{" "}
            <span className="bg-clip-text text-transparent" style={{ backgroundImage: "linear-gradient(135deg, #B9945F 0%, #E4D398 100%)" }}>
              {TOTAL_LESSONS}+ leçons.
            </span>
            <br />
            De l&apos;achat du van à la mise en location.
          </h1>

          <p className="text-base sm:text-lg text-slate-400 mt-6 max-w-2xl mx-auto leading-relaxed">
            Chaque vidéo est filmée en conditions réelles, dans notre atelier au Pays Basque.
            Pas de théorie creuse — que du concret, étape par étape.
          </p>

          {/* Stats bar */}
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 mt-10">
            {[
              { value: `${TOTAL_MODULES}`, label: "modules" },
              { value: `${TOTAL_LESSONS}+`, label: "vidéos" },
              { value: "A→Z", label: "méthode complète" },
              { value: "100%", label: "terrain" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl sm:text-3xl font-black bg-clip-text text-transparent" style={{ backgroundImage: "linear-gradient(135deg, #B9945F 0%, #E4D398 100%)" }}>
                  {stat.value}
                </div>
                <div className="text-xs text-slate-500 mt-1 uppercase tracking-wider">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Modules ── */}
      <section className="max-w-3xl mx-auto px-5 pb-20">
        <div className="space-y-6">
          {MODULES.map((mod) => (
            <div
              key={mod.number}
              className="rounded-2xl overflow-hidden"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
                backdropFilter: "blur(12px)",
              }}
            >
              {/* Module header */}
              <div className="p-5 sm:p-6" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                <div className="flex items-start gap-4">
                  <span className="text-2xl sm:text-3xl flex-shrink-0 mt-0.5">{mod.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "#B9945F" }}>
                        Module {mod.number}
                      </span>
                      {mod.badge && (
                        <span
                          className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                          style={{
                            background: mod.badge === "NOUVEAU" ? "rgba(16,185,129,0.15)" : "rgba(185,148,95,0.15)",
                            color: mod.badge === "NOUVEAU" ? "#10B981" : "#B9945F",
                          }}
                        >
                          {mod.badge}
                        </span>
                      )}
                    </div>
                    <h2 className="text-lg sm:text-xl font-bold text-white mt-1">{mod.title}</h2>
                    <p className="text-sm text-slate-400 mt-1.5 leading-relaxed">{mod.description}</p>
                  </div>
                  <span className="text-xs text-slate-500 flex-shrink-0 mt-1 tabular-nums">
                    {mod.lessons.length} leçons
                  </span>
                </div>
              </div>

              {/* Lessons */}
              <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                {mod.lessons.map((lesson, i) => {
                  const tag = lesson.tag ? TAG_STYLES[lesson.tag] : null;
                  return (
                    <div key={i} className="flex items-center gap-3 px-5 sm:px-6 py-3 hover:bg-white/[0.02] transition-colors">
                      <span className="text-xs text-slate-600 w-5 text-right flex-shrink-0 tabular-nums font-mono">
                        {i + 1}
                      </span>
                      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "rgba(185,148,95,0.5)" }} />
                      <span className="text-sm text-slate-300 flex-1">{lesson.title}</span>
                      {tag && (
                        <span
                          className="text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
                          style={{ background: tag.bg, color: tag.text }}
                        >
                          {tag.label}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* ── Bonus exclusifs ── */}
        <div className="mt-16">
          <div className="text-center mb-8">
            <span
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold tracking-wider uppercase"
              style={{ background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.25)", color: "#10B981" }}
            >
              ✦ Inclus dans la formation
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mt-5">
              Ce que tu obtiens{" "}
              <span className="bg-clip-text text-transparent" style={{ backgroundImage: "linear-gradient(135deg, #B9945F 0%, #E4D398 100%)" }}>
                en plus des vidéos
              </span>
            </h2>
          </div>

          <div className="grid gap-4 sm:gap-5">
            {/* Bonus 1 — Parrainage */}
            <div
              className="rounded-2xl p-5 sm:p-6"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <div className="flex items-start gap-4">
                <div
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                  style={{ background: "rgba(185,148,95,0.12)" }}
                >
                  🤝
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white">Programme de parrainage</h3>
                  <p className="text-sm text-slate-400 mt-1.5 leading-relaxed">
                    Tu obtiens un <span className="text-white font-semibold">code promo personnalisé</span> à partager autour de toi.
                    Chaque personne qui rejoint la formation grâce à ton code bénéficie d&apos;une réduction —
                    et toi, tu touches <span className="text-white font-semibold">10% de commission</span> sur chaque vente.
                    Un moyen concret de rentabiliser ta formation avant même d&apos;avoir terminé les travaux.
                  </p>
                </div>
              </div>
            </div>

            {/* Bonus 2 — Campagne pub offerte */}
            <div
              className="rounded-2xl p-5 sm:p-6"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <div className="flex items-start gap-4">
                <div
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                  style={{ background: "rgba(59,130,246,0.12)" }}
                >
                  📣
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white">Campagne de publicité offerte</h3>
                  <p className="text-sm text-slate-400 mt-1.5 leading-relaxed">
                    Une fois tes travaux terminés, tu accèdes au <span className="text-white font-semibold">réseau de média buyers de Vanzon Explorer</span>.
                    On lance gratuitement une campagne publicitaire pour toi — que ce soit pour
                    optimiser la <span className="text-white font-semibold">location</span> ou accélérer la <span className="text-white font-semibold">revente</span> de ton van.
                    Tu n&apos;as rien à gérer, on s&apos;occupe de tout.
                  </p>
                </div>
              </div>
            </div>

            {/* Bonus 3 — Visibilité sur le site */}
            <div
              className="rounded-2xl p-5 sm:p-6"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <div className="flex items-start gap-4">
                <div
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                  style={{ background: "rgba(168,85,247,0.12)" }}
                >
                  🌐
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white">Ton van publié sur Vanzon Explorer</h3>
                  <p className="text-sm text-slate-400 mt-1.5 leading-relaxed">
                    Ton van terminé ? On publie ton annonce directement sur <span className="text-white font-semibold">vanzonexplorer.com</span> et
                    tu profites de notre référencement SEO. En bonus, on publie une <span className="text-white font-semibold">série d&apos;articles de blog</span> ciblés
                    sur ta zone géographique pour attirer des locataires intéressés par ta région.
                    Du trafic qualifié, gratuitement.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── CTA final ── */}
        <div className="mt-16 text-center">
          <div
            className="rounded-2xl p-8 sm:p-10"
            style={{
              background: "linear-gradient(135deg, rgba(185,148,95,0.08) 0%, rgba(228,211,152,0.04) 100%)",
              border: "1px solid rgba(185,148,95,0.2)",
            }}
          >
            <h3 className="text-xl sm:text-2xl font-bold text-white mb-3">
              Prêt à construire ta liberté van par van ?
            </h3>
            <p className="text-sm text-slate-400 mb-6 max-w-md mx-auto">
              {TOTAL_MODULES} modules, {TOTAL_LESSONS}+ vidéos, une méthode testée sur nos propres vans.
              Le tout accessible à vie.
            </p>
            <LiquidButton variant="gold" size="lg" href="/van-business-academy/inscription">
              Accéder à la formation →
            </LiquidButton>
            <p className="text-xs text-slate-500 mt-4">
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
            description: `Formation complète : ${TOTAL_MODULES} modules, ${TOTAL_LESSONS}+ vidéos. Du sourcing du van à la mise en location, en passant par l'aménagement et l'homologation VASP.`,
            url: "https://vanzonexplorer.com/van-business-academy/programme",
            numberOfCredits: TOTAL_MODULES,
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
