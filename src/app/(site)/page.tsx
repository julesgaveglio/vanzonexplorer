import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import LiquidButton from "@/components/ui/LiquidButton";
import VanCard from "@/components/van/VanCard";
import { sanityFetch } from "@/lib/sanity/client";
import { getAllLocationVansQuery } from "@/lib/sanity/queries";
import type { VanCard as VanCardType } from "@/lib/sanity/types";
import { IconShield, IconPin, IconStar } from "@/components/ui/LineIcons";
import GoogleReviewsSection from "@/components/reviews/GoogleReviewsSection";
import { getGooglePlaceData } from "@/lib/google-places";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: { absolute: "Vanzon Explorer — Location & Achat Van Aménagé | Pays Basque" },
  description:
    "Location de vans aménagés dès 65€/nuit et achat au Pays Basque. Biarritz, Bayonne, Hossegor — vivez la liberté avec Vanzon Explorer.",
  alternates: {
    canonical: "https://vanzonexplorer.com/",
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "Vanzon Explorer — Location & Achat Van Aménagé | Pays Basque",
    description: "Location de vans aménagés dès 65€/nuit et achat au Pays Basque. Vivez la liberté avec Vanzon Explorer.",
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
    desc: "Surf, plages et couchers de soleil",
    img: "https://www.destination-biarritz.fr/app/uploads/2024/05/img-1959.webp",
  },
  {
    href: "/location/hossegor",
    label: "Hossegor",
    desc: "La Mecque du surf européen",
    img: "https://hossegor-surf.fr/wp-content/uploads/2022/04/vague-hossegor.jpeg",
  },
  {
    href: "/location/bayonne",
    label: "Bayonne",
    desc: "Culture basque et gastronomie",
    img: "https://dynamic-media-cdn.tripadvisor.com/media/photo-o/14/99/72/c2/les-tours-jumelles-de.jpg?w=1200&h=1200&s=1",
  },
  {
    href: "/location/saint-jean-de-luz",
    label: "Saint-Jean-de-Luz",
    desc: "Village basque face à l'océan",
    img: "https://www.saint-jean-de-luz.com/wp-content/uploads/2021/04/p1190705-1600x690.jpg",
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
  const [fleetVans, googlePlace] = await Promise.all([
    sanityFetch<VanCardType[]>(getAllLocationVansQuery).then((v) => v ?? []),
    getGooglePlaceData(),
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
              <span className="text-white/90 text-sm font-medium">
                {googlePlace?.reviewCount ?? 33} avis Google · {googlePlace?.ratingDisplay ?? "4.9"}/5
              </span>
            </a>

            <p className="text-white/60 text-sm sm:text-base font-medium italic mb-4">
              Rendre accessible à tous le goût de la liberté
            </p>

            <h1 className="text-4xl sm:text-4xl md:text-6xl lg:text-7xl font-black text-white leading-[1.08] mb-7">
              Location de <span className="bg-gradient-to-r from-blue-400 to-sky-300 bg-clip-text text-transparent">vans aménagés</span> au Pays Basque
            </h1>

            <p className="text-lg sm:text-xl text-white/75 leading-relaxed mb-10 max-w-xl">
              Louez un van tout équipé dès <strong className="text-white">65€/nuit</strong>, achetez
              un van révisé de notre flotte, ou formez-vous pour créer votre
              propre activité de location.
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
              {
                value: `${googlePlace?.ratingDisplay ?? "4.9"}★`,
                label: "Google",
                sub: `${googlePlace?.reviewCount ?? 33} avis`,
              },
            ].map((stat) => (
              <div key={stat.label} className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-5 py-4 text-center min-w-[100px]">
                <div className="text-xs text-white/60 font-medium mb-0.5">{stat.sub}</div>
                <div className="text-2xl font-black text-white">{stat.value}</div>
                <div className="text-xs text-white/70 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        <a href="#parcours" className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 text-white/50 hover:text-white/80 transition-colors animate-bounce">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </a>
      </section>

      <section className="hidden sm:block bg-slate-950 py-5 border-t border-white/5">
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex flex-wrap justify-center md:justify-between items-center gap-y-4 gap-x-8 text-white/60 text-sm font-medium">
            {[
              { icon: <IconShield />, text: "Assurance tous risques incluse" },
              { icon: <IconPin />, text: "Départ Cambo-les-Bains, Pays Basque" },
              {
                icon: <IconStar />,
                text: `${googlePlace?.ratingDisplay ?? "4.9"}/5 sur ${googlePlace?.reviewCount ?? 33} avis Google`,
              },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-2.5">
                <span className="text-white/40">{item.icon}</span>
                <span>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── NOS SERVICES — aiguillage éditorial des 3 cibles ── */}
      <section id="parcours" className="bg-white py-16 md:py-20 scroll-mt-20 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-2xl mb-10 md:mb-14">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">
              Nos services
            </p>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 leading-tight">
              Louer, acheter, ou créer votre propre activité de location.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-slate-200 rounded-2xl overflow-hidden border border-slate-200">
            {[
              {
                href: "/location",
                num: "01",
                title: "Louer un van",
                image: "/images/services/location.jpg",
                imageAlt: "Intérieur d'un van aménagé Vanzon face à une plage du Pays Basque",
                desc: "Vans tout équipés au départ de Cambo-les-Bains, à 25 minutes de Biarritz. Assurance tous risques incluse.",
                highlight: "Dès 65 € / nuit",
                cta: "Voir les vans disponibles",
              },
              {
                href: "/achat",
                num: "02",
                title: "Acheter un van",
                image: "/images/services/achat.jpg",
                imageAlt: "Renault Trafic aménagé Vanzon proposé à la vente",
                desc: "Des vans aménagés par nos soins, exploités en location puis revendus avec historique et carnet d'entretien complets.",
                highlight: "19 900 € — essai sur place",
                cta: "Voir les vans à vendre",
              },
              {
                href: "/formation",
                num: "03",
                title: "Créer votre business van",
                image: "/images/services/formation-amenagement-van-vanzon-explorer.jpg",
                imageAlt: "Aménagement d'un van en cours pendant la formation Van Business Academy de Vanzon Explorer",
                desc: "La méthode complète pour acheter, aménager et rentabiliser un van en location : la Van Business Academy.",
                highlight: "Formation 100 % en ligne",
                cta: "Découvrir la formation",
              },
            ].map((path) => (
              <Link
                key={path.href}
                href={path.href}
                className="group bg-white flex flex-col transition-colors duration-200 hover:bg-slate-50"
              >
                <div className="relative aspect-[16/10] w-full overflow-hidden">
                  <Image
                    src={path.image}
                    alt={path.imageAlt}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
                  />
                  <span className="absolute left-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-xs font-bold text-slate-900 shadow-sm backdrop-blur-sm">
                    {path.num}
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-8 md:p-10">
                  <h3 className="text-xl font-black text-slate-900 mb-3">{path.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed mb-6 flex-1">{path.desc}</p>
                  <p className="text-sm font-semibold text-slate-900 mb-5">{path.highlight}</p>
                  <span className="inline-flex items-center gap-2 text-sm font-semibold text-accent-blue transition-transform duration-200 group-hover:translate-x-1">
                    {path.cta}
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── NOS VANS — la flotte Vanzon (marketplace en pause) ── */}
      {fleetVans.length > 0 && (
        <section className="bg-white py-16 md:py-20">
          <div className="max-w-6xl mx-auto px-6">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10 md:mb-12">
              <div className="max-w-xl">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">
                  Nos vans à la location
                </p>
                <h2 className="text-3xl md:text-4xl font-black text-slate-900 leading-tight">
                  Des vans aménagés par nos soins.
                </h2>
              </div>
              <Link
                href="/location"
                className="text-sm font-semibold text-accent-blue hover:underline flex-shrink-0"
              >
                Tout savoir sur la location →
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
              {fleetVans.map((van) => (
                <VanCard key={van._id} van={van} mode="location" />
              ))}
            </div>
          </div>
        </section>
      )}


      {/* ── OÙ PARTIR EN VAN ──────────────────────────────────────── */}
      <section className="py-20" style={{ background: "linear-gradient(160deg, #EFF6FF 0%, #F0FDFF 100%)" }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-2xl mb-10 md:mb-14">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">
              Les destinations
            </p>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-3 leading-tight">
              Où partir en van au Pays Basque ?
            </h2>
            <p className="text-slate-500 text-lg">
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

      {/* Avis Google réels — connectés à l'API Place Details (max 5 avis côté
          Google). Repli sur des témoignages statiques si l'API est indisponible. */}
      {googlePlace && googlePlace.reviews.length > 0 ? (
        <GoogleReviewsSection data={googlePlace} />
      ) : (
        <section className="py-20" style={{ background: "linear-gradient(160deg, #F8FAFC 0%, #EFF6FF 100%)" }}>
          <div className="max-w-5xl mx-auto px-6">
            <div className="text-center mb-12">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">
                Avis clients
              </p>
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-2">
                Ce qu&apos;ils en disent
              </h2>
              <a
                href="https://maps.app.goo.gl/NqyLKueJCSzukQei7"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium transition-colors"
                style={{ color: 'var(--accent)' }}
              >
                5/5 sur Google Maps • Voir tous les avis →
              </a>
            </div>

            <div className="grid md:grid-cols-3 gap-5">
              {[
                {
                  name: "Joris Darnanville",
                  detail: "Van super bien équipé, exactement comme décrit. Jules est disponible et de bons conseils. On recommande !",
                  initials: "J",
                  color: "bg-slate-800",
                },
                {
                  name: "Mathilde Sehil",
                  detail: "Un weekend parfait au Pays Basque. Le van est propre, bien rangé et très pratique. On a adoré la cuisine coulissante.",
                  initials: "M",
                  color: "bg-slate-800",
                },
                {
                  name: "Aurélie CEDELLE",
                  detail: "Tout est optimisé pour un séjour parfait. Rien à redire, on repart l'année prochaine avec les enfants !",
                  initials: "A",
                  color: "bg-slate-800",
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
      )}

      {/* ════════════════════════════════════════════════
          VAN BUSINESS ACADEMY
      ════════════════════════════════════════════════ */}
      <section className="bg-white py-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">

            {/* Texte gauche */}
            <div>
              <div className="flex items-center gap-3 mb-6">
                <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest bg-amber-50 border border-amber-200 text-amber-700">
                  Formation
                </span>
                <span className="text-slate-400 text-xs font-medium">100% en ligne</span>
              </div>

              <h2 className="text-4xl md:text-5xl font-black text-slate-900 leading-tight mb-4">
                Van Business<br />
                <span className="bg-clip-text text-transparent" style={{ backgroundImage: "linear-gradient(135deg, var(--gold) 0%, var(--gold-light) 100%)" }}>
                  Academy
                </span>
              </h2>

              <p className="text-slate-500 text-lg leading-relaxed mb-8 max-w-md">
                De zéro à la location rentable. Nous vous accompagnons dans l&apos;achat du fourgon, l&apos;aménagement, l&apos;homologation VASP et comment gérer des revenus avec votre van.
              </p>

              <div className="grid grid-cols-2 gap-4 mb-10">
                {[
                  { value: "A→Z", label: "aménagement" },
                  { value: "100%", label: "en ligne" },
                ].map((s) => (
                  <div key={s.label} className="text-center p-4 rounded-2xl bg-slate-50 border border-slate-100">
                    <div className="text-2xl font-black text-slate-900 leading-none mb-1">{s.value}</div>
                    <div className="text-xs text-slate-500 font-medium">{s.label}</div>
                  </div>
                ))}
              </div>

              <div className="w-full sm:w-auto">
                <LiquidButton href="/formation" variant="gold" size="lg" fullWidth>
                  Découvrir la formation →
                </LiquidButton>
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

          <h2 className="font-sans text-4xl md:text-5xl font-black text-white mb-5 leading-tight tracking-tight">
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
            Envie d&apos;inspiration ? <Link href="/road-trip-personnalise" className="text-white/60 hover:text-white underline underline-offset-2 transition-colors">Générez votre itinéraire gratuit</Link>
            {" "}· Questions ? <Link href="/contact" className="text-white/60 hover:text-white underline underline-offset-2 transition-colors">Contactez-nous</Link>
          </p>
        </div>
      </section>
    </>
  );
}
