import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import GlassCard from "@/components/ui/GlassCard";
import LiquidButton from "@/components/ui/LiquidButton";
import OtherServices from "@/components/ui/OtherServices";

export const metadata: Metadata = {
  title: "Pays Basque en van — Spots, Bivouacs & Itinéraires | Vanzon Explorer",
  description:
    "Guide complet pour explorer le Pays Basque en van aménagé : meilleurs spots, bivouacs légaux, itinéraires par saison et conseils pratiques. Départ Cambo-les-Bains.",
  alternates: {
    canonical: "https://vanzonexplorer.com/pays-basque",
  },
};

const SPOTS = [
  {
    name: "Biarritz",
    tag: "Surf & océan",
    desc: "La Côte des Basques, Milady, la Grande Plage — Biarritz concentre les meilleurs spots de surf d'Europe à moins de 25 minutes de Cambo-les-Bains. Idéale pour dormir face à l'Atlantique.",
    img: "https://www.destination-biarritz.fr/app/uploads/2024/05/img-1959.webp",
    alt: "Plage de Biarritz avec l'océan Atlantique au coucher du soleil",
    href: "/location/biarritz",
  },
  {
    name: "Hossegor",
    tag: "Vagues & pinèdes",
    desc: "Hossegor est la capitale mondiale du surf de haut niveau. Les Landes commencent ici : pinèdes, lacs, vagues puissantes. Un incontournable à 45 min en van depuis le Pays Basque.",
    img: "https://hossegor-surf.fr/wp-content/uploads/2022/04/vague-hossegor.jpeg",
    alt: "Vague de surf à La Gravière, Hossegor",
    href: "/location/hossegor",
  },
  {
    name: "Saint-Jean-de-Luz",
    tag: "Village & gastronomie",
    desc: "Port de pêche authentique, maisons basques colorées et marché couvert. La place Louis XIV est l'une des plus belles du Pays Basque. Aire de camping-car municipale à 7€/nuit.",
    img: "https://www.saint-jean-de-luz.com/wp-content/uploads/2021/04/p1190705-1600x690.jpg",
    alt: "Port et bateaux de Saint-Jean-de-Luz au Pays Basque",
    href: "/location/saint-jean-de-luz",
  },
  {
    name: "Forêt d'Irati",
    tag: "Montagne & nature",
    desc: "La plus grande hêtraie-sapinière d'Europe, à la frontière espagnole. Bivouac en forêt autorisé sur les pistes forestières, silence total, chevaux sauvages et paysages pyrénéens.",
    img: "https://media.sudouest.fr/16227503/1000x625/sudouest-photo-1-3807448-1600.jpg?v=1754848800",
    alt: "Forêt d'Irati au Pays Basque — hêtraie en automne",
    href: "/location/foret-irati",
  },
  {
    name: "La Rhune",
    tag: "Sommet & panorama",
    desc: "905 mètres, vue sur l'Atlantique et les Pyrénées, troupeaux de pottok — la Rhune est le symbole du Pays Basque. On y monte à pied ou en petit train à crémaillère depuis Sare.",
    img: "https://www.rhune.com/wp-content/uploads/2020/11/dscf0459-700x525.jpg",
    alt: "Vue panoramique depuis le sommet de la Rhune — Pays Basque et Atlantique",
    href: "/road-trip-pays-basque-van",
  },
  {
    name: "Saint-Jean-Pied-de-Port",
    tag: "Camino & Pyrénées",
    desc: "Porte d'entrée du Chemin de Saint-Jacques, vieille ville médiévale, marché basque le lundi. Une étape montagne parfaite avec plusieurs aires de stationnement van accessibles.",
    img: "https://www.tourisme64.com/wp-content/uploads/2023/09/Saint-Jean-Pied-de-Port-et-Nive-001-%C2%A9PierreCarton2048-e1701854909605-1400x777.png",
    alt: "Village médiéval de Saint-Jean-Pied-de-Port et la Nive dans les Pyrénées",
    href: "/road-trip-pays-basque-van",
  },
];

