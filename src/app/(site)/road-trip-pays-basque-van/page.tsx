import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Script from "next/script";

export const metadata: Metadata = {
  title: "Road Trip Pays Basque en Van — Itinéraire 7 Jours | Vanzon Explorer",
  description:
    "Découvrez notre itinéraire road trip Pays Basque en van aménagé : Biarritz, Hossegor, Saint-Jean-de-Luz, Espelette. Spots vanlife, budget et conseils pratiques.",
  openGraph: {
    title: "Road Trip Pays Basque en Van — Itinéraire 7 Jours",
    description:
      "Itinéraire complet pour un road trip Pays Basque en van : 7 jours, spots vanlife, budget détaillé, conseils pratiques.",
    type: "article",
  },
};

const itinerary = [
  {
    day: "Jour 1",
    location: "Bayonne → Biarritz",
    emoji: "🌊",
    highlight: "Côte des Basques",
    description:
      "Départ de Bayonne, récupération du van. Cap sur Biarritz — installez-vous au parking de la Côte des Basques pour le coucher de soleil. Dîner de pintxos en vieille ville.",
    sleep: "Parking Côte des Basques (gratuit hors saison)",
    tip: "Arrivée avant 18h pour profiter de la plage.",
  },
  {
    day: "Jour 2",
    location: "Biarritz — Journée surf",
    emoji: "🏄",
    highlight: "La Grande Plage & Milady",
    description:
      "Matin surf à la plage de Milady ou au VVF — des vagues accessibles aux débutants. L'après-midi, explorez le Rocher de la Vierge et le phare de Biarritz. Apéro face à l'Atlantique.",
    sleep: "Camping Biarritz ou bivouac légal en périphérie",
    tip: "Louez une planche sur place pour 15-20€/h.",
  },
  {
    day: "Jour 3",
    location: "Biarritz → Hossegor",
    emoji: "🌴",
    highlight: "La Gravière — spot mythique du surf mondial",
    description:
      "Route vers Hossegor (30 min), capitale du surf. La Gravière en été, les plages des Estagnots en automne. Soirée tacos et ambiance surfeuse dans les Landes.",
    sleep: "Aire de camping-cars d'Hossegor ou forêt landaise",
    tip: "En septembre — les vagues sont parfaites et la foule absente.",
  },
  {
    day: "Jour 4",
    location: "Hossegor → Saint-Jean-de-Luz",
    emoji: "⛵",
    highlight: "Le port le plus pittoresque du Pays Basque",
    description:
      "Retour côté basque. Saint-Jean-de-Luz et son port, la maison Louis XIV, les macarons Maison Adam. Baignade dans la baie protégée — idéale pour les familles. Dîner de ttoro (soupe de poisson basque).",
    sleep: "Aire municipale de Saint-Jean-de-Luz (7€/nuit)",
    tip: "Marché le matin les mardi et vendredi — produits locaux garantis.",
  },
  {
    day: "Jour 5",
    location: "Saint-Jean-de-Luz → Espelette → La Rhune",
    emoji: "🌶️",
    highlight: "Village rouge et sommet mythique",
    description:
      "Matinée à Espelette, village aux maisons ornées de piments. Déjeuner pique-nique depuis le van. Après-midi : montée au col de Saint-Ignace pour le train ou la randonnée vers La Rhune (900m). Vue sur deux pays.",
    sleep: "Bivouac au col de Saint-Ignace (vue panoramique)",
    tip: "La Rhune à pied : 3h aller-retour par le sentier balisé.",
  },
  {
    day: "Jour 6",
    location: "Saint-Jean-Pied-de-Port → Forêt d'Irati",
    emoji: "🌲",
    highlight: "La plus grande hêtraie d'Europe",
    description:
      "Cap sur l'intérieur basque. Saint-Jean-Pied-de-Port, porte du Camino. Puis la forêt d'Irati — randonnée dans une hêtraie millénaire, bivouac autorisé à l'orée des bois, feux de camp sous les étoiles.",
    sleep: "Bivouac forêt d'Irati (zones autorisées balisées)",
    tip: "Prévoyez un réchaud — la nuit en forêt peut être fraîche même en été.",
  },
  {
    day: "Jour 7",
    location: "Retour à Bayonne",
    emoji: "🏁",
    highlight: "Marché des Halles & dernier pintxo",
    description:
      "Dernière matinée libre. Marché des Halles de Bayonne pour des fromages, du jambon de Bayonne et une bouteille d'Irouléguy. Remise du van en début d'après-midi. Prochaine fois, on rallonge l'aventure.",
    sleep: "—",
    tip: "Nettoyez le van la veille au soir pour profiter du dernier matin.",
  },
];

