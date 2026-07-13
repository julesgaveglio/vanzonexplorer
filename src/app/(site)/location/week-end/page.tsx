import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { fetchPexelsPhoto } from "@/lib/pexels";
import { LocationRentalJsonLd } from "@/components/seo/JsonLd";
import VanSelectionSection from "@/components/location/VanSelectionSection";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Location Van Week-end Pays Basque — dès 65€/nuit",
  description:
    "Louez un van aménagé pour votre week-end au Pays Basque. 4 idées d'itinéraires testées : surf, gastronomie, montagne, côte+intérieur.",
  alternates: {
    canonical: "https://vanzonexplorer.com/location/week-end",
  },
};

const FALLBACK_IMG =
  "https://cdn.sanity.io/images/lewexa74/production/d445397965472d300e3dc13d6b1c37503fe8ba25-1920x1080.png?auto=format&q=82";

const faq = [
  {
    q: "Peut-on vraiment tout voir en un week-end ?",
    a: "Le Pays Basque est compact — en 48h, vous pouvez alterner mer et montagne facilement. On vous conseille de choisir 1 thème principal (surf, gastronomie, ou nature) plutôt que de tout vouloir voir.",
  },
  {
    q: "Quelle est la durée minimale de location ?",
    a: "2 nuits minimum. La formule week-end (vendredi soir → dimanche soir) est notre plus populaire. Pour un vrai road trip, partez 4–7 jours.",
  },
  {
    q: "Peut-on récupérer le van le vendredi après le travail ?",
    a: "Oui, nous nous adaptons à vos horaires. Récupération possible jusqu'à 20h à Cambo-les-Bains. Dites-nous votre heure d'arrivée lors de la réservation.",
  },
  {
    q: "Comment réserver pour un week-end ?",
    a: "Directement sur Yescapa.fr en sélectionnant vos dates. Nous sommes également disponibles par message pour les questions avant réservation.",
  },
  {
    q: "Faut-il réserver à l'avance ?",
    a: "Oui, surtout pour les week-ends de mai à septembre. Nos 2 vans sont souvent réservés 3–4 semaines à l'avance en haute saison. Pour les fêtes de Bayonne (août) et l'été, réservez 2 mois à l'avance.",
  },
];

export default async function LocationWeekEndPage() {
  const heroPhoto = await fetchPexelsPhoto(
    "campervan parked scenic coastal road sunset",
    FALLBACK_IMG
  );

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
      { "@type": "ListItem", position: 3, name: "Week-end", item: "https://vanzonexplorer.com/location/week-end" },
    ],
  };

  return (
    <>
      <LocationRentalJsonLd
        destination="Week-end Pays Basque"
        url="https://vanzonexplorer.com/location/week-end"
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
            alt="Location van week-end Pays Basque — van aménagé côte et montagne"
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
              <li className="text-white/80">Week-end</li>
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
              Week-end en van
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--accent-soft)] to-[var(--accent)]">
                au Pays Basque
              </span>
            </h1>

            <p className="text-lg text-white/75 leading-relaxed mb-8 max-w-xl">
              Surf à Biarritz, pintxos à Bayonne, forêt d&apos;Irati — en 48h, le Pays Basque
              vous donne envie de tout. Récupération vendredi soir à Cambo-les-Bains.
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
      <VanSelectionSection destination="Pays Basque" />

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
            Personnalisez votre week-end en van
          </h2>
          <p className="text-slate-500 text-lg leading-relaxed mb-8 max-w-xl mx-auto">
            Surf, gastronomie, montagne ou tout à la fois — dites-nous ce que vous aimez et recevez un itinéraire personnalisé par email en 60 secondes. Gratuit.
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
              Questions fréquentes — Location van week-end
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
            Ce week-end,<br />le Pays Basque en van.
          </h2>
          <p className="text-white/70 text-xl mb-10">
            <strong className="text-white">2 nuits dès 130€</strong> — assurance incluse, van
            tout équipé, spots partagés par Jules.
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
              Voir notre itinéraire road trip Pays Basque 7 jours
            </Link>
          </p>
        </div>
      </section>
    </>
  );
}
