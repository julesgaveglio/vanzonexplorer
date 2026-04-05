import { Metadata } from "next";
import { notFound } from "next/navigation";
import { sanityFetch } from "@/lib/sanity/client";
import { getRoadTripArticlesByRegionQuery } from "@/lib/sanity/queries";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import RoadTripCard from "../_components/RoadTripCard";
import dynamic from "next/dynamic";

const CatalogMap = dynamic(() => import("../_components/CatalogMap"), { ssr: false });

interface Props {
  params: { regionSlug: string };
}

const REGION_NAMES: Record<string, string> = {
  "pays-basque": "Pays Basque", "bretagne": "Bretagne", "provence": "Provence",
  "camargue": "Camargue", "alsace": "Alsace", "dordogne": "Dordogne",
  "corse": "Corse", "normandie": "Normandie", "ardeche": "Ardèche",
  "pyrenees": "Pyrénées", "loire": "Val de Loire", "jura": "Jura",
  "vercors": "Vercors", "cotentin": "Cotentin", "landes": "Landes",
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const regionName = REGION_NAMES[params.regionSlug] || params.regionSlug;
  return {
    title: `Road Trip en Van ${regionName} — Itinéraires`,
    description: `Découvrez nos itinéraires de road trip en van aménagé en ${regionName}. Spots GPS, campings, restaurants et conseils pratiques.`,
    alternates: { canonical: `https://vanzonexplorer.com/road-trip/${params.regionSlug}` },
  };
}

interface Article {
  _id: string;
  title: string;
  slug: string;
  regionSlug: string;
  regionName: string;
  duree?: number;
  style?: string;
  excerpt?: string;
  coverImage?: { url: string; alt: string };
}

interface Region {
  slug: string;
  name: string;
  description?: string;
  neighboring_slugs?: string[];
  mountain?: boolean;
  article_count?: number;
}

export default async function RegionHubPage({ params }: Props) {
  const { regionSlug } = params;
  const regionName = REGION_NAMES[regionSlug];

  if (!regionName) notFound();

  // Fetch articles + région en parallèle
  const supabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [articles, { data: regionData }] = await Promise.all([
    sanityFetch<Article[]>(getRoadTripArticlesByRegionQuery, { regionSlug }) ?? Promise.resolve([]),
    supabase.from("road_trip_regions").select("*").eq("slug", regionSlug).single(),
  ]);

  const region = regionData as Region | null;
  const mapData = (articles || []).map(a => ({ id: a._id, title: a.title, regionSlug: a.regionSlug, articleSlug: a.slug }));

  return (
    <main className="min-h-screen bg-bg-primary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumbs items={[
          { label: "Accueil", href: "/" },
          { label: "Road Trips", href: "/road-trip" },
          { label: regionName },
        ]} />

        <div className="mb-8">
          <h1 className="text-4xl font-black text-slate-900 mb-3">Road Trip en Van — {regionName}</h1>
          <p className="text-slate-500">{(articles || []).length} itinéraire{(articles || []).length > 1 ? "s" : ""} disponible{(articles || []).length > 1 ? "s" : ""}</p>
        </div>

        <div className="mb-8">
          <CatalogMap articles={mapData} />
        </div>

        {region?.description && (
          <div className="glass-card rounded-2xl p-6 mb-8 prose prose-slate max-w-none text-sm">
            <p>{region.description}</p>
          </div>
        )}

        {(articles || []).length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {(articles || []).map((a) => <RoadTripCard key={a._id} {...a} />)}
          </div>
        ) : (
          <div className="text-center py-16 text-slate-400">
            <p className="text-lg font-medium mb-2">Itinéraires {regionName} bientôt disponibles</p>
            <a href="/road-trip-personnalise" className="btn-primary inline-flex mt-4 px-6 py-3 rounded-xl font-semibold text-white">
              Générer un itinéraire {regionName}
            </a>
          </div>
        )}

        {/* Liens régions voisines */}
        {region?.neighboring_slugs && region.neighboring_slugs.length > 0 && (
          <div className="border-t border-slate-200 pt-8">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Régions voisines</h2>
            <div className="flex flex-wrap gap-2">
              {region.neighboring_slugs.map(slug => (
                <a key={slug} href={`/road-trip/${slug}`}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-sm font-medium hover:bg-slate-200 transition-colors">
                  {REGION_NAMES[slug] || slug}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
