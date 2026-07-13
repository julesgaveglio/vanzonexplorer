import Link from "next/link";
import { sanityFetch } from "@/lib/sanity/client";
import { getAllLocationVansQuery } from "@/lib/sanity/queries";
import type { VanCard as VanCardType } from "@/lib/sanity/types";
import VanCard from "@/components/van/VanCard";
import CamboMapSection from "./CamboMapSection";

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
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">
            Nos vans
          </p>
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-3">
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
            {["Annulation flexible", "Assurance tous risques", "Départ depuis Cambo-les-Bains"].map((t) => (
              <span key={t} className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-emerald-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                {t}
              </span>
            ))}
          </div>
          <Link
            href="/location"
            className="text-sm font-semibold text-[var(--accent)] hover:underline flex-shrink-0"
          >
            Voir tous les détails →
          </Link>
        </div>
      </div>

      <CamboMapSection destination={destination} />
    </section>
  );
}
