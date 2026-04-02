"use client";
// TODO: npm install maplibre-gl react-map-gl supercluster @types/supercluster
// Import MapLibre when package is installed

interface Article {
  id: string;
  title: string;
  regionSlug: string;
  articleSlug: string;
  geojson?: string;
}

interface CatalogMapProps {
  articles: Article[];
}

export default function CatalogMap({ articles }: CatalogMapProps) {
  return (
    <div className="w-full h-80 bg-slate-100 rounded-2xl flex items-center justify-center border-2 border-dashed border-slate-200">
      <div className="text-center text-slate-400">
        <div className="text-4xl mb-2">🗺️</div>
        <p className="text-sm font-medium">Carte interactive</p>
        <p className="text-xs">{articles.length} itinéraires disponibles</p>
        <p className="text-xs mt-1 text-slate-300">MapLibre GL JS (requires NEXT_PUBLIC_MAPTILER_KEY)</p>
      </div>
    </div>
  );
}
