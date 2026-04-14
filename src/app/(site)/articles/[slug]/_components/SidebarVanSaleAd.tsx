import { sanityFetch } from "@/lib/sanity/client";
import { getAllSaleVansQuery } from "@/lib/sanity/queries";
import type { VanCard } from "@/lib/sanity/types";
import Image from "next/image";
import Link from "next/link";

const equipIcons: { key: keyof VanCard; label: string; icon: string }[] = [
  { key: "eq_kitchen", label: "Cuisine", icon: "M3 3h18v18H3V3zm2 2v14h14V5H5zm3 3h8v2H8V8zm0 4h5v2H8v-2z" },
  { key: "eq_shower", label: "Douche", icon: "M7 3v2H5v2h2v14h2V7h6v14h2V7h2V5h-2V3H7zm0 0" },
  { key: "eq_solar", label: "Solaire", icon: "M12 2v3m0 14v3M4.22 4.22l2.12 2.12m11.32 11.32l2.12 2.12M2 12h3m14 0h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12M12 8a4 4 0 100 8 4 4 0 000-8z" },
];

export default async function SidebarVanSaleAd() {
  const vans = await sanityFetch<VanCard[]>(getAllSaleVansQuery);
  if (!vans || vans.length === 0) return null;

  return (
    <div className="rounded-2xl border border-violet-100/80 bg-gradient-to-br from-violet-50/50 via-white to-slate-50/30 p-4 shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-2 mb-1">
        <div className="w-6 h-6 rounded-lg bg-violet-100 flex items-center justify-center">
          <svg className="w-3.5 h-3.5 text-violet-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" />
            <line x1="7" y1="7" x2="7.01" y2="7" />
          </svg>
        </div>
        <p className="text-[11px] font-bold uppercase tracking-widest text-violet-600">
          Nos vans à vendre
        </p>
      </div>
      <p className="text-[10px] text-slate-400 mb-3 leading-relaxed">
        Vans aménagés prêts à partir, basés au Pays Basque.
      </p>

      {/* Van cards */}
      <div className="space-y-3">
        {vans.map((van) => {
          const equips = equipIcons.filter((e) => van[e.key]);

          return (
            <Link
              key={van._id}
              href={`/achat/${van.slug}`}
              className="group block rounded-xl overflow-hidden border border-slate-100 bg-white hover:shadow-md hover:border-violet-200/60 transition-all duration-200 hover:-translate-y-0.5"
            >
              {/* Image */}
              {van.mainImage?.url && (
                <div className="relative aspect-[16/10] overflow-hidden">
                  <Image
                    src={van.mainImage.url}
                    alt={van.mainImage.alt ?? van.name}
                    fill
                    sizes="240px"
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {/* Overlay gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />

                  {/* Prix en overlay */}
                  {van.salePrice && (
                    <div className="absolute bottom-2 right-2 bg-white/95 backdrop-blur-sm text-slate-900 text-sm font-black px-2.5 py-1 rounded-lg shadow-sm">
                      {van.salePrice.toLocaleString("fr-FR")}&thinsp;€
                    </div>
                  )}
                </div>
              )}

              {/* Infos */}
              <div className="p-3">
                <h4 className="font-bold text-slate-900 text-[13px] leading-tight mb-1.5 group-hover:text-violet-600 transition-colors">
                  {van.name}
                </h4>

                {/* Meta row */}
                <div className="flex items-center gap-2 text-[10px] text-slate-400 mb-2">
                  <span className="flex items-center gap-1">
                    <svg className="w-3 h-3 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                      <path fillRule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-2.079 3.218-4.396 3.218-6.327a8.5 8.5 0 10-17 0c0 1.93 1.274 4.248 3.218 6.327a19.58 19.58 0 002.856 2.874l.087.066.013.01zm0 0zM12 13.5a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                    </svg>
                    Cambo (64)
                  </span>
                  {van.capacity && (
                    <span className="flex items-center gap-1">
                      <svg className="w-3 h-3 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
                      </svg>
                      {van.capacity} pers.
                    </span>
                  )}
                  {van.vanType && (
                    <span className="text-slate-300">|</span>
                  )}
                  {van.vanType && (
                    <span className="capitalize">{van.vanType}</span>
                  )}
                </div>

                {/* Equip pills */}
                {equips.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {equips.map((e) => (
                      <span
                        key={e.key}
                        className="text-[9px] font-medium text-violet-600 bg-violet-50 px-1.5 py-0.5 rounded"
                      >
                        {e.label}
                      </span>
                    ))}
                  </div>
                )}

                {/* Prix (fallback si pas d'image) */}
                {!van.mainImage?.url && (
                  <div className="mt-2">
                    {van.salePrice ? (
                      <span className="text-base font-black text-slate-900">
                        {van.salePrice.toLocaleString("fr-FR")}&thinsp;€
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">Prix sur demande</span>
                    )}
                  </div>
                )}
              </div>
            </Link>
          );
        })}
      </div>

      {/* Footer link */}
      <Link
        href="/achat"
        className="mt-3 flex items-center justify-center gap-1 text-[11px] font-semibold text-violet-500 hover:text-violet-700 transition-colors"
      >
        Voir tous nos vans
        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </Link>
    </div>
  );
}
