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
  title: "Location Van Aménagé Bayonne — dès 65€/nuit | Vanzon Explorer",
  description:
    "Louez un van aménagé à Bayonne dès 65€/nuit. Ville de départ idéale pour explorer le Pays Basque en van — Biarritz à 20 min, Saint-Jean-de-Luz à 25 min, les Pyrénées à 1h.",
  alternates: {
    canonical: "https://vanzonexplorer.com/location/bayonne",
  },
};

const FALLBACK_IMG =
  "https://cdn.sanity.io/images/lewexa74/production/d445397965472d300e3dc13d6b1c37503fe8ba25-1920x1080.png?auto=format&q=82";

const XALBAT_IMG =
  "https://cdn.sanity.io/images/lewexa74/production/04d93973d30c5eede51f954d1432a50a5f82ef9b-1080x750.png?auto=format&q=82";

export default async function LocationBayonnePage() {
  const [heroPhoto, photoTown, photoFood, photoFestival, placeStats] =
    await Promise.all([
      fetchPexelsPhoto("bayonne basque city river cathedral france", FALLBACK_IMG),
      fetchPexelsPhoto("bayonne old town medieval architecture", FALLBACK_IMG),
      fetchPexelsPhoto("basque food jambon chocolate artisan", FALLBACK_IMG),
      fetchPexelsPhoto("bayonne river festival basque", FALLBACK_IMG),
      getGooglePlaceStats(),
    ]);

  const activities = [
    {
      icon: "🏰",
      title: "Vieille ville et remparts",
      desc: "Remparts médiévaux classés, ruelles animées, quais de la Nive. Bayonne est l'une des villes les mieux conservées du Sud-Ouest.",
      photo: photoTown,
    },
    {
      icon: "⛪",
      title: "Cathédrale Sainte-Marie",
      desc: "Joyau gothique du XIIIe siècle, inscrit au patrimoine mondial. Le cloître est un havre de paix.",
      photo: photoTown,
    },
    {
      icon: "🍖",
      title: "Jambon de Bayonne AOP",
      desc: "L'un des meilleurs jambons au monde. Visite de maison Pierre Ibaïalde ou dégustation au marché couvert.",
      photo: photoFood,
    },
    {
      icon: "🍫",
      title: "Chocolat artisanal",
      desc: "Bayonne est la capitale française du chocolat depuis le XVIIe siècle. Cazenave, Puyodebat, Daranatz — faites le tour des chocolatiers.",
      photo: photoFood,
    },
    {
      icon: "🎉",
      title: "Fêtes de Bayonne",
      desc: "Début août, les plus grandes fêtes du Sud-Ouest. 5 jours de musique, corridas et ambiance basque explosive.",
      photo: photoFestival,
    },
    {
      icon: "🏛️",
      title: "Musée Basque",
      desc: "La meilleure introduction à la culture basque : langue, histoire, traditions. Incontournable.",
      photo: photoFestival,
    },
  ];

  const itinerary = [
    {
      day: "Vendredi soir",
      emoji: "🌆",
      color: "bg-[#4BC3E3]",
      items: [
        "Récupération van à Cambo (17h)",
        "15 min jusqu'à Bayonne",
        "Parking quai de la Nive",
        "Dîner tapas quartier Saint-Esprit",
        "Promenade nocturne remparts",
      ],
    },
    {
      day: "Samedi",
      emoji: "🏛️",
      color: "bg-[#4D5FEC]",
      items: [
        "Petit déj marché couvert",
        "Visite cathédrale + musée basque",
        "Chocolateries rue du Pont-Neuf",
        "Aperitivo terrasse quai Galuperie",
        "Option : Biarritz l'après-midi (20 min)",
      ],
    },
    {
      day: "Dimanche",
      emoji: "🚐",
      color: "bg-[#4BC3E3]",
      items: [
        "Jambon Ibaïalde",
        "Dernière balade vieille ville",
        "Route vers Pays Basque intérieur (Espelette, Ainhoa)",
        "Retour Cambo",
      ],
    },
  ];

  const faq = [
    {
      q: "Où se garer en van à Bayonne ?",
      a: "Le parking Remparts (rue des Gouverneurs) est le plus central — comptez 10–15€/nuit. Hors saison, plusieurs zones sur les quais sont tolérées. Nous vous donnons nos spots préférés.",
    },
    {
      q: "Peut-on visiter Biarritz depuis Bayonne en van ?",
      a: "Absolument, Biarritz n'est qu'à 20 min. Beaucoup de nos clients font une base à Bayonne et rayonnent vers Biarritz, Saint-Jean-de-Luz et même l'intérieur du Pays Basque.",
    },
    {
      q: "Les Fêtes de Bayonne — comment s'organiser en van ?",
      a: "Début août, le stationnement en centre-ville est quasi impossible pendant les fêtes. On vous recommande de se garer dans les parkings périphériques (P+R) et d'entrer à pied. Réservez votre van plusieurs mois à l'avance pour cette période.",
    },
    {
      q: "Quelle est la durée minimale de location ?",
      a: "La durée minimale est de 2 nuits (week-end). Nous recommandons 4–7 jours pour profiter de tout le Pays Basque depuis Bayonne.",
    },
    {
      q: "Y a-t-il une cuisine complète dans le van ?",
      a: "Oui, nos vans ont une cuisine équipée avec réchaud 2 feux, évier, réfrigérateur 12V, vaisselle et ustensiles. Idéal pour cuisiner les achats du marché de Bayonne.",
    },
  ];

  return (
    <>
      <LocationRentalJsonLd
        destination="Bayonne"
        url="https://vanzonexplorer.com/location/bayonne"
      />

      {/* ── HERO ──────────────────────────────────────────────────── */}
      <section className="relative -mt-16 min-h-screen flex items-end overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src={heroPhoto?.url ?? FALLBACK_IMG}
            alt="Van Vanzon Explorer à Bayonne, base de départ Pays Basque"
            fill
            sizes="100vw"
            className="object-cover object-center"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-900/50 to-slate-900/20" />
          <div className="absolute inset-0 bg-gradient-to-r from-blue-950/30 via-transparent to-transparent" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 pb-20 pt-32 w-full">
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
              <li className="text-white/80">Bayonne</li>
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
              Location van aménagé
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4D5FEC] to-[#4BC3E3]">
                à Bayonne
              </span>
            </h1>

            <p className="text-xl text-white/75 leading-relaxed mb-8 max-w-xl">
              Remparts médiévaux, chocolat artisanal, jambon AOP... Bayonne la basque s&apos;explore
              à pied depuis votre van. Départ Cambo-les-Bains — 15 min.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/location#nos-vans"
                className="btn-shine inline-flex items-center justify-center gap-2 bg-white text-slate-900 font-bold px-8 py-4 rounded-xl hover:bg-blue-50 transition-colors text-lg shadow-2xl"
              >
                Voir nos vans disponibles
              </Link>
              <a
                href="https://www.yescapa.fr/campers/89215"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-white/10 backdrop-blur-md border border-white/30 text-white font-bold px-8 py-4 rounded-xl hover:bg-white/20 transition-colors text-lg"
              >
                Réserver maintenant →
              </a>
            </div>
          </div>

          <div className="hidden lg:flex gap-4 absolute bottom-20 right-6">
            {[
              { value: "65€", label: "/ nuit", sub: "à partir de" },
              { value: "2", label: "vans", sub: "exclusifs" },
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

        <a
          href="#activites"
          className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 text-white/50 hover:text-white/80 transition-colors animate-bounce"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </a>
      </section>

      {/* ── TRUST BAR ─────────────────────────────────────────────── */}
      <section className="bg-slate-950 py-5 border-t border-white/5">
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex flex-wrap justify-center md:justify-between items-center gap-y-4 gap-x-8 text-white/60 text-sm font-medium">
            {[
              { icon: "📍", text: "Départ Cambo-les-Bains — 15 min de Bayonne" },
              { icon: "🛡️", text: "Assurance tous risques incluse" },
              { icon: "💰", text: "Dès 65€/nuit" },
              {
                icon: "⭐",
                text: `${placeStats.ratingDisplay}/5 sur ${placeStats.reviewCount} avis Google`,
              },
              { icon: "💡", text: "Conseils locaux offerts par Jules" },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-2">
                <span>{item.icon}</span>
                <span>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ACTIVITÉS AVEC PHOTOS ─────────────────────────────────── */}
      <section id="activites" className="py-20 bg-white scroll-mt-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <span
              className="badge-glass !px-4 !py-1.5 text-sm font-semibold mb-4 inline-block"
              style={{ color: "#4D5FEC" }}
            >
              À faire à Bayonne
            </span>
            <h2 className="text-4xl font-black text-slate-900 mb-3">
              Pourquoi partir de Bayonne ?
            </h2>
            <p className="text-slate-500 text-lg max-w-xl mx-auto">
              Bayonne est le carrefour parfait : au croisement de la côte basque, des Pyrénées
              et des Landes. En van, toutes les destinations s&apos;atteignent en moins d&apos;une heure.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activities.map((activity) => (
              <div
                key={activity.title}
                className="relative h-64 overflow-hidden rounded-2xl group"
              >
                <Image
                  src={activity.photo?.url ?? FALLBACK_IMG}
                  alt={activity.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                <div className="absolute bottom-0 p-5">
                  <div className="text-2xl mb-1">{activity.icon}</div>
                  <h3 className="font-bold text-white text-lg mb-1">{activity.title}</h3>
                  <p className="text-white/75 text-sm leading-relaxed">{activity.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ITINÉRAIRE WEEK-END ───────────────────────────────────── */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-14">
            <span
              className="badge-glass !px-4 !py-1.5 text-sm font-semibold mb-4 inline-block"
              style={{ color: "#4D5FEC" }}
            >
              Week-end type
            </span>
            <h2 className="text-4xl font-black text-slate-900 mb-3">
              Itinéraire week-end à Bayonne en van
            </h2>
            <p className="text-slate-500 text-lg max-w-xl mx-auto">
              Deux nuits, trois jours — Bayonne comme base pour explorer la ville et rayonner
              vers la côte et l&apos;intérieur du Pays Basque.
            </p>
          </div>

          <div className="space-y-8">
            {itinerary.map((day, idx) => (
              <div key={day.day} className="flex gap-6">
                {/* Timeline */}
                <div className="flex flex-col items-center flex-shrink-0">
                  <div
                    className={`w-12 h-12 rounded-full ${day.color} flex items-center justify-center text-xl shadow-md`}
                  >
                    {day.emoji}
                  </div>
                  {idx < itinerary.length - 1 && (
                    <div className="w-0.5 flex-1 bg-slate-200 mt-3" />
                  )}
                </div>

                {/* Content */}
                <div className="pb-8 flex-1">
                  <h3 className="font-black text-slate-900 text-xl mb-4">{day.day}</h3>
                  <ul className="space-y-2">
                    {day.items.map((item) => (
                      <li key={item} className="flex items-start gap-3 text-slate-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#4D5FEC] flex-shrink-0 mt-2" />
                        {item}
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
        title="Infos pratiques — Bayonne en van"
        image={XALBAT_IMG}
        imageAlt="Van Xalbat Vanzon Explorer ouvert près de Bayonne"
        rows={[
          {
            label: "Récupération",
            value: "Cambo-les-Bains (15 min de Bayonne) ou livraison sur demande",
          },
          {
            label: "Distance Biarritz",
            value: "20 min — idéal pour combiner les deux villes",
          },
          {
            label: "Tarif",
            value: "Dès 65€/nuit — assurance et équipements inclus",
          },
          {
            label: "Parking van",
            value: "Parking Remparts ou quais de la Nive (payant en centre-ville)",
          },
          {
            label: "Marché couvert",
            value: "Mardi–Samedi matin — le meilleur de la gastronomie basque",
          },
          {
            label: "Hub idéal",
            value: "Bayonne est au centre de tout — côte, montagne, Espagne à 45 min",
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
            À 15 min de Bayonne. Remise des clés sur place, parking gratuit.
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
              title="Cambo-les-Bains — Point de départ vers Bayonne"
            />
          </div>
        </div>
      </section>

      {/* ── VAN SELECTION ─────────────────────────────────────────── */}
      <VanSelectionSection destination="Bayonne" />

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
              Questions fréquentes — Location van Bayonne
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
            Partez à Bayonne
            <br />
            en van dès ce week-end.
          </h2>
          <p className="text-white/70 text-xl mb-10">
            Dès <strong className="text-white">65€/nuit</strong> — clés remises à
            Cambo-les-Bains, assurance incluse.
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
              Voir l&apos;itinéraire road trip Pays Basque 7 jours
            </Link>
          </p>
        </div>
      </section>
    </>
  );
}
