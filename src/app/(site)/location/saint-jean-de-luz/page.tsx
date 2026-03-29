import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { fetchPexelsPhoto } from "@/lib/pexels";
import { fetchSerpApiImages } from "@/lib/serpapi-images";
import { getGooglePlaceStats } from "@/lib/google-places";
import { LocationRentalJsonLd } from "@/components/seo/JsonLd";
import VanSelectionSection from "@/components/location/VanSelectionSection";
import PracticalInfoSection from "@/components/location/PracticalInfoSection";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Location Van Aménagé Saint-Jean-de-Luz — dès 65€/nuit | Vanzon Explorer",
  description:
    "Louez un van aménagé à Saint-Jean-de-Luz dès 65€/nuit. Port de pêche basque, plage protégée, marché animé — explorez le joyau du Golfe de Gascogne en van avec Vanzon Explorer.",
  alternates: {
    canonical: "https://vanzonexplorer.com/location/saint-jean-de-luz",
  },
};

const FALLBACK_IMG =
  "https://cdn.sanity.io/images/lewexa74/production/d445397965472d300e3dc13d6b1c37503fe8ba25-1920x1080.png?auto=format&q=82";

const YONI_IMG =
  "https://cdn.sanity.io/images/lewexa74/production/660105a28e577c33f642a8fdff528d88925642e3-1080x750.png?auto=format&q=82";

