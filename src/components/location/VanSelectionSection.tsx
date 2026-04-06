import Link from "next/link";
import { sanityFetch } from "@/lib/sanity/client";
import { getAllLocationVansQuery } from "@/lib/sanity/queries";
import type { VanCard as VanCardType } from "@/lib/sanity/types";
import VanCard from "@/components/van/VanCard";

interface VanSelectionSectionProps {
  destination: string;
}

export default async function VanSelectionSection({ destination }: VanSelectionSectionProps) {
  const vans = await sanityFetch<VanCardType[]>(getAllLocationVansQuery);

  if (!vans || vans.length === 0) return null;

  return (
    <section id="nos-vans" className="py-20 bg-white scroll-mt-20">
      <div className="max-w-6xl mx-auto px-6">

        {/* Header */}
        <div className="text-center mb-14">
          <span className="inline-flex items-center gap-2 bg-blue-50 text-[#4D5FEC] text-sm font-bold px-4 py-1.5 rounded-full mb-4">
            🚐 Nos vans
          </span>
          <h2 className="text-4xl font-black text-slate-900 mb-3">
            Choisissez votre van
          </h2>
          <p className="text-slate-500 text-lg max-w-xl mx-auto">
            Deux vans aménagés, tout équipés, assurance incluse.
            Récupération à Cambo-les-Bains — 30 min de {destination}.
          </p>
        </div>

        {/* Van cards — identiques à la homepage */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mb-10">
          {vans.map((van) => (
            <VanCard key={van._id} van={van} mode="location" />
          ))}
        </div>

        {/* Confiance + lien page location */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50 rounded-2xl px-6 py-4">
          <div className="flex flex-wrap justify-center sm:justify-start items-center gap-x-6 gap-y-2 text-sm text-slate-500">
            <span className="flex items-center gap-1.5">✅ Annulation flexible</span>
            <span className="flex items-center gap-1.5">🛡️ Assurance tous risques</span>
            <span className="flex items-center gap-1.5">📍 Départ depuis Cambo-les-Bains</span>
          </div>
          <Link
            href="/location"
            className="text-sm font-semibold text-[#4D5FEC] hover:underline flex-shrink-0"
          >
            Voir tous les détails →
          </Link>
        </div>
      </div>
    </section>
  );
}
