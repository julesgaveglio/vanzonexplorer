import type { Metadata } from "next";
import Image from "next/image";
import LiquidButton from "@/components/ui/LiquidButton";

export const metadata: Metadata = {
  title: "Pays Basque en van — Vantrips & Meilleurs Spots | Vanzon Explorer",
  description:
    "Découvrez les meilleurs spots et vantrips au Pays Basque avec Vanzon Explorer. Côte atlantique, montagnes, villages basques — les itinéraires arrivent bientôt.",
  alternates: {
    canonical: "https://vanzonexplorer.com/pays-basque",
  },
  robots: { index: false, follow: true },
};


export default function PaysBasquePage() {
  return (
    <>
      {/* ── Hero ── */}
      <section className="relative overflow-hidden min-h-[55vh] flex items-end">
        <div className="absolute inset-0">
          <Image
            src="https://cdn.sanity.io/images/lewexa74/production/0b3f81d08627ba0b4423224029cb5016d0e7ed25-2048x1365.jpg"
            alt="Pays Basque depuis un van - ikurriña et paysage basque Vanzon Explorer"
            fill
            sizes="100vw"
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/30 to-transparent" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-6 pb-16 w-full">
          <span className="inline-block text-xs font-semibold uppercase tracking-widest text-white/60 mb-3">
            Vanzon Explorer
          </span>
          <h1 className="text-5xl md:text-7xl font-black text-white leading-tight">
            Le Pays Basque, en van.
          </h1>
          <p className="text-lg text-white/80 mt-4 max-w-xl">
            Des plages de Biarritz aux sommets de la Rhune — explorez l&apos;une
            des régions les plus sauvages d&apos;Europe à votre rythme.
          </p>
        </div>
      </section>

      {/* ── Road Trip Feature + Coming soon ── */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-6">
          {/* Road Trip highlight */}
          <div className="mb-16 rounded-3xl overflow-hidden border border-blue-100" style={{ background: "linear-gradient(135deg, #EFF6FF 0%, #F0FDFF 100%)" }}>
            <div className="grid md:grid-cols-2 gap-0">
              <div className="p-10 flex flex-col justify-center">
                <span className="inline-block text-xs font-semibold uppercase tracking-widest text-blue-500 mb-4">
                  Guide disponible maintenant
                </span>
                <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4 leading-tight">
                  Road Trip Pays Basque<br />en Van — 7 Jours
                </h2>
                <p className="text-slate-500 leading-relaxed mb-6">
                  L&apos;itinéraire complet de Biarritz à la Forêt d&apos;Irati :
                  étapes jour par jour, spots vanlife, budget détaillé et conseils pratiques pour
                  un road trip réussi au Pays Basque en van aménagé.
                </p>
                <div className="flex flex-wrap gap-3 mb-8">
                  {["7 jours d'itinéraire", "6 étapes clés", "Budget estimé", "FAQ pratique"].map((tag) => (
                    <span key={tag} className="text-xs font-semibold bg-white border border-blue-200 text-blue-700 px-3 py-1.5 rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
                <a
                  href="/road-trip-pays-basque-van"
                  className="inline-flex items-center gap-2 bg-slate-900 text-white font-bold px-8 py-4 rounded-xl hover:bg-slate-800 transition-colors self-start text-base"
                >
                  Lire le guide road trip →
                </a>
              </div>
              <div className="hidden md:block relative min-h-[300px]">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-transparent z-10" />
                <div className="absolute inset-0 overflow-hidden">
                  <div className="w-full h-full" style={{ backgroundImage: "url('https://cdn.sanity.io/images/lewexa74/production/f93fa16ab46d8934dcc3092a8e86fc80ebce4305-1080x750.png')", backgroundSize: "cover", backgroundPosition: "center" }} />
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ── CTA location ── */}
      <section
        className="py-20"
        style={{
          background: "linear-gradient(160deg, #EFF6FF 0%, #F0FDFF 100%)",
        }}
      >
        <div className="max-w-3xl mx-auto px-4 text-center">
          <span className="text-4xl mb-6 block">🚐</span>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 leading-snug">
            Prêt à partir maintenant ?
          </h2>
          <p className="text-slate-500 mt-3 max-w-md mx-auto leading-relaxed text-sm md:text-base">
            Nos vans aménagés sont disponibles dès aujourd&apos;hui pour
            explorer le Pays Basque à votre rythme.
          </p>
          <div className="flex gap-3 mt-8 justify-center flex-wrap">
            <LiquidButton href="/location">Louer un van</LiquidButton>
            <LiquidButton variant="ghost" href="/achat">
              Acheter un van
            </LiquidButton>
          </div>
        </div>
      </section>
    </>
  );
}
