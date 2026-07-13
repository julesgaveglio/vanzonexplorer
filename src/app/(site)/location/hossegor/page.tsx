import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { fetchPexelsPhoto } from "@/lib/pexels";
import { LocationRentalJsonLd } from "@/components/seo/JsonLd";
import VanSelectionSection from "@/components/location/VanSelectionSection";

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

export default async function LocationHossegorPage() {
  const heroPhoto = await fetchPexelsPhoto("powerful ocean wave tube barrel surfing", FALLBACK_IMG);

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
      { "@type": "ListItem", position: 3, name: "Hossegor", item: "https://vanzonexplorer.com/location/hossegor" },
    ],
  };

  return (
    <>
      <LocationRentalJsonLd
        destination="Hossegor"
        url="https://vanzonexplorer.com/location/hossegor"
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
            alt="Van aménagé à Hossegor face aux vagues de l'Atlantique"
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
              <li className="text-white/80">Hossegor</li>
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
              Location van aménagé
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--accent-soft)] to-[var(--accent)]">
                à Hossegor
              </span>
            </h1>

            <p className="text-lg text-white/75 leading-relaxed mb-8 max-w-xl">
              La Gravière, Les Estagnots, forêt landaise... Hossegor est le temple du surf
              européen. Départ Cambo-les-Bains — 45 min par l&apos;autoroute.
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
      <VanSelectionSection destination="Hossegor" />

      {/* ── TÉMOIGNAGE ────────────────────────────────────────────── */}
      <section className="py-12 bg-slate-50">
        <div className="max-w-2xl mx-auto px-6">
          <div className="glass-card p-6 text-center">
            <div className="flex justify-center gap-1 text-amber-400 mb-3">
              {[...Array(5)].map((_, i) => <span key={i}>★</span>)}
            </div>
            <p className="text-slate-700 font-medium text-sm leading-relaxed mb-4">
              &ldquo;Un weekend parfait au Pays Basque. Le van est propre, bien rangé et très pratique. On a adoré la cuisine coulissante.&rdquo;
            </p>
            <div className="flex items-center justify-center gap-3">
              <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold text-sm">M</div>
              <div className="text-left">
                <div className="font-semibold text-slate-800 text-sm">Mathilde Sehil</div>
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
            Personnalisez votre road trip à Hossegor
          </h2>
          <p className="text-slate-500 text-lg leading-relaxed mb-8 max-w-xl mx-auto">
            Surf, forêt landaise, lac marin — dites-nous ce que vous aimez et recevez un itinéraire personnalisé par email en 60 secondes. Gratuit.
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
              Questions fréquentes — Location van Hossegor
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
              href="https://www.wikicampers.com/rental/fourgon/cambo-les-bains/renault-vanzon-explorer-trafic-iii/380874"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-white/10 backdrop-blur-md border border-white/30 text-white font-bold px-10 py-5 rounded-2xl hover:bg-white/20 transition-colors text-lg"
            >
              Réserver Xalbat — Wikicampers
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
