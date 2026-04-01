import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { sanityFetch } from "@/lib/sanity/client";
import { getAllLocationVansQuery } from "@/lib/sanity/queries";
import type { VanCard as VanCardType } from "@/lib/sanity/types";
import VanCard from "@/components/van/VanCard";
import { getGooglePlaceStats } from "@/lib/google-places";
import OtherServices from "@/components/ui/OtherServices";
import RoadTripCTA from "@/components/ui/RoadTripCTA";
import LiquidButton from "@/components/ui/LiquidButton";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Vanzon Explorer — Location, Achat & Formation Van Aménagé | Pays Basque",
  description:
    "Location de vans aménagés dès 65€/nuit, achat de fourgons aménagés et formation vanlife au Pays Basque. Biarritz, Bayonne, Hossegor — vivez le Pays Basque en liberté avec Vanzon Explorer.",
  alternates: {
    canonical: "https://vanzonexplorer.com/",
  },
  openGraph: {
    title: "Vanzon Explorer — Location, Achat & Formation Van Aménagé | Pays Basque",
    description: "Location de vans aménagés dès 65€/nuit, achat et formation vanlife au Pays Basque. Assurance incluse.",
    url: "https://vanzonexplorer.com/",
    images: [
      {
        url: "https://cdn.sanity.io/images/lewexa74/production/d445397965472d300e3dc13d6b1c37503fe8ba25-1920x1080.png?auto=format&q=82",
        width: 1920,
        height: 1080,
        alt: "Van aménagé au bord de l'océan au Pays Basque — Vanzon Explorer",
      },
    ],
  },
};

const destMeta = [
  {
    href: "/location/biarritz",
    label: "Biarritz",
    emoji: "🌊",
    desc: "Surf, plages et couchers de soleil",
    img: "https://www.destination-biarritz.fr/app/uploads/2024/05/img-1959.webp",
  },
  {
    href: "/location/hossegor",
    label: "Hossegor",
    emoji: "🏄",
    desc: "La Mecque du surf européen",
    img: "https://hossegor-surf.fr/wp-content/uploads/2022/04/vague-hossegor.jpeg",
  },
  {
    href: "/location/bayonne",
    label: "Bayonne",
    emoji: "🏰",
    desc: "Culture basque et gastronomie",
    img: "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/14/99/72/c2/les-tours-jumelles-de.jpg?w=1200&h=1200&s=1",
  },
  {
    href: "/location/saint-jean-de-luz",
    label: "Saint-Jean-de-Luz",
    emoji: "⛵",
    desc: "Village basque face à l'océan",
    img: "https://www.saint-jean-de-luz.com/wp-content/uploads/2021/04/p1190705-1600x690.jpg",
  },
  {
    href: "/location/week-end",
    label: "Week-end",
    emoji: "🗓️",
    desc: "2 nuits au minimum, idée d'itinéraire incluse",
    img: "https://www.vanlifemag.fr/wp-content/uploads/2020/12/AdobeStock_369527107.jpg",
  },
  {
    href: "/location/foret-irati",
    label: "Forêt d'Irati",
    emoji: "🌲",
    desc: "Bivouac, randonnée et nature sauvage",
    img: "https://media.sudouest.fr/16227503/1000x625/sudouest-photo-1-3807448-1600.jpg?v=1754848800",
  },
];

function getSeasonLabel(): string {
  const month = new Date().getMonth(); // 0-11
  if (month >= 5 && month <= 8) return "Vans disponibles cet été";
  if (month >= 9 && month <= 10) return "Vans disponibles cet automne";
  if (month >= 11 || month <= 1) return "Vans disponibles cet hiver";
  return "Vans disponibles ce printemps";
}

