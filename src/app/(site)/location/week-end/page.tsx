import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { fetchPexelsPhoto } from "@/lib/pexels";
import { getGooglePlaceStats } from "@/lib/google-places";
import { LocationRentalJsonLd } from "@/components/seo/JsonLd";
import VanSelectionSection from "@/components/location/VanSelectionSection";
import PracticalInfoSection from "@/components/location/PracticalInfoSection";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Location Van Week-end Pays Basque — dès 65€/nuit | Vanzon Explorer",
  description:
    "Louez un van aménagé pour votre week-end au Pays Basque. 4 idées d'itinéraires testées : surf, gastronomie, montagne, côte+intérieur.",
  alternates: {
    canonical: "https://vanzonexplorer.com/location/week-end",
  },
};

const FALLBACK_IMG =
  "https://cdn.sanity.io/images/lewexa74/production/d445397965472d300e3dc13d6b1c37503fe8ba25-1920x1080.png?auto=format&q=82";

const YONI_IMG =
  "https://cdn.sanity.io/images/lewexa74/production/660105a28e577c33f642a8fdff528d88925642e3-1080x750.png?auto=format&q=82";

const faq = [
  {
    q: "Peut-on vraiment tout voir en un week-end ?",
    a: "Le Pays Basque est compact — en 48h, vous pouvez alterner mer et montagne facilement. On vous conseille de choisir 1 thème principal (surf, gastronomie, ou nature) plutôt que de tout vouloir voir.",
  },
  {
    q: "Quelle est la durée minimale de location ?",
    a: "2 nuits minimum. La formule week-end (vendredi soir → dimanche soir) est notre plus populaire. Pour un vrai road trip, partez 4–7 jours.",
  },
  {
    q: "Peut-on récupérer le van le vendredi après le travail ?",
    a: "Oui, nous nous adaptons à vos horaires. Récupération possible jusqu'à 20h à Cambo-les-Bains. Dites-nous votre heure d'arrivée lors de la réservation.",
  },
  {
    q: "Comment réserver pour un week-end ?",
    a: "Directement sur Yescapa.fr en sélectionnant vos dates. Nous sommes également disponibles par message pour les questions avant réservation.",
  },
  {
    q: "Faut-il réserver à l'avance ?",
    a: "Oui, surtout pour les week-ends de mai à septembre. Nos 2 vans sont souvent réservés 3–4 semaines à l'avance en haute saison. Pour les fêtes de Bayonne (août) et l'été, réservez 2 mois à l'avance.",
  },
];

const itineraryDays = [
  {
    icon: "🚐",
    label: "Vendredi soir",
    activities: [
      "Récupération van à Cambo (17h–19h)",
      "Petit tour du Pays Basque intérieur ou route directe vers la côte",
      "Installation au bivouac",
      "Nuit étoilée",
    ],
  },
  {
    icon: "🌊",
    label: "Samedi",
    activities: [
      "Biarritz ou Saint-Jean-de-Luz (surf, plage, halles)",
      "Espelette l'après-midi (piments, village basque)",
      "Nuit vue montagne",
    ],
  },
  {
    icon: "🏔️",
    label: "Dimanche",
    activities: [
      "Randonnée matinale (La Rhune ou Irati)",
      "Retour van à Cambo avant 18h",
    ],
  },
];

