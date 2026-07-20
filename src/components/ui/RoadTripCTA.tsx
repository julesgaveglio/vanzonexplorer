import Link from "next/link";

export default function RoadTripCTA() {
  return (
    <section className="px-4 sm:px-6 py-10">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm px-6 py-6 md:px-8 md:py-7 flex flex-col sm:flex-row sm:items-center gap-6">
          {/* Icône */}
          <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
            <svg className="w-5 h-5 text-[var(--accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
          </div>

          {/* Texte */}
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-widest text-[var(--accent)] mb-1">
              Outil gratuit
            </p>
            <h2 className="font-sans text-lg font-bold text-slate-900 tracking-tight">
              Créez votre road trip van personnalisé
            </h2>
            <p className="text-sm text-slate-500 leading-relaxed mt-1">
              Indiquez votre région, votre durée et vos envies — nous générons
              votre itinéraire complet : étapes, spots nature, parkings et activités.
            </p>
          </div>

          {/* CTA */}
          <div className="shrink-0 flex flex-col items-start sm:items-center gap-2">
            <Link
              href="/road-trip-personnalise"
              className="inline-flex items-center justify-center gap-2 bg-[var(--accent)] text-white font-bold text-sm px-6 py-3 rounded-xl hover:opacity-90 transition-opacity"
            >
              Créer mon itinéraire
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
            <p className="text-xs text-slate-400">Généré en 60 secondes · gratuit</p>
          </div>
        </div>
      </div>
    </section>
  );
}
