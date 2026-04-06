import type { VanCard as VanCardType } from "@/lib/sanity/types";
import Link from "next/link";
import VanImageCarousel from "./VanImageCarousel";

interface VanCardProps {
  van: VanCardType;
  mode: "location" | "achat";
}

export default function VanCard({ van, mode }: VanCardProps) {
  const href = mode === "location" ? `/location/${van.slug}` : `/achat/${van.slug}`;

  const slides = [
    ...(van.mainImage?.url ? [{ url: van.mainImage.url, alt: van.mainImage.alt || van.name }] : []),
    ...(van.gallery?.filter((g) => g?.url).map((g) => ({ url: g.url, alt: g.alt || van.name })) ?? []),
  ];

  const price = mode === "location" ? van.startingPricePerNight : van.salePrice;
  const priceSuffix = mode === "location" ? "/jour" : "€";
  const priceLabel = mode === "achat" ? "" : "€";

  return (
    <Link
      href={href}
      className="group rounded-2xl overflow-hidden border border-slate-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-white flex flex-col"
    >
      {/* Photo */}
      <div className="relative aspect-[4/3] overflow-hidden flex-shrink-0">
        <VanImageCarousel slides={slides} name={van.name} />

        {/* Badge Vanzon Explorer */}
        <div className="absolute top-3 left-3 z-30 flex items-center gap-1.5 bg-[#4D5FEC] text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-md">
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
          Vanzon Explorer
        </div>
      </div>

      {/* Infos */}
      <div className="p-4 flex flex-col gap-2">
        <h3 className="font-bold text-slate-900 text-sm line-clamp-1">{van.name}</h3>

        {/* Localisation */}
        <p className="flex items-center gap-1.5 text-slate-400 text-xs">
          <svg className="w-3.5 h-3.5 flex-shrink-0 text-slate-400" viewBox="0 0 24 24" fill="currentColor">
            <path fillRule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-2.079 3.218-4.396 3.218-6.327a8.5 8.5 0 10-17 0c0 1.93 1.274 4.248 3.218 6.327a19.58 19.58 0 002.856 2.874l.087.066.013.01zm0 0zM12 13.5a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
          </svg>
          Cambo-les-Bains (64250)
        </p>

        {/* Prix + voyageurs */}
        <div className="flex items-center justify-between mt-1">
          <div className="flex items-baseline gap-0.5">
            {price ? (
              <>
                <span className="text-xl font-black text-slate-900">
                  {mode === "achat" ? price.toLocaleString("fr-FR") : price}{priceLabel}
                </span>
                <span className="text-slate-400 text-xs">{priceSuffix}</span>
              </>
            ) : (
              <span className="text-sm text-slate-400">Prix sur demande</span>
            )}
          </div>

          {van.capacity && (
            <div className="flex items-center gap-1 text-xs text-slate-500 bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-lg">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
              </svg>
              {van.capacity} voyageur{van.capacity > 1 ? "s" : ""}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
