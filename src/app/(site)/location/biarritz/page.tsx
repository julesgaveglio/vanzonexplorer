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
  title: "Location Van Aménagé Biarritz — dès 65€/nuit | Vanzon Explorer",
  description:
    "Louez un van aménagé à Biarritz dès 65€/nuit. Surf à la Côte des Basques, plage de Milady, Grande Plage — explorez Biarritz en van avec Vanzon Explorer.",
  alternates: {
    canonical: "https://vanzonexplorer.com/location/biarritz",
  },
};

const FALLBACK_IMG =
  "https://cdn.sanity.io/images/lewexa74/production/d445397965472d300e3dc13d6b1c37503fe8ba25-1920x1080.png?auto=format&q=82";

const YONI_IMG =
  "https://cdn.sanity.io/images/lewexa74/production/660105a28e577c33f642a8fdff528d88925642e3-1080x750.png?auto=format&q=82";

export default async function LocationBiarritzPage() {
  const [heroPhoto, activityImages, placeStats] =
    await Promise.all([
      fetchPexelsPhoto("biarritz surf atlantic beach basque france", FALLBACK_IMG),
      fetchSerpApiImages([
        "Côte des Basques Biarritz surf vague plage",
        "Plage de Milady Biarritz baignade longboard",
        "Marché des Halles Biarritz pintxos fromage basque",
        "Biarritz rue port tapas bar nuit soir",
        "Rocher de la Vierge Biarritz passerelle coucher soleil",
        "Phare Biarritz vue panoramique Pyrénées",
      ], FALLBACK_IMG),
      getGooglePlaceStats(),
    ]);

  const activities = [
    {
      icon: "🌊",
      title: "Côte des Basques",
      desc: "Le spot de surf le plus iconique de France. Lever tôt, waves parfaites, et le parking gratuit hors saison.",
      imgUrl: activityImages[0]?.thumbnail ?? FALLBACK_IMG,
    },
    {
      icon: "🏄",
      title: "Plage Milady",
      desc: "Plus calme que la Côte des Basques, idéale pour débuter le surf ou se baigner en famille.",
      imgUrl: activityImages[1]?.thumbnail ?? FALLBACK_IMG,
    },
    {
      icon: "🏛️",
      title: "Marché des Halles",
      desc: "Pintxos, jambon de Bayonne, fromages basques. Le meilleur petit-déjeuner avant de partir surfer.",
      imgUrl: activityImages[2]?.thumbnail ?? FALLBACK_IMG,
    },
    {
      icon: "🍽️",
      title: "Rue du Port",
      desc: "Tapas, txakoli et ambiance basque garantie. Le soir, l'animation est dans les rues.",
      imgUrl: activityImages[3]?.thumbnail ?? FALLBACK_IMG,
    },
    {
      icon: "🗿",
      title: "Rocher de la Vierge",
      desc: "Vue à 360° sur l'Atlantique depuis la passerelle. Incontournable au coucher de soleil.",
      imgUrl: activityImages[4]?.thumbnail ?? FALLBACK_IMG,
    },
    {
      icon: "💡",
      title: "Phare de Biarritz",
      desc: "Par temps clair, vue sur les Pyrénées et l'Espagne. À 10 min à pied du centre.",
      imgUrl: activityImages[5]?.thumbnail ?? FALLBACK_IMG,
    },
  ];

  const itinerary = [
    {
      day: "Vendredi soir",
      emoji: "🌅",
      color: "bg-[#4BC3E3]",
      items: [
        "Récupération van à Cambo (17h)",
        "Route vers Biarritz (25 min)",
        "Installation au parking Côte des Basques",
        "Coucher de soleil face à l'Atlantique",
        "Dîner pintxos rue du Port",
      ],
    },
    {
      day: "Samedi",
      emoji: "🏄",
      color: "bg-[#4D5FEC]",
      items: [
        "Surf ou bain matinal Côte des Basques",
        "Café + pintxos aux Halles",
        "Grande Plage l'après-midi",
        "Rocher de la Vierge au coucher du soleil",
        "Soirée en terrasse",
      ],
    },
    {
      day: "Dimanche",
      emoji: "🗺️",
      color: "bg-[#4BC3E3]",
      items: [
        "Petit déj dans le van face à l'océan",
        "Phare et tour de Biarritz",
        "Option : Saint-Jean-de-Luz à 20 min",
        "Retour van Cambo (avant 18h)",
      ],
    },
  ];

  const faq = [
    {
      q: "Peut-on dormir en van à Biarritz ?",
      a: "Oui, le parking de la Côte des Basques est toléré hors juillet/août. En haute saison, l'aire camping-car de Biarritz (route de Milady) est la solution la plus pratique. Nous vous donnons tous les spots testés.",
    },
    {
      q: "Combien de temps pour aller de Cambo-les-Bains à Biarritz ?",
      a: "25 minutes en voiture via la D932. En van, comptez 30 min pour prendre le temps. Nous pouvons aussi livrer le van directement à Biarritz sur demande.",
    },
    {
      q: "L'assurance est-elle incluse dans la location ?",
      a: "Oui, l'assurance tous risques est incluse dans le tarif. Pas de franchise cachée — vous êtes couverts pour tout votre séjour.",
    },
    {
      q: "Y a-t-il un rack à surf sur les vans ?",
      a: "Un porte-vélos est disponible en option. Pour les surfboards, nos vans acceptent les planches jusqu'à 7' à l'intérieur. Les grandes planches peuvent être fixées sur le toit avec nos sangles.",
    },
    {
      q: "Peut-on aller en Espagne avec le van ?",
      a: "Oui, San Sebastián est à 50 min de Biarritz. Hondarribia, Zarautz, Mundaka — la côte basque espagnole est accessible avec nos vans. Vérifiez juste votre couverture assurance internationale.",
    },
  ];

  return (
    <>
      <LocationRentalJsonLd
        destination="Biarritz"
        url="https://vanzonexplorer.com/location/biarritz"
      />

      {/* ── HERO ──────────────────────────────────────────────────── */}
      <section className="relative -mt-16 min-h-screen flex items-end overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src={heroPhoto?.url ?? FALLBACK_IMG}
            alt="Van aménagé à Biarritz au bord de l'Atlantique"
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
              <li className="text-white/80">Biarritz</li>
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
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4BC3E3] to-[#4D5FEC]">
                à Biarritz
              </span>
            </h1>

            <p className="text-xl text-white/75 leading-relaxed mb-8 max-w-xl">
              Côte des Basques, Grande Plage, phare... Biarritz s&apos;explore autrement en van.
              Récupération à Cambo-les-Bains — 25 min de la côte.
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
              { icon: "📍", text: "Départ Cambo-les-Bains — 25 min de Biarritz" },
              { icon: "🛡️", text: "Assurance tous risques incluse" },
              { icon: "💰", text: "Dès 65€/nuit" },
              {
                icon: "⭐",
                text: `${placeStats.ratingDisplay}/5 sur ${placeStats.reviewCount} avis Google`,
              },
              { icon: "🔑", text: "Livraison Biarritz sur demande" },
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
              À faire à Biarritz
            </span>
            <h2 className="text-4xl font-black text-slate-900 mb-3">
              Pourquoi louer un van à Biarritz ?
            </h2>
            <p className="text-slate-500 text-lg max-w-xl mx-auto">
              Biarritz est la capitale du surf français et l&apos;un des spots les plus
              photogéniques du Pays Basque. En van, vous dormez à 500 m des meilleures plages.
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
              Itinéraire week-end à Biarritz en van
            </h2>
            <p className="text-slate-500 text-lg max-w-xl mx-auto">
              Deux nuits, trois jours — le programme parfait pour découvrir Biarritz et la Côte
              Basque depuis votre van.
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
                        <span className="w-1.5 h-1.5 rounded-full bg-[#4BC3E3] flex-shrink-0 mt-2" />
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
        title="Infos pratiques — Biarritz en van"
        image={YONI_IMG}
        imageAlt="Van Yoni Vanzon Explorer ouvert près de Biarritz"
        rows={[
          {
            label: "Récupération",
            value: "Cambo-les-Bains (25 min) ou livraison Biarritz sur demande",
          },
          {
            label: "Durée recommandée",
            value: "2 nuits minimum — idéal 4–5 jours pour profiter",
          },
          {
            label: "Tarif",
            value: "Dès 65€/nuit tout inclus (assurance, équipements, cuisine)",
          },
          {
            label: "Spot nuit",
            value: "Parking Côte des Basques — gratuit hors juillet/août",
          },
          {
            label: "Meilleure saison",
            value: "Mai–Juin et Septembre–Octobre — vagues et météo parfaites",
          },
          {
            label: "Accès surf",
            value: "Côte des Basques, Milady, Les Cavaliers (Anglet) — toutes à 10 min",
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
            À 25 min de Biarritz. Remise des clés sur place, parking gratuit.
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
              title="Cambo-les-Bains — Point de départ vers Biarritz"
            />
          </div>
        </div>
      </section>

      {/* ── VAN SELECTION ─────────────────────────────────────────── */}
      <VanSelectionSection destination="Biarritz" />

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
              Questions fréquentes — Location van Biarritz
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
            Partez à Biarritz
            <br />
            en van dès ce week-end.
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
