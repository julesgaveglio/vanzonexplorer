import type { Metadata } from "next";
import Image from "next/image";
import LiquidButton from "@/components/ui/LiquidButton";

export const metadata: Metadata = {
  title: "À propos — Jules & Elio | Vanzon Explorer",
  description:
    "Découvrez Jules et Elio, co-fondateurs de Vanzon Explorer. Passionnés de vanlife, ils accompagnent chaque projet de A à Z — de l'aménagement du fourgon à la mise en location rentable au Pays Basque.",
};

export default function AProposPage() {
  return (
    <>
      {/* ── Hero ── */}
      <section
        className="py-20 md:py-28"
        style={{ background: "linear-gradient(160deg, #EFF6FF 0%, #F0FDFF 100%)" }}
      >
        <div className="max-w-4xl mx-auto px-6 text-center">
          <span className="inline-block text-xs font-semibold uppercase tracking-widest text-slate-400 mb-4">
            Vanzon Explorer
          </span>
          <h1 className="text-4xl md:text-6xl font-black text-slate-900 leading-tight">
            Jules &amp; Elio
          </h1>
          <p className="text-lg text-slate-500 mt-4 max-w-2xl mx-auto leading-relaxed">
            Tous les deux animés par la même envie de liberté, de voyage et de vie en van — unis pour créer une formation complète autour de l&apos;aménagement et de l&apos;exploitation d&apos;un van.
          </p>
        </div>
      </section>

      {/* ── Photos ── */}
      <section className="bg-white py-16">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-3 gap-3 md:gap-4">
            <div className="relative aspect-[3/4] rounded-2xl overflow-hidden">
              <Image
                src="https://cdn.sanity.io/images/lewexa74/production/16f9120e659bdd4bba47e663e9df9a1a9293fe3f-1170x2080.jpg"
                alt="Jules co-fondateur Vanzon Explorer - expert business et location van Pays Basque"
                fill
                className="object-cover hover:scale-105 transition-transform duration-500"
                priority
              />
            </div>
            <div className="relative aspect-[3/4] rounded-2xl overflow-hidden">
              <Image
                src="https://cdn.sanity.io/images/lewexa74/production/28a2c5acbe2ee16169d4ace1ab0522481c43d356-1170x2080.jpg"
                alt="Jules et Elio fondateurs Vanzon Explorer - construction van aménagé Pays Basque"
                fill
                className="object-cover hover:scale-105 transition-transform duration-500"
              />
            </div>
            <div className="relative aspect-[3/4] rounded-2xl overflow-hidden">
              <Image
                src="https://cdn.sanity.io/images/lewexa74/production/325f3ebf1d68fd890487229864c73cc65bef20d3-1186x1654.png"
                alt="Elio co-fondateur Vanzon Explorer - spécialiste mécanique et aménagement fourgon"
                fill
                className="object-cover hover:scale-105 transition-transform duration-500"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── Profils ── */}
      <section className="bg-[#F8FAFC] py-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

            {/* Elio */}
            <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-2xl">🔧</div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Elio</h2>
                  <span className="text-sm text-amber-600 font-medium">Directeur Général &amp; Co-fondateur</span>
                </div>
              </div>
              <p className="text-slate-600 leading-relaxed">
                Elio est le spécialiste du concret et surtout de la mécanique. C&apos;est lui qui t&apos;aide à <strong className="text-slate-800">choisir le bon fourgon dès le départ</strong>, éviter les erreurs qui coûtent très cher, analyser l&apos;état réel d&apos;un véhicule, négocier au bon prix et viser le meilleur rapport qualité-prix.
              </p>
              <div className="flex flex-wrap gap-2 mt-6">
                {["Mécanique", "Aménagement", "Choix fourgon", "Négociation"].map((tag) => (
                  <span key={tag} className="text-xs font-medium bg-amber-50 text-amber-700 px-3 py-1 rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Jules */}
            <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-2xl">🚀</div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Jules</h2>
                  <span className="text-sm text-blue-600 font-medium">Président &amp; Co-fondateur</span>
                </div>
              </div>
              <p className="text-slate-600 leading-relaxed">
                Jules est tourné vers la stratégie et l&apos;innovation. <strong className="text-slate-800">Business model, marketing, mise en location, rentabilité</strong> — il apporte la vision entrepreneuriale pour transformer un van aménagé en véritable source de revenus. Il maîtrise aussi l&apos;IA pour automatiser les tâches techniques et marketing.
              </p>
              <div className="flex flex-wrap gap-2 mt-6">
                {["Business", "Marketing", "IA", "Location", "Rentabilité"].map((tag) => (
                  <span key={tag} className="text-xs font-medium bg-blue-50 text-blue-700 px-3 py-1 rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Mission commune ── */}
      <section className="bg-white py-20">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-slate-900">Un projet commun</h2>
          </div>
          <p className="text-slate-600 leading-relaxed text-lg text-center">
            Ensemble, ils accompagnent chaque participant <strong className="text-slate-900">de A à Z</strong> — de l&apos;idée initiale jusqu&apos;à la mise sur la route et au-delà. L&apos;objectif n&apos;est pas seulement de construire un van, mais de <strong className="text-slate-900">bâtir un projet solide long terme, rentable et aligné avec un mode de vie plus libre.</strong>
          </p>
          <div className="flex gap-4 mt-10 justify-center flex-wrap">
            <LiquidButton href={process.env.NEXT_PUBLIC_GHL_BOOKING_URL || "/formation"} external>📅 Réserver un appel gratuit →</LiquidButton>
            <LiquidButton variant="ghost" href="/location">Louer un van</LiquidButton>
          </div>
        </div>
      </section>
    </>
  );
}