const budgetItems = [
  { item: "Location van Vanzon Explorer", cost: "65€/nuit × 7", total: "455€", note: "Assurance incluse" },
  { item: "Carburant (1000 km environ)", cost: "≈ 110L de diesel", total: "160–180€", note: "~16L/100 km" },
  { item: "Alimentation (courses + marchés)", cost: "20–30€/j × 7", total: "140–210€", note: "Cuisine dans le van" },
  { item: "Restaurants & pintxos", cost: "15–25€/repas × 7", total: "100–175€", note: "3–4 vrais repas" },
  { item: "Nuits (aires, campings)", cost: "0–10€/nuit × 7", total: "0–70€", note: "Bivouac majoritaire" },
  { item: "Activités (surf, train Rhune…)", cost: "Variable", total: "50–120€", note: "Selon envies" },
];

const faqItems = [
  {
    question: "Peut-on faire un road trip Pays Basque en van toute l'année ?",
    answer:
      "Oui — le Pays Basque est accessible 12 mois sur 12 en van. Le printemps (avril-juin) et l'automne (septembre-octobre) sont les meilleures saisons : moins de monde, vagues excellentes pour le surf, bivouac plus facile. L'été est très fréquenté mais la côte reste magnifique. L'hiver offre des paysages enneigés côté montagne.",
  },
  {
    question: "Est-ce que le bivouac en van est légal au Pays Basque ?",
    answer:
      "Le bivouac est toléré dans de nombreuses zones naturelles du Pays Basque (cols, forêts, espaces peu urbanisés), sauf dans les zones protégées et les communes qui l'interdisent explicitement. En pratique : arrivez tard, repartez tôt, ne laissez aucun déchet, et évitez les plages urbaines et les parkings payants hors saison. Nos vans incluent des conseils spots personnalisés par Jules.",
  },
  {
    question: "Combien coûte un road trip Pays Basque en van sur 7 jours ?",
    answer:
      "Budget total estimé entre 900€ et 1 200€ pour deux personnes sur 7 jours, soit 450–600€ par personne. Cela inclut la location du van Vanzon Explorer (455€), le carburant (~170€), la nourriture (250–385€), les nuits (0–70€) et quelques activités (50–120€). La cuisine dans le van permet de réaliser des économies significatives sur la restauration.",
  },
  {
    question: "Faut-il un permis spécial pour conduire un van aménagé ?",
    answer:
      "Non — nos Renault Trafic III aménagés sont homologués comme véhicules de tourisme. Le permis B standard suffit. Le PTAC est inférieur à 3,5 tonnes. Aucune formation supplémentaire n'est nécessaire. L'assurance tous risques est incluse via Yescapa.",
  },
  {
    question: "Les vans Vanzon sont-ils équipés pour cuisiner et dormir confortablement ?",
    answer:
      "Oui — nos vans sont équipés d'une cuisine coulissante (réchaud gaz 2 feux, vaisselle, rangements), d'un lit fixe pour 2 personnes + matelas supplémentaire, d'une glacière portative, d'une toilette sèche et d'éclairage LED. Tout le nécessaire pour une semaine en autonomie complète.",
  },
  {
    question: "Où peut-on récupérer et rendre le van ?",
    answer:
      "Les vans se récupèrent et se rendent à Bayonne. Une livraison sur demande est possible dans les communes proches (Biarritz, Anglet, Saint-Jean-de-Luz). Contactez Jules directement via la plateforme Yescapa pour organiser la logistique.",
  },
];