export default async function HomePage() {
  const [vans, placeStats] = await Promise.all([
    sanityFetch<VanCardType[]>(getAllLocationVansQuery),
    getGooglePlaceStats(),
  ]);

  return (
    <>
      <section className="relative -mt-16 min-h-[620px] lg:min-h-screen flex items-start lg:items-end overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="https://cdn.sanity.io/images/lewexa74/production/d445397965472d300e3dc13d6b1c37503fe8ba25-1920x1080.png?auto=format&fit=max&q=82"
            alt="Van aménagé au bord de l'océan au Pays Basque"
            fill
            sizes="100vw"
            className="object-cover object-[60%_center] sm:object-center"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-900/55 to-slate-900/10" />
          <div className="absolute inset-0 bg-gradient-to-r from-blue-950/40 via-transparent to-transparent" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 pt-28 pb-14 lg:pb-20 lg:pt-32 w-full">
          <div className="max-w-2xl">
            <a
              href={`https://www.google.com/maps/place/?q=place_id:ChIJ7-3ASe0oTyQR6vNHg7YRicA`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-4 py-2 mb-8 transition-transform hover:scale-105 cursor-pointer"
            >
              <span className="text-amber-400">★★★★★</span>
              <span className="text-white/90 text-sm font-medium">{placeStats.reviewCount} avis Google • {placeStats.ratingDisplay}/5</span>
            </a>

            <h1 className="text-4xl sm:text-4xl md:text-6xl lg:text-7xl font-black text-white leading-[1.08] mb-7">
              Location Van Aménagé<br />
              au Pays Basque,<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4BC3E3] to-[#4D5FEC]">
                à votre rythme.
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-white/75 leading-relaxed mb-10 max-w-xl">
              Louez un van aménagé tout équipé et explorez l&apos;Atlantique,
              les Pyrénées et les villages basques en totale liberté.
            </p>

            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex w-full sm:w-auto">
                <LiquidButton href="/location" variant="blue" size="responsive" fullWidth>
                  Louer un van
                </LiquidButton>
              </div>
              <div className="flex w-full sm:w-auto">
                <LiquidButton href="/achat" variant="slate" size="responsive" shineDelay={1.9} fullWidth>
                  Acheter un van →
                </LiquidButton>
              </div>
            </div>
          </div>

          <div className="hidden lg:flex gap-4 absolute bottom-20 right-6">
            {[
              { value: "65€", label: "/ nuit", sub: "à partir de" },
              { value: "2", label: "vans", sub: "exclusifs" },
              { value: `${placeStats.ratingDisplay}★`, label: "Google", sub: `${placeStats.reviewCount} avis` },
            ].map((stat) => (
              <div key={stat.label} className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-5 py-4 text-center min-w-[100px]">
                <div className="text-xs text-white/60 font-medium mb-0.5">{stat.sub}</div>
                <div className="text-2xl font-black text-white">{stat.value}</div>
                <div className="text-xs text-white/70 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        <a href="#nos-vans" className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 text-white/50 hover:text-white/80 transition-colors animate-bounce">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </a>
      </section>

      <section className="hidden sm:block bg-slate-950 py-5 border-t border-white/5">
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex flex-wrap justify-center md:justify-between items-center gap-y-4 gap-x-8 text-white/60 text-sm font-medium">
            {[
              { icon: "🛡️", text: "Assurance incluse via Yescapa" },
              { icon: "📍", text: "Basé au Pays Basque" },
              { icon: "⭐", text: `${placeStats.ratingDisplay}/5 sur ${placeStats.reviewCount} avis Google` },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-2">
                <span>{item.icon}</span>
                <span>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="nos-vans" className="py-20 bg-white scroll-mt-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <span className="badge-glass !px-4 !py-1.5 text-sm font-semibold mb-4 inline-block text-blue-500">
              🚐 Nos vans
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-3">
              Une liberté totale
            </h2>
            <p className="text-slate-500 text-lg">
              Choisissez votre compagnon de route pour explorer le Pays Basque.
            </p>
          </div>

          {vans && vans.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
              {vans.map((van) => (
                <VanCard key={van._id} van={van} mode="location" />
              ))}
            </div>
          ) : (
            <p className="text-center text-slate-400">Vans bientôt disponibles.</p>
          )}
        </div>
      </section>

      <section className="py-10 bg-white">
        <div className="max-w-3xl mx-auto px-6">
          <div className="glass-card p-6 flex items-start gap-5">
            <div className="flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center text-2xl" style={{ background: "rgba(232,67,108,0.10)" }}>
              🛡️
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base mb-1">Assurance tous risques</h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                Vous êtes couverts dès la réservation avec l&apos;
                <a
                  href="https://www.yescapa.fr/aide/assurance-et-assistance-24-7-locataire/comment-fonctionne-lassurance/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent-blue underline decoration-dotted underline-offset-2 hover:opacity-80 transition-opacity"
                >
                  assurance de la plateforme Yescapa
                </a>
                {" "}— assurance tous risques incluse pour rouler l&apos;esprit tranquille, sans frais cachés.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <span className="badge-glass !px-4 !py-1.5 text-sm font-semibold mb-5 inline-block" style={{ color: '#4D5FEC' }}>
                📍 La destination
              </span>
              <h2 className="text-4xl font-black text-slate-900 mb-6 leading-tight">
                Le Pays Basque,<br />
                terrain de jeu idéal<br />
                pour la vanlife.
              </h2>
              <p className="text-slate-500 text-lg leading-relaxed mb-8">
                De l&apos;Atlantique aux Pyrénées en moins d&apos;une heure — le Pays Basque
                concentre tout ce qu&apos;on aime : des vagues parfaites, des villages
                authentiques, une gastronomie unique et des paysages magnifiques.
              </p>

              <div className="space-y-4">
                {[
                  { icon: "🌊", label: "Biarritz & la Côte des Basques", desc: "Les spots de surf les plus célèbres de France" },
                  { icon: "⛰️", label: "La Rhune & les Pyrénées", desc: "Bivouacs légaux avec vue sur deux pays" },
                  { icon: "🍷", label: "Saint-Jean-de-Luz & Espelette", desc: "Marchés, pintxos et vins basques" },
                  { icon: "🌲", label: "Forêt d'Irati", desc: "La plus grande hêtraie d'Europe à votre portée" },
                ].map((spot) => (
                  <div key={spot.label} className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                    <span className="text-2xl mt-0.5">{spot.icon}</span>
                    <div>
                      <div className="font-semibold text-slate-800">{spot.label}</div>
                      <div className="text-sm text-slate-500">{spot.desc}</div>
                    </div>
                  </div>
                ))}
              </div>

              <a
                href="/road-trip-pays-basque-van"
                className="inline-flex items-center gap-2 mt-6 text-sm font-semibold transition-colors"
                style={{ color: "#4D5FEC" }}
              >
                Voir l&apos;itinéraire road trip 7 jours →
              </a>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Panorama pleine largeur */}
              <div className="relative col-span-2 aspect-[16/7] rounded-3xl overflow-hidden shadow-lg">
                <Image
                  src="https://cdn.sanity.io/images/lewexa74/production/0b3f81d08627ba0b4423224029cb5016d0e7ed25-2048x1365.jpg?auto=format&q=82"
                  alt="Paysage Pays Basque en van"
                  fill
                  sizes="(max-width: 768px) 100vw, calc(50vw + 200px)"
                  className="object-cover hover:scale-105 transition-transform duration-700"
                />
              </div>
              {/* 2 images côte à côte */}
              <div className="relative aspect-[4/3] rounded-3xl overflow-hidden shadow-lg">
                <Image
                  src="https://cdn.sanity.io/images/lewexa74/production/7e04357061492ab4193c49d03351310cf245a106-1540x976.png?auto=format&q=82"
                  alt="Van aménagé Vanzon Explorer"
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover hover:scale-105 transition-transform duration-700"
                />
              </div>
              <div className="relative aspect-[4/3] rounded-3xl overflow-hidden shadow-lg">
                <Image
                  src="https://cdn.sanity.io/images/lewexa74/production/4ee40c1abb03d029487868808a159216a641e3ad-3829x2872.jpg?auto=format&q=82"
                  alt="Van life Pays Basque"
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover hover:scale-105 transition-transform duration-700"
                />
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* ── OÙ PARTIR EN VAN ──────────────────────────────────────── */}
      <section className="py-20" style={{ background: "linear-gradient(160deg, #EFF6FF 0%, #F0FDFF 100%)" }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <span className="badge-glass !px-4 !py-1.5 text-sm font-semibold mb-4 inline-block" style={{ color: "#4D5FEC" }}>
              🗺️ Les destinations
            </span>
            <h2 className="text-4xl font-black text-slate-900 mb-3">
              Où partir en van au Pays Basque ?
            </h2>
            <p className="text-slate-500 text-lg max-w-xl mx-auto">
              De l&apos;Atlantique aux Pyrénées, chaque destination a ses spots secrets.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {destMeta.map((dest) => (
              <Link
                key={dest.href}
                href={dest.href}
                className="group relative rounded-2xl overflow-hidden aspect-[4/3] block"
              >
                <Image
                  src={dest.img}
                  alt={`Van au Pays Basque — ${dest.label}`}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
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

      <section className="py-20" style={{ background: "linear-gradient(160deg, #F8FAFC 0%, #EFF6FF 100%)" }}>
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <span className="badge-glass !px-4 !py-1.5 text-sm text-amber-600 font-semibold mb-4 inline-block">
              ⭐ Avis clients
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-2">
              Ce qu&apos;ils en disent
            </h2>
            <a
              href="https://maps.app.goo.gl/NqyLKueJCSzukQei7"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium transition-colors"
              style={{ color: '#4D5FEC' }}
            >
              {placeStats.reviewCount} avis Google Maps • Voir tous les avis →
            </a>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {[
              {
                name: "Joris Darnanville",
                detail: "Van super bien équipé, exactement comme décrit. Jules est disponible et de bons conseils. On recommande !",
                initials: "J",
                color: "bg-blue-500",
              },
              {
                name: "Mathilde Sehil",
                detail: "Un weekend parfait au Pays Basque. Le van est propre, bien rangé et très pratique. On a adoré la cuisine coulissante.",
                initials: "M",
                color: "bg-purple-500",
              },
              {
                name: "Aurélie CEDELLE",
                detail: "Tout est optimisé pour un séjour parfait. Rien à redire, on repart l'année prochaine avec les enfants !",
                initials: "A",
                color: "bg-teal-500",
              },
            ].map((review) => (
              <div key={review.name} className="glass-card p-6">
                <div className="flex items-center gap-1 text-amber-400 mb-4">
                  {[...Array(5)].map((_, i) => <span key={i}>★</span>)}
                </div>
                <p className="text-slate-700 font-medium mb-2 text-sm leading-relaxed">
                  &ldquo;{review.detail}&rdquo;
                </p>
                <div className="flex items-center gap-3 mt-4 pt-4 border-t border-slate-100">
                  <div className={`w-9 h-9 rounded-full ${review.color} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
                    {review.initials}
                  </div>
                  <div>
                    <div className="font-semibold text-slate-800 text-sm">{review.name}</div>
                    <div className="text-xs text-slate-400">Client Google Maps</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════
          VAN BUSINESS ACADEMY
      ════════════════════════════════════════════════ */}
      <section className="bg-white py-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">

            {/* Texte gauche */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest bg-amber-50 border border-amber-200 text-amber-700">
                  🎓 Formation
                </span>
                <span className="text-slate-400 text-xs font-medium">100% en ligne</span>
              </div>

              <h2 className="text-4xl md:text-5xl font-black text-slate-900 leading-tight mb-4">
                Van Business<br />
                <span className="bg-clip-text text-transparent" style={{ backgroundImage: "linear-gradient(135deg, #B9945F 0%, #E4D398 100%)" }}>
                  Academy
                </span>
              </h2>

              <p className="text-slate-500 text-lg leading-relaxed mb-8 max-w-md">
                De zéro à la location rentable. Jules et Elio vous accompagnent dans l&apos;achat du fourgon, l&apos;aménagement, l&apos;homologation VASP et comment gérer des revenus avec votre van.
              </p>

              <div className="grid grid-cols-3 gap-4 mb-10">
                {[
                  { value: "8", label: "semaines" },
                  { value: "A→Z", label: "aménagement" },
                  { value: "100%", label: "en ligne" },
                ].map((s) => (
                  <div key={s.label} className="text-center p-4 rounded-2xl bg-slate-50 border border-slate-100">
                    <div className="text-2xl font-black text-slate-900 leading-none mb-1">{s.value}</div>
                    <div className="text-xs text-slate-500 font-medium">{s.label}</div>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <div className="w-full sm:w-auto">
                  <LiquidButton href="/formation" variant="gold" size="lg" fullWidth>
                    Découvrir la formation →
                  </LiquidButton>
                </div>
                <a
                  href="/formation#programme"
                  className="flex items-center justify-center gap-2 bg-slate-100 text-slate-700 font-semibold px-6 py-4 rounded-2xl text-sm hover:bg-slate-200 transition-colors w-full sm:w-auto"
                >
                  Voir le programme
                </a>
              </div>
            </div>

            {/* Image droite */}
            <div className="relative flex items-center justify-center">
              <Image
                src="https://cdn.sanity.io/images/lewexa74/production/e8d8a66703e846a5bd916e38bd9a488b663ce433-1920x1080.png?auto=format&q=82"
                alt="Van Business Academy — Formation vanlife aménagement"
                width={960}
                height={540}
                className="w-full h-auto"
              />
            </div>

          </div>
        </div>
      </section>

      <section className="relative py-28 overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="https://cdn.sanity.io/images/lewexa74/production/e9664378c5fdc652c33ae7342dfc52cc4960c8bf-1080x750.png?auto=format&q=82"
            alt="Van Xalbat Vanzon Explorer"
            fill
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(15,21,58,0.92) 0%, rgba(77,95,236,0.6) 100%)" }} />
        </div>

        <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-4 py-2 mb-6">
            <span className="text-green-400">●</span>
            <span className="text-white/90 text-sm font-medium">{getSeasonLabel()}</span>
          </div>

          <h2 className="text-4xl md:text-5xl font-black text-white mb-5 leading-tight">
            Votre prochaine aventure<br />
            commence ici.
          </h2>
          <p className="text-white/70 text-xl mb-10 leading-relaxed">
            À partir de <strong className="text-white">65€/nuit</strong> — assurance incluse, van tout équipé.
          </p>

          <div className="flex flex-row justify-center gap-2 sm:gap-3">
            <LiquidButton href="/location" variant="blue" size="responsive">
              Louer un van
            </LiquidButton>
            <LiquidButton href="/achat" variant="slate" size="responsive" shineDelay={1.9}>
              Acheter un van →
            </LiquidButton>
          </div>

          <p className="text-white/40 text-sm mt-6">
            Questions ? <Link href="/contact" className="text-white/60 hover:text-white underline underline-offset-2 transition-colors">Contactez-nous ici</Link>
          </p>
        </div>
      </section>

      <RoadTripCTA />
      <OtherServices current="location" bgColor="#F8FAFC" />
    </>
  );
}
