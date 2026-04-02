import RoadTripCard from "./RoadTripCard";

interface RelatedArticle {
  _id: string;
  title: string;
  slug: string;
  regionSlug: string;
  regionName: string;
  duree?: number;
  style?: string;
  coverImage?: { url: string; alt: string };
}

interface RelatedItinerariesProps {
  articles: RelatedArticle[];
}

export default function RelatedItineraries({ articles }: RelatedItinerariesProps) {
  if (!articles || articles.length === 0) return null;
  return (
    <section className="mt-16 pt-8 border-t border-slate-200">
      <h2 className="text-xl font-black text-slate-900 mb-6">Ces itinéraires pourraient aussi t&apos;intéresser</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {articles.slice(0, 3).map((a) => (
          <RoadTripCard key={a._id} {...a} />
        ))}
      </div>
    </section>
  );
}
