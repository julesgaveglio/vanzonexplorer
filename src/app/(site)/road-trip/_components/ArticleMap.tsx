"use client";
// TODO: npm install maplibre-gl react-map-gl supercluster @types/supercluster

interface ArticleMapProps {
  geojson?: string;
  regionName?: string;
}

export default function ArticleMap({ geojson, regionName }: ArticleMapProps) {
  const features = (() => {
    try { return geojson ? JSON.parse(geojson).features?.length || 0 : 0; } catch { return 0; }
  })();
  return (
    <div className="w-full h-72 bg-slate-100 rounded-2xl flex items-center justify-center border-2 border-dashed border-slate-200 mb-8">
      <div className="text-center text-slate-400">
        <div className="text-3xl mb-2">🗺️</div>
        <p className="text-sm font-medium">Carte de l&apos;itinéraire — {regionName}</p>
        <p className="text-xs">{features} points GPS</p>
      </div>
    </div>
  );
}