const BIVOUAC_RULES = [
  {
    icon: "✓",
    positive: true,
    title: "Aires municipales",
    desc: "Saint-Jean-de-Luz (7€/nuit), Hendaye, Cambo-les-Bains, Saint-Jean-Pied-de-Port. Eau, électricité, vidange disponibles.",
  },
  {
    icon: "✓",
    positive: true,
    title: "Forêt d'Irati",
    desc: "Bivouac toléré sur les pistes forestières balisées. Arrivée après 20h, départ avant 9h, zéro déchet. La règle d'or du bivouac responsable.",
  },
  {
    icon: "✓",
    positive: true,
    title: "Campings vanlife",
    desc: "De nombreux campings acceptent les vans aménagés hors saison à tarif réduit. Idéal pour les séjours de plus de 3 nuits.",
  },
  {
    icon: "✗",
    positive: false,
    title: "Bord de mer",
    desc: "Le stationnement nocturne est interdit dans la plupart des zones côtières en été. Respectez les panneaux — les PV sont fréquents.",
  },
];

const SAISONS = [
  {
    emoji: "🌿",
    label: "Printemps",
    months: "Mars — Juin",
    note: "Idéale",
    noteColor: "bg-emerald-500",
    accentGradient: "from-emerald-400 to-teal-400",
    desc: "La meilleure période : fréquentation faible, températures douces (16–22°C), végétation luxuriante. Les routes de montagne rouvrent en mai. Tarif intermédiaire (75€/nuit).",
  },
  {
    emoji: "☀️",
    label: "Été",
    months: "Juil — Août",
    note: "Animée",
    noteColor: "bg-orange-500",
    accentGradient: "from-orange-400 to-amber-300",
    desc: "Chaleur, mer à 22°C et ambiance festive. Les aires se remplissent vite — réservez à l'avance. Haute saison chez Vanzon Explorer (95€/nuit). Privilégiez les départs tôt le matin.",
  },
  {
    emoji: "🍂",
    label: "Automne",
    months: "Sept — Nov",
    note: "Coup de cœur",
    noteColor: "bg-amber-500",
    accentGradient: "from-amber-400 to-orange-400",
    desc: "La forêt d'Irati prend ses couleurs, les vagues d'Hossegor sont au top, les touristes sont partis. Septembre reste chaud (24°C). Notre saison préférée pour les vanlifer.",
  },
  {
    emoji: "❄️",
    label: "Hiver",
    months: "Déc — Fév",
    note: "Calme",
    noteColor: "bg-blue-500",
    accentGradient: "from-blue-400 to-sky-400",
    desc: "Montagne enneigée, côte déserte et lumières basses — un pays basque secret. Froid en altitude (0–5°C), doux sur la côte (12°C). Tarif basse saison Vanzon Explorer (65€/nuit).",
  },
];

const STATS = [
  { value: "100 km", label: "Côte à montagne", sub: "Atlantique aux Pyrénées" },
  { value: "45 min", label: "Depuis Cambo", sub: "Toutes destinations accessibles" },
  { value: "4 saisons", label: "De vanlife", sub: "Chaque saison a ses spots" },
];

const FAQ_ITEMS = [
  {
    question: "Où bivouaquer légalement en van au Pays Basque ?",
    answer:
      "Les aires de camping-cars municipales sont la solution la plus sûre : Saint-Jean-de-Luz (7€/nuit), Hendaye, Cambo-les-Bains, Saint-Jean-Pied-de-Port. En montagne, le bivouac est toléré dans la Forêt d'Irati sur les pistes forestières balisées, à condition de partir avant 9h et de ne laisser aucune trace. Sur la côte, le bivouac est interdit dans les zones urbanisées — respectez les panneaux locaux.",
  },
  {
    question: "Quelle est la meilleure saison pour un van trip au Pays Basque ?",
    answer:
      "Le printemps (avril–juin) et l'automne (septembre–octobre) sont les meilleures périodes : météo agréable, peu de monde et paysages au sommet. L'été est possible mais les aires saturent et les prix augmentent. L'hiver est idéal pour les amateurs de solitude et de surf de qualité.",
  },
  {
    question: "Combien de jours faut-il pour le Pays Basque en van ?",
    answer:
      "Un minimum de 5 à 7 jours est recommandé pour voir l'essentiel : 2 jours côte (Biarritz, Saint-Jean-de-Luz), 2 jours montagne (Rhune, Espelette, Saint-Jean-Pied-de-Port), 1 à 2 jours forêt d'Irati. Notre guide road trip 7 jours couvre l'itinéraire complet avec budget estimé à 900–1 200€ pour deux.",
  },
  {
    question: "Peut-on surfer et faire du van au Pays Basque ?",
    answer:
      "Absolument, c'est la combinaison parfaite. La côte basque concentre les meilleurs spots de surf d'Europe en moins de 30 km : Côte des Basques et Milady à Biarritz, Les Alcyons à Guéthary, La Gravière à Hossegor. Les vans Vanzon Explorer sont équipés d'une douche extérieure 12V — parfaite pour rincer combinaison et planches.",
  },
  {
    question: "Peut-on partir avec un van Vanzon Explorer sans permis spécial ?",
    answer:
      "Oui. Les vans Vanzon Explorer sont des véhicules homologués conduits avec un permis B classique. Ils sont assurés tous risques via Yescapa, avec assistance 24h/24. Aucune expérience préalable de camping-car n'est nécessaire — un briefing complet est fourni au départ à Cambo-les-Bains.",
  },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ_ITEMS.map(({ question, answer }) => ({
    "@type": "Question",
    name: question,
    acceptedAnswer: { "@type": "Answer", text: answer },
  })),
};

