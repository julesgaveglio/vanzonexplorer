import { createSupabaseAnon } from "@/lib/supabase/server";
import { slugify } from "@/lib/slugify";
import Link from "next/link";
import MarketplaceVanCard from "./MarketplaceVanCard";

interface MarketplaceVan {
  id: string;
  title: string;
  van_brand: string;
  van_model: string;
  location_city: string;
  price_per_day: number;
  sleeps: number;
  seats: number | null;
  photos: string[];
}

export default async function MarketplaceVansSection() {
  const supabase = createSupabaseAnon();
  const { data: vans } = await supabase
    .from("marketplace_vans")
    .select("id, title, van_brand, van_model, location_city, price_per_day, sleeps, seats, photos")
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
          {items.map((van) => (
            <MarketplaceVanCard
              key={van.id}
              {...van}
              href={`/location/${slugify(van.location_city)}/${van.id}`}
            />
          ))}
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
