import { createSupabaseAnon } from "@/lib/supabase/server";
import { slugify } from "@/lib/slugify";
import Link from "next/link";

interface MarketplaceVan {
  id: string;
  title: string;
  van_brand: string;
  van_model: string;
  location_city: string;
  price_per_day: number;
  sleeps: number;
  photos: string[];
}

export default async function MarketplaceVansSection() {
  const supabase = createSupabaseAnon();
  const { data: vans } = await supabase
    .from("marketplace_vans")
    .select("id, title, van_brand, van_model, location_city, price_per_day, sleeps, photos")
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(12);

  const items = (vans ?? []) as MarketplaceVan[];
  if (items.length === 0) return null;

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-end justify-between mb-10">
          <div>
            <span className="badge-glass !px-4 !py-1.5 text-sm font-semibold mb-4 inline-block text-accent-blue">
              🚐 Plateforme nationale
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900">
              Vans disponibles en France
            </h2>
            <p className="text-slate-500 mt-2">
              {items.length} van{items.length > 1 ? "s" : ""} sélectionné{items.length > 1 ? "s" : ""} par Vanzon Explorer
            </p>
          </div>
          <Link
            href="/location"
            className="hidden sm:flex items-center gap-1.5 text-sm font-semibold hover:underline"
            style={{ color: "#4D5FEC" }}
          >
            Voir tous
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {items.map((van) => {
            const citySlug = slugify(van.location_city);
            const href = `/location/${citySlug}/${van.id.slice(0, 8)}`;
            return (
              <Link
                key={van.id}
                href={href}
                className="glass-card-hover group rounded-2xl overflow-hidden border border-slate-100 hover:shadow-lg transition-all hover:-translate-y-0.5"
              >
                <div className="aspect-[4/3] bg-slate-100 overflow-hidden">
                  {van.photos?.[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={van.photos[0]}
                      alt={van.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-300 text-5xl">🚐</div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-slate-900 text-sm line-clamp-1 mb-1">{van.title}</h3>
                  <p className="text-slate-400 text-xs mb-3 flex items-center gap-1">
                    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    </svg>
                    {van.location_city}
                  </p>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xl font-black text-slate-900">{van.price_per_day}€</span>
                      <span className="text-slate-400 text-xs">/jour</span>
                    </div>
                    <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded-lg">
                      {van.sleeps} couchage{van.sleeps > 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="sm:hidden mt-6 text-center">
          <Link href="/location" className="btn-ghost px-6 py-3 rounded-xl font-semibold text-sm inline-flex">
            Voir tous les vans →
          </Link>
        </div>
      </div>
    </section>
  );
}
