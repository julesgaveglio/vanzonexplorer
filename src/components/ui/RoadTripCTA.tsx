import Link from "next/link";

export default function RoadTripCTA() {
  return (
    <section className="px-4 sm:px-6 py-10">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          {/* Top strip */}
          <div
            className="px-8 py-2 border-b border-slate-100 flex items-center gap-2"
            style={{
              background: "linear-gradient(135deg, #eff6ff 0%, #fefce8 50%, #f0fdf4 100%)",
            }}
          >
            <span>🤖</span>
            <span className="text-xs font-bold uppercase tracking-widest text-blue-600">
              Outil gratuit · Généré par IA
            </span>
          </div>

          {/* Body */}
          <div className="px-8 py-7 flex flex-col sm:flex-row items-center gap-6">
            {/* Icon */}
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0 border border-blue-100"
              style={{ background: "linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)" }}
            >
              🗺️
            </div>

            {/* Text */}
            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-lg font-extrabold text-slate-900 mb-1">
                Crée ton road trip van personnalisé
              </h2>
              <p className="text-sm text-slate-500 leading-relaxed">
                Dis-nous ta région, ta durée, ce qui te fait vibrer. On génère ton itinéraire
                complet&nbsp;: étapes, spots nature, parkings et activités.
              </p>
            </div>

            {/* CTA */}
            <div className="flex-shrink-0 flex flex-col items-center gap-2">
              <Link
                href="/road-trip-personnalise"
                className="inline-flex items-center justify-center gap-2 text-white font-bold text-sm px-6 py-3 rounded-full transition-all hover:shadow-lg active:scale-95"
                style={{
                  background: "linear-gradient(135deg, #2563eb 0%, #0ea5e9 100%)",
                  boxShadow: "0 4px 14px rgba(37,99,235,0.3)",
                }}
              >
                Créer mon itinéraire gratuit →
              </Link>
              <div className="flex gap-3 text-xs text-slate-400">
                <span>✓ IA</span>
                <span>✓ 60 sec</span>
                <span>✓ Gratuit</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
