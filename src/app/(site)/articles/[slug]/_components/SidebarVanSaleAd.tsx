import { sanityFetch } from "@/lib/sanity/client";
import { getAllSaleVansQuery } from "@/lib/sanity/queries";
import type { VanCard } from "@/lib/sanity/types";
import Image from "next/image";
import Link from "next/link";

export default async function SidebarVanSaleAd() {
  const vans = await sanityFetch<VanCard[]>(getAllSaleVansQuery);
  if (!vans || vans.length === 0) return null;

  return (
    <div className="rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50/60 to-white p-4">
      <div className="flex items-center gap-2 mb-3">
        <svg className="w-4 h-4 text-violet-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 18l6-6-6-6" />
        </svg>
        <p className="text-xs font-bold uppercase tracking-widest text-violet-500">
          Vans à vendre
        </p>
      </div>

      <div className="space-y-3">
        {vans.map((van) => (
          <Link
            key={van._id}
            href={`/achat/${van.slug}`}
            className="group block rounded-xl overflow-hidden border border-slate-100 bg-white hover:shadow-md transition-all duration-200 hover:-translate-y-0.5"
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
                {/* Badge Vanzon */}
                <div className="absolute top-2 left-2 flex items-center gap-1 bg-[#4D5FEC] text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                  <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                  Vanzon
                </div>
              </div>
            )}

            {/* Infos */}
            <div className="p-3">
              <h4 className="font-bold text-slate-900 text-xs leading-tight mb-1 group-hover:text-[#4D5FEC] transition-colors">
                {van.name}
              </h4>
              <p className="flex items-center gap-1 text-[10px] text-slate-400 mb-2">
                <svg className="w-3 h-3 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path fillRule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-2.079 3.218-4.396 3.218-6.327a8.5 8.5 0 10-17 0c0 1.93 1.274 4.248 3.218 6.327a19.58 19.58 0 002.856 2.874l.087.066.013.01zm0 0zM12 13.5a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                </svg>
                Cambo-les-Bains (64)
              </p>
              <div className="flex items-baseline gap-1">
                {van.salePrice ? (
                  <>
                    <span className="text-base font-black text-slate-900">
                      {van.salePrice.toLocaleString("fr-FR")}€
                    </span>
                  </>
                ) : (
                  <span className="text-xs text-slate-400">Prix sur demande</span>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>

      <Link
        href="/achat"
        className="mt-3 block text-center text-xs font-semibold text-violet-500 hover:text-[#4D5FEC] transition-colors"
      >
        Voir tous les vans à vendre →
      </Link>
    </div>
  );
}
