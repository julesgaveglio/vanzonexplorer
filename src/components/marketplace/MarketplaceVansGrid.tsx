"use client";

import { useState } from "react";
import Link from "next/link";
import VanCard from "@/components/van/VanCard";
import MarketplaceVanCard from "./MarketplaceVanCard";
import { slugify } from "@/lib/slugify";
import type { VanCard as VanCardType } from "@/lib/sanity/types";

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

interface MarketplaceVansGridProps {
  officialVans: VanCardType[];
  marketplaceVans: MarketplaceVan[];
}

export default function MarketplaceVansGrid({
  officialVans,
  marketplaceVans,
}: MarketplaceVansGridProps) {
  const [activeRegion, setActiveRegion] = useState("Tous");

  const cities = Array.from(new Set(marketplaceVans.map((v) => v.location_city))).sort();
  const regions = ["Tous", ...(officialVans.length > 0 ? ["Pays Basque"] : []), ...cities];

  const filteredOfficial =
    activeRegion === "Tous" || activeRegion === "Pays Basque" ? officialVans : [];
  const filteredMarketplace =
    activeRegion === "Tous"
      ? marketplaceVans
      : activeRegion === "Pays Basque"
      ? []
      : marketplaceVans.filter((v) => v.location_city === activeRegion);

  const totalCount = officialVans.length + marketplaceVans.length;

  return (
    <>
      <div className="flex flex-col gap-4 mb-10">
        <div className="flex items-end justify-between">
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

        {regions.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {regions.map((region) => (
              <button
                key={region}
                onClick={() => setActiveRegion(region)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold border transition-colors ${
                  activeRegion === region
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
                }`}
              >
                {region}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {filteredOfficial.map((van) => (
          <VanCard key={van._id} van={van} mode="location" />
        ))}
        {filteredMarketplace.map((van) => (
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
    </>
  );
}