export default async function LocationWeekEndPage() {
  const [heroPhoto, photoSurf, photoFood, photoMountain, photoCoast, placeStats] =
    await Promise.all([
      fetchPexelsPhoto("campervan parked scenic coastal road sunset", FALLBACK_IMG),
      fetchPexelsPhoto("surfer walking beach surfboard golden hour", FALLBACK_IMG),
      fetchPexelsPhoto("tapas pintxos spanish food plates wine bar", FALLBACK_IMG),
      fetchPexelsPhoto("green mountain trail hiker pyrenees morning", FALLBACK_IMG),
      fetchPexelsPhoto("coastal village colorful houses ocean cliff sunset", FALLBACK_IMG),
      getGooglePlaceStats(),
    ]);

  const weekendIdeas = [
    {
      icon: "🌊",
      title: "Surf & Atlantique",
      days: "2 jours",
      desc: "Côte des Basques, Grande Plage, Milady... Biarritz vous réserve les meilleures vagues de France.",
      highlights: [
        "Spot débutant : Milady",
        "Spot confirmé : Côte des Basques",
        "Nuit : parking face à l'océan",
      ],
      target: "Surfers et amateurs de plage",
      photo: photoSurf,
    },
    {
      icon: "🍽️",
      title: "Gastronomie basque",
      days: "2–3 jours",
      desc: "Jambon de Bayonne, chocolat artisanal, pintxos... Le Pays Basque est l'une des premières destinations gastronomiques de France.",
      highlights: [
        "Bayonne : chocolateries + halles",
        "Saint-Jean-de-Luz : marché poisson",
        "Espelette : producteurs de piment",
      ],
      target: "Amateurs de cuisine et culture",
      photo: photoFood,
    },
    {
      icon: "🏔️",
      title: "Montagne & Nature",
      days: "2 jours",
      desc: "La Rhune, Forêt d'Irati, cols des Pyrénées... Le Pays Basque côté montagne est une révélation.",
      highlights: [
        "La Rhune : panorama côte-montagne",
        "Irati : hêtraie millénaire",
        "Col d'Organbidexka : vue Pyrénées",
      ],
      target: "Randonneurs et amoureux de nature",
      photo: photoMountain,
    },
    {
      icon: "🌅",
      title: "Côte + Intérieur",
      days: "3 jours",
      desc: "Le combo parfait : surf ou plage le matin, villages basques et gastronomie l'après-midi. Saint-Jean-de-Luz, Espelette, Ainhoa.",
      highlights: [
        "Jour 1 : Saint-Jean-de-Luz et côte",
        "Jour 2 : Espelette et Ainhoa",
        "Jour 3 : Forêt ou montagne",
      ],
      target: "Pour tout voir en un séjour",
      photo: photoCoast,
    },
  ];

  return (
    <>
      <LocationRentalJsonLd
        destination="Week-end Pays Basque"
        url="https://vanzonexplorer.com/location/week-end"
      />

      {/* ── HERO ──────────────────────────────────────────────────── */}
      <section className="relative -mt-16 min-h-screen flex items-end overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src={heroPhoto?.url ?? FALLBACK_IMG}
            alt="Location van week-end Pays Basque — van aménagé côte et montagne"
            fill
            sizes="100vw"
            className="object-cover object-center"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-900/50 to-slate-900/20" />
          <div className="absolute inset-0 bg-gradient-to-r from-blue-950/30 via-transparent to-transparent" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 pb-20 pt-32 w-full">
          {/* Breadcrumb */}
          <nav aria-label="Fil d'Ariane" className="mb-6">
            <ol className="flex items-center gap-2 text-white/50 text-xs font-medium">
              <li>
                <Link href="/" className="hover:text-white/80 transition-colors">
                  Accueil
                </Link>
              </li>
              <li>›</li>
              <li>
                <Link href="/location" className="hover:text-white/80 transition-colors">
                  Location
                </Link>
              </li>
              <li>›</li>
              <li className="text-white/80">Week-end</li>
            </ol>
          </nav>

          <div className="max-w-2xl">
            <a
              href="https://www.google.com/maps/place/?q=place_id:ChIJ7-3ASe0oTyQR6vNHg7YRicA"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-4 py-2 mb-6 transition-transform hover:scale-105 cursor-pointer"
            >
              <span className="text-amber-400">★★★★★</span>
              <span className="text-white/90 text-sm font-medium">
                {placeStats.reviewCount} avis Google
              </span>
            </a>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-white leading-[1.05] mb-6">
              Week-end en van<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4BC3E3] to-[#4D5FEC]">
                au Pays Basque
              </span>
            </h1>

            <p className="text-xl text-white/75 leading-relaxed mb-8 max-w-xl">
              Surf à Biarritz, pintxos à Bayonne, forêt d&apos;Irati... En 48h, le Pays Basque
              vous donne envie de tout. Récupération vendredi soir à Cambo-les-Bains.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/location#nos-vans"
                className="btn-shine inline-flex items-center justify-center gap-2 bg-white text-slate-900 font-bold px-8 py-4 rounded-xl hover:bg-blue-50 transition-colors text-lg shadow-2xl"
              >
                Voir les disponibilités
              </Link>
              <a
                href="https://www.yescapa.fr/campers/89215"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-white/10 backdrop-blur-md border border-white/30 text-white font-bold px-8 py-4 rounded-xl hover:bg-white/20 transition-colors text-lg"
              >
                Réserver sur Yescapa →
              </a>
            </div>
          </div>

          {/* Stats cards — desktop only, bottom-right */}
          <div className="hidden lg:flex gap-4 absolute bottom-20 right-6">
            {[
              { value: "2", label: "nuits min.", sub: "week-end" },
              { value: "130€", label: "2 nuits", sub: "dès" },
              {
                value: `${placeStats.ratingDisplay}★`,
                label: "Google",
                sub: `${placeStats.reviewCount} avis`,
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-5 py-4 text-center min-w-[100px]"
              >
                <div className="text-xs text-white/60 font-medium mb-0.5">{stat.sub}</div>
                <div className="text-2xl font-black text-white">{stat.value}</div>
                <div className="text-xs text-white/70 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {heroPhoto?.photographer && (
          <p className="absolute bottom-2 right-4 text-white/30 text-[10px] z-10">
            Photo: {heroPhoto.photographer} / Pexels
          </p>
        )}

        {/* Scroll arrow */}
        <a
          href="#idees"
          className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 text-white/50 hover:text-white/80 transition-colors animate-bounce"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </a>
      </section>

      {/* ── TRUST BAR ─────────────────────────────────────────────── */}
      <section className="bg-slate-950 py-5 border-t border-white/5">
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex flex-wrap justify-center md:justify-between items-center gap-y-4 gap-x-8 text-white/60 text-sm font-medium">
            {[
              { icon: "📅", text: "Disponible vendredi soir" },
              { icon: "🛡️", text: "Assurance tous risques incluse" },
              { icon: "💰", text: "2 nuits dès 130€" },
              {
                icon: "⭐",
                text: `${placeStats.ratingDisplay}/5 sur ${placeStats.reviewCount} avis Google`,
              },
              { icon: "🔑", text: "Remise des clés à Cambo-les-Bains" },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-2">
                <span>{item.icon}</span>
                <span>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4 IDÉES DE WEEK-END ───────────────────────────────────── */}
      <section id="idees" className="py-20 bg-white scroll-mt-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <span
              className="badge-glass !px-4 !py-1.5 text-sm font-semibold mb-4 inline-block"
              style={{ color: "#4D5FEC" }}
            >
              Idées de week-end
            </span>
            <h2 className="text-4xl font-black text-slate-900 mb-3">
              4 week-ends idéals en van au Pays Basque
            </h2>
            <p className="text-slate-500 text-lg max-w-xl mx-auto">
              Selon vos envies — surf, gastronomie, montagne ou tout à la fois.
              Nos vans sont prêts à partir le vendredi soir.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {weekendIdeas.map((idea) => (
              <div key={idea.title} className="relative rounded-2xl overflow-hidden h-80 group">
                <Image
                  src={idea.photo?.url ?? FALLBACK_IMG}
                  alt={idea.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/10" />

                {/* Day badge top-right */}
                <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm text-white text-xs font-bold px-3 py-1 rounded-full border border-white/30">
                  {idea.days}
                </div>

                {/* Content bottom */}
                <div className="absolute bottom-0 p-6">
                  <p className="text-xs text-blue-300 font-semibold mb-1 uppercase tracking-wider">
                    {idea.target}
                  </p>
                  <h3 className="text-white font-black text-xl mb-2">
                    {idea.icon} {idea.title}
                  </h3>
                  <p className="text-white/80 text-sm mb-3">{idea.desc}</p>
                  <ul className="space-y-1">
                    {idea.highlights.map((h) => (
                      <li key={h} className="text-white/70 text-xs flex items-start gap-1.5">
                        <span className="text-blue-400">●</span>
                        {h}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ITINÉRAIRE EXEMPLE : CÔTE + INTÉRIEUR ─────────────────── */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-14">
            <span
              className="badge-glass !px-4 !py-1.5 text-sm font-semibold mb-4 inline-block"
              style={{ color: "#4D5FEC" }}
            >
              Itinéraire exemple
            </span>
            <h2 className="text-4xl font-black text-slate-900 mb-3">
              Week-end côte + intérieur — vendredi soir → dimanche soir
            </h2>
            <p className="text-slate-500 text-lg max-w-xl mx-auto">
              Notre combo le plus populaire — mer, villages basques et nature en 48h chrono.
            </p>
          </div>

          <div className="max-w-3xl mx-auto space-y-0">
            {itineraryDays.map((day, idx) => (
              <div key={idx} className="flex gap-6">
                <div className="flex flex-col items-center flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#4BC3E3] to-[#4D5FEC] flex items-center justify-center text-white text-xl font-bold shadow-lg">
                    {day.icon}
                  </div>
                  {idx < itineraryDays.length - 1 && (
                    <div className="w-0.5 bg-gradient-to-b from-[#4D5FEC]/40 to-slate-200 flex-1 my-2" />
                  )}
                </div>
                <div className="pb-10 pt-2">
                  <h3 className="font-black text-slate-900 text-xl mb-4">{day.label}</h3>
                  <ul className="space-y-3">
                    {day.activities.map((a) => (
                      <li key={a} className="flex items-start gap-3 text-slate-600">
                        <span className="text-[#4D5FEC] font-bold mt-0.5 flex-shrink-0">→</span>
                        <span>{a}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── INFOS PRATIQUES ───────────────────────────────────────── */}
      <PracticalInfoSection
        title="Infos pratiques — Week-end en van"
        image={YONI_IMG}
        imageAlt="Van Yoni Vanzon Explorer prêt pour un week-end au Pays Basque"
        rows={[
          {
            label: "Récupération",
            value: "Vendredi 17h–20h à Cambo-les-Bains (ou livraison sur demande)",
          },
          {
            label: "Retour",
            value: "Dimanche avant 18h (possibilité prolonger sur demande)",
          },
          {
            label: "Tarif week-end",
            value: "2 nuits = 130€ (basse saison) à 190€ (haute saison)",
          },
          {
            label: "Distance Cambo",
            value: "Biarritz 25 min, SJL 35 min, Bayonne 15 min, Irati 1h",
          },
          {
            label: "Inclus",
            value: "Assurance, literie, cuisine complète, table de camping",
          },
          {
            label: "Conseil",
            value: "Réservez 2–4 semaines à l'avance en haute saison",
          },
        ]}
      />

      {/* ── GOOGLE MAPS ───────────────────────────────────────────── */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-2xl font-black text-slate-900 mb-2 text-center">
            Votre point de départ : Cambo-les-Bains
          </h2>
          <p className="text-slate-500 text-center mb-8">
            Remise des clés à Cambo-les-Bains (64250). Parking gratuit sur place.
          </p>
          <div className="rounded-3xl overflow-hidden shadow-lg border border-slate-100">
            <iframe
              src="https://maps.google.com/maps?q=Cambo-les-Bains,64250,France&t=&z=13&ie=UTF8&iwloc=&output=embed"
              width="100%"
              height="350"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Cambo-les-Bains — Votre base de départ week-end"
            />
          </div>
        </div>
      </section>

      {/* ── VAN SELECTION ─────────────────────────────────────────── */}
      <VanSelectionSection destination="Pays Basque" />

      {/* ── FAQ ───────────────────────────────────────────────────── */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-12">
            <span
              className="badge-glass !px-4 !py-1.5 text-sm font-semibold mb-4 inline-block"
              style={{ color: "#4D5FEC" }}
            >
              FAQ
            </span>
            <h2 className="text-3xl font-black text-slate-900">
              Questions fréquentes — Location van week-end
            </h2>
          </div>

          <div className="space-y-3">
            {faq.map((item) => (
              <details
                key={item.q}
                className="glass-card group rounded-2xl overflow-hidden"
              >
                <summary className="flex items-center justify-between gap-4 p-5 cursor-pointer list-none font-bold text-slate-900 hover:text-[#4D5FEC] transition-colors">
                  <span>{item.q}</span>
                  <span className="text-[#4BC3E3] flex-shrink-0 group-open:rotate-45 transition-transform duration-200 text-xl leading-none">
                    +
                  </span>
                </summary>
                <div className="px-5 pb-5 text-slate-600 leading-relaxed text-sm">
                  {item.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ─────────────────────────────────────────────── */}
      <section className="relative py-24 overflow-hidden">
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(135deg, #0F153A 0%, #1e2d6b 100%)" }}
        />
        <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-5 leading-tight">
            Ce week-end,<br />le Pays Basque en van.
          </h2>
          <p className="text-white/70 text-xl mb-10">
            <strong className="text-white">2 nuits dès 130€</strong> — assurance incluse, van
            tout équipé, spots partagés par Jules.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <a
              href="https://www.yescapa.fr/campers/89215"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-white text-slate-900 font-bold px-10 py-5 rounded-2xl hover:bg-blue-50 transition-colors text-lg shadow-2xl"
            >
              Réserver Yoni — Yescapa
            </a>
            <a
              href="https://www.yescapa.fr/campers/98869"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-white/10 backdrop-blur-md border border-white/30 text-white font-bold px-10 py-5 rounded-2xl hover:bg-white/20 transition-colors text-lg"
            >
              Réserver Xalbat — Yescapa
            </a>
          </div>
          <p className="text-white/40 text-sm mt-6">
            <Link
              href="/road-trip-pays-basque-van"
              className="hover:text-white/60 transition-colors underline underline-offset-2"
            >
              Voir notre itinéraire road trip Pays Basque 7 jours
            </Link>
          </p>
        </div>
      </section>
    </>
  );
}
