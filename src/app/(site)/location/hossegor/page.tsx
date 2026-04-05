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
  title: "Location Van Aménagé Hossegor — Surf & Vanlife",
  description:
    "Louez un van aménagé à Hossegor dès 65€/nuit. La Gravière, les Estagnots, forêt landaise — temple du surf européen à 45 min de Cambo-les-Bains. Assurance incluse.",
  alternates: {
    canonical: "https://vanzonexplorer.com/location/hossegor",
  },
};

const FALLBACK_IMG =
  "https://cdn.sanity.io/images/lewexa74/production/d445397965472d300e3dc13d6b1c37503fe8ba25-1920x1080.png?auto=format&q=82";

const XALBAT_IMG =
  "https://cdn.sanity.io/images/lewexa74/production/04d93973d30c5eede51f954d1432a50a5f82ef9b-1080x750.png?auto=format&q=82";

export default async function LocationHossegorPage() {
  const [heroPhoto, photoGraviere, photoEstagnots, photoForet, photoCoteSauvage, photoVillageLac, photoCapbreton, placeStats] =
    await Promise.all([
      fetchPexelsPhoto("powerful ocean wave tube barrel surfing", FALLBACK_IMG),
      fetchPexelsPhoto("big wave surfer tube barrel ocean", FALLBACK_IMG),
      fetchPexelsPhoto("surfer sandy beach beginner longboard", FALLBACK_IMG),
      fetchPexelsPhoto("pine tree forest path sunlight green", FALLBACK_IMG),
      fetchPexelsPhoto("wild empty sand beach dunes atlantic", FALLBACK_IMG),
      fetchPexelsPhoto("lakeside town houses calm water reflection", FALLBACK_IMG),
      fetchPexelsPhoto("fishing port jetty pier sunset boats", FALLBACK_IMG),
      getGooglePlaceStats(),
    ]);

  const activities = [
    {
      icon: "🌊",
      title: "La Gravière",
      desc: "Le reef le plus puissant d'Europe. Les vagues tubulaires de La Gravière accueillent le Quiksilver Pro chaque automne. Réservé aux surfers confirmés.",
      photo: photoGraviere,
    },
    {
      icon: "🏄",
      title: "Les Estagnots",
      desc: "Moins exposé que La Gravière, Les Estagnots est le meilleur spot pour les intermédiaires. Fond de sable, vagues régulières.",
      photo: photoEstagnots,
    },
    {
      icon: "🌲",
      title: "Forêt landaise",
      desc: "La plus grande forêt de pins d'Europe à deux pas de la plage. Balades, vélo, champignons en automne. Un contraste saisissant mer-forêt.",
      photo: photoForet,
    },
    {
      icon: "🏖️",
      title: "La Côte Sauvage",
      desc: "40 km de plages de sable fin entre Hossegor et Biscarrosse. Accessible en van, peu fréquentée hors saison.",
      photo: photoCoteSauvage,
    },
    {
      icon: "🏘️",
      title: "Le Village et le Lac",
      desc: "Hossegor est la ville la plus chic des Landes. Architectures basques, boutiques surf, restaurants gastro. Le lac marin pour les sports calmes.",
      photo: photoVillageLac,
    },
    {
      icon: "🎯",
      title: "Capbreton et ses jetées",
      desc: "À 3 km, Capbreton est un port de pêche et un paradis pour les pêcheurs de bar et de thon. Les jetées au coucher du soleil sont magiques.",
      photo: photoCapbreton,
    },
  ];

  const itinerary = [
    {
      day: "Vendredi soir",
      emoji: "🌅",
      color: "bg-[#4BC3E3]",
      items: [
        "Récupération van à Cambo (17h)",
        "Autoroute A63, sortie Capbreton (45 min)",
        "Installation parking plage Estagnots",
        "Coucher de soleil depuis la dune",
        "Dîner fish&chips bord de mer",
      ],
    },
    {
      day: "Samedi",
      emoji: "🏄",
      color: "bg-[#4D5FEC]",
      items: [
        "Dawn patrol La Gravière ou Estagnots",
        "Café au village d'Hossegor",
        "Forêt landaise à vélo l'après-midi",
        "Lac marin SUP ou kayak",
        "Dîner terrasse restaurant",
      ],
    },
    {
      day: "Dimanche",
      emoji: "🌲",
      color: "bg-[#4BC3E3]",
      items: [
        "Dernier surf le matin",
        "Capbreton et ses jetées",
        "Option : aller jusqu'à Biscarrosse",
        "Retour Cambo via A63",
      ],
    },
  ];

  const faq = [
    {
      q: "Hossegor est-il adapté aux débutants en surf ?",
      a: "La Gravière est réservée aux surfers expérimentés. Pour les débutants, nous conseillons Les Estagnots ou Capbreton, plus accessibles. Des écoles de surf sont disponibles sur place.",
    },
    {
      q: "Peut-on bivouaquer à la plage à Hossegor ?",
      a: "Hors juillet-août, le parking des Estagnots est toléré pour les vans. En haute saison, l'aire camping-car officielle de Capbreton est la meilleure option à 3 km.",
    },
    {
      q: "Combien de temps de Cambo à Hossegor ?",
      a: "45 min via l'A63 (autoroute A64 → A63). En camping-car, nous conseillons la route côtière pour plus de paysages — comptez 1h15.",
    },
    {
      q: "Y a-t-il un porte-vélos disponible ?",
      a: "Oui, un porte-vélos 2 places est disponible en option (gratuit). Idéal pour la forêt landaise et les pistes cyclables d'Hossegor.",
    },
    {
      q: "Le Quiksilver Pro — comment s'organiser ?",
      a: "Le Quiksilver Pro a lieu début octobre à La Gravière. C'est la meilleure période pour venir ! Le parking est géré par les organisateurs — réservez votre van longtemps à l'avance pour cette période.",
    },
  ];

  return (
    <>
      <LocationRentalJsonLd
        destination="Hossegor"
        url="https://vanzonexplorer.com/location/hossegor"
      />

      {/* ── HERO ──────────────────────────────────────────────────── */}
      <section className="relative -mt-16 min-h-screen flex items-end overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src={heroPhoto?.url ?? FALLBACK_IMG}
            alt="Van aménagé à Hossegor face aux vagues de l'Atlantique"
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
              <li className="text-white/80">Hossegor</li>
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
              Location van aménagé{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4BC3E3] to-[#4D5FEC]">
                à Hossegor
              </span>
            </h1>

            <p className="text-xl text-white/75 leading-relaxed mb-8 max-w-xl">
              La Gravière, Les Estagnots, forêt landaise... Hossegor est le temple du surf
              européen. Départ Cambo-les-Bains — 45 min par l&apos;autoroute.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/location#nos-vans"
                className="btn-shine inline-flex items-center justify-center gap-2 bg-white text-slate-900 font-bold px-8 py-4 rounded-xl hover:bg-blue-50 transition-colors text-lg shadow-2xl"
              >
                Voir nos vans disponibles
              </Link>
              <a
                href="https://www.yescapa.fr/campers/98869"
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
              { icon: "📍", text: "Départ Cambo-les-Bains — 45 min d'Hossegor" },
              { icon: "🛡️", text: "Assurance tous risques incluse" },
              { icon: "💰", text: "Dès 65€/nuit" },
              {
                icon: "⭐",
                text: `${placeStats.ratingDisplay}/5 sur ${placeStats.reviewCount} avis Google`,
              },
              { icon: "🏄", text: "Conseil spots surf offert" },
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
              À faire à Hossegor
            </span>
            <h2 className="text-4xl font-black text-slate-900 mb-3">
              Pourquoi louer un van à Hossegor ?
            </h2>
            <p className="text-slate-500 text-lg max-w-xl mx-auto">
              Hossegor, c&apos;est l&apos;Atlantique brut, la forêt landaise et une culture surf unique
              en Europe. En van, réveillez-vous face aux vagues et choisissez votre spot selon
              la marée.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activities.map((activity) => (
              <div
                key={activity.title}
                className="relative rounded-2xl overflow-hidden h-64 group cursor-default"
              >
                <Image
                  src={activity.photo?.url ?? FALLBACK_IMG}
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
              Itinéraire week-end à Hossegor en van
            </h2>
            <p className="text-slate-500 text-lg max-w-xl mx-auto">
              Deux nuits, trois jours — surf, forêt, coucher de soleil. Le programme parfait
              pour vivre Hossegor comme un local, depuis votre van.
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
        title="Infos pratiques — Hossegor en van"
        image={XALBAT_IMG}
        imageAlt="Van Xalbat Vanzon Explorer en route vers Hossegor"
        rows={[
          {
            label: "Récupération",
            value: "Cambo-les-Bains (45 min) ou livraison Hossegor sur demande",
          },
          {
            label: "Bivouac",
            value: "Parking des Estagnots (toléré hors saison) — accès direct à la plage",
          },
          {
            label: "Meilleure saison",
            value: "Septembre–Octobre — vagues de qualité, moins de monde",
          },
          {
            label: "Tarif",
            value: "Dès 65€/nuit — rack vélo disponible en option",
          },
          {
            label: "Équipement surf",
            value: "Planches jusqu'à 7' acceptées à l'intérieur, sangles de toit fournies",
          },
          {
            label: "Distances",
            value: "Biarritz 45 min, Bayonne 40 min, Bordeaux 1h30",
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
            À 45 min d&apos;Hossegor. Remise des clés sur place, parking gratuit.
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
              title="Cambo-les-Bains — Point de départ vers Hossegor"
            />
          </div>
        </div>
      </section>

      {/* ── VAN SELECTION ─────────────────────────────────────────── */}
      <VanSelectionSection destination="Hossegor" />

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
              Questions fréquentes — Location van Hossegor
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
            La Gravière vous attend.
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
