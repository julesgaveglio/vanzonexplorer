import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { sanityFetch } from "@/lib/sanity/client";
import { getAllLocationVansQuery } from "@/lib/sanity/queries";
import type { VanCard as VanCardType } from "@/lib/sanity/types";
import VanCard from "@/components/van/VanCard";
import { getGooglePlaceStats } from "@/lib/google-places";
import OtherServices from "@/components/ui/OtherServices";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Location Van Aménagé Pays Basque — dès 65€/nuit | Vanzon Explorer",
  description:
    "Louez un van aménagé au Pays Basque dès 65€/nuit. Biarritz, Bayonne, Hossegor — vans tout équipés, assurance incluse, réservation simple. Surf, montagne, océan — vivez le Pays Basque en liberté.",
  alternates: {
    canonical: "https://vanzonexplorer.com/",
  },
};

export default async function HomePage() {
  const [vans, placeStats] = await Promise.all([
    sanityFetch<VanCardType[]>(getAllLocationVansQuery),
    getGooglePlaceStats(),
  ]);

  return (
    <>
      <section className="relative -mt-16 min-h-screen flex items-end overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="https://cdn.sanity.io/images/lewexa74/production/d445397965472d300e3dc13d6b1c37503fe8ba25-1920x1080.png?auto=format&fit=max&q=82"
            alt="Van aménagé au bord de l'océan au Pays Basque"
            fill
            className="object-cover object-center sm:object-center object-right"
            priority
            unoptimized
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-900/50 to-slate-900/20" />
          <div className="absolute inset-0 bg-gradient-to-r from-blue-950/30 via-transparent to-transparent" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 pb-20 pt-32 w-full">
          <div className="max-w-2xl">
            <a
              href={`https://www.google.com/maps/place/?q=place_id:ChIJ7-3ASe0oTyQR6vNHg7YRicA`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-4 py-2 mb-6 transition-transform hover:scale-105 cursor-pointer"
            >
              <span className="text-amber-400">★★★★★</span>
              <span className="text-white/90 text-sm font-medium">{placeStats.reviewCount} avis Google • {placeStats.ratingDisplay}/5</span>
            </a>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-white leading-[1.05] mb-6">
              L&apos;aventure<br />
              au Pays Basque,<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4BC3E3] to-[#4D5FEC]">
                à votre rythme.
              </span>
            </h1>

            <p className="text-xl text-white/75 leading-relaxed mb-8 max-w-xl">
              Louez un van aménagé tout équipé et explorez l&apos;Atlantique,
              les Pyrénées et les villages basques en totale liberté.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href="/location"
                className="btn-shine inline-flex items-center justify-center gap-2 bg-white text-slate-900 font-bold px-8 py-4 rounded-xl hover:bg-blue-50 transition-colors text-lg shadow-2xl"
              >
                Louer un van
              </a>
              <a
                href="/achat"
                className="inline-flex items-center justify-center gap-2 bg-white/10 backdrop-blur-md border border-white/30 text-white font-bold px-8 py-4 rounded-xl hover:bg-white/20 transition-colors text-lg"
              >
                Acheter un van →
              </a>
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

      <section className="bg-slate-950 py-5 border-t border-white/5">
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
                Vous êtes couverts dès la réservation avec l&apos;assurance de la plateforme Yescapa — assurance tous risques incluse pour rouler l&apos;esprit tranquille, sans frais cachés.
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
                pour le vanlife.
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
                  src="https://cdn.sanity.io/images/lewexa74/production/0b3f81d08627ba0b4423224029cb5016d0e7ed25-2048x1365.jpg"
                  alt="Paysage Pays Basque en van"
                  fill
                  className="object-cover hover:scale-105 transition-transform duration-700"
                  unoptimized
                />
              </div>
              {/* 2 images côte à côte */}
              <div className="relative aspect-[4/3] rounded-3xl overflow-hidden shadow-lg">
                <Image
                  src="https://cdn.sanity.io/images/lewexa74/production/7e04357061492ab4193c49d03351310cf245a106-1540x976.png"
                  alt="Van aménagé Vanzon Explorer"
                  fill
                  className="object-cover hover:scale-105 transition-transform duration-700"
                  unoptimized
                />
              </div>
              <div className="relative aspect-[4/3] rounded-3xl overflow-hidden shadow-lg">
                <Image
                  src="https://cdn.sanity.io/images/lewexa74/production/4ee40c1abb03d029487868808a159216a641e3ad-3829x2872.jpg"
                  alt="Van life Pays Basque"
                  fill
                  className="object-cover hover:scale-105 transition-transform duration-700"
                  unoptimized
                />
              </div>
            </div>
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
                <span style={{ color: "#B9945F" }}>
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
                <a
                  href="/formation"
                  className="btn-gold inline-flex items-center justify-center gap-2 font-bold px-8 py-4 rounded-2xl text-base text-white"
                >
                  Découvrir la formation →
                </a>
                <a
                  href="/formation"
                  className="inline-flex items-center justify-center gap-2 bg-slate-100 text-slate-700 font-semibold px-6 py-4 rounded-2xl text-sm hover:bg-slate-200 transition-colors"
                >
                  Voir le programme
                </a>
              </div>
            </div>

            {/* Image droite */}
            <div className="relative flex items-center justify-center">
              <Image
                src="https://cdn.sanity.io/images/lewexa74/production/e8d8a66703e846a5bd916e38bd9a488b663ce433-1920x1080.png"
                alt="Van Business Academy — Formation vanlife aménagement"
                width={960}
                height={540}
                className="w-full h-auto"
                unoptimized
              />
            </div>

          </div>
        </div>
      </section>

      <section className="relative py-28 overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="https://cdn.sanity.io/images/lewexa74/production/e9664378c5fdc652c33ae7342dfc52cc4960c8bf-1080x750.png"
            alt="Van Xalbat Vanzon Explorer"
            fill
            className="object-cover"
            unoptimized
          />
          <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(15,21,58,0.92) 0%, rgba(77,95,236,0.6) 100%)" }} />
        </div>

        <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-4 py-2 mb-6">
            <span className="text-green-400">●</span>
            <span className="text-white/90 text-sm font-medium">Vans disponibles cet été</span>
          </div>

          <h2 className="text-4xl md:text-5xl font-black text-white mb-5 leading-tight">
            Votre prochaine aventure<br />
            commence ici.
          </h2>
          <p className="text-white/70 text-xl mb-10 leading-relaxed">
            À partir de <strong className="text-white">65€/nuit</strong> — assurance incluse, van tout équipé.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <a
              href="/location"
              className="btn-shine inline-flex items-center justify-center gap-2 bg-white text-slate-900 font-bold px-10 py-5 rounded-2xl hover:bg-blue-50 transition-colors text-lg shadow-2xl"
            >
              Louer un van
            </a>
            <a
              href="/achat"
              className="inline-flex items-center justify-center gap-2 bg-white/10 backdrop-blur-md border border-white/30 text-white font-bold px-10 py-5 rounded-2xl hover:bg-white/20 transition-colors text-lg"
            >
              Acheter un van
            </a>
          </div>

          <p className="text-white/40 text-sm mt-6">
            Questions ? <Link href="/contact" className="text-white/60 hover:text-white underline underline-offset-2 transition-colors">Contactez-nous ici</Link>
          </p>
        </div>
      </section>

      {vans && vans.length > 0 && (
        <section className="bg-[#F8FAFC] py-16">
          <div className="max-w-7xl mx-auto px-6">
            <h2 className="text-2xl font-bold text-slate-900 mb-8">Plus de vans disponibles</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {vans.map((van) => (
                <VanCard key={van._id} van={van} mode="location" />
              ))}
            </div>
          </div>
        </section>
      )}

      <OtherServices current="location" bgColor="#F8FAFC" />
    </>
  );
}
