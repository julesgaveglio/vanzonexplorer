import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Location Van Aménagé Saint-Jean-de-Luz | Vanzon Explorer",
  description:
    "Louez un van aménagé à Saint-Jean-de-Luz dès 65€/nuit. Port pittoresque, plage protégée, pintxos et ambiance basque authentique. Assurance incluse, départ Bayonne.",
  alternates: {
    canonical: "https://vanzonexplorer.com/location/saint-jean-de-luz",
  },
};

const highlights = [
  { icon: "⛵", label: "Le port", desc: "L'un des plus beaux ports de pêche de la côte Atlantique française" },
  { icon: "🏖️", label: "Plage de Saint-Jean-de-Luz", desc: "Baie protégée, eaux calmes — parfaite pour les familles" },
  { icon: "🏛️", label: "Maison Louis XIV", desc: "Classée monument historique, berceau du mariage royal de 1660" },
  { icon: "🍰", label: "Maison Adam", desc: "Les macarons basques les plus célèbres depuis 1660" },
  { icon: "🌶️", label: "Rue Gambetta", desc: "Rue piétonne animée, boutiques basques, restaurants, bars à pintxos" },
  { icon: "🎣", label: "Ciboure", desc: "Village voisin, maisons colorées face à la mer — calme et authentique" },
];

export default function LocationSaintJeanDeLuzPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative min-h-[70vh] flex items-end overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="https://cdn.sanity.io/images/lewexa74/production/0b3f81d08627ba0b4423224029cb5016d0e7ed25-2048x1365.jpg"
            alt="Van aménagé à Saint-Jean-de-Luz au Pays Basque"
            fill
            className="object-cover object-center"
            priority
            unoptimized
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-900/50 to-slate-900/10" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 pb-20 pt-32 w-full">
          <nav aria-label="Fil d'Ariane" className="mb-6">
            <ol className="flex items-center gap-2 text-white/50 text-xs font-medium">
              <li><Link href="/" className="hover:text-white/80 transition-colors">Accueil</Link></li>
              <li>›</li>
              <li><Link href="/location" className="hover:text-white/80 transition-colors">Location</Link></li>
              <li>›</li>
              <li className="text-white/80">Saint-Jean-de-Luz</li>
            </ol>
          </nav>

          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-4 py-2 mb-6">
              <span>⛵</span>
              <span className="text-white/90 text-sm font-medium">Joyau du Pays Basque — à 25 min de Bayonne</span>
            </div>

            <h1 className="text-5xl md:text-6xl font-black text-white leading-tight mb-6">
              Location van aménagé<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4BC3E3] to-sky-400">
                Saint-Jean-de-Luz
              </span>
            </h1>

            <p className="text-xl text-white/75 leading-relaxed mb-8">
              Van aménagé tout équipé pour explorer Saint-Jean-de-Luz et la côte basque.
              Plage protégée, port authentique, gastronomie basque — le charme du Pays Basque
              dans toute sa splendeur.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/location#nos-vans"
                className="inline-flex items-center justify-center gap-2 bg-white text-slate-900 font-bold px-8 py-4 rounded-xl hover:bg-blue-50 transition-colors text-lg shadow-2xl"
              >
                Voir nos vans disponibles
              </Link>
              <a
                href="https://www.yescapa.fr/campers/89215"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-white/10 backdrop-blur-md border border-white/30 text-white font-bold px-8 py-4 rounded-xl hover:bg-white/20 transition-colors text-lg"
              >
                Réserver maintenant →
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Confiance */}
      <section className="bg-slate-950 py-5 border-t border-white/5">
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex flex-wrap justify-center md:justify-between items-center gap-y-4 gap-x-8 text-white/60 text-sm font-medium">
            {[
              { icon: "📍", text: "Départ Bayonne — 25 min de Saint-Jean-de-Luz" },
              { icon: "🛡️", text: "Assurance tous risques incluse" },
              { icon: "💰", text: "Dès 65€/nuit" },
              { icon: "⭐", text: "4.9/5 sur 33 avis Google" },
              { icon: "🚿", text: "Toilette sèche & cuisine à bord" },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-2">
                <span>{item.icon}</span>
                <span>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Points forts */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <span className="badge-glass !px-4 !py-1.5 text-sm font-semibold mb-4 inline-block" style={{ color: "#4D5FEC" }}>
              La destination
            </span>
            <h2 className="text-4xl font-black text-slate-900 mb-3">
              Saint-Jean-de-Luz en van — l&apos;authenticité basque
            </h2>
            <p className="text-slate-500 text-lg max-w-xl mx-auto">
              Saint-Jean-de-Luz concentre tout ce qu&apos;on aime du Pays Basque :
              architecture, gastronomie, plage et port de pêche dans un cadre protégé du vent
              et des grandes vagues.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {highlights.map((item) => (
              <div key={item.label} className="glass-card p-6 hover:shadow-glass-hover transition-all duration-300 group">
                <div className="text-4xl mb-4">{item.icon}</div>
                <h3 className="font-bold text-slate-900 text-lg mb-2 group-hover:text-[#4D5FEC] transition-colors">
                  {item.label}
                </h3>
                <p className="text-slate-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Infos pratiques */}
      <section className="py-20" style={{ background: "linear-gradient(160deg, #EFF6FF 0%, #F0FDFF 100%)" }}>
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-black text-slate-900 mb-6">
                Infos pratiques — Saint-Jean-de-Luz en van
              </h2>
              <div className="space-y-4">
                {[
                  { label: "Distance Bayonne", value: "25 min (D918) — route côtière panoramique" },
                  { label: "Spot nuit recommandé", value: "Aire municipale de Saint-Jean-de-Luz (7€/nuit, accès port)" },
                  { label: "Meilleure saison", value: "Toute l'année — baie protégée, peu de vent" },
                  { label: "Tarif van", value: "Dès 65€/nuit — assurance et équipements inclus" },
                  { label: "Marché local", value: "Mardi et vendredi matin — fruits, légumes, fromages basques" },
                  { label: "À combiner avec", value: "Hendaye (15 min), Biarritz (20 min), Espelette (30 min)" },
                ].map((row) => (
                  <div key={row.label} className="flex gap-4 border-b border-slate-100 pb-4">
                    <span className="text-sm font-semibold text-slate-400 w-40 flex-shrink-0">{row.label}</span>
                    <span className="text-sm text-slate-700">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative aspect-square rounded-3xl overflow-hidden">
              <Image
                src="https://cdn.sanity.io/images/lewexa74/production/660105a28e577c33f642a8fdff528d88925642e3-1080x750.png"
                alt="Van Yoni Vanzon Explorer à Saint-Jean-de-Luz"
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, #0F153A 0%, #1e2d6b 100%)" }} />
        <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-5 leading-tight">
            Saint-Jean-de-Luz vous attend.<br />Le van aussi.
          </h2>
          <p className="text-white/70 text-xl mb-10">
            Dès <strong className="text-white">65€/nuit</strong> — assurance incluse, van tout équipé,
            départ Bayonne.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <a
              href="https://www.yescapa.fr/campers/89215"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-white text-slate-900 font-bold px-10 py-5 rounded-2xl hover:bg-blue-50 transition-colors text-lg shadow-2xl"
            >
              Réserver Yoni — Yescapa
            </a>
            <a
              href="https://www.yescapa.fr/campers/98869"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-white/10 backdrop-blur-md border border-white/30 text-white font-bold px-10 py-5 rounded-2xl hover:bg-white/20 transition-colors text-lg"
            >
              Réserver Xalbat — Yescapa
            </a>
          </div>
          <p className="text-white/40 text-sm mt-6">
            <Link href="/road-trip-pays-basque-van" className="hover:text-white/60 transition-colors underline underline-offset-2">
              Voir l&apos;itinéraire road trip Pays Basque 7 jours
            </Link>
          </p>
        </div>
      </section>
    </>
  );
}
