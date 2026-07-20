import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { fetchPexelsPhoto } from "@/lib/pexels";
import { LocationRentalJsonLd } from "@/components/seo/JsonLd";
import VanSelectionSection from "@/components/location/VanSelectionSection";
import FinalBookingCTA from "@/components/location/FinalBookingCTA";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Location Van Aménagé Bayonne — dès 65€/nuit",
  description:
    "Louez un van aménagé à Bayonne dès 65€/nuit. Ville de départ idéale pour explorer le Pays Basque en van — Biarritz à 20 min, Saint-Jean-de-Luz à 25 min, les Pyrénées à 1h.",
  alternates: {
    canonical: "https://vanzonexplorer.com/location/bayonne",
  },
};

const FALLBACK_IMG =
  "https://cdn.sanity.io/images/lewexa74/production/e9664378c5fdc652c33ae7342dfc52cc4960c8bf-1080x750.png?auto=format&q=82";

export default async function LocationBayonnePage() {
  const heroPhoto = await fetchPexelsPhoto("colorful riverside houses old town france", FALLBACK_IMG);

  const faq = [
    {
      q: "Où se garer en van à Bayonne ?",
      a: "Le parking Remparts (rue des Gouverneurs) est le plus central — comptez 10–15€/nuit. Hors saison, plusieurs zones sur les quais sont tolérées. Nous vous donnons nos spots préférés.",
    },
    {
      q: "Peut-on visiter Biarritz depuis Bayonne en van ?",
      a: "Absolument, Biarritz n'est qu'à 20 min. Beaucoup de nos clients font une base à Bayonne et rayonnent vers Biarritz, Saint-Jean-de-Luz et même l'intérieur du Pays Basque.",
    },
    {
      q: "Les Fêtes de Bayonne — comment s'organiser en van ?",
      a: "Début août, le stationnement en centre-ville est quasi impossible pendant les fêtes. On vous recommande de se garer dans les parkings périphériques (P+R) et d'entrer à pied. Réservez votre van plusieurs mois à l'avance pour cette période.",
    },
    {
      q: "Quelle est la durée minimale de location ?",
      a: "La durée minimale est de 2 nuits (week-end). Nous recommandons 4–7 jours pour profiter de tout le Pays Basque depuis Bayonne.",
    },
    {
      q: "Y a-t-il une cuisine complète dans le van ?",
      a: "Oui, nos vans ont une cuisine équipée avec réchaud 2 feux, évier, réfrigérateur 12V, vaisselle et ustensiles. Idéal pour cuisiner les achats du marché de Bayonne.",
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
      { "@type": "ListItem", position: 3, name: "Bayonne", item: "https://vanzonexplorer.com/location/bayonne" },
    ],
  };

  return (
    <>
      <LocationRentalJsonLd
        destination="Bayonne"
        url="https://vanzonexplorer.com/location/bayonne"
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
            alt="Van aménagé à Bayonne, base de départ Pays Basque"
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
              <li className="text-white/80">Bayonne</li>
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
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--accent)] to-[var(--accent-soft)]">
                à Bayonne
              </span>
            </h1>

            <p className="text-lg text-white/75 leading-relaxed mb-8 max-w-xl">
              Remparts médiévaux, chocolat artisanal, jambon AOP — Bayonne la basque s&apos;explore en van. Départ Cambo-les-Bains, 15 min.
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
      <VanSelectionSection destination="Bayonne" />

      {/* ── TÉMOIGNAGE ────────────────────────────────────────────── */}
      <section className="py-12 bg-slate-50">
        <div className="max-w-2xl mx-auto px-6">
          <div className="glass-card p-6 text-center">
            <div className="flex justify-center gap-1 text-amber-400 mb-3">
              {[...Array(5)].map((_, i) => <span key={i}>★</span>)}
            </div>
            <p className="text-slate-700 font-medium text-sm leading-relaxed mb-4">
              &ldquo;Tout est optimisé pour un séjour parfait. Rien à redire, on repart l&apos;année prochaine avec les enfants !&rdquo;
            </p>
            <div className="flex items-center justify-center gap-3">
              <div className="w-8 h-8 rounded-full bg-teal-500 flex items-center justify-center text-white font-bold text-sm">A</div>
              <div className="text-left">
                <div className="font-semibold text-slate-800 text-sm">Aurélie CEDELLE</div>
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
            Personnalisez votre road trip à Bayonne
          </h2>
          <p className="text-slate-500 text-lg leading-relaxed mb-8 max-w-xl mx-auto">
            Gastronomie, culture basque, côte atlantique — dites-nous ce que vous aimez et recevez un itinéraire personnalisé par email en 60 secondes. Gratuit.
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
              Questions fréquentes — Location van Bayonne
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
        title={<>Partez à Bayonne <br /> en van dès ce week-end.</>}
        subtitle={<>Dès <strong className="text-white">65€/nuit</strong> — clés remises à Cambo-les-Bains, assurance incluse.</>}
        linkHref="/road-trip-pays-basque-van"
        linkLabel="Voir l&apos;itinéraire road trip Pays Basque 7 jours"
      />
    </>
  );
}
