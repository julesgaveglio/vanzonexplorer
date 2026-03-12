import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { sanityFetch } from "@/lib/sanity/client";
import { getAllLocationVansQuery } from "@/lib/sanity/queries";
import type { VanCard as VanCardType } from "@/lib/sanity/types";
import VanCard from "@/components/van/VanCard";

const BASE_URL = "https://vanzonexplorer.com";

export const metadata: Metadata = {
  title: "Location Van Aménagé Pays Basque — dès 65€/nuit | Vanzon Explorer",
  description:
    "Louez un van aménagé tout équipé au Pays Basque dès 65€/nuit. Départ Bayonne, assurance tous risques incluse. Surf, montagne, road trip — explorez librement avec Vanzon Explorer.",
  alternates: {
    canonical: `${BASE_URL}/location`,
  },
  openGraph: {
    title: "Location Van Aménagé Pays Basque — dès 65€/nuit",
    description:
      "Vans aménagés tout équipés au Pays Basque. Assurance incluse, départ Bayonne. Idéal surf, road trip, vanlife.",
    url: `${BASE_URL}/location`,
    type: "website",
    locale: "fr_FR",
    siteName: "Vanzon Explorer",
  },
};

const faqItems = [
  {
    q: "Quel est le prix de la location d'un van aménagé au Pays Basque ?",
    a: "Nos vans sont disponibles dès 65€/nuit, assurance tous risques incluse. Le tarif varie selon la saison et la durée de location. Pas de frais cachés — tout est compris.",
  },
  {
    q: "L'assurance est-elle incluse dans le prix ?",
    a: "Oui, l'assurance tous risques est incluse dans le prix de location. Vous partez l'esprit tranquille, sans franchise surprenante.",
  },
  {
    q: "Les animaux de compagnie sont-ils acceptés ?",
    a: "Oui, les animaux de compagnie sont acceptés sous conditions. Contactez-nous avant votre réservation pour en discuter.",
  },
  {
    q: "Quelle est la durée minimum de location ?",
    a: "La durée minimum est de 2 nuits (week-end). Nous recommandons 4 à 7 jours pour profiter pleinement du Pays Basque.",
  },
  {
    q: "Où récupère-t-on le van ?",
    a: "Le van se récupère à Bayonne (Pays Basque). La livraison sur Biarritz, Anglet ou Hossegor est possible sur demande, selon disponibilités.",
  },
];

const destinations = [
  {
    href: "/location/biarritz",
    label: "Biarritz",
    emoji: "🌊",
    desc: "Surf, plages et couchers de soleil",
    img: "https://cdn.sanity.io/images/lewexa74/production/f93fa16ab46d8934dcc3092a8e86fc80ebce4305-1080x750.png",
  },
  {
    href: "/location/hossegor",
    label: "Hossegor",
    emoji: "🏄",
    desc: "La Mecque du surf européen",
    img: "https://cdn.sanity.io/images/lewexa74/production/660105a28e577c33f642a8fdff528d88925642e3-1080x750.png",
  },
  {
    href: "/location/bayonne",
    label: "Bayonne",
    emoji: "🏰",
    desc: "Culture basque et gastronomie",
    img: "https://cdn.sanity.io/images/lewexa74/production/f93fa16ab46d8934dcc3092a8e86fc80ebce4305-1080x750.png",
  },
  {
    href: "/location/saint-jean-de-luz",
    label: "Saint-Jean-de-Luz",
    emoji: "⛵",
    desc: "Village basque face à l'océan",
    img: "https://cdn.sanity.io/images/lewexa74/production/660105a28e577c33f642a8fdff528d88925642e3-1080x750.png",
  },
  {
    href: "/location/week-end",
    label: "Week-end",
    emoji: "🗓️",
    desc: "2 nuits au minimum, idée d'itinéraire incluse",
    img: "https://cdn.sanity.io/images/lewexa74/production/f93fa16ab46d8934dcc3092a8e86fc80ebce4305-1080x750.png",
  },
  {
    href: "/articles/foret-irati-van",
    label: "Forêt d'Irati",
    emoji: "🌲",
    desc: "Bivouac, randonnée et nature sauvage",
    img: "https://cdn.sanity.io/images/lewexa74/production/660105a28e577c33f642a8fdff528d88925642e3-1080x750.png",
  },
];

