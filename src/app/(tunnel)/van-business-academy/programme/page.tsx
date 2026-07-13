import type { Metadata } from "next";
import ModuleAccordion from "./ModuleAccordion";

export const metadata: Metadata = {
  title: "Programme complet — Van Business Academy | Vanzon Explorer",
  description:
    "Découvre le programme détaillé de la Van Business Academy : 11 modules, +100 vidéos, du sourcing à la location. Formation terrain par des loueurs en activité.",
  alternates: { canonical: "https://vanzonexplorer.com/van-business-academy/programme" },
  openGraph: {
    title: "Programme complet — Van Business Academy",
    description: "11 modules, +100 vidéos, de l'achat du van à la mise en location. Tout le détail du programme.",
    type: "website",
  },
};

/* ── Module data ── */

export interface Lesson {
  title: string;
  duration?: number;
  tag?: "quiz" | "pdf" | "bonus" | "outil" | "nouveau" | "filmé";
}

export interface Module {
  number: number;
  title: string;
  emoji: string;
  description: string;
  lessons: Lesson[];
  badge?: string;
  comingSoon?: boolean;
  estimatedMinutes?: number;
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
      { title: "Quiz Module 1", tag: "quiz" },
      { title: "Fiche récap PDF", tag: "pdf" },
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
      { title: "Quiz Module 4", tag: "quiz" },
      { title: "Fiche récap PDF", tag: "pdf" },
    ],
  },
  {
    number: 5,
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
      { title: "Quiz Module 5", tag: "quiz" },
      { title: "Fiche récap PDF", tag: "pdf" },
    ],
  },
  {
    number: 6,
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
      { title: "Quiz Module 6", tag: "quiz" },
      { title: "Fiche récap PDF", tag: "pdf" },
    ],
  },
  {
    number: 7,
    title: "Les travaux VASP (L1H1)",
    emoji: "👷🏼‍♂️",
    description: "20 vidéos pratiques filmées en atelier — tout l'aménagement VASP d'un L1H1 de A à Z.",
    badge: "VASP",
    lessons: [
      { title: "Nettoyage", duration: 8 },
      { title: "La pose de la fenêtre", duration: 12 },
      { title: "La pose des aérations", duration: 10 },
      { title: "La pose du lanterneau", duration: 10 },
      { title: "La pose de la structure", duration: 15 },
      { title: "L'isolation Armaflex", duration: 12 },
      { title: "La pose de la moquette feutrine", duration: 8 },
      { title: "Construire le robinet fixe", duration: 10 },
      { title: "La plaque de cuisson", duration: 8 },
      { title: "Le lit peigne", duration: 12 },
      { title: "Le sol", duration: 10 },
      { title: "Le plafond", duration: 10 },
      { title: "La pose des rideaux", duration: 8 },
      { title: "Fabrication du lit", duration: 15 },
      { title: "Meuble d'entrée", duration: 10 },
      { title: "Meuble de cuisine et eau", duration: 12 },
      { title: "Étagère arrière", duration: 8 },
      { title: "Le ponçage", duration: 8 },
      { title: "Installation électrique", duration: 15 },
      { title: "Le vernissage", duration: 10 },
      { title: "Quiz Module 7", tag: "quiz" },
      { title: "Fiche récap PDF", tag: "pdf" },
    ],
  },
  {
    number: 8,
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
      { title: "Quiz Module 8", tag: "quiz" },
      { title: "Fiche récap PDF", tag: "pdf" },
    ],
  },
  {
    number: 9,
    title: "Les démarches administratives",
    emoji: "📄",
    description: "Du dossier VASP à la DREAL : chaque document, chaque étape, chaque astuce pour obtenir ton homologation sans stress.",
    badge: "VASP",
    lessons: [
      { title: "Les dossiers VASP — Google Drive & checklist Airtable", duration: 10 },
      { title: "Demande de réception", duration: 8 },
      { title: "Attestation de travaux", duration: 6 },
      { title: "COC / Barré rouge — obtenir le certificat de conformité", duration: 10 },
      { title: "Photos de ton van", duration: 5 },
      { title: "La DREAL — tout le process de A à Z", duration: 15 },
      { title: "Certificat de conformité QUALIGAZ", duration: 8 },
      { title: "Pré-remplir le dossier pour la DREAL", duration: 10 },
      { title: "Comment peser son véhicule", duration: 6 },
      { title: "Calcul de répartition des charges", duration: 8 },
      { title: "Plans Électricité & eau", duration: 10 },
      { title: "Quiz Module 9", tag: "quiz" },
      { title: "Fiche récap PDF", tag: "pdf" },
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

const BONUS_MODULE: Module = {
  number: 0,
  title: "Les travaux (non VASP)",
  emoji: "🔨",
  description: "Aménagement classique sans homologation : du nettoyage aux finitions, chaque étape filmée dans l'atelier.",
  badge: "BONUS",
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
    { title: "Quiz", tag: "quiz" },
    { title: "Fiche récap PDF", tag: "pdf" },
  ],
};

const TOTAL_LESSONS = MODULES.reduce((sum, m) => sum + m.lessons.length, 0) + BONUS_MODULE.lessons.length;
const TOTAL_MODULES = MODULES.length;
const TOTAL_MINUTES = MODULES.reduce(
  (sum, m) => sum + (m.estimatedMinutes ?? m.lessons.reduce((s, l) => s + (l.duration ?? 0), 0)),
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
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold tracking-wider uppercase mb-6"
            style={{ background: "rgba(185,148,95,0.08)", border: "1px solid rgba(185,148,95,0.25)", color: "var(--gold)" }}
          >
            🎓 Programme détaillé
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 leading-tight tracking-tight">
            Van Business Academy
          </h1>

          {/* Stats bar */}
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 mt-10">
            {[
              { value: `${TOTAL_MODULES}`, label: "modules" },
              { value: `${TOTAL_LESSONS}+`, label: "vidéos" },
              { value: `${TOTAL_HOURS}h${REMAINING_MINUTES > 0 ? `${REMAINING_MINUTES.toString().padStart(2, "0")}` : ""}`, label: "de contenu" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl sm:text-3xl font-black bg-clip-text text-transparent" style={{ backgroundImage: "linear-gradient(135deg, var(--gold) 0%, var(--gold-light) 100%)" }}>
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

        {/* ── Module bonus ── */}
        <div className="mt-10">
          <div className="text-center mb-6">
            <span
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold tracking-wider uppercase"
              style={{ background: "rgba(185,148,95,0.08)", border: "1px solid rgba(185,148,95,0.25)", color: "var(--gold)" }}
            >
              🎁 Module bonus
            </span>
          </div>
          <ModuleAccordion modules={[BONUS_MODULE]} isBonusSection />
        </div>

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
              <span className="bg-clip-text text-transparent" style={{ backgroundImage: "linear-gradient(135deg, var(--gold) 0%, var(--gold-light) 100%)" }}>
                en plus des vidéos
              </span>
            </h2>
          </div>

          <div className="grid gap-4 sm:gap-5">
            {[
              {
                emoji: "🛒",
                title: "Liste de course complète",
                iconBg: "rgba(245,158,11,0.08)",
                text: (
                  <>
                    Un <span className="text-slate-900 font-semibold">tableur Airtable complet</span> avec chaque matériau, chaque outil, chaque référence et son prix.
                    Tu maîtrises <span className="text-slate-900 font-semibold">100% de ton budget</span> avant même de commencer les travaux — zéro surprise.
                  </>
                ),
              },
              {
                emoji: "📋",
                title: "Templates administratifs VASP",
                iconBg: "rgba(59,130,246,0.08)",
                text: (
                  <>
                    Des <span className="text-slate-900 font-semibold">documents pré-remplis</span> dans un Google Drive partagé pour faire ta demande d&apos;homologation VASP
                    vite et bien. Demande de réception, attestation de travaux, checklist DREAL — tout est prêt, tu n&apos;as qu&apos;à compléter.
                  </>
                ),
              },
              {
                emoji: "⚡",
                title: "Schémas électricité & eau détaillés",
                iconBg: "rgba(168,85,247,0.08)",
                text: (
                  <>
                    Des <span className="text-slate-900 font-semibold">schémas complets et annotés</span> pour le circuit électrique et le circuit d&apos;eau de ton van.
                    Tu sais exactement quoi brancher où, sans risque d&apos;erreur.
                  </>
                ),
              },
              {
                emoji: "🤝",
                title: "Programme de parrainage",
                iconBg: "rgba(185,148,95,0.08)",
                text: (
                  <>
                    Tu obtiens un <span className="text-slate-900 font-semibold">code promo personnalisé</span> à partager autour de toi.
                    Chaque personne qui rejoint la formation grâce à ton code bénéficie d&apos;une réduction —
                    et toi, tu touches <span className="text-slate-900 font-semibold">10% de commission</span> sur chaque vente.
                  </>
                ),
              },
              {
                emoji: "📣",
                title: "Campagne de publicité offerte",
                iconBg: "rgba(16,185,129,0.08)",
                text: (
                  <>
                    Une fois tes travaux terminés, tu accèdes au <span className="text-slate-900 font-semibold">réseau de média buyers de Vanzon Explorer</span>.
                    On lance gratuitement une campagne publicitaire pour toi — que ce soit pour
                    optimiser la <span className="text-slate-900 font-semibold">location</span> ou accélérer la <span className="text-slate-900 font-semibold">revente</span> de ton van.
                  </>
                ),
              },
              {
                emoji: "🌐",
                title: "Ton van publié sur Vanzon Explorer",
                iconBg: "rgba(239,68,68,0.06)",
                text: (
                  <>
                    Ton van terminé ? On publie ton annonce directement sur <span className="text-slate-900 font-semibold">vanzonexplorer.com</span> et
                    tu profites de notre référencement SEO. En bonus, on publie une <span className="text-slate-900 font-semibold">série d&apos;articles de blog</span> ciblés
                    sur ta zone géographique pour attirer des locataires intéressés par ta région.
                  </>
                ),
              },
              {
                emoji: "💬",
                title: "Contact WhatsApp direct avec Jules",
                iconBg: "rgba(37,211,102,0.08)",
                text: (
                  <>
                    Tu as accès à mon <span className="text-slate-900 font-semibold">WhatsApp personnel</span> pour échanger sur n&apos;importe quelle question liée à ton projet.
                    Je suis toujours ouvert à de nouvelles idées, des partenariats et de nouveaux projets ensemble.
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
      </section>

      {/* ── Comparatif investissement ── */}
      <section className="pb-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-14">
            <span
              className="inline-block px-4 py-2 rounded-full text-sm font-medium mb-6"
              style={{ background: "rgba(185, 148, 95, 0.08)", border: "1px solid rgba(185, 148, 95, 0.25)", color: "rgb(185, 148, 95)" }}
            >
              💰 Comparatif réel
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900">
              L&apos;investissement avec et sans accompagnement
            </h2>
            <p className="text-slate-400 mt-3 max-w-xl mx-auto">
              Des chiffres réels issus de notre expérience terrain.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            {/* SANS */}
            <div className="rounded-2xl p-6 md:p-8 border border-slate-200 bg-slate-50">
              <div className="flex items-center gap-2 mb-6">
                <span className="text-xl">❌</span>
                <h3 className="text-lg md:text-xl font-bold text-slate-900">SANS l&apos;accompagnement</h3>
              </div>
              <div className="mb-6">
                <span className="inline-block px-4 py-2 rounded-lg text-xl md:text-2xl font-black text-red-700 bg-red-50 border border-red-100">
                  23 600 €
                </span>
              </div>
              <ul className="space-y-3">
                {[
                  { amount: "13 000 €", label: "Véhicule" },
                  { amount: "10 600 €", label: "Aménagement" },
                  { amount: "❌", label: "Pas d'homologation VASP" },
                  { amount: "8 mois", label: "Temps des travaux" },
                  { amount: "❌", label: "Pas d'exploitation à la location" },
                  { amount: "❌", label: "Mauvaise revente" },
                ].map((item) => (
                  <li key={item.label} className="flex items-center gap-3 text-slate-600 text-sm md:text-base">
                    <span className="font-bold text-red-500 flex-shrink-0 min-w-[100px]">{item.amount}</span>
                    <span className="text-slate-300">→</span>
                    <span>{item.label}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* AVEC */}
            <div
              className="rounded-2xl p-6 md:p-8 border shadow-sm"
              style={{ borderColor: "rgba(185, 148, 95, 0.3)", background: "rgba(185, 148, 95, 0.03)" }}
            >
              <div className="flex items-center gap-2 mb-6">
                <span className="text-xl">✅</span>
                <h3 className="text-lg md:text-xl font-bold text-slate-900">AVEC l&apos;accompagnement</h3>
              </div>
              <div className="mb-6">
                <span className="inline-block px-4 py-2 rounded-lg text-xl md:text-2xl font-black text-emerald-700 bg-emerald-50 border border-emerald-100">
                  15 000 €
                </span>
              </div>
              <ul className="space-y-3">
                {[
                  { amount: "10 000 €", label: "Véhicule négocié" },
                  { amount: "4 300 €", label: "Aménagement" },
                  { amount: "700 €", label: "Documents VASP pré-remplis" },
                  { amount: "3-4 mois", label: "Temps des travaux" },
                  { amount: "7 000 €/an", label: "Mise en location" },
                  { amount: "Revente", label: "optimisée" },
                  { amount: "Compétences", label: "Recommencer le process" },
                ].map((item) => (
                  <li key={item.label} className="flex items-center gap-3 text-slate-600 text-sm md:text-base">
                    <span className="font-bold flex-shrink-0 min-w-[100px]" style={{ color: "rgb(22, 163, 74)" }}>{item.amount}</span>
                    <span className="text-slate-300">→</span>
                    <span>{item.label}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-10 text-center">
            <p className="text-slate-500 text-sm">
              Économie moyenne constatée : <span className="font-bold" style={{ color: "rgb(185, 148, 95)" }}>8 600 € + un van qui génère des revenus</span>
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