const destinationJsonLd = {
  "@context": "https://schema.org",
  "@type": "TouristDestination",
  name: "Pays Basque",
  description:
    "Région du sud-ouest de la France entre Atlantique et Pyrénées. Destinations vanlife emblématiques : Biarritz, Hossegor, Saint-Jean-de-Luz, Forêt d'Irati, La Rhune.",
  url: "https://vanzonexplorer.com/pays-basque",
  touristType: "Vanlifers, surfeurs, randonneurs",
  includesAttraction: [
    { "@type": "TouristAttraction", name: "Biarritz", description: "Côte des Basques, surf, Grande Plage" },
    { "@type": "TouristAttraction", name: "Forêt d'Irati", description: "Hêtraie-sapinière, bivouac, chevaux sauvages" },
    { "@type": "TouristAttraction", name: "La Rhune", description: "Sommet 905m, panorama Atlantique et Pyrénées" },
    { "@type": "TouristAttraction", name: "Saint-Jean-de-Luz", description: "Port de pêche, architecture basque, marché" },
    { "@type": "TouristAttraction", name: "Saint-Jean-Pied-de-Port", description: "Village médiéval, Chemin de Saint-Jacques" },
  ],
};

export default function PaysBasquePage() {
  return (
    <>
      {/* ── Hero ── */}
      <section className="relative overflow-hidden min-h-[72vh] flex items-end">
        <div className="absolute inset-0">
          <Image
            src="https://cdn.sanity.io/images/lewexa74/production/0b3f81d08627ba0b4423224029cb5016d0e7ed25-2048x1365.jpg"
            alt="Pays Basque depuis un van - ikurriña et paysage basque Vanzon Explorer"
            fill
            sizes="100vw"
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/35 to-transparent" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-6 pb-16 w-full">
          <span className="inline-block text-xs font-semibold uppercase tracking-widest text-white/55 mb-4">
            Guide Vanzon Explorer
          </span>
          <h1 className="text-5xl md:text-7xl font-black text-white leading-tight">
            Le Pays Basque,<br className="hidden sm:block" /> en van.
          </h1>
          <p className="text-lg text-white/75 mt-4 max-w-xl leading-relaxed">
            Des plages de Biarritz aux forêts d&apos;Irati — le guide complet pour
            explorer la région la plus sauvage du Sud-Ouest à votre rythme.
          </p>
          <div className="flex flex-wrap gap-2.5 mt-7">
            {["6 destinations", "Bivouacs légaux", "Par saison", "FAQ pratique"].map((tag) => (
              <span key={tag} className="text-xs font-semibold bg-white/10 backdrop-blur-sm border border-white/20 text-white px-3 py-1.5 rounded-full">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats + Intro ── */}
      <section className="bg-white py-16">
        <div className="max-w-5xl mx-auto px-6">
          {/* Stats row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
            {STATS.map((stat) => (
              <GlassCard key={stat.value} padding="p-6" className="text-center">
                <div className="text-3xl md:text-4xl font-black text-slate-900">{stat.value}</div>
                <div className="text-sm font-semibold text-blue-500 mt-1.5">{stat.label}</div>
                <div className="text-xs text-slate-400 mt-1">{stat.sub}</div>
              </GlassCard>
            ))}
          </div>

          {/* Intro text */}
          <div className="max-w-3xl mx-auto space-y-4">
            <p className="text-lg text-slate-600 leading-relaxed">
              Le Pays Basque est l&apos;une des destinations vanlife les plus complètes d&apos;Europe.
              En moins de 100 km, on passe de l&apos;Atlantique à 900 mètres d&apos;altitude, de la meilleure
              vague de surf du continent aux forêts pyrénéennes les plus denses. Chaque étape a
              sa personnalité : villages basques en rouge et blanc, ports de pêche, cols de
              montagne, bivouacs au cœur de hêtraies centenaires.
            </p>
            <p className="text-lg text-slate-600 leading-relaxed">
              Depuis Cambo-les-Bains où sont basés nos vans, toutes les destinations emblématiques
              sont accessibles en moins de 45 minutes. Voici ce qu&apos;on vous recommande, saison par
              saison, avec les spots où dormir.
            </p>
          </div>
        </div>
      </section>

      {/* ── 6 Spots ── */}
      <section className="bg-bg-secondary py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <span className="text-xs font-semibold uppercase tracking-widest text-blue-500 mb-3 block">
              Les incontournables
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900">
              6 destinations vanlife au Pays Basque
            </h2>
            <p className="text-slate-500 mt-3 max-w-xl mx-auto">
              Côte, montagne, villages — notre sélection testée en van aménagé.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {SPOTS.map((spot) => (
              <Link key={spot.name} href={spot.href} className="group glass-card glass-card-hover overflow-hidden !p-0 block">
                <div className="relative aspect-[4/3] overflow-hidden">
                  <Image
                    src={spot.img}
                    alt={spot.alt}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3">
                    <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-white/90 text-slate-700 backdrop-blur-sm border border-white/50 shadow-sm">
                      {spot.tag}
                    </span>
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-black text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">{spot.name}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{spot.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Bivouac ── */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-xs font-semibold uppercase tracking-widest text-emerald-500 mb-3 block">
                Nuits en van
              </span>
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-6 leading-tight">
                Où dormir en van<br />au Pays Basque ?
              </h2>
              <div className="space-y-3">
                {BIVOUAC_RULES.map((rule) => (
                  <GlassCard key={rule.title} padding="p-4">
                    <div className="flex gap-3 items-start">
                      <span className={`font-black text-lg mt-0.5 flex-shrink-0 ${rule.positive ? "text-emerald-500" : "text-red-400"}`}>
                        {rule.icon}
                      </span>
                      <div>
                        <strong className="text-slate-900 text-sm font-bold">{rule.title}</strong>
                        <p className="text-sm text-slate-500 mt-0.5 leading-relaxed">{rule.desc}</p>
                      </div>
                    </div>
                  </GlassCard>
                ))}
              </div>
            </div>
            <div className="relative aspect-[4/3] rounded-3xl overflow-hidden shadow-xl">
              <Image
                src="https://cdn.sanity.io/images/lewexa74/production/d445397965472d300e3dc13d6b1c37503fe8ba25-1920x1080.png"
                alt="Van aménagé Vanzon Explorer en bivouac dans les Pyrénées basques"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── Saisons ── */}
      <section className="bg-bg-secondary py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <span className="text-xs font-semibold uppercase tracking-widest text-blue-500 mb-3 block">
              Quand partir
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900">
              Le Pays Basque par saison
            </h2>
            <p className="text-slate-500 mt-3 max-w-xl mx-auto">
              Chaque période a ses avantages — voici ce que ça change concrètement.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {SAISONS.map((s) => (
              <GlassCard key={s.label} className="overflow-hidden !p-0">
                <div className={`h-1.5 w-full bg-gradient-to-r ${s.accentGradient}`} />
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl">{s.emoji}</span>
                      <div>
                        <h3 className="font-black text-slate-900 leading-none">{s.label}</h3>
                        <p className="text-xs text-slate-400 uppercase tracking-wider mt-0.5">{s.months}</p>
                      </div>
                    </div>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full text-white shrink-0 ${s.noteColor}`}>
                      {s.note}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 leading-relaxed">{s.desc}</p>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* ── Road Trip Feature ── */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-6">
          <GlassCard className="overflow-hidden !p-0">
            <div className="h-1.5 w-full" style={{ background: "linear-gradient(135deg, #3B82F6 0%, #0EA5E9 100%)" }} />
            <div className="grid md:grid-cols-2">
              <div className="p-10 flex flex-col justify-center">
                <span className="inline-block text-xs font-semibold uppercase tracking-widest text-blue-500 mb-4">
                  Guide disponible maintenant
                </span>
                <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4 leading-tight">
                  Road Trip Pays Basque<br />en Van — 7 Jours
                </h2>
                <p className="text-slate-500 leading-relaxed mb-6">
                  L&apos;itinéraire complet de Biarritz à la Forêt d&apos;Irati :
                  étapes jour par jour, spots vanlife, budget détaillé (900–1 200€ pour deux)
                  et conseils pratiques pour un road trip réussi.
                </p>
                <div className="flex flex-wrap gap-2.5 mb-8">
                  {["7 jours d'itinéraire", "6 étapes clés", "Budget estimé", "FAQ pratique"].map((tag) => (
                    <span key={tag} className="badge-glass">{tag}</span>
                  ))}
                </div>
                <div>
                  <LiquidButton href="/road-trip-pays-basque-van">
                    Lire le guide road trip →
                  </LiquidButton>
                </div>
              </div>
              <div className="hidden md:block relative min-h-[320px] overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-white/30 to-transparent z-10" />
                <Image
                  src="https://cdn.sanity.io/images/lewexa74/production/d445397965472d300e3dc13d6b1c37503fe8ba25-1920x1080.png"
                  alt="Road trip Pays Basque en van — itinéraire 7 jours Vanzon Explorer"
                  fill
                  sizes="50vw"
                  className="object-cover"
                />
              </div>
            </div>
          </GlassCard>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="bg-bg-secondary py-20">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-12">
            <span className="text-xs font-semibold uppercase tracking-widest text-blue-500 mb-3 block">
              Questions fréquentes
            </span>
            <h2 className="text-3xl font-black text-slate-900">
              Tout ce qu&apos;il faut savoir
            </h2>
          </div>
          <div className="space-y-3">
            {FAQ_ITEMS.map((item, i) => (
              <details key={i} className="glass-card !p-0 overflow-hidden group">
                <summary className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-slate-50/60 transition-colors cursor-pointer list-none">
                  <span className="font-semibold text-slate-900 text-sm md:text-base">{item.question}</span>
                  <span className="text-slate-400 flex-shrink-0 text-sm transition-transform duration-200 group-open:rotate-180">▼</span>
                </summary>
                <div className="px-5 pb-5 pt-1">
                  <p className="text-sm text-slate-600 leading-relaxed">{item.answer}</p>
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="relative overflow-hidden py-28">
        <div className="absolute inset-0">
          <Image
            src="https://cdn.sanity.io/images/lewexa74/production/0b3f81d08627ba0b4423224029cb5016d0e7ed25-2048x1365.jpg"
            alt="Van Vanzon Explorer au Pays Basque — prêt à partir"
            fill
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(15,23,42,0.92) 0%, rgba(15,23,42,0.65) 50%, rgba(15,23,42,0.40) 100%)" }} />
        </div>
        <div className="relative z-10 text-center max-w-3xl mx-auto px-6">
          <span className="text-xs font-semibold uppercase tracking-widest text-blue-300 mb-5 block">
            Disponible maintenant
          </span>
          <h2 className="text-3xl md:text-4xl font-black text-white leading-tight mb-4">
            Prêt à partir ?
          </h2>
          <p className="text-white/70 max-w-md mx-auto leading-relaxed">
            Nos vans aménagés partent de Cambo-les-Bains, à 25 min de Biarritz.
            Assurance tous risques incluse, dès 65€/nuit.
          </p>
          <div className="flex gap-3 mt-8 justify-center flex-wrap">
            <LiquidButton href="/location">Louer un van</LiquidButton>
            <LiquidButton variant="ghost" href="/road-trip-pays-basque-van">
              Voir l&apos;itinéraire 7 jours
            </LiquidButton>
          </div>
        </div>
      </section>

      {/* ── Other services ── */}
      <OtherServices current="location" bgColor="#F8FAFC" />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(destinationJsonLd) }}
      />
    </>
  );
}