export default async function LocationSaintJeanDeLuzPage() {
  const [heroPhoto, activityImages, placeStats] =
    await Promise.all([
      fetchPexelsPhoto("saint jean de luz harbor beach basque village", FALLBACK_IMG),
      fetchSerpApiImages([
        "Saint-Jean-de-Luz port pêche bateaux colorés quai",
        "Maison Louis XIV Saint-Jean-de-Luz façade historique",
        "Plage Saint-Jean-de-Luz famille baignade sable",
        "Hondarribia vieille ville fortifiée pittoresque Espagne",
        "Rue Gambetta Saint-Jean-de-Luz maisons colombages basques",
        "Ciboure port maisons colorées basques pêcheurs",
      ], FALLBACK_IMG),
      getGooglePlaceStats(),
    ]);

  const activities = [
    {
      icon: "⚓",
      title: "Le port de pêche",
      desc: "L'un des ports de pêche les plus actifs de la côte basque. Thon rouge, anchois, merlu — le matin, les pêcheurs rentrent.",
      imgUrl: activityImages[0]?.url ?? FALLBACK_IMG,
    },
    {
      icon: "🏠",
      title: "Maison Louis XIV",
      desc: "Dans cette maison du XVIIe siècle, Louis XIV séjourna avant son mariage avec l'infante d'Espagne Marie-Thérèse. Histoire vivante.",
      imgUrl: activityImages[1]?.url ?? FALLBACK_IMG,
    },
    {
      icon: "🏖️",
      title: "La Plage",
      desc: "La seule grande plage protégée du Pays Basque, à l'abri des vagues. Idéale pour les familles et les enfants.",
      imgUrl: activityImages[2]?.url ?? FALLBACK_IMG,
    },
    {
      icon: "🌊",
      title: "Hendaye et Hondarribia",
      desc: "À 15 min, la frontière espagnole et ses plages infinies. Hondarribia, ville fortifiée espagnole, mérite le détour.",
      imgUrl: activityImages[3]?.url ?? FALLBACK_IMG,
    },
    {
      icon: "🛍️",
      title: "Rue Gambetta",
      desc: "La rue principale, piétonne, avec ses maisons à colombages basques. Maison Adam (gâteau basque depuis 1660) à ne pas manquer.",
      imgUrl: activityImages[4]?.url ?? FALLBACK_IMG,
    },
    {
      icon: "🐟",
      title: "Ciboure et ses ruelles",
      desc: "L'autre rive du port, plus calme, avec ses maisons d'armateurs colorées. Maurice Ravel y est né.",
      imgUrl: activityImages[5]?.url ?? FALLBACK_IMG,
    },
  ];

  const itinerary = [
    {
      day: "Vendredi soir",
      emoji: "🌅",
      color: "bg-[#4BC3E3]",
      items: [
        "Récupération van à Cambo (17h)",
        "Route côtière vers Saint-Jean (35 min)",
        "Arrivée port, premier verre en terrasse",
        "Nuit au parking municipal bord de mer",
      ],
    },
    {
      day: "Samedi",
      emoji: "⚓",
      color: "bg-[#4D5FEC]",
      items: [
        "Marché du matin (produits basques)",
        "Visite port et marché poisson",
        "Plage l'après-midi",
        "Balade Ciboure",
        "Dîner fruits de mer au port",
      ],
    },
    {
      day: "Dimanche",
      emoji: "🇪🇸",
      color: "bg-[#4BC3E3]",
      items: [
        "Déjeuner gâteau basque rue Gambetta",
        "Route Hondarribia ou Hendaye (15 min)",
        "Retour Cambo en passant par Espelette",
      ],
    },
  ];

  const faq = [
    {
      q: "Peut-on dormir en van à Saint-Jean-de-Luz ?",
      a: "Oui, l'aire camping-car du chemin d'Erromardie est excellente — vue mer, accès plage direct, et tarif raisonnable hors haute saison. En été, réservez à l'avance.",
    },
    {
      q: "Combien de temps de Cambo à Saint-Jean-de-Luz ?",
      a: "35 minutes via la D810. Nous conseillons la route côtière par Azkaine — plus belle et seulement 5 min de plus.",
    },
    {
      q: "Peut-on aller en Espagne en van ?",
      a: "Oui ! Hondarribia est à 15 min de Saint-Jean-de-Luz, San Sebastián à 35 min. Nos vans sont assurés pour toute l'Europe.",
    },
    {
      q: "Que faire en cas de mauvais temps ?",
      a: "Saint-Jean a une vieille ville magnifique à explorer à pied. Bayonne et ses musées sont à 30 min. Et l'intérieur du Pays Basque (Espelette, Ainhoa) est splendide sous la pluie.",
    },
    {
      q: "Le van a-t-il un lit confortable ?",
      a: "Oui, lit fixe 120×190 cm pour les deux vans. Literie, couette et oreillers fournis. Le van Yoni a une vue dégagée depuis le lit grâce à son toit relevable.",
    },
  ];

  return (
    <>
      <LocationRentalJsonLd
        destination="Saint-Jean-de-Luz"
        url="https://vanzonexplorer.com/location/saint-jean-de-luz"
      />

      {/* ── HERO ──────────────────────────────────────────────────── */}
      <section className="relative -mt-16 min-h-screen flex items-end overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src={heroPhoto?.url ?? FALLBACK_IMG}
            alt="Van aménagé à Saint-Jean-de-Luz au bord du port basque"
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
              <li className="text-white/80">Saint-Jean-de-Luz</li>
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
              Location van aménagé à{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4BC3E3] to-[#4D5FEC]">
                Saint-Jean-de-Luz
              </span>
            </h1>

            <p className="text-xl text-white/75 leading-relaxed mb-8 max-w-xl">
              Port de pêche basque, plage familiale protégée, marché animé... Saint-Jean-de-Luz
              est un joyau du Golfe de Gascogne. À 35 min de Cambo-les-Bains.
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
              { icon: "📍", text: "Départ Cambo-les-Bains — 35 min de Saint-Jean-de-Luz" },
              { icon: "🛡️", text: "Assurance tous risques incluse" },
              { icon: "💰", text: "Dès 65€/nuit" },
              {
                icon: "⭐",
                text: `${placeStats.ratingDisplay}/5 sur ${placeStats.reviewCount} avis Google`,
              },
              { icon: "🔑", text: "Livraison Saint-Jean sur demande" },
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
              À faire à Saint-Jean-de-Luz
            </span>
            <h2 className="text-4xl font-black text-slate-900 mb-3">
              Pourquoi louer un van à Saint-Jean-de-Luz ?
            </h2>
            <p className="text-slate-500 text-lg max-w-xl mx-auto">
              Saint-Jean-de-Luz concentre tout le charme du Pays Basque dans un cadre
              exceptionnel. En van, vous dormez à deux pas du port, du marché et de la plage.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activities.map((activity) => (
              <div
                key={activity.title}
                className="relative rounded-2xl overflow-hidden h-64 group cursor-default"
              >
                <Image
                  src={activity.imgUrl}
                  alt={activity.title}
                  fill
                  sizes="(max-width:768px) 100vw, (max-width:1024px) 50vw, 33vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                <div className="absolute bottom-0 p-5">
                  <span className="text-2xl mb-2 block">{activity.icon}</span>
                  <h3 className="text-white font-bold text-lg leading-tight mb-1">
                    {activity.title}
                  </h3>
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
              Itinéraire week-end à Saint-Jean-de-Luz en van
            </h2>
            <p className="text-slate-500 text-lg max-w-xl mx-auto">
              Deux nuits, trois jours — port, plage, Espagne. Le programme parfait pour
              découvrir Saint-Jean-de-Luz et ses environs depuis votre van.
            </p>
          </div>

          <div className="space-y-8">
            {itinerary.map((day, idx) => (
              <div key={day.day} className="flex gap-6">
                <div className="flex flex-col items-center flex-shrink-0">
                  <div
                    className={`w-10 h-10 rounded-full ${day.color} flex items-center justify-center text-lg shadow-md`}
                  >
                    {day.emoji}
                  </div>
                  {idx < itinerary.length - 1 && (
                    <div className="w-0.5 flex-1 bg-slate-200 mt-3" />
                  )}
                </div>

                <div className="pb-8 flex-1">
                  <h3 className="font-black text-slate-900 text-xl mb-4">{day.day}</h3>
                  <ul className="space-y-2">
                    {day.items.map((item) => (
                      <li key={item} className="flex items-start gap-3 text-slate-600">
                        <span className="text-[#4BC3E3] flex-shrink-0 mt-0.5">→</span>
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
        title="Infos pratiques — Saint-Jean-de-Luz en van"
        image={YONI_IMG}
        imageAlt="Van Yoni Vanzon Explorer ouvert près de Saint-Jean-de-Luz"
        rows={[
          {
            label: "Récupération",
            value: "Cambo-les-Bains (35 min) ou livraison Saint-Jean sur demande",
          },
          {
            label: "Aire camping-car",
            value: "Aire municipale chemin d'Erromardie — idéale bord de mer",
          },
          {
            label: "Durée recommandée",
            value: "3–5 jours — côte + intérieur basque",
          },
          {
            label: "Tarif",
            value: "Dès 65€/nuit — assurance et cuisine inclus",
          },
          {
            label: "Marché",
            value: "Tous les matins en saison — meilleur marché basque de la côte",
          },
          {
            label: "À proximité",
            value: "Hendaye 15 min, Biarritz 20 min, Bayonne 30 min",
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
            À 35 min de Saint-Jean-de-Luz. Remise des clés sur place, parking gratuit.
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
              title="Cambo-les-Bains — Point de départ vers Saint-Jean-de-Luz"
            />
          </div>
        </div>
      </section>

      {/* ── VAN SELECTION ─────────────────────────────────────────── */}
      <VanSelectionSection destination="Saint-Jean-de-Luz" />

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
              Questions fréquentes — Location van Saint-Jean-de-Luz
            </h2>
          </div>

          <div className="divide-y divide-slate-200">
            {faq.map((item) => (
              <details key={item.q} className="border-b border-slate-200 py-5 group">
                <summary className="flex justify-between items-center cursor-pointer font-semibold text-slate-900 list-none">
                  {item.q}
                  <span className="text-slate-400 group-open:rotate-180 transition-transform flex-shrink-0 ml-4">
                    ▼
                  </span>
                </summary>
                <p className="text-slate-500 mt-3 leading-relaxed">{item.a}</p>
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
            Saint-Jean-de-Luz vous attend.
            <br />
            Le van aussi.
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
              Voir notre itinéraire road trip Pays Basque en van
            </Link>
          </p>
        </div>
      </section>
    </>
  );
}
