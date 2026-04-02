import { Metadata } from "next";
import { sanityFetch } from "@/lib/sanity/client";
import { getAllRoadTripArticlesQuery } from "@/lib/sanity/queries";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import RoadTripCard from "./_components/RoadTripCard";
import dynamic from "next/dynamic";

const CatalogMap = dynamic(() => import("./_components/CatalogMap"), { ssr: false });

export const metadata: Metadata = {
  title: "Road Trips en Van en France — Itinéraires par Région | Vanzon Explorer",
  description: "Découvrez nos road trips en van aménagé à travers la France : Pays Basque, Bretagne, Provence, Corse... Itinéraires détaillés avec spots, campings et cartes GPS.",
  openGraph: {
    title: "Road Trips en Van en France",
    description: "Itinéraires van life par région : Pays Basque, Bretagne, Provence et plus. Spots GPS, campings, restaurants.",
    type: "website",
  },
};

const REGIONS = [
  { slug: "pays-basque", name: "Pays Basque", emoji: "🏄" },
  { slug: "bretagne", name: "Bretagne", emoji: "⛵" },
  { slug: "provence", name: "Provence", emoji: "🌿" },
  { slug: "camargue", name: "Camargue", emoji: "🦩" },
  { slug: "alsace", name: "Alsace", emoji: "🍷" },
  { slug: "dordogne", name: "Dordogne", emoji: "🏰" },
  { slug: "corse", name: "Corse", emoji: "🏝️" },
  { slug: "normandie", name: "Normandie", emoji: "🦪" },
  { slug: "ardeche", name: "Ardèche", emoji: "🛶" },
  { slug: "pyrenees", name: "Pyrénées", emoji: "⛰️" },
  { slug: "loire", name: "Val de Loire", emoji: "🏰" },
  { slug: "jura", name: "Jura", emoji: "🧀" },
  { slug: "vercors", name: "Vercors", emoji: "🦅" },
  { slug: "cotentin", name: "Cotentin", emoji: "💧" },
  { slug: "landes", name: "Landes", emoji: "🌊" },
];

interface RoadTripArticle {
  _id: string;
  title: string;
  slug: string;
  regionSlug: string;
  regionName: string;
  duree?: number;
  style?: string;
  profil?: string;
  excerpt?: string;
  coverImage?: { url: string; alt: string };
  qualityScore?: number;
}

export default async function RoadTripCataloguePage() {
  const articles = await sanityFetch<RoadTripArticle[]>(getAllRoadTripArticlesQuery) ?? [];

  const mapArticles = articles.map(a => ({
    id: a._id,
    title: a.title,
    regionSlug: a.regionSlug,
    articleSlug: a.slug,
    regionName: a.regionName,
    duree: a.duree,
    style: a.style,
  }));

  return (
    <main className="min-h-screen bg-bg-primary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumbs items={[{ label: "Accueil", href: "/" }, { label: "Road Trips" }]} />

        {/* Hero */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-4">
            Road Trips en Van en France
          </h1>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto">
            {articles.length > 0 ? `${articles.length} itinéraires` : "Des itinéraires"} détaillés avec spots GPS, campings et cartes interactives.
            Du Pays Basque à la Bretagne, partez à l&apos;aventure en van aménagé.
          </p>
        </div>

        {/* Carte interactive */}
        <div className="mb-12">
          <CatalogMap articles={mapArticles} />
        </div>

        {/* Grille articles */}
        {articles.length > 0 ? (
          <section className="mb-16">
            <h2 className="text-2xl font-black text-slate-900 mb-6">Tous les itinéraires</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {articles.map((a) => (
                <RoadTripCard key={a._id} {...a} />
              ))}
            </div>
          </section>
        ) : (
          <div className="text-center py-20 text-slate-400">
            <div className="text-5xl mb-4">🗺️</div>
            <p className="text-lg font-medium mb-2">Les premiers itinéraires arrivent bientôt</p>
            <p className="text-sm">Génère le tien dès maintenant !</p>
            <a href="/road-trip-personnalise" className="btn-primary inline-flex mt-4 px-6 py-3 rounded-xl font-semibold text-white">
              Créer mon itinéraire
            </a>
          </div>
        )}

        {/* Section SEO éditoriale */}
        <section className="mb-16 glass-card rounded-2xl p-8 max-w-3xl mx-auto">
          <h2 className="text-2xl font-black text-slate-900 mb-4">Pourquoi faire un road trip en van en France ?</h2>
          <div className="prose prose-slate max-w-none text-sm leading-relaxed text-slate-600">
            <p>La France offre une diversité de paysages exceptionnelle pour le van life : côtes sauvages en Bretagne, villages perchés en Provence, sommets pyrénéens au Pays Basque. Avec un van aménagé, vous voyagez à votre rythme, sans contrainte d&apos;hôtel.</p>
            <p>Nos itinéraires sont conçus pour maximiser vos découvertes : spots secrets, campings en pleine nature, restaurants locaux et conseils pratiques pour chaque région. Chaque road trip est enrichi de coordonnées GPS pour une navigation facile.</p>
          </div>
        </section>

        {/* Grille régions */}
        <section id="regions" className="mb-16">
          <h2 className="text-2xl font-black text-slate-900 mb-6">Explorer par région</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {REGIONS.map((r) => (
              <a key={r.slug} href={`/road-trip/${r.slug}`}
                className="glass-card-hover rounded-xl p-4 text-center group transition-all">
                <div className="text-2xl mb-1">{r.emoji}</div>
                <p className="text-xs font-semibold text-slate-700 group-hover:text-accent-blue transition-colors">{r.name}</p>
              </a>
            ))}
          </div>
        </section>

        {/* CTA génération */}
        <div className="text-center glass-card rounded-2xl p-8">
          <h2 className="text-2xl font-black text-slate-900 mb-2">Tu as un road trip en tête ?</h2>
          <p className="text-slate-500 mb-4">Génère ton itinéraire personnalisé en quelques minutes.</p>
          <a href="/road-trip-personnalise" className="btn-primary inline-flex items-center gap-2 px-8 py-3 rounded-xl font-semibold text-white">
            🗺️ Créer mon itinéraire sur mesure
          </a>
        </div>
      </div>
    </main>
  );
}
