"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import type { SanityArticle } from "../types";

type Category = "Tous" | "Road Trips" | "Aménagement Van" | "Business Van" | "Achat Van";

type Article = {
  slug: string;
  title: string;
  description: string;
  category: Exclude<Category, "Tous">;
  image: string;
  imageAlt: string;
  readTime: string;
  href: string;
  status: "live" | "coming-soon";
  featured?: boolean;
  tag?: string;
};

const articles: Article[] = [
  {
    slug: "road-trip-pays-basque-van",
    title: "Road Trip Pays Basque en Van — Itinéraire 7 Jours",
    description: "L'itinéraire complet pour explorer le Pays Basque en van aménagé. De Biarritz à la Forêt d'Irati, étapes jour par jour, spots vanlife secrets, budget au centime près.",
    category: "Road Trips",
    image: "https://images.pexels.com/photos/6946423/pexels-photo-6946423.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    imageAlt: "Van aménagé sur une route forestière enneigée - road trip Pays Basque",
    readTime: "12 min",
    href: "/road-trip-pays-basque-van",
    status: "live",
    featured: true,
    tag: "Guide complet",
  },
  {
    slug: "ou-dormir-van-pays-basque",
    title: "Où dormir en van au Pays Basque ? Les 10 meilleurs spots",
    description: "Aires municipales, bivouacs légaux, forêts et cols pyrénéens — notre sélection des meilleures nuits en van sur la côte basque et en montagne.",
    category: "Road Trips",
    image: "https://images.pexels.com/photos/35120667/pexels-photo-35120667.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    imageAlt: "Deux vans sous un ciel étoilé en montagne",
    readTime: "8 min",
    href: "/articles/ou-dormir-van-pays-basque",
    status: "coming-soon",
    tag: "Top 10",
  },
  {
    slug: "surf-vanlife-biarritz",
    title: "Surf + Vanlife à Biarritz : les plages incontournables",
    description: "Côte des Basques, Milady, Anglet… Un guide pour combiner van et surf sur la côte basque. Les meilleurs spots selon la marée, le vent et votre niveau.",
    category: "Road Trips",
    image: "https://images.pexels.com/photos/21706237/pexels-photo-21706237.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    imageAlt: "Surfeur sur une vague de l'océan Atlantique",
    readTime: "7 min",
    href: "/articles/surf-vanlife-biarritz",
    status: "coming-soon",
    tag: "Surf",
  },
  {
    slug: "rhune-randonnee-van",
    title: "Randonner à La Rhune depuis son van : guide pratique",
    description: "La Rhune à pied ou en train à crémaillère ? Le col de Saint-Ignace, les sentiers balisés, le bivouac avec vue sur deux pays — tout ce qu'il faut pour réussir l'ascension.",
    category: "Road Trips",
    image: "https://images.pexels.com/photos/35314822/pexels-photo-35314822.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    imageAlt: "Paysage des Pyrénées en Occitanie, France",
    readTime: "6 min",
    href: "/articles/rhune-randonnee-van",
    status: "coming-soon",
    tag: "Randonnée",
  },
  {
    slug: "foret-irati-van",
    title: "La Forêt d'Irati en van : randonnée, bivouac et nature sauvage",
    description: "La plus grande hêtraie d'Europe s'explore depuis un van. Sentiers, zones de bivouac autorisées, faune sauvage, itinéraires depuis Bayonne — le guide complet.",
    category: "Road Trips",
    image: "https://images.pexels.com/photos/10915474/pexels-photo-10915474.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    imageAlt: "Forêt de hêtres baignée de lumière",
    readTime: "7 min",
    href: "/articles/foret-irati-van",
    status: "coming-soon",
    tag: "Nature",
  },
  {
    slug: "cote-basque-espagne-van",
    title: "La côte basque espagnole en van : de Hondarribia à Bilbao",
    description: "Passer la frontière et explorer la Euskal Herria côté espagnol. Plages sauvages, pintxos, San Sebastián — le road trip basque ne s'arrête pas à la frontière.",
    category: "Road Trips",
    image: "https://images.pexels.com/photos/12983843/pexels-photo-12983843.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    imageAlt: "Vue côtière colorée d'un village espagnol en bord de mer",
    readTime: "9 min",
    href: "/articles/cote-basque-espagne-van",
    status: "coming-soon",
    tag: "Transfrontalier",
  },
  {
    slug: "choisir-fourgon-van-amenage",
    title: "Quel fourgon choisir pour aménager son van ? Notre guide 2025",
    description: "Renault Trafic, Citroën Jumpy, Volkswagen Transporter, Mercedes Sprinter — on compare les meilleurs fourgons pour une conversion van selon votre budget et vos besoins.",
    category: "Aménagement Van",
    image: "https://images.pexels.com/photos/15240841/pexels-photo-15240841.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    imageAlt: "Lit confortable à l'intérieur d'un van aménagé",
    readTime: "10 min",
    href: "/articles/choisir-fourgon-van-amenage",
    status: "coming-soon",
    tag: "Guide achat",
  },
  {
    slug: "isolation-van-guide-complet",
    title: "Isolation d'un van : matériaux, méthode et erreurs à éviter",
    description: "Laine de mouton, liège, armaflex — on compare les isolants et on vous guide pas à pas pour une isolation thermique et phonique efficace de votre fourgon.",
    category: "Aménagement Van",
    image: "https://images.pexels.com/photos/7285975/pexels-photo-7285975.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    imageAlt: "Travaux d'électricité et câblage DIY",
    readTime: "8 min",
    href: "/articles/isolation-van-guide-complet",
    status: "coming-soon",
    tag: "Isolation",
  },
  {
    slug: "electricite-12v-van-installation",
    title: "Électricité 12V dans un van : batterie, panneau solaire et câblage",
    description: "Comment installer un circuit 12V autonome dans son van ? Calcul de consommation, choix de la batterie lithium, panneau solaire, convertisseur — le guide technique complet.",
    category: "Aménagement Van",
    image: "https://images.pexels.com/photos/8112480/pexels-photo-8112480.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    imageAlt: "Vue aérienne d'un van garé sur un ponton face à l'océan",
    readTime: "12 min",
    href: "/articles/electricite-12v-van-installation",
    status: "coming-soon",
    tag: "Électricité",
  },
  {
    slug: "cuisine-van-amenagement",
    title: "Aménager une cuisine dans son van : plans, matériaux et astuces",
    description: "Plan de travail, réfrigérateur 12V, réchaud à gaz ou induction, évier — comment créer une cuisine fonctionnelle dans un espace réduit sans se ruiner.",
    category: "Aménagement Van",
    image: "https://images.pexels.com/photos/6946075/pexels-photo-6946075.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    imageAlt: "Couple préparant le petit-déjeuner dans un van aménagé",
    readTime: "7 min",
    href: "/articles/cuisine-van-amenagement",
    status: "coming-soon",
    tag: "Cuisine",
  },
  {
    slug: "homologation-vasp-van",
    title: "Homologation VASP : comment transformer son fourgon en véhicule de loisir",
    description: "Tout sur la réception à titre isolé (RTI) et le passage en VASP pour un van aménagé. Démarches DREAL, coût, délais et ce qu'on peut faire soi-même.",
    category: "Aménagement Van",
    image: "https://images.pexels.com/photos/6946001/pexels-photo-6946001.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    imageAlt: "Couple en road trip dans un van vert classique en forêt",
    readTime: "9 min",
    href: "/articles/homologation-vasp-van",
    status: "coming-soon",
    tag: "Administratif",
  },
  {
    slug: "mettre-van-en-location-yescapa",
    title: "Mettre son van en location sur Yescapa : le guide de départ",
    description: "Comment créer son activité de location de van ? Statut juridique, assurance, tarification, contrat — tout ce qu'il faut savoir pour démarrer sereinement sur Yescapa.",
    category: "Business Van",
    image: "https://images.pexels.com/photos/8230951/pexels-photo-8230951.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    imageAlt: "Couple souriant devant leur van bleu iconique en road trip",
    readTime: "11 min",
    href: "/articles/mettre-van-en-location-yescapa",
    status: "coming-soon",
    tag: "Démarrage",
  },
  {
    slug: "tarification-van-location-yescapa",
    title: "Tarification van sur Yescapa : comment fixer le bon prix ?",
    description: "Tarif basse/haute saison, week-end, semaine complète — les stratégies de prix qui maximisent revenus et taux d'occupation pour un van de location au Pays Basque.",
    category: "Business Van",
    image: "https://images.pexels.com/photos/7947998/pexels-photo-7947998.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    imageAlt: "Vue aérienne de rapports financiers et d'une calculatrice",
    readTime: "7 min",
    href: "/articles/tarification-van-location-yescapa",
    status: "coming-soon",
    tag: "Pricing",
  },
  {
    slug: "creer-annonce-yescapa-convertir",
    title: "Créer une annonce Yescapa qui convertit : photos, titre, description",
    description: "Les annonces qui bookent vraiment ont des caractéristiques en commun. On analyse les meilleures annonces et vous donne notre checklist pour maximiser vos réservations.",
    category: "Business Van",
    image: "https://images.pexels.com/photos/6946001/pexels-photo-6946001.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    imageAlt: "Van classique en forêt enneigée - photo d'annonce",
    readTime: "6 min",
    href: "/articles/creer-annonce-yescapa-convertir",
    status: "coming-soon",
    tag: "Marketing",
  },
  {
    slug: "declarer-revenus-location-van-impots",
    title: "Déclarer ses revenus de location de van aux impôts",
    description: "Micro-BIC, régime réel, location meublée non professionnelle — quel régime fiscal choisir pour la location de votre van ? Les règles 2025 expliquées simplement.",
    category: "Business Van",
    image: "https://images.pexels.com/photos/7111529/pexels-photo-7111529.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    imageAlt: "Calculatrice et note tax season sur un bureau",
    readTime: "8 min",
    href: "/articles/declarer-revenus-location-van-impots",
    status: "coming-soon",
    tag: "Fiscalité",
  },
  {
    slug: "optimiser-taux-occupation-van-location",
    title: "Optimiser le taux d'occupation de son van : stratégies avancées",
    description: "Réservations de dernière minute, offres saison creuse, messages automatiques, avis clients — les leviers concrets pour louer son van plus de 150 jours par an.",
    category: "Business Van",
    image: "https://images.pexels.com/photos/29509513/pexels-photo-29509513.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    imageAlt: "Calendrier de réservations van en gros plan",
    readTime: "9 min",
    href: "/articles/optimiser-taux-occupation-van-location",
    status: "coming-soon",
    tag: "Optimisation",
  },
  // ── Achat Van ──────────────────────────────────────────────
  {
    slug: "acheter-van-amenage-occasion-guide",
    title: "Acheter un van aménagé d'occasion : le guide complet 2025",
    description: "Que vérifier avant d'acheter un fourgon aménagé ? Inspection mécanique, aménagement, documents, prix du marché — tout ce qu'il faut savoir pour ne pas se tromper.",
    category: "Achat Van",
    image: "https://images.pexels.com/photos/6946001/pexels-photo-6946001.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    imageAlt: "Van vert sur une route forestière enneigée",
    readTime: "10 min",
    href: "/articles/acheter-van-amenage-occasion-guide",
    status: "coming-soon",
    tag: "Guide achat",
  },
  {
    slug: "prix-van-amenage-2025",
    title: "Prix d'un van aménagé en 2025 : ce que ça coûte vraiment",
    description: "Budget d'achat, coût d'un aménagement DIY vs clé en main, frais d'entretien, assurance — une estimation réaliste pour acheter ou construire votre van.",
    category: "Achat Van",
    image: "https://images.pexels.com/photos/10356910/pexels-photo-10356910.png?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    imageAlt: "Van garé dans la nature avec lumière du soir",
    readTime: "8 min",
    href: "/articles/prix-van-amenage-2025",
    status: "coming-soon",
    tag: "Budget",
  },
  {
    slug: "renault-trafic-amenage-notre-retour",
    title: "Renault Trafic aménagé : notre retour d'expérience après 2 ans",
    description: "Pourquoi on a choisi le Trafic III pour notre flotte de location ? Fiabilité, espace, coût d'entretien, pannes rencontrées — un retour d'expérience honnête.",
    category: "Achat Van",
    image: "https://images.pexels.com/photos/4391469/pexels-photo-4391469.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    imageAlt: "Renault Trafic blanc garé dans une rue",
    readTime: "7 min",
    href: "/articles/renault-trafic-amenage-notre-retour",
    status: "coming-soon",
    tag: "Retour d'expérience",
  },
  {
    slug: "van-amenage-pour-deux-personnes-criteres",
    title: "Van aménagé pour 2 personnes : les critères essentiels",
    description: "Lit fixe ou convertible, espace de vie, cuisine fonctionnelle, rangements — comment choisir ou construire un van confortable pour deux sans se retrouver à l'étroit.",
    category: "Achat Van",
    image: "https://images.pexels.com/photos/8231247/pexels-photo-8231247.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    imageAlt: "Couple heureux à côté de leur van au coucher du soleil",
    readTime: "6 min",
    href: "/articles/van-amenage-pour-deux-personnes-criteres",
    status: "coming-soon",
    tag: "Couple",
  },
  {
    slug: "acheter-van-amenage-pays-basque",
    title: "Acheter un van aménagé au Pays Basque : ce qu'il faut savoir",
    description: "Le marché du van aménagé d'occasion au Pays Basque — où chercher, les prix pratiqués, les particularités locales et pourquoi acheter directement à un propriétaire.",
    category: "Achat Van",
    image: "https://images.pexels.com/photos/32823206/pexels-photo-32823206.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    imageAlt: "Van garé dans un village de montagne",
    readTime: "6 min",
    href: "/articles/acheter-van-amenage-pays-basque",
    status: "coming-soon",
    tag: "Pays Basque",
  },
  {
    slug: "van-cle-en-main-vs-conversion",
    title: "Van clé en main ou auto-conversion : lequel choisir ?",
    description: "Acheter un van déjà aménagé ou construire le sien de zéro ? On compare les deux approches en termes de budget, temps, qualité et revenabilité pour vous aider à décider.",
    category: "Achat Van",
    image: "https://images.pexels.com/photos/8082327/pexels-photo-8082327.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    imageAlt: "Intérieur moderne d'un van aménagé en bois clair",
    readTime: "8 min",
    href: "/articles/van-cle-en-main-vs-conversion",
    status: "coming-soon",
    tag: "Comparatif",
  },
];

