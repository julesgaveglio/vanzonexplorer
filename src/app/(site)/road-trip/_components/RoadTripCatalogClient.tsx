"use client";

import { useState, useMemo } from "react";
import SearchBar, { type SearchSuggestion } from "./SearchBar";
import RoadTripCard from "./RoadTripCard";
import { REGION_CENTROIDS, haversineKm } from "./regionData";

const PROXIMITY_KM = 300;

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

interface Props {
  articles: RoadTripArticle[];
}

export default function RoadTripCatalogClient({ articles }: Props) {
  const [active, setActive] = useState<SearchSuggestion | null>(null);

  const filtered = useMemo(() => {
    if (!active) return articles;

    if (active.type === "region" && active.regionSlug) {
      return articles.filter(a => a.regionSlug === active.regionSlug);
    }

    // City type: filter by proximity to region centroids
    if (active.type === "city") {
      const nearby = Object.entries(REGION_CENTROIDS)
        .filter(([, coords]) => haversineKm(active.coords, coords) < PROXIMITY_KM)
        .map(([slug]) => slug);
      return articles.filter(a => nearby.includes(a.regionSlug));
    }

    return articles;
  }, [articles, active]);

  const heading = active
    ? `Itinéraires près de ${active.label}`
    : "Tous les itinéraires";

  return (
    <>
      {/* Barre de recherche */}
      <div className="mb-8">
        <SearchBar
          articles={articles}
          onSelect={setActive}
          onClear={() => setActive(null)}
        />
        {active && (
          <p className="text-center text-sm text-slate-500 mt-3">
            {filtered.length > 0
              ? `${filtered.length} itinéraire${filtered.length > 1 ? "s" : ""} trouvé${filtered.length > 1 ? "s" : ""} près de ${active.label}`
              : `Aucun itinéraire dans cette zone pour l'instant`}
          </p>
        )}
      </div>

      {/* Grille d'itinéraires */}
      {articles.length > 0 && (
        <section className="mb-16">
          <h2 className="text-2xl font-black text-slate-900 mb-6">{heading}</h2>
          {filtered.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map(a => (
                <RoadTripCard key={a._id} {...a} />
              ))}
            </div>
          ) : (
            <div className="text-center py-14 glass-card rounded-2xl">
              <div className="text-5xl mb-4">🗺️</div>
              <p className="text-slate-700 font-semibold mb-1">
                Aucun itinéraire dans cette zone pour l&apos;instant
              </p>
              <p className="text-slate-400 text-sm mb-5">
                Tu peux générer le tien sur mesure !
              </p>
              <a
                href="/road-trip-personnalise"
                className="btn-primary inline-flex items-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-white text-sm"
              >
                Créer mon itinéraire
              </a>
            </div>
          )}
        </section>
      )}

      {/* Empty state global (aucun article du tout) */}
      {articles.length === 0 && (
        <div className="text-center py-20 text-slate-400 mb-16">
          <div className="text-5xl mb-4">🗺️</div>
          <p className="text-lg font-medium mb-2">Les premiers itinéraires arrivent bientôt</p>
          <p className="text-sm">Génère le tien dès maintenant !</p>
          <a
            href="/road-trip-personnalise"
            className="btn-primary inline-flex mt-4 px-6 py-3 rounded-xl font-semibold text-white"
          >
            Créer mon itinéraire
          </a>
        </div>
      )}
    </>
  );
}
