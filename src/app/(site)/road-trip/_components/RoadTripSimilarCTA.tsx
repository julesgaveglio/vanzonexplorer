interface RoadTripSimilarCTAProps {
  region?: string;
  duree?: number;
  style?: string;
}

export default function RoadTripSimilarCTA({ region, duree, style }: RoadTripSimilarCTAProps) {
  const params = new URLSearchParams();
  if (region) params.set("region", region);
  if (duree) params.set("duree", String(duree));
  if (style) params.set("style", style);
  const href = `/road-trip-personnalise${params.toString() ? `?${params.toString()}` : ""}`;

  return (
    <div className="glass-card rounded-2xl p-6 text-center my-10">
      <p className="text-xl font-black text-slate-900 mb-2">
        Cet itinéraire t&apos;inspire ?
      </p>
      <p className="text-slate-500 text-sm mb-4">
        Génère ton road trip personnalisé avec tes dates, ton profil et tes envies.
      </p>
      <a href={href} className="btn-primary inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white">
        🗺️ Générer mon road trip similaire
      </a>
    </div>
  );
}
