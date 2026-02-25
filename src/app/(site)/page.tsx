import Link from "next/link";
import Image from "next/image";
import { sanityFetch } from "@/lib/sanity/client";
import { getFeaturedVansQuery, getAllTestimonialsQuery, getHeroImageQuery, getHeroCarouselQuery } from "@/lib/sanity/queries";
import { imagePresets } from "@/lib/sanity/client";
import type { VanCard as VanCardType, Testimonial } from "@/lib/sanity/types";
import GlassCard from "@/components/ui/GlassCard";
import LiquidButton from "@/components/ui/LiquidButton";
import VanCard from "@/components/van/VanCard";
import VanSlider from "@/components/van/VanSlider";
import TestimonialCarousel from "@/components/testimonials/TestimonialCarousel";
import HeroCarousel from "@/components/ui/HeroCarousel";

export const revalidate = 60;

// ── Sections statiques (offres) ──
const offers = [
  {
    icon: "🚐",
    title: "Location de vans",
    description:
      "Partez à l'aventure au Pays Basque avec nos vans aménagés tout équipés. Réservation simple via nos partenaires.",
    href: "/location",
    color: "blue" as const,
  },
  {
    icon: "🔑",
    title: "Achat / Revente",
    description:
      "Trouvez le van de vos rêves ou revendez le vôtre. Accompagnement personnalisé de A à Z.",
    href: "/achat",
    color: "gold" as const,
  },
  {
    icon: "🎓",
    title: "Formation vanlife",
    description:
      "Apprenez à vivre sur la route : aménagement, mécanique, spots secrets et business nomade.",
    href: "/formation",
    color: "teal" as const,
  },
];

const offerBorderColors = {
  blue: "hover:border-blue-300",
  gold: "hover:border-amber-300",
  teal: "hover:border-sky-300",
};

const offerIconBg = {
  blue: "bg-blue-50 text-blue-600",
  gold: "bg-amber-50 text-amber-600",
  teal: "bg-sky-50 text-sky-600",
};

// ── Vans vedettes (hardcoded) ──
const vanFeatures = [
  { icon: "https://iili.io/KGvOdtS.png", label: "3 sièges" },
  { icon: "https://iili.io/KGvOHAl.png", label: "2+1 couchages" },
  { icon: "https://iili.io/KGvO3o7.png", label: "Cuisine coulissante" },
  { icon: "https://iili.io/KGvOJN2.png", label: "Glacière portative" },
  { icon: "https://iili.io/KGvOFV9.png", label: "Toilette sèche" },
];


const stats = [
  { value: "12+", label: "Vans disponibles" },
  { value: "250", label: "km de côtes" },
  { value: "500+", label: "Locataires heureux" },
  { value: "5", label: "Ans d'expérience" },
];

