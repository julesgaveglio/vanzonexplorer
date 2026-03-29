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
  title: "Location Van Aménagé — Forêt d'Irati | Pays Basque | Vanzon Explorer",
  description:
    "Partez explorer la Forêt d'Irati en van aménagé. Hêtraie millénaire, bivouac en altitude, faune sauvage — le Pays Basque profond à 1h de Cambo-les-Bains.",
  alternates: {
    canonical: "https://vanzonexplorer.com/location/foret-irati",
  },
};

const FALLBACK_IMG =
  "https://cdn.sanity.io/images/lewexa74/production/d445397965472d300e3dc13d6b1c37503fe8ba25-1920x1080.png?auto=format&q=82";

const XALBAT_IMG =
  "https://cdn.sanity.io/images/lewexa74/production/04d93973d30c5eede51f954d1432a50a5f82ef9b-1080x750.png?auto=format&q=82";

const faq = [
  {
    q: "La forêt d'Irati est-elle accessible en van ?",
    a: "Oui, la route depuis Larrau est goudronnée jusqu'au lac d'Irabia. Quelques virages serrés mais nos vans (moins de 6m) passent sans problème. En hiver, la route peut être fermée — vérifiez les conditions avant de partir.",
  },
  {
    q: "Peut-on bivouaquer à Irati ?",
    a: "Le bivouac sauvage est toléré à moins de 300m des chalets et du lac. Hors saison (octobre-mars), la zone du lac est quasi-déserte. En juillet-août, préférez l'aire officielle de Larrau (5 km).",
  },
  {
    q: "Combien de temps de Cambo à Irati ?",
    a: "1 heure environ selon la route choisie. Nous recommandons la route via Saint-Jean-Pied-de-Port pour les paysages, ou via Mauléon pour éviter les cols.",
  },
  {
    q: "Quand voir le brame du cerf à Irati ?",
    a: "De mi-septembre à mi-octobre. Levez-vous à l'aube — à 7h, les cerfs sont au bord du lac d'Irabia. C'est l'une des expériences les plus fortes que vous puissiez vivre en Pays Basque.",
  },
  {
    q: "Le van a-t-il un chauffage pour les nuits en altitude ?",
    a: "Oui, nos deux vans ont un chauffage diesel Webasto autonome. Même à 900m d'altitude en automne, vous dormez confortablement sans brancher le van.",
  },
];

const itineraryDays = [
  {
    icon: "🌲",
    label: "Vendredi soir",
    activities: [
      "Récupération van à Cambo (17h)",
      "Route via Saint-Jean-Pied-de-Port ou Mauléon (1h)",
      "Arrivée lac d'Irabia à la nuit",
      "Première nuit en altitude sous les étoiles",
    ],
  },
  {
    icon: "🥾",
    label: "Samedi",
    activities: [
      "Lever avec les cerfs au bord du lac",
      "Randonnée tour du lac d'Irabia (3h)",
      "Pique-nique dans la hêtraie",
      "Découverte bergerie et fromages",
      "Coucher de soleil col d'Organbidexka",
    ],
  },
  {
    icon: "🏔️",
    label: "Dimanche",
    activities: [
      "Balade matinale aux vautours",
      "Descente par Larrau",
      "Marché Mauléon ou Saint-Jean-Pied-de-Port",
      "Retour Cambo",
    ],
  },
];

