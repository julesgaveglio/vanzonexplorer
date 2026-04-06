import { createSupabaseAnon } from "@/lib/supabase/server";
import { sanityFetch } from "@/lib/sanity/client";
import { getAllLocationVansQuery } from "@/lib/sanity/queries";
import type { VanCard as VanCardType } from "@/lib/sanity/types";
import { slugify } from "@/lib/slugify";
import Link from "next/link";
import VanCard from "@/components/van/VanCard";
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
  const [supabaseResult, sanityVans] = await Promise.all([
    createSupabaseAnon()
      .from("marketplace_vans")
      .select("id, title, van_brand, van_model, location_city, price_per_day, sleeps, seats, photos")
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .limit(12),
    sanityFetch<VanCardType[]>(getAllLocationVansQuery).catch(() => []),
  ]);

  const marketplaceVans = (supabaseResult.data ?? []) as MarketplaceVan[];
  const officialVans = (sanityVans ?? []) as VanCardType[];

  const totalCount = officialVans.length + marketplaceVans.length;
  if (totalCount === 0) return null;

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-end justify-between mb-10">
          <div>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900">
              Vans disponibles en France
            </h2>
            <p className="text-slate-500 mt-2">
              {totalCount} van{totalCount > 1 ? "s" : ""} sélectionné{totalCount > 1 ? "s" : ""} par Vanzon Explorer
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
          {/* Vans Vanzon Explorer en premier */}
          {officialVans.map((van) => (
            <VanCard key={van._id} van={van} mode="location" />
          ))}

          {/* Vans marketplace ensuite */}
          {marketplaceVans.map((van) => (
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