const jsonLdArticle = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "Road Trip Pays Basque en Van — Itinéraire 7 Jours",
  description:
    "Itinéraire complet pour un road trip Pays Basque en van aménagé : Biarritz, Hossegor, Saint-Jean-de-Luz, Espelette, Forêt d'Irati. Spots vanlife, budget et conseils.",
  author: {
    "@type": "Person",
    name: "Jules Gaveglio",
    url: "https://vanzonexplorer.com/a-propos",
  },
  publisher: {
    "@type": "Organization",
    name: "Vanzon Explorer",
    url: "https://vanzonexplorer.com",
    logo: {
      "@type": "ImageObject",
      url: "https://cdn.sanity.io/images/lewexa74/production/9de5b0e768fa1fcc5ea5aa6f41ac816c249af9b0-1042x417.png",
    },
  },
  datePublished: "2025-06-01",
  dateModified: "2026-03-05",
  image: "https://cdn.sanity.io/images/lewexa74/production/f93fa16ab46d8934dcc3092a8e86fc80ebce4305-1080x750.png",
  mainEntityOfPage: {
    "@type": "WebPage",
    "@id": "https://vanzonexplorer.com/road-trip-pays-basque-van",
  },
};

const jsonLdFaq = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqItems.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.answer,
    },
  })),
};

const jsonLdBreadcrumb = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Accueil", item: "https://vanzonexplorer.com" },
    { "@type": "ListItem", position: 2, name: "Pays Basque", item: "https://vanzonexplorer.com/pays-basque" },
    {
      "@type": "ListItem",
      position: 3,
      name: "Road Trip Pays Basque en Van",
      item: "https://vanzonexplorer.com/road-trip-pays-basque-van",
    },
  ],
};

