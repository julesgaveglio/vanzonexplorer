import Image from "next/image";
import Link from "next/link";
import { VANS_LANDING } from "@/lib/data/vans";

/**
 * Encart sidebar « Vans à vendre » sur les articles catégorie "Achat Van".
 * Source de vérité unique : src/lib/data/vans.ts — mêmes prix, statuts et
 * pastilles que la page /achat (tout changement s'y répercute automatiquement).
 */
export default function SidebarVanSaleAd() {
  const vans = VANS_LANDING.filter((v) => v.status === "Disponible");
  if (vans.length === 0) return null;

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
      {/* Header */}
      <p className="text-[11px] font-bold uppercase tracking-widest text-[var(--accent)] mb-1">
        Marketplace Vanzon
      </p>
      <p className="font-sans text-sm font-bold text-slate-900 mb-1">Vans aménagés à vendre</p>
      <p className="text-[11px] text-slate-400 mb-3 leading-relaxed">
        Annonces vérifiées · remise en main propre au Pays Basque.
      </p>

      {/* Annonces */}
      <div className="space-y-3">
        {vans.map((van) => (
          <Link
            key={van.id}
            href={van.href}
            className="group block rounded-xl overflow-hidden border border-slate-200/80 bg-white hover:shadow-md hover:border-slate-300 transition-all duration-200"
          >
            {/* Photo */}
            <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
              <Image
                src={van.images[0]}
                alt={`Van aménagé ${van.model} à vendre — ${van.locationLabel}`}
                fill
                sizes="280px"
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <span className="absolute top-2 left-2 bg-white/95 backdrop-blur-sm text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                {van.tag}
              </span>
              <span className="absolute bottom-2 right-2 bg-white/95 backdrop-blur-sm text-slate-900 font-sans text-sm font-black px-2.5 py-1 rounded-lg shadow-sm">
                {van.price}
              </span>
            </div>

            {/* Infos */}
            <div className="p-3">
              <h4 className="font-sans font-bold text-slate-900 text-[13px] leading-snug group-hover:text-[var(--accent)] transition-colors">
                Van aménagé {van.model} — {van.name}
              </h4>

              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                    van.vasp
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-amber-50 text-amber-700 border-amber-200"
                  }`}
                >
                  {van.vasp ? "VASP" : "Non VASP"}
                </span>
                <span className="text-[10px] font-medium text-slate-500">
                  {van.year} · {van.mileage}
                </span>
              </div>

              <p className="flex items-center gap-1 text-[10px] text-slate-400 font-medium mt-2">
                <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                </svg>
                {van.locationLabel} · Pays Basque
              </p>
            </div>
          </Link>
        ))}
      </div>

      {/* Lien listing */}
      <Link
        href="/achat"
        className="mt-3 flex items-center justify-center gap-1.5 text-[12px] font-bold text-[var(--accent)] hover:gap-2.5 transition-all"
      >
        Voir toutes les annonces
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </Link>
    </div>
  );
}
