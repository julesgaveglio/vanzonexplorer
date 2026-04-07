import { createSupabaseAnon } from "@/lib/supabase/server";
import { sanityFetch } from "@/lib/sanity/client";
import { getAllLocationVansQuery } from "@/lib/sanity/queries";
import type { VanCard as VanCardType } from "@/lib/sanity/types";
import MarketplaceVansGrid from "./MarketplaceVansGrid";

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

  if (officialVans.length + marketplaceVans.length === 0) return null;

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <MarketplaceVansGrid
          officialVans={officialVans}
          marketplaceVans={marketplaceVans}
        />
      </div>
    </section>
  );
}