export default function RoadTripPaysBasquePage() {
  return (
    <>
      <Script
        id="ld-article"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdArticle) }}
      />
      <Script
        id="ld-faq"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdFaq) }}
      />
      <Script
        id="ld-breadcrumb"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdBreadcrumb) }}
      />

      {/* ══════════════════════════════════════════
          HERO
      ══════════════════════════════════════════ */}
      <section className="relative min-h-[80vh] flex items-end overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="https://cdn.sanity.io/images/lewexa74/production/f93fa16ab46d8934dcc3092a8e86fc80ebce4305-1080x750.png"
            alt="Van aménagé au bord de l'océan au Pays Basque pour un road trip"
            fill
            className="object-cover object-center"
            priority
            unoptimized
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-900/50 to-slate-900/10" />
          <div className="absolute inset-0 bg-gradient-to-r from-blue-950/30 via-transparent to-transparent" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 pb-20 pt-32 w-full">
          {/* Fil d'Ariane */}
          <nav aria-label="Fil d'Ariane" className="mb-6">
            <ol className="flex items-center gap-2 text-white/50 text-xs font-medium">
              <li><Link href="/" className="hover:text-white/80 transition-colors">Accueil</Link></li>
              <li>›</li>
              <li><Link href="/pays-basque" className="hover:text-white/80 transition-colors">Pays Basque</Link></li>
              <li>›</li>
              <li className="text-white/80">Road Trip Van</li>
            </ol>
          </nav>

          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-4 py-2 mb-6">
              <span className="text-[#4BC3E3] font-medium">🗺️</span>
              <span className="text-white/90 text-sm font-medium">Guide vanlife — Itinéraire 7 jours</span>
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-white leading-[1.05] mb-6">
              Road Trip<br />
              Pays Basque<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4BC3E3] to-[#4D5FEC]">
                en van.
              </span>
            </h1>

            <p className="text-xl text-white/75 leading-relaxed mb-8 max-w-2xl">
              L&apos;itinéraire complet pour explorer le Pays Basque en van aménagé — de Biarritz à la
              Forêt d&apos;Irati en passant par Hossegor et Espelette. 7 jours, des spots vanlife secrets,
              le budget au centime près.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/location"
                className="inline-flex items-center justify-center gap-2 bg-white text-slate-900 font-bold px-8 py-4 rounded-xl hover:bg-blue-50 transition-colors text-lg shadow-2xl"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="20" height="8" x="2" y="13" rx="2" /><path d="M6 13V8a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v5" />
                </svg>
                Louer un van aménagé au Pays Basque
              </Link>
              <a
                href="#itineraire"
                className="inline-flex items-center justify-center gap-2 bg-white/10 backdrop-blur-md border border-white/30 text-white font-bold px-8 py-4 rounded-xl hover:bg-white/20 transition-colors text-lg"
              >
                Voir l&apos;itinéraire
              </a>
            </div>
          </div>

          {/* Stats */}
          <div className="hidden lg:flex gap-4 absolute bottom-20 right-6">
            {[
              { value: "7", label: "jours", sub: "itinéraire" },
              { value: "~1000", label: "km", sub: "distance totale" },
              { value: "900€", label: "/ 2 pers.", sub: "budget moyen" },
            ].map((stat) => (
              <div key={stat.label} className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-5 py-4 text-center min-w-[110px]">
                <div className="text-xs text-white/60 font-medium mb-0.5">{stat.sub}</div>
                <div className="text-2xl font-black text-white">{stat.value}</div>
                <div className="text-xs text-white/70 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        <a href="#intro" className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 text-white/50 hover:text-white/80 transition-colors animate-bounce">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </a>
      </section>

      {/* ══════════════════════════════════════════
          INTRO — Pourquoi le Pays Basque en van
      ══════════════════════════════════════════ */}
      <section id="intro" className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <span className="badge-glass !px-4 !py-1.5 text-sm font-semibold mb-5 inline-block" style={{ color: "#4D5FEC" }}>
                Pourquoi le Pays Basque ?
              </span>
              <h2 className="text-4xl font-black text-slate-900 mb-6 leading-tight">
                La destination vanlife<br />
                parfaite en France.
              </h2>
              <p className="text-slate-500 text-lg leading-relaxed mb-6">
                En moins d&apos;une heure de route, vous passez de l&apos;Atlantique aux Pyrénées.
                Le Pays Basque concentre tout ce qui fait la magie du vanlife : des vagues pour
                surfer le matin, des cols pour bivouaquer le soir, une gastronomie qui n&apos;a
                rien à envier aux grandes capitales.
              </p>
              <p className="text-slate-500 text-lg leading-relaxed">
                Et puis il y a cette identité — les maisons à colombages rouges, les fêtes de
                village, le basque et ses cinq voyelles. Un road trip ici, c&apos;est voyager à
                l&apos;étranger sans quitter la France.
              </p>

              <div className="mt-8 grid grid-cols-2 gap-4">
                {[
                  { icon: "🌊", text: "Côte Atlantique" },
                  { icon: "⛰️", text: "Pyrénées à 1h" },
                  { icon: "🍷", text: "Gastronomie unique" },
                  { icon: "🏄", text: "Spots surf légendaires" },
                  { icon: "🌲", text: "Forêts sauvages" },
                  { icon: "🏘️", text: "Villages authentiques" },
                ].map((item) => (
                  <div key={item.text} className="flex items-center gap-2 text-slate-700 font-medium text-sm">
                    <span className="text-xl">{item.icon}</span>
                    {item.text}
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="relative aspect-[3/4] rounded-2xl overflow-hidden row-span-2">
                <Image
                  src="https://cdn.sanity.io/images/lewexa74/production/04d93973d30c5eede51f954d1432a50a5f82ef9b-1080x750.png"
                  alt="Van Xalbat en montagne au Pays Basque - road trip"
                  fill
                  className="object-cover hover:scale-105 transition-transform duration-700"
                  unoptimized
                />
              </div>
              <div className="relative aspect-square rounded-2xl overflow-hidden">
                <Image
                  src="https://cdn.sanity.io/images/lewexa74/production/660105a28e577c33f642a8fdff528d88925642e3-1080x750.png"
                  alt="Van Yoni ouvert sur la côte basque"
                  fill
                  className="object-cover hover:scale-105 transition-transform duration-700"
                  unoptimized
                />
              </div>
              <div className="relative aspect-square rounded-2xl overflow-hidden">
                <Image
                  src="https://cdn.sanity.io/images/lewexa74/production/0b3f81d08627ba0b4423224029cb5016d0e7ed25-2048x1365.jpg"
                  alt="Paysage basque depuis un van"
                  fill
                  className="object-cover hover:scale-105 transition-transform duration-700"
                  unoptimized
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          ITINÉRAIRE 7 JOURS
      ══════════════════════════════════════════ */}
      <section id="itineraire" className="py-20 scroll-mt-20" style={{ background: "linear-gradient(160deg, #F8FAFC 0%, #EFF6FF 100%)" }}>
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-14">
            <span className="badge-glass !px-4 !py-1.5 text-sm font-semibold mb-4 inline-block" style={{ color: "#4D5FEC" }}>
              L&apos;itinéraire complet
            </span>
            <h2 className="text-4xl font-black text-slate-900 mb-3">
              7 jours au Pays Basque en van
            </h2>
            <p className="text-slate-500 text-lg max-w-xl mx-auto">
              Un itinéraire pensé pour alterner côte, montagne et découverte culturelle.
              Adaptable en 5 ou 10 jours selon vos envies.
            </p>
          </div>

          <div className="relative">
            {/* Ligne verticale */}
            <div className="absolute left-8 top-0 bottom-0 w-px bg-gradient-to-b from-[#4BC3E3]/30 via-[#4D5FEC]/60 to-[#4BC3E3]/30 hidden md:block" />

            <div className="space-y-6">
              {itinerary.map((day, idx) => (
                <div key={day.day} className="relative flex gap-6">
                  {/* Numéro de jour */}
                  <div className="hidden md:flex flex-shrink-0 w-16 h-16 rounded-2xl items-center justify-center font-black text-white text-sm z-10"
                    style={{ background: `linear-gradient(135deg, #4BC3E3, #4D5FEC)` }}>
                    J{idx + 1}
                  </div>

                  <div className="glass-card p-6 flex-1 hover:shadow-glass-hover transition-all duration-300">
                    <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-2xl">{day.emoji}</span>
                          <span className="text-xs font-semibold uppercase tracking-widest text-slate-400 md:hidden">{day.day}</span>
                        </div>
                        <h3 className="text-xl font-black text-slate-900">{day.location}</h3>
                        <p className="text-sm font-semibold mt-0.5" style={{ color: "#4D5FEC" }}>{day.highlight}</p>
                      </div>
                    </div>

                    <p className="text-slate-600 leading-relaxed mb-4">{day.description}</p>

                    <div className="flex flex-wrap gap-4 text-sm">
                      <div className="flex items-center gap-2 text-slate-500">
                        <span>🌙</span>
                        <span><strong className="text-slate-700">Nuit :</strong> {day.sleep}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-500">
                        <span>💡</span>
                        <span><strong className="text-slate-700">Conseil :</strong> {day.tip}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          LES ÉTAPES INCONTOURNABLES
      ══════════════════════════════════════════ */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-black text-slate-900 mb-3">
              Les étapes incontournables
            </h2>
            <p className="text-slate-500 text-lg max-w-xl mx-auto">
              Six destinations à ne pas manquer pour un road trip Pays Basque en van complet.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                emoji: "🌊",
                title: "Biarritz",
                description:
                  "La reine de la Côte Basque. Surf à Milady, rocher de la Vierge, marché des Halles. Base parfaite pour les 2 premiers jours.",
                vanTip: "Parking Côte des Basques — gratuit hors saison, vue imprenable.",
              },
              {
                emoji: "🏄",
                title: "Hossegor",
                description:
                  "La capitale mondiale du surf. La Gravière attire les meilleurs surfeurs de la planète. Ambiance surf culture authentique.",
                vanTip: "Forêt landaise à 10 min — bivouac tranquille loin des foules estivales.",
              },
              {
                emoji: "⛵",
                title: "Saint-Jean-de-Luz",
                description:
                  "Le port le plus charmant du Pays Basque. Maison Louis XIV, rue piétonne, plage familiale protégée du vent.",
                vanTip: "Aire municipale à 7€/nuit, accès direct au port à pied.",
              },
              {
                emoji: "🌶️",
                title: "Espelette",
                description:
                  "Village basque classé, célèbre pour son piment AOC. Façades à colombages rouges, coopérative du piment, ambiance hors du temps.",
                vanTip: "Parking gratuit à l'entrée du village. Idéal pour une halte déjeuner.",
              },
              {
                emoji: "🏔️",
                title: "La Rhune",
                description:
                  "Sommet mythique entre France et Espagne (900m). Train à crémaillère ou randonnée. Vue sur l'Atlantique et les Pyrénées.",
                vanTip: "Bivouac au col de Saint-Ignace — panorama exceptionnel au lever du soleil.",
              },
              {
                emoji: "🌲",
                title: "Forêt d'Irati",
                description:
                  "La plus grande hêtraie d'Europe. Calme absolu, air pur, sentiers de randonnée balisés. La nature basque dans toute sa splendeur.",
                vanTip: "Zones de bivouac balisées autorisées. Prévoir eau et réchaud.",
              },
            ].map((stop) => (
              <div key={stop.title} className="glass-card p-6 hover:shadow-glass-hover transition-all duration-300 group">
                <div className="text-4xl mb-4">{stop.emoji}</div>
                <h3 className="font-bold text-slate-900 text-xl mb-2 transition-colors group-hover:text-[#4D5FEC]">
                  {stop.title}
                </h3>
                <p className="text-slate-500 text-sm leading-relaxed mb-4">{stop.description}</p>
                <div className="flex items-start gap-2 text-xs text-slate-400 bg-slate-50 rounded-xl p-3">
                  <span className="text-base mt-0.5">🚐</span>
                  <span>{stop.vanTip}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          OÙ DORMIR EN VAN
      ══════════════════════════════════════════ */}
      <section className="py-20 text-white" style={{ background: "#0F153A" }}>
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-14">
            <span className="inline-block text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "#4BC3E3" }}>
              Conseils pratiques
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-white mb-3">
              Où dormir en van au Pays Basque ?
            </h2>
            <p className="text-white/60 text-lg max-w-xl mx-auto">
              Le Pays Basque offre de nombreuses options pour passer la nuit en van —
              du bivouac sauvage à l&apos;aire aménagée.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: "🌿",
                title: "Bivouac naturel",
                items: [
                  "Col de Saint-Ignace (La Rhune)",
                  "Forêt d'Irati (zones balisées)",
                  "Cols des Pyrénées Atlantiques",
                  "Forêt landaise (Hossegor)",
                ],
                cost: "Gratuit",
                note: "Arriver tard, partir tôt. Zéro déchet.",
                gradient: "from-emerald-500 to-teal-600",
              },
              {
                icon: "🏕️",
                title: "Aires camping-cars",
                items: [
                  "Aire Saint-Jean-de-Luz (7€/nuit)",
                  "Aire Biarritz - Milady (10€/nuit)",
                  "Aire Hendaye (5€/nuit)",
                  "Aire Bayonne (8€/nuit)",
                ],
                cost: "5–12€/nuit",
                note: "Eau, électricité, vidange incluses.",
                gradient: "from-blue-500 to-indigo-600",
              },
              {
                icon: "⛺",
                title: "Campings nature",
                items: [
                  "Camping Oyam (Bidart) — vue mer",
                  "Camping Ibarron (St-Pée-sur-Nivelle)",
                  "Camping Irati (forêt d'Irati)",
                  "Camping La Ferme Landaise",
                ],
                cost: "15–25€/nuit",
                note: "Idéal en haute saison — réservez à l'avance.",
                gradient: "from-amber-500 to-orange-600",
              },
            ].map((option) => (
              <div key={option.title} className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6">
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${option.gradient} flex items-center justify-center text-2xl mb-4`}>
                  {option.icon}
                </div>
                <h3 className="font-bold text-white text-lg mb-1">{option.title}</h3>
                <p className="text-[#4BC3E3] font-semibold text-sm mb-4">{option.cost}</p>
                <ul className="space-y-2 mb-4">
                  {option.items.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-white/70 text-sm">
                      <span className="w-1.5 h-1.5 rounded-full bg-white/30 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-white/40 mt-3 italic">{option.note}</p>
              </div>
            ))}
          </div>

          <p className="text-center text-white/50 text-sm mt-10 max-w-2xl mx-auto">
            Jules, fondateur de Vanzon Explorer, partage personnellement ses spots secrets avec chaque locataire.
            Des bivouacs légaux et confidentiels que seuls les locaux connaissent.
          </p>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          BUDGET
      ══════════════════════════════════════════ */}
      <section className="py-20" style={{ background: "linear-gradient(160deg, #EFF6FF 0%, #F0FDFF 100%)" }}>
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-12">
            <span className="badge-glass !px-4 !py-1.5 text-sm font-semibold mb-4 inline-block" style={{ color: "#4D5FEC" }}>
              Budget estimé
            </span>
            <h2 className="text-4xl font-black text-slate-900 mb-3">
              Combien coûte un road trip<br />Pays Basque en van ?
            </h2>
            <p className="text-slate-500 text-lg">Budget pour 2 personnes sur 7 jours</p>
          </div>

          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left p-4 text-xs font-semibold uppercase tracking-wider text-slate-400">Poste</th>
                    <th className="text-right p-4 text-xs font-semibold uppercase tracking-wider text-slate-400">Détail</th>
                    <th className="text-right p-4 text-xs font-semibold uppercase tracking-wider text-slate-400">Total</th>
                    <th className="text-right p-4 text-xs font-semibold uppercase tracking-wider text-slate-400 hidden md:table-cell">Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {budgetItems.map((row) => (
                    <tr key={row.item} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 text-sm font-medium text-slate-800">{row.item}</td>
                      <td className="p-4 text-sm text-slate-500 text-right">{row.cost}</td>
                      <td className="p-4 text-sm font-bold text-slate-900 text-right">{row.total}</td>
                      <td className="p-4 text-xs text-slate-400 text-right hidden md:table-cell">{row.note}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-slate-200 bg-slate-50/80">
                    <td className="p-4 font-black text-slate-900">Total estimé</td>
                    <td className="p-4" />
                    <td className="p-4 font-black text-xl text-right" style={{ color: "#4D5FEC" }}>900–1 200€</td>
                    <td className="p-4 text-xs text-slate-400 text-right hidden md:table-cell">450–600€ / pers.</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <p className="text-center text-slate-400 text-sm mt-6">
            Cuisine dans le van = économies de 30 à 50% sur la restauration. Le poste le plus variable est les activités.
          </p>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          CTA — LOUER UN VAN
      ══════════════════════════════════════════ */}
      <section className="relative py-28 overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="https://cdn.sanity.io/images/lewexa74/production/e9664378c5fdc652c33ae7342dfc52cc4960c8bf-1080x750.png"
            alt="Van Vanzon Explorer au Pays Basque"
            fill
            className="object-cover"
            unoptimized
          />
          <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(15,21,58,0.92) 0%, rgba(77,95,236,0.6) 100%)" }} />
        </div>

        <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-4 py-2 mb-6">
            <span className="text-green-400">●</span>
            <span className="text-white/90 text-sm font-medium">Vans disponibles — réservation en ligne</span>
          </div>

          <h2 className="text-4xl md:text-5xl font-black text-white mb-5 leading-tight">
            Prêt à vivre<br />
            cet itinéraire ?
          </h2>
          <p className="text-white/70 text-xl mb-10 leading-relaxed">
            Nos Renault Trafic aménagés partent de <strong className="text-white">65€/nuit</strong>,
            assurance incluse. Jules vous partage ses spots secrets à la remise des clés.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href="/location"
              className="inline-flex items-center justify-center gap-2 bg-white text-slate-900 font-bold px-10 py-5 rounded-2xl hover:bg-blue-50 transition-colors text-lg shadow-2xl"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect width="20" height="8" x="2" y="13" rx="2" /><path d="M6 13V8a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v5" />
              </svg>
              Louer un van aménagé au Pays Basque
            </Link>
            <Link
              href="/pays-basque"
              className="inline-flex items-center justify-center gap-2 bg-white/10 backdrop-blur-md border border-white/30 text-white font-bold px-10 py-5 rounded-2xl hover:bg-white/20 transition-colors text-lg"
            >
              Explorer les spots vanlife
            </Link>
          </div>

          <p className="text-white/40 text-sm mt-6">
            Questions ? Contactez Jules directement via Yescapa.
          </p>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          FAQ
      ══════════════════════════════════════════ */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black text-slate-900 mb-3">
              Questions fréquentes
            </h2>
            <p className="text-slate-500 text-lg">
              Tout ce qu&apos;il faut savoir pour préparer votre road trip Pays Basque en van.
            </p>
          </div>

          <div className="space-y-4">
            {faqItems.map((item, idx) => (
              <details key={idx} className="glass-card group">
                <summary className="p-6 cursor-pointer flex items-center justify-between gap-4 list-none">
                  <h3 className="font-bold text-slate-900 text-lg pr-4">{item.question}</h3>
                  <svg
                    className="w-5 h-5 text-slate-400 flex-shrink-0 transition-transform group-open:rotate-180"
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <p className="px-6 pb-6 text-slate-500 leading-relaxed">{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          ARTICLES LIÉS
      ══════════════════════════════════════════ */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-2xl font-black text-slate-900 mb-8">Continuer à explorer</h2>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              {
                emoji: "🗺️",
                title: "Spots vanlife au Pays Basque",
                desc: "Notre sélection des meilleurs endroits pour stationner la nuit en van.",
                href: "/pays-basque",
                cta: "Voir les spots",
              },
              {
                emoji: "🚐",
                title: "Louer un van aménagé",
                desc: "Yoni et Xalbat, deux Renault Trafic tout équipés au départ de Bayonne.",
                href: "/location",
                cta: "Voir les vans",
              },
              {
                emoji: "🌶️",
                title: "À propos de Vanzon",
                desc: "Jules et Elio, les fondateurs de Vanzon Explorer — leur histoire et leur vision du vanlife.",
                href: "/a-propos",
                cta: "Découvrir",
              },
            ].map((card) => (
              <Link
                key={card.title}
                href={card.href}
                className="glass-card p-6 hover:shadow-glass-hover transition-all duration-300 group block"
              >
                <div className="text-3xl mb-3">{card.emoji}</div>
                <h3 className="font-bold text-slate-900 mb-2 group-hover:text-[#4D5FEC] transition-colors">{card.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed mb-4">{card.desc}</p>
                <span className="text-sm font-semibold" style={{ color: "#4D5FEC" }}>{card.cta} →</span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
