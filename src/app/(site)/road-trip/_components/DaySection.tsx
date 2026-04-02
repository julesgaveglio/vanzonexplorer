import SpotCard from "./SpotCard";
import CampingCard from "./CampingCard";
import RestaurantCard from "./RestaurantCard";

interface Spot {
  nom: string;
  description?: string;
  type?: string;
  mapsUrl?: string;
  wikiExcerpt?: string;
  wikiUrl?: string;
  photo?: { url: string; alt: string; credit?: string };
  lat?: number;
  lon?: number;
}

interface DaySectionProps {
  numero: number;
  titre: string;
  spots?: Spot[];
  camping?: { nom?: string; mapsUrl?: string; options?: string[] };
  restaurant?: { nom?: string; type?: string; specialite?: string };
  tips?: string;
}

export default function DaySection({ numero, titre, spots, camping, restaurant, tips }: DaySectionProps) {
  return (
    <section className="mb-12">
      <h2 className="text-2xl font-black text-slate-900 mb-2">
        Jour {numero} — {titre}
      </h2>
      {tips && (
        <div className="bg-blue-50 border-l-4 border-accent-blue px-4 py-3 mb-6 rounded-r-xl">
          <p className="text-blue-800 text-sm"><span className="font-semibold">💡 Conseil : </span>{tips}</p>
        </div>
      )}
      {spots && spots.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {spots.map((spot, i) => (
            <SpotCard key={i} {...spot} />
          ))}
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <CampingCard {...(camping || {})} />
        <RestaurantCard {...(restaurant || {})} />
      </div>
    </section>
  );
}