export default async function HomePage() {
  // Fetch Sanity data
  const [featuredVans, testimonials, heroImage, heroCarousel] = await Promise.all([
    sanityFetch<VanCardType[]>(getFeaturedVansQuery),
    sanityFetch<Testimonial[]>(getAllTestimonialsQuery),
    sanityFetch<{image?: string; alt?: string}>(getHeroImageQuery),
    sanityFetch<{images?: any[]; isActive?: boolean}>(getHeroCarouselQuery),
  ]);

  return (
    <>
      {/* ━━━ SECTION 1 — Hero ━━━ */}
      <section className="relative overflow-hidden min-h-[80vh]">
        {/* Image de fond avec carousel */}
        {heroCarousel?.isActive && heroCarousel?.images && heroCarousel.images.length > 0 ? (
          <HeroCarousel 
            images={heroCarousel.images} 
            interval={6000}
          />
        ) : heroImage?.image ? (
          // Fallback image fixe si carousel désactivé
          <div className="absolute inset-0">
            <Image
              src={imagePresets.hero(heroImage.image)}
              alt={heroImage.alt || "Van sur la route avec vue montagne et océan"}
              fill
              className="object-cover"
              priority
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-blue-900/40 to-slate-900/60" />
          </div>
        ) : (
          // Fallback gradient si pas d'image
          <div
            className="absolute inset-0"
            style={{
              background: "linear-gradient(160deg, #EFF6FF 0%, #F0FDFF 50%, #FFFBEB 100%)",
            }}
          />
        )}

        {/* Contenu fixe au-dessus du carousel */}
        <div className="absolute inset-0 z-20 flex items-center">
          <div className="max-w-7xl mx-auto px-6 w-full">
            <div className="max-w-3xl">
              <h1 className="text-5xl md:text-7xl font-black text-white leading-[1.05] tracking-tight drop-shadow-lg">
                Construisez votre{" "}
                <span className="bg-gradient-to-r from-blue-400 to-sky-300 bg-clip-text text-transparent">
                  liberté.
                </span>
              </h1>
              <p className="text-xl text-white/90 mt-6 max-w-xl leading-relaxed drop-shadow-md">
                Location · Achat · Formation — Explorez le Pays Basque en van aménagé, à votre rythme.
              </p>
              <div className="flex gap-4 mt-8 flex-wrap">
                <LiquidButton href="/location">Louer un van</LiquidButton>
                <LiquidButton variant="ghost" href="/achat">
                  Acheter un van
                </LiquidButton>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ━━━ SECTION 2 — 3 Offres ━━━ */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {offers.map((offer) => (
              <Link key={offer.href} href={offer.href} className="block">
                <GlassCard
                  hover
                  className={`h-full ${offerBorderColors[offer.color]}`}
                >
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl ${offerIconBg[offer.color]}`}
                  >
                    {offer.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mt-4">
                    {offer.title}
                  </h3>
                  <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                    {offer.description}
                  </p>
                  <span className="inline-flex items-center gap-1 text-sm font-medium text-accent-blue mt-4">
                    Découvrir →
                  </span>
                </GlassCard>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━ SECTION 3 — Vans vedettes ━━━ */}
      <section className="bg-bg-secondary py-20">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-slate-900 text-center">
            Nos vans en vedette
          </h2>
          <p className="text-slate-500 text-center mt-2 max-w-lg mx-auto">
            Découvrez notre sélection de vans aménagés, prêts pour l&apos;aventure au Pays Basque.
          </p>

          {/* Slider Yoni & Xalbat */}
          <div className="mt-12">
            <VanSlider />
          </div>

          {/* Vans Sanity supplémentaires (si configuré) */}
          {featuredVans && featuredVans.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-12">
              {featuredVans.map((van) => (
                <VanCard
                  key={van._id}
                  van={van}
                  mode={van.offerType?.includes("location") ? "location" : "achat"}
                />
              ))}
            </div>
          )}

          <div className="text-center mt-10">
            <LiquidButton href="/location" variant="ghost">
              Voir tous les vans →
            </LiquidButton>
          </div>
        </div>
      </section>

      {/* ━━━ SECTION 4 — Chiffres clés ━━━ */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-4xl font-black text-blue-600">{stat.value}</p>
                <p className="text-sm text-slate-500 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━ SECTION 5 — Testimonials Carousel ━━━ */}
      <section className="bg-bg-secondary py-20">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-12">
            Ce qu&apos;ils en disent
            <Link 
              href="https://maps.app.goo.gl/NqyLKueJCSzukQei7"
              target="_blank"
              rel="noopener noreferrer"
              className="block text-sm font-normal text-blue-600 hover:text-blue-700 mt-2 transition-colors underline"
            >
              33 avis Google Maps • Voir tous les avis →
            </Link>
          </h2>

          {testimonials && testimonials.length > 0 ? (
            <div className="py-12">
              <TestimonialCarousel testimonials={testimonials} />
            </div>
          ) : (
            <p className="text-center text-slate-400 mt-8">
              Les témoignages arrivent bientôt !
            </p>
          )}
        </div>
      </section>

      {/* ━━━ SECTION 6 — Pays Basque teaser ━━━ */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-slate-900">
                Le Pays Basque, votre terrain de jeu
              </h2>
              <p className="text-slate-500 mt-4 leading-relaxed">
                Des plages de Biarritz aux montagnes de la Rhune, en passant par
                les villages colorés d&apos;Espelette et Saint-Jean-de-Luz. Le Pays
                Basque offre une diversité de paysages unique, parfaite pour
                l&apos;exploration en van.
              </p>
              <p className="text-slate-500 mt-3 leading-relaxed">
                Surf, randonnée, gastronomie, culture… Chaque jour est une
                nouvelle aventure.
              </p>
              <div className="mt-6">
                <LiquidButton href="/pays-basque" variant="ghost">
                  Découvrir les spots →
                </LiquidButton>
              </div>
            </div>
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-bg-elevated">
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-6xl">🏔️</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
