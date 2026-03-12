import { adminReadClient } from "@/lib/sanity/adminClient";
import { groq } from "next-sanity";

const spotsQuery = groq`
  *[_type == "spotPaysBasque"] | order(name asc) {
    _id,
    name,
    "slug": slug.current,
    category,
    description,
    "img": mainImage.asset->url
  }
`;

type Spot = {
  _id: string;
  name: string;
  slug: string;
  category?: string;
  description?: string;
  img?: string;
};

const categoryColors: Record<string, { bg: string; color: string }> = {
  surf: { bg: "#EFF6FF", color: "#3B82F6" },
  montagne: { bg: "#F0FDF4", color: "#10B981" },
  gastronomie: { bg: "#FFFBEB", color: "#F59E0B" },
  culture: { bg: "#FDF4FF", color: "#A855F7" },
  bivouac: { bg: "#F0FDF4", color: "#10B981" },
  default: { bg: "#F8FAFC", color: "#64748B" },
};

export default async function AdminSpotsPage() {
  const spots = await adminReadClient.fetch<Spot[]>(spotsQuery);
  const total = spots?.length ?? 0;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-slate-400 text-sm font-medium mb-1">Administration</p>
          <h1 className="text-3xl font-black text-slate-900">Spots Pays Basque</h1>
          <p className="text-slate-500 mt-1">{total} spot{total > 1 ? "s" : ""} references</p>
        </div>
        <a
          href="/studio/structure/spotPaysBasque;new"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 font-semibold text-white text-sm px-5 py-2.5 rounded-xl transition-all"
          style={{ background: "linear-gradient(135deg, #8B5CF6 0%, #A855F7 100%)", boxShadow: "0 4px 14px rgba(139,92,246,0.35)" }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Ajouter un spot
        </a>
      </div>

      {total === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-16 text-center">
          <p className="text-slate-400 text-sm">Aucun spot dans Sanity.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {spots.map((spot) => {
            const cat = categoryColors[spot.category ?? "default"] ?? categoryColors.default;
            return (
              <div key={spot._id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-all group">
                <div className="relative h-36 bg-slate-100 overflow-hidden">
                  {spot.img ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={`${spot.img}?w=500&h=300&fit=crop&auto=format`}
                      alt={spot.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-4xl">📍</span>
                    </div>
                  )}
                  {spot.category && (
                    <span
                      className="absolute top-3 left-3 text-xs font-semibold px-2.5 py-1 rounded-lg capitalize"
                      style={{ background: cat.bg, color: cat.color }}
                    >
                      {spot.category}
                    </span>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-slate-900 text-sm">{spot.name}</h3>
                    <a
                      href={`/studio/structure/spotPaysBasque;${spot._id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-7 h-7 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 hover:bg-blue-50 hover:text-blue-500 transition-all"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </a>
                  </div>
                  {spot.description && (
                    <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">{spot.description}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
