interface CampingCardProps {
  nom?: string;
  mapsUrl?: string;
  options?: string[];
}

export default function CampingCard({ nom, mapsUrl, options }: CampingCardProps) {
  if (!nom) return null;
  return (
    <div className="bg-green-50 border border-green-200 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-lg">⛺</span>
        <h4 className="font-semibold text-green-800 text-sm">Nuit recommandée</h4>
      </div>
      <p className="text-green-900 font-medium text-sm mb-1">{nom}</p>
      {options && options.length > 0 && (
        <p className="text-green-700 text-xs mb-2">{options.join(" · ")}</p>
      )}
      {mapsUrl && (
        <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-green-600 font-semibold hover:underline">
          Voir sur Maps →
        </a>
      )}
    </div>
  );
}