const categories: { label: Category; icon: string }[] = [
  { label: "Tous", icon: "✦" },
  { label: "Road Trips", icon: "🗺️" },
  { label: "Aménagement Van", icon: "🔧" },
  { label: "Business Van", icon: "💼" },
  { label: "Achat Van", icon: "🔑" },
];

const categoryColorMap: Record<string, string> = {
  "Road Trips": "bg-blue-50 text-blue-700",
  "Aménagement Van": "bg-emerald-50 text-emerald-700",
  "Business Van": "bg-amber-50 text-amber-700",
  "Achat Van": "bg-violet-50 text-violet-700",
};

function ArticleCard({ article, index }: { article: Article; index: number }) {
  const isLive = article.status === "live";

  return (
    <div className="animate-fade-in" style={{ animationDelay: `${index * 40}ms`, animationFillMode: "both" }}>
      <div className={`group relative flex flex-col rounded-2xl overflow-hidden border transition-all duration-300 bg-white ${isLive ? "border-slate-100 hover:border-[#4D5FEC]/30 hover:shadow-xl hover:-translate-y-1" : "border-slate-100 opacity-75 hover:opacity-90"}`}>
        <div className="relative aspect-[16/9] overflow-hidden bg-slate-100">
          <Image src={article.image} alt={article.imageAlt} fill className={`object-cover transition-transform duration-500 ${isLive ? "group-hover:scale-105" : "grayscale-[20%]"}`} unoptimized />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent" />
          <div className="absolute top-3 left-3 flex gap-2">
            {article.tag && (
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full backdrop-blur-sm ${isLive ? "bg-white/95 text-slate-800" : "bg-white/80 text-slate-500"}`}>{article.tag}</span>
            )}
            {!isLive && <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-800/80 text-white/80 backdrop-blur-sm">Bientôt</span>}
            {isLive && (
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-[#4D5FEC]/90 text-white backdrop-blur-sm flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />Disponible
              </span>
            )}
          </div>
          <div className="absolute bottom-3 right-3 text-xs font-medium text-white/90 bg-black/30 backdrop-blur-sm px-2.5 py-1 rounded-full">{article.readTime} de lecture</div>
        </div>

        <div className="flex flex-col flex-1 p-5">
          <span className={`self-start text-xs font-semibold px-2.5 py-1 rounded-full mb-3 ${categoryColorMap[article.category]}`}>{article.category}</span>
          <h3 className={`font-black text-slate-900 text-base leading-snug mb-2 flex-1 transition-colors duration-200 ${isLive ? "group-hover:text-[#4D5FEC]" : ""}`}>{article.title}</h3>
          <p className="text-slate-500 text-sm leading-relaxed line-clamp-2 mb-4">{article.description}</p>
          {isLive ? (
            <Link href={article.href} className="inline-flex items-center gap-1.5 text-sm font-semibold mt-auto transition-colors" style={{ color: "#4D5FEC" }}>
              Lire l&apos;article
              <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
            </Link>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-400 mt-auto cursor-default">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              Article en préparation
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ArticlesPageClient({ sanityArticles = [] }: { sanityArticles: SanityArticle[] }) {
  const [activeCategory, setActiveCategory] = useState<Category>("Tous");

  // Merge: Sanity articles override hardcoded articles with the same slug, then append remaining hardcoded
  const mergedArticles = useMemo<Article[]>(() => {
    const sanityMapped: Article[] = sanityArticles.map((a) => ({
      slug: a.slug,
      title: a.title,
      description: a.excerpt,
      category: a.category,
      image: a.coverImage?.url ?? "https://cdn.sanity.io/images/lewexa74/production/f93fa16ab46d8934dcc3092a8e86fc80ebce4305-1080x750.png",
      imageAlt: a.coverImage?.alt ?? a.title,
      readTime: a.readTime ?? "5 min",
      href: `/articles/${a.slug}`,
      status: "live" as const,
      featured: a.featured,
      tag: a.tag,
    }));
    const sanitySlugSet = new Set(sanityArticles.map((a) => a.slug));
    const hardcodedRemaining = articles.filter((a) => !sanitySlugSet.has(a.slug));
    // Featured Sanity articles first, then remaining Sanity articles, then hardcoded
    const sanityFeatured = sanityMapped.filter((a) => a.featured);
    const sanityOthers = sanityMapped.filter((a) => !a.featured);
    return [...sanityFeatured, ...sanityOthers, ...hardcodedRemaining];
  }, [sanityArticles]);

  const featuredArticle = mergedArticles.find((a) => a.featured);
  const showFeaturedSection = activeCategory === "Tous";
  const filteredArticles = activeCategory === "Tous"
    ? mergedArticles.filter((a) => !a.featured)
    : mergedArticles.filter((a) => a.category === activeCategory);

  const liveCount = mergedArticles.filter((a) => a.status === "live").length;
  const comingSoonCount = mergedArticles.filter((a) => a.status === "coming-soon").length;
  const countByCategory = (cat: Category) => cat === "Tous" ? mergedArticles.length : mergedArticles.filter((a) => a.category === cat).length;

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden pt-10 pb-0" style={{ background: "linear-gradient(160deg, #0F153A 0%, #1e2860 50%, #0c1233 100%)" }}>
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
        <div className="relative z-10 max-w-7xl mx-auto px-6 pt-10 pb-16">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 border border-white/15 bg-white/5 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
              <span className="w-2 h-2 rounded-full bg-[#4BC3E3] animate-pulse" />
              <span className="text-white/70 text-xs font-semibold uppercase tracking-widest">Vanzon Explorer · Magazine</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-black text-white leading-tight mb-5">
              Guides & Articles<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4BC3E3] to-[#4D5FEC]">Vanlife &amp; Pays Basque</span>
            </h1>
            <p className="text-white/60 text-xl leading-relaxed max-w-xl mb-8">
              Itinéraires, spots secrets, conseils pratiques et culture basque — tout ce qu&apos;il faut pour vivre le Pays Basque en van comme un local.
            </p>
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-400" />
                <span className="text-white/70">{liveCount} article{liveCount > 1 ? "s" : ""} disponible{liveCount > 1 ? "s" : ""}</span>
              </div>
              <div className="w-px h-4 bg-white/15" />
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-white/30" />
                <span className="text-white/50">{comingSoonCount} articles en préparation</span>
              </div>
            </div>
          </div>
        </div>
        <div className="relative h-10 overflow-hidden">
          <svg viewBox="0 0 1440 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute bottom-0 w-full" preserveAspectRatio="none">
            <path d="M0 40 L0 20 Q360 0 720 20 Q1080 40 1440 10 L1440 40 Z" fill="white" />
          </svg>
        </div>
      </section>

      {/* FEATURED */}
      {featuredArticle && showFeaturedSection && (
        <section className="bg-white pt-10 pb-0">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex items-center gap-3 mb-6">
              <span className="w-8 h-px bg-slate-200" />
              <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">Article à la une</span>
            </div>
            <Link href={featuredArticle.href} className="group block">
              <div className="relative rounded-3xl overflow-hidden border border-slate-100 hover:border-[#4D5FEC]/30 transition-all duration-300 hover:shadow-2xl">
                <div className="grid md:grid-cols-2 min-h-[400px]">
                  <div className="relative min-h-[260px] md:min-h-0">
                    <Image src={featuredArticle.image} alt={featuredArticle.imageAlt} fill className="object-cover transition-transform duration-700 group-hover:scale-105" unoptimized priority />
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-white hidden md:block" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent md:hidden" />
                  </div>
                  <div className="flex flex-col justify-center p-8 md:p-12 bg-white">
                    <div className="flex items-center gap-3 mb-5">
                      <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-[#4D5FEC] text-white flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />Disponible
                      </span>
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${categoryColorMap[featuredArticle.category]}`}>{featuredArticle.category}</span>
                      <span className="text-xs text-slate-400">{featuredArticle.readTime} de lecture</span>
                    </div>
                    <h2 className="text-2xl md:text-3xl font-black text-slate-900 leading-snug mb-4 group-hover:text-[#4D5FEC] transition-colors duration-200">{featuredArticle.title}</h2>
                    <p className="text-slate-500 leading-relaxed mb-8 text-base">{featuredArticle.description}</p>
                    <div className="inline-flex items-center gap-2 text-base font-bold transition-colors" style={{ color: "#4D5FEC" }}>
                      Lire l&apos;article complet
                      <svg className="w-5 h-5 transition-transform group-hover:translate-x-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </section>
      )}

      {/* FILTRES */}
      <section className="bg-white pt-14 pb-0">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center gap-3 mb-6">
            <span className="w-8 h-px bg-slate-200" />
            <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">Parcourir par thème</span>
          </div>
          <div className="flex flex-wrap gap-3">
            {categories.map(({ label, icon }) => {
              const isActive = activeCategory === label;
              const count = countByCategory(label);
              return (
                <button key={label} onClick={() => setActiveCategory(label)}
                  className={`group flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all duration-200 cursor-pointer ${isActive ? "bg-[#4D5FEC] text-white border-[#4D5FEC] shadow-md shadow-[#4D5FEC]/20" : "bg-white text-slate-600 border-slate-200 hover:border-[#4D5FEC]/40 hover:text-[#4D5FEC] hover:bg-blue-50/50"}`}
                >
                  <span className="text-base leading-none">{icon}</span>
                  <span>{label}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold transition-colors ${isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-600"}`}>{count}</span>
                </button>
              );
            })}
          </div>
          <div className="mt-8 h-px bg-slate-100" />
        </div>
      </section>

      {/* GRILLE */}
      <section className="bg-white py-10 pb-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between mb-8">
            <p className="text-sm text-slate-400">
              <span className="font-semibold text-slate-700">{filteredArticles.length}</span> article{filteredArticles.length > 1 ? "s" : ""}
              {activeCategory !== "Tous" && <span className="ml-1">dans <span className="font-medium text-slate-600">{activeCategory}</span></span>}
            </p>
            {activeCategory !== "Tous" && (
              <button onClick={() => setActiveCategory("Tous")} className="text-xs text-slate-400 hover:text-[#4D5FEC] transition-colors flex items-center gap-1 font-medium">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                Réinitialiser le filtre
              </button>
            )}
          </div>
          <div key={activeCategory} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredArticles.map((article, i) => <ArticleCard key={article.slug} article={article} index={i} />)}
          </div>
          {filteredArticles.length === 0 && (
            <div className="text-center py-24 animate-fade-in">
              <div className="text-5xl mb-4">🔍</div>
              <p className="text-slate-400 text-lg font-medium">Aucun article dans cette catégorie pour l&apos;instant.</p>
              <button onClick={() => setActiveCategory("Tous")} className="mt-4 text-sm font-semibold transition-colors" style={{ color: "#4D5FEC" }}>Voir tous les articles →</button>
            </div>
          )}
        </div>
      </section>

      {/* NEWSLETTER */}
      <section className="py-20 border-t border-slate-100" style={{ background: "linear-gradient(160deg, #EFF6FF 0%, #F0FDFF 100%)" }}>
        <div className="max-w-3xl mx-auto px-6 text-center">
          <div className="text-4xl mb-5">📬</div>
          <h2 className="text-3xl font-black text-slate-900 mb-3">Ne ratez pas les prochains guides</h2>
          <p className="text-slate-500 text-lg leading-relaxed mb-2 max-w-xl mx-auto">
            {comingSoonCount} articles en cours de rédaction sur le vanlife au Pays Basque — spots secrets, conseils pratiques, itinéraires inédits.
          </p>
          <p className="text-slate-400 text-sm mb-8">Retrouvez nos articles au fil des publications sur cette page.</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/location" className="inline-flex items-center justify-center gap-2 bg-slate-900 text-white font-bold px-8 py-4 rounded-xl hover:bg-slate-800 transition-colors text-base shadow-lg">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="8" x="2" y="13" rx="2" /><path d="M6 13V8a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v5" /></svg>
              Louer un van aménagé au Pays Basque
            </Link>
            <Link href="/road-trip-pays-basque-van" className="inline-flex items-center justify-center gap-2 border border-slate-200 bg-white text-slate-700 font-bold px-8 py-4 rounded-xl hover:border-[#4D5FEC]/40 hover:text-[#4D5FEC] transition-colors text-base">
              Lire le guide road trip →
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
