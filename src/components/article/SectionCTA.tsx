import Link from "next/link";

// ── SECTION_CTAS constant ──────────────────────────────────────────────────────

export const SECTION_CTAS = [
  {
    label: "Louer un van pour ce road trip",
    sub: "Disponible dès 65€/nuit — livraison Pays Basque possible",
    href: "/location",
    cta: "Voir les vans disponibles →",
    accent: "bg-[#4D5FEC] hover:bg-[#3B4FD4]",
    icon: "🚐",
  },
  {
    label: "Votre propre van aménagé",
    sub: "Accompagnement personnalisé pour trouver et aménager votre van",
    href: "/achat",
    cta: "Parler à Jules →",
    accent: "bg-slate-900 hover:bg-slate-800",
    icon: "🔑",
  },
] as const;

// ── SectionCTA component ───────────────────────────────────────────────────────

export function SectionCTA({ index }: { index: number }) {
  const cta = SECTION_CTAS[index % SECTION_CTAS.length];
  return (
    <div className="my-10 p-6 rounded-2xl border border-slate-100 bg-gradient-to-br from-slate-50 to-blue-50/30 flex flex-col sm:flex-row items-center gap-5">
      <span className="text-4xl flex-shrink-0">{cta.icon}</span>
      <div className="flex-1 text-center sm:text-left">
        <p className="font-bold text-slate-900 text-base">{cta.label}</p>
        <p className="text-sm text-slate-500 mt-0.5">{cta.sub}</p>
      </div>
      <Link
        href={cta.href}
        className={`btn-shine flex-shrink-0 inline-flex items-center justify-center gap-2 text-white font-bold px-6 py-3 rounded-xl transition-colors text-sm relative overflow-hidden ${cta.accent}`}
      >
        {cta.cta}
      </Link>
    </div>
  );
}