const whyItems = [
  {
    icon: "🛡️",
    title: "Assurance tous risques incluse",
    desc: "Pas de franchise surprise. Partez l'esprit libre, on gère l'administratif.",
  },
  {
    icon: "🔧",
    title: "Vans 100% équipés",
    desc: "Cuisine coulissante, literie, douche, électricité solaire — prêt à partir.",
  },
  {
    icon: "📍",
    title: "Basé au Pays Basque",
    desc: "On connaît chaque spot, chaque parking, chaque coin secret de la région.",
  },
  {
    icon: "📞",
    title: "Support 7j/7",
    desc: "Un problème sur la route ? On répond, en français, tous les jours.",
  },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqItems.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.a,
    },
  })),
};

export default async function LocationPage() {
  const vans = await sanityFetch<VanCardType[]>(getAllLocationVansQuery) ?? [];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      {/* ── Hero ── */}
      <section className="relative min-h-[80vh] flex items-end overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="https://cdn.sanity.io/images/lewexa74/production/f93fa16ab46d8934dcc3092a8e86fc80ebce4305-1080x750.png"
            alt="Van aménagé au Pays Basque face à l'Atlantique"
            fill
            className="object-cover object-center"
            priority
            unoptimized
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/92 via-slate-900/55 to-slate-900/10" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 pb-20 pt-32 w-full">
          <nav aria-label="Fil d'Ariane" className="mb-6">
            <ol className="flex items-center gap-2 text-white/50 text-xs font-medium">
              <li><Link href="/" className="hover:text-white/80 transition-colors">Accueil</Link></li>
              <li>›</li>
              <li className="text-white/80">Location</li>
            </ol>
          </nav>

          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-4 py-2 mb-6">
              <span className="text-amber-400">★★★★★</span>
              <span className="text-white/90 text-sm font-medium">4.9/5 · 33 avis Google · Départ Bayonne</span>
            </div>

            <h1 className="text-5xl md:text-6xl font-black text-white leading-tight mb-6">
              Location van aménagé<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4BC3E3] to-[#4D5FEC]">
                au Pays Basque
              </span>
            </h1>

            <p className="text-xl text-white/75 leading-relaxed mb-8">
              Vans tout équipés, assurance incluse, départ Bayonne.
              Surf, montagne, road trip — explorez le Pays Basque en toute liberté dès <strong className="text-white">65€/nuit</strong>.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href="#nos-vans"
                className="inline-flex items-center justify-center gap-2 bg-white text-slate-900 font-bold px-8 py-4 rounded-xl hover:bg-blue-50 transition-colors text-lg shadow-2xl"
              >
                Voir nos vans disponibles
              </a>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 bg-white/10 backdrop-blur-md border border-white/30 text-white font-bold px-8 py-4 rounded-xl hover:bg-white/20 transition-colors text-lg"
              >
                Nous contacter →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Barre de réassurance ── */}
      <section className="bg-slate-950 py-5 border-t border-white/5">
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex flex-wrap justify-center md:justify-between items-center gap-y-4 gap-x-8 text-white/60 text-sm font-medium">
            {[
              { icon: "📍", text: "Départ Bayonne, Pays Basque" },
              { icon: "🛡️", text: "Assurance tous risques incluse" },
              { icon: "💰", text: "Dès 65€/nuit" },
              { icon: "⭐", text: "4.9/5 sur 33 avis Google" },
              { icon: "🔑", text: "Livraison possible à Biarritz" },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-2">
                <span>{item.icon}</span>
                <span>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Nos vans ── */}
      <section id="nos-vans" className="py-20 bg-white scroll-mt-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <span className="badge-glass !px-4 !py-1.5 text-sm font-semibold mb-4 inline-block" style={{ color: "#4D5FEC" }}>
              Nos vans
            </span>
            <h2 className="text-4xl font-black text-slate-900 mb-3">
              Choisissez votre van
            </h2>
            <p className="text-slate-500 text-lg max-w-xl mx-auto">
              Deux vans aménagés avec soin, tout équipés pour partir à l&apos;aventure au Pays Basque.
            </p>
          </div>

          {vans.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {vans.map((van) => (
                <VanCard key={van._id} van={van} mode="location" />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-400">
              <p className="text-lg">Vans en cours de chargement…</p>
            </div>
          )}
        </div>
      </section>

      {/* ── Destinations ── */}
      <section className="py-20" style={{ background: "linear-gradient(160deg, #EFF6FF 0%, #F0FDFF 100%)" }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <span className="badge-glass !px-4 !py-1.5 text-sm font-semibold mb-4 inline-block" style={{ color: "#4D5FEC" }}>
              Destinations
            </span>
            <h2 className="text-4xl font-black text-slate-900 mb-3">
              Où partir en van au Pays Basque ?
            </h2>
            <p className="text-slate-500 text-lg max-w-xl mx-auto">
              De l&apos;Atlantique aux Pyrénées — chaque destination a ses spots secrets.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {destinations.map((dest) => (
              <Link
                key={dest.href}
                href={dest.href}
                className="group relative rounded-2xl overflow-hidden aspect-[4/3] block"
              >
                <Image
                  src={dest.img}
                  alt={`Van au Pays Basque — ${dest.label}`}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  unoptimized
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/30 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <p className="text-2xl mb-1">{dest.emoji}</p>
                  <h3 className="text-white font-black text-xl leading-tight">{dest.label}</h3>
                  <p className="text-white/70 text-sm mt-1">{dest.desc}</p>
                </div>
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="bg-white/20 backdrop-blur-md text-white text-xs font-semibold px-3 py-1.5 rounded-full border border-white/30">
                    Découvrir →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pourquoi Vanzon ── */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-4xl font-black text-slate-900 mb-3">
              Pourquoi louer avec Vanzon Explorer ?
            </h2>
            <p className="text-slate-500 text-lg max-w-xl mx-auto">
              Une agence locale, des vans bien préparés, et une vraie connaissance du terrain.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {whyItems.map((item) => (
              <div key={item.title} className="glass-card p-6 text-center hover:shadow-glass-hover transition-all duration-300">
                <div className="text-4xl mb-4">{item.icon}</div>
                <h3 className="font-bold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-20" style={{ background: "linear-gradient(160deg, #F8FAFC 0%, #EFF6FF 100%)" }}>
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black text-slate-900 mb-3">
              Questions fréquentes
            </h2>
            <p className="text-slate-500 text-lg">
              Tout ce qu&apos;il faut savoir avant de louer un van au Pays Basque.
            </p>
          </div>

          <div className="space-y-3">
            {faqItems.map((item) => (
              <details
                key={item.q}
                className="group bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
              >
                <summary className="flex items-center justify-between gap-4 px-6 py-5 cursor-pointer list-none select-none">
                  <span className="font-semibold text-slate-900 text-base">{item.q}</span>
                  <span className="flex-shrink-0 w-7 h-7 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 group-open:rotate-180 transition-transform duration-200 text-sm font-bold">
                    ↓
                  </span>
                </summary>
                <div className="px-6 pb-5 text-slate-600 text-sm leading-relaxed border-t border-slate-50 pt-4">
                  {item.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA final ── */}
      <section className="relative py-28 overflow-hidden">
        <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, #0F153A 0%, #1e2d6b 100%)" }} />
        <div className="absolute inset-0 opacity-20">
          <Image
            src="https://cdn.sanity.io/images/lewexa74/production/660105a28e577c33f642a8fdff528d88925642e3-1080x750.png"
            alt=""
            fill
            className="object-cover"
            unoptimized
          />
        </div>
        <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-5 leading-tight">
            Prêt à explorer<br />le Pays Basque en van ?
          </h2>
          <p className="text-white/70 text-xl mb-10">
            Dès <strong className="text-white">65€/nuit</strong> — assurance incluse, van tout équipé,
            récupération à Bayonne.
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
            <Link href="/road-trip-pays-basque-van" className="hover:text-white/60 transition-colors underline underline-offset-2">
              Voir notre itinéraire road trip Pays Basque →
            </Link>
          </p>
        </div>
      </section>
    </>
  );
}
