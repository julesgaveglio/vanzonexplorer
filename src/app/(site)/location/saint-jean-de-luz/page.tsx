import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { fetchPexelsPhoto } from "@/lib/pexels";
import { LocationRentalJsonLd } from "@/components/seo/JsonLd";
import VanSelectionSection from "@/components/location/VanSelectionSection";
import FinalBookingCTA from "@/components/location/FinalBookingCTA";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Location Van Aménagé Saint-Jean-de-Luz — dès 65€/nuit",
  description:
    "Louez un van aménagé à Saint-Jean-de-Luz dès 65€/nuit. Port de pêche basque, plage protégée, marché animé — explorez le joyau du Golfe de Gascogne en van avec Vanzon Explorer.",
  alternates: {
    canonical: "https://vanzonexplorer.com/location/saint-jean-de-luz",
  },
};

const FALLBACK_IMG =
  "https://cdn.sanity.io/images/lewexa74/production/0b3f81d08627ba0b4423224029cb5016d0e7ed25-2048x1365.jpg?auto=format&q=82";

export default async function LocationSaintJeanDeLuzPage() {
  const heroPhoto = await fetchPexelsPhoto("colorful fishing village harbor basque coast", FALLBACK_IMG);

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

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Accueil", item: "https://vanzonexplorer.com/" },
      { "@type": "ListItem", position: 2, name: "Location", item: "https://vanzonexplorer.com/location" },
      { "@type": "ListItem", position: 3, name: "Saint-Jean-de-Luz", item: "https://vanzonexplorer.com/location/saint-jean-de-luz" },
    ],
  };

  return (
    <>
      <LocationRentalJsonLd
        destination="Saint-Jean-de-Luz"
        url="https://vanzonexplorer.com/location/saint-jean-de-luz"
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      {/* ── HERO (compact) ───────────────────────────────────────── */}
      <section className="relative -mt-16 min-h-[480px] lg:min-h-[60vh] flex items-end overflow-hidden">
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

        <div className="relative z-10 max-w-7xl mx-auto px-6 pb-14 pt-28 w-full">
          <nav aria-label="Fil d'Ariane" className="mb-5">
            <ol className="flex items-center gap-2 text-white/50 text-xs font-medium">
              <li><Link href="/" className="hover:text-white/80 transition-colors">Accueil</Link></li>
              <li>›</li>
              <li><Link href="/location" className="hover:text-white/80 transition-colors">Location</Link></li>
              <li>›</li>
              <li className="text-white/80">Saint-Jean-de-Luz</li>
            </ol>
          </nav>

          <div className="max-w-2xl">
            <a
              href="https://www.google.com/maps/place/?q=place_id:ChIJ7-3ASe0oTyQR6vNHg7YRicA"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-4 py-2 mb-5 transition-transform hover:scale-105 cursor-pointer"
            >
              <span className="text-amber-400">★★★★★</span>
              <span className="text-white/90 text-sm font-medium">5/5 sur Google</span>
            </a>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white leading-[1.05] mb-5">
              Location van aménagé à{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--accent-soft)] to-[var(--accent)]">
                Saint-Jean-de-Luz
              </span>
            </h1>

            <p className="text-lg text-white/75 leading-relaxed mb-8 max-w-xl">
              Port de pêche basque, plage familiale, marché animé — Saint-Jean-de-Luz en van. Départ Cambo-les-Bains, 35 min.
            </p>

            <Link
              href="#nos-vans"
              className="btn-shine inline-flex items-center justify-center gap-2 bg-white text-slate-900 font-bold px-8 py-4 rounded-xl hover:bg-blue-50 transition-colors text-lg shadow-2xl"
            >
              Voir nos vans disponibles
            </Link>
          </div>
        </div>

        {heroPhoto?.photographer && (
          <p className="absolute bottom-2 right-4 text-white/30 text-[10px] z-10">
            Photo: {heroPhoto.photographer} / Pexels
          </p>
        )}
      </section>

      {/* ── VANS DISPONIBLES (position 2 — immédiat) ─────────────── */}
      <VanSelectionSection destination="Saint-Jean-de-Luz" />

      {/* ── TÉMOIGNAGE ────────────────────────────────────────────── */}
      <section className="py-12 bg-slate-50">
        <div className="max-w-2xl mx-auto px-6">
          <div className="glass-card p-6 text-center">
            <div className="flex justify-center gap-1 text-amber-400 mb-3">
              {[...Array(5)].map((_, i) => <span key={i}>★</span>)}
            </div>
            <p className="text-slate-700 font-medium text-sm leading-relaxed mb-4">
              &ldquo;Van super bien équipé, exactement comme décrit. Jules est disponible et de bons conseils. On recommande !&rdquo;
            </p>
            <div className="flex items-center justify-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-sm">J</div>
              <div className="text-left">
                <div className="font-semibold text-slate-800 text-sm">Joris Darnanville</div>
                <div className="text-xs text-slate-400">Client Google Maps</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── ROAD TRIP PERSONNALISÉ ────────────────────────────────── */}
      <section className="py-20" style={{ background: "linear-gradient(160deg, #EFF6FF 0%, #F0FDFF 100%)" }}>
        <div className="max-w-3xl mx-auto px-6 text-center">
          <span
            className="badge-glass !px-4 !py-1.5 text-sm font-semibold mb-4 inline-block"
            style={{ color: "var(--accent)" }}
          >
            Votre itinéraire sur-mesure
          </span>
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">
            Personnalisez votre road trip à Saint-Jean-de-Luz
          </h2>
          <p className="text-slate-500 text-lg leading-relaxed mb-8 max-w-xl mx-auto">
            Port, plage, Espagne — dites-nous ce que vous aimez et recevez un itinéraire personnalisé par email en 60 secondes. Gratuit.
          </p>
          <div className="flex flex-wrap justify-center gap-3 mb-8 text-sm text-slate-500">
            <span className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full border border-slate-100">✓ IA</span>
            <span className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full border border-slate-100">✓ 60 sec</span>
            <span className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full border border-slate-100">✓ Gratuit</span>
          </div>
          <Link
            href="/road-trip-personnalise"
            className="btn-shine inline-flex items-center justify-center gap-2 bg-slate-900 text-white font-bold px-8 py-4 rounded-xl hover:bg-slate-800 transition-colors text-lg shadow-xl"
          >
            Créer mon itinéraire →
          </Link>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────── */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-12">
            <span
              className="badge-glass !px-4 !py-1.5 text-sm font-semibold mb-4 inline-block"
              style={{ color: "var(--accent)" }}
            >
              FAQ
            </span>
            <h2 className="text-3xl font-black text-slate-900">
              Questions fréquentes — Location van Saint-Jean-de-Luz
            </h2>
          </div>

          <div className="space-y-3">
            {faq.map((item) => (
              <details
                key={item.q}
                className="glass-card group rounded-2xl overflow-hidden"
              >
                <summary className="flex items-center justify-between gap-4 p-5 cursor-pointer list-none font-bold text-slate-900 hover:text-[var(--accent)] transition-colors">
                  <span>{item.q}</span>
                  <span className="text-[var(--accent-soft)] flex-shrink-0 group-open:rotate-45 transition-transform duration-200 text-xl leading-none">
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

      {/* ── CTA FINAL ────────────────────────────────────────────── */}
      <FinalBookingCTA
        title={<>Saint-Jean-de-Luz vous attend. <br /> Le van aussi.</>}
        subtitle={<>Dès <strong className="text-white">65€/nuit</strong> — assurance incluse, van tout équipé, clés remises à Cambo-les-Bains.</>}
        linkHref="/road-trip-pays-basque-van"
        linkLabel="Voir notre itinéraire road trip Pays Basque en van"
      />
    </>
  );
}