export default async function LocationForetIratiPage() {
  const [heroPhoto, activityImages, placeStats] =
    await Promise.all([
      fetchPexelsPhoto("irati forest beech trees autumn pyrenees", FALLBACK_IMG),
      Promise.all([
        "Forêt Irati hêtraie automne feuilles colorées",
        "Vautours fauves vol thermique Pyrénées basque",
        "Randonnée sentier Irati forêt lac Irabia Pyrénées",
        "Fromage Ossau-Iraty brebis bergerie basque meule",
        "Col Organbidexka vue Pyrénées panorama basque",
        "Lac Irabia Irati reflet forêt nuit étoilée bivouac",
      ].map((q) => fetchPexelsPhoto(q, FALLBACK_IMG))),
      getGooglePlaceStats(),
    ]);

  const activities = [
    {
      icon: "🌲",
      title: "La Hêtraie millénaire",
      desc: "L'une des dernières grandes forêts primitives d'Europe. 17 000 hectares de hêtres centenaires, un silence absolu, une lumière filtrée incomparable.",
      imgUrl: activityImages[0]?.url ?? FALLBACK_IMG,
    },
    {
      icon: "🦅",
      title: "Faune sauvage",
      desc: "Vautours fauves en vol thermique, cerfs en rut à l'automne, isards dans les rochers. Irati est un sanctuaire animalier accessible.",
      imgUrl: activityImages[1]?.url ?? FALLBACK_IMG,
    },
    {
      icon: "🥾",
      title: "Randonnées balisées",
      desc: "80 km de sentiers balisés. Du tour du lac d'Irabia (3h) à la traversée du massif (2 jours). Toute la forêt est accessible à pied.",
      imgUrl: activityImages[2]?.url ?? FALLBACK_IMG,
    },
    {
      icon: "🧀",
      title: "Fromages de brebis",
      desc: "Les bergeries du piémont produisent l'Ossau-Iraty AOP. Visite et dégustation directement chez les producteurs — une expérience authentique.",
      imgUrl: activityImages[3]?.url ?? FALLBACK_IMG,
    },
    {
      icon: "🏔️",
      title: "Cols et points de vue",
      desc: "Le col d'Organbidexka (1284m) offre un panorama à 360° sur les Pyrénées. Le col Bagargui est un des plus beaux du Pays Basque.",
      imgUrl: activityImages[4]?.url ?? FALLBACK_IMG,
    },
    {
      icon: "🌙",
      title: "Bivouac altitude",
      desc: "Dormir dans le van au cœur de la forêt, à 900m d'altitude. La nuit étoilée d'Irati est parmi les plus belles de France — pollution lumineuse nulle.",
      imgUrl: activityImages[5]?.url ?? FALLBACK_IMG,
    },
  ];

  return (
    <>
      <LocationRentalJsonLd
        destination="Forêt d'Irati"
        url="https://vanzonexplorer.com/location/foret-irati"
      />

      {/* ── HERO ──────────────────────────────────────────────────── */}
      <section className="relative -mt-16 min-h-screen flex items-end overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src={heroPhoto?.url ?? FALLBACK_IMG}
            alt="Van aménagé en bivouac dans la Forêt d'Irati, hêtraie millénaire Pyrénées basques"
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
              <li className="text-white/80">Forêt d&apos;Irati</li>
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
              Forêt d&apos;Irati<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4BC3E3] to-[#4D5FEC]">
                en van aménagé
              </span>
            </h1>

            <p className="text-xl text-white/75 leading-relaxed mb-8 max-w-xl">
              La plus grande hêtraie millénaire d&apos;Europe. Bivouac en altitude, cerfs et
              vautours, sentiers infinis... Le Pays Basque sauvage à 1h de Cambo-les-Bains.
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

          {/* Stats cards — desktop only, bottom-right */}
          <div className="hidden lg:flex gap-4 absolute bottom-20 right-6">
            {[
              { value: "65€", label: "/ nuit", sub: "à partir de" },
              { value: "1h", label: "de Cambo", sub: "seulement" },
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
          href="#activites"
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
              { icon: "📍", text: "Départ Cambo-les-Bains — 1h d'Irati" },
              { icon: "🛡️", text: "Assurance tous risques incluse" },
              { icon: "💰", text: "Dès 65€/nuit" },
              {
                icon: "⭐",
                text: `${placeStats.ratingDisplay}/5 sur ${placeStats.reviewCount} avis Google`,
              },
              { icon: "🌲", text: "Spots bivouac partagés par Jules" },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-2">
                <span>{item.icon}</span>
                <span>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CE QU'IL FAUT FAIRE À IRATI ───────────────────────────── */}
      <section id="activites" className="py-20 bg-white scroll-mt-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <span
              className="badge-glass !px-4 !py-1.5 text-sm font-semibold mb-4 inline-block"
              style={{ color: "#4D5FEC" }}
            >
              À faire à Irati
            </span>
            <h2 className="text-4xl font-black text-slate-900 mb-3">
              Ce qu&apos;il faut faire à la Forêt d&apos;Irati
            </h2>
            <p className="text-slate-500 text-lg max-w-xl mx-auto">
              À seulement 1h de Cambo-les-Bains, Irati est l&apos;antithèse de la côte :
              silence, altitude, forêt primaire et bivouacs à couper le souffle.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activities.map((activity) => (
              <div
                key={activity.title}
                className="relative h-64 overflow-hidden rounded-2xl group"
              >
                <Image
                  src={activity.imgUrl}
                  alt={activity.title}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-700"
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

      {/* ── ITINÉRAIRE 3 JOURS ────────────────────────────────────── */}
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
              Itinéraire week-end à Irati en van
            </h2>
            <p className="text-slate-500 text-lg max-w-xl mx-auto">
              Deux nuits, trois jours — le programme parfait pour découvrir la forêt d&apos;Irati
              depuis votre van.
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
        title="Infos pratiques — Forêt d'Irati en van"
        image={XALBAT_IMG}
        imageAlt="Van Xalbat Vanzon Explorer en direction de la Forêt d'Irati"
        rows={[
          {
            label: "Récupération",
            value: "Cambo-les-Bains → Route via col d'Ispéguy (1h) ou Saint-Jean-Pied-de-Port (1h10)",
          },
          {
            label: "Bivouac",
            value: "Lac d'Irabia — toléré hors saison, arrivée tardive recommandée",
          },
          {
            label: "Meilleure saison",
            value: "Septembre–Novembre pour les couleurs d'automne et le brame du cerf",
          },
          {
            label: "À emporter",
            value: "Eau potable (source du lac), vêtements chauds même en été, cartes IGN",
          },
          {
            label: "À combiner",
            value: "Saint-Jean-Pied-de-Port, Mauléon-Licharre, cols pyrénéens",
          },
          {
            label: "Altitude",
            value: "900–1300 m — les nuits sont fraîches, même en juillet",
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
            À 1h de la Forêt d&apos;Irati. Remise des clés sur place, parking gratuit.
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
              title="Cambo-les-Bains — Point de départ vers la Forêt d'Irati"
            />
          </div>
        </div>
      </section>

      {/* ── VAN SELECTION ─────────────────────────────────────────── */}
      <VanSelectionSection destination="la Forêt d'Irati" />

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
              Questions fréquentes — Location van Forêt d&apos;Irati
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
            La forêt vous attend.<br />Le van aussi.
          </h2>
          <p className="text-white/70 text-xl mb-10">
            Dès <strong className="text-white">65€/nuit</strong> — assurance incluse, van tout
            équipé, clés remises à Cambo-les-Bains.
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
