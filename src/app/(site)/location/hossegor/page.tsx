import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { fetchPexelsPhoto } from "@/lib/pexels";
import { getGooglePlaceStats } from "@/lib/google-places";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Location Van Aménagé Hossegor — Surf & Vanlife | Vanzon Explorer",
  description:
    "Louez un van aménagé à Hossegor dès 65€/nuit. La Gravière, les Estagnots, ambiance surf culture — explorez les Landes et la côte basque en van avec Vanzon Explorer.",
  alternates: {
    canonical: "https://vanzonexplorer.com/location/hossegor",
  },
};

const FALLBACK_IMG = "https://cdn.sanity.io/images/lewexa74/production/f93fa16ab46d8934dcc3092a8e86fc80ebce4305-1080x750.png";

const highlights = [
  { icon: "🏄", label: "La Gravière", desc: "Le spot de surf le plus puissant d'Europe, étape du World Surf League" },
  { icon: "🌴", label: "Les Estagnots", desc: "Plage familiale avec vagues régulières, idéale hors haute saison" },
  { icon: "🌲", label: "Forêt landaise", desc: "Bivouac possible sous les pins — calme absolu à 5 min des plages" },
  { icon: "🛍️", label: "Village d'Hossegor", desc: "Boutiques surf, restaurants, bars en bois typiques des Landes" },
  { icon: "🌊", label: "Capbreton", desc: "Port de pêche voisin, marché frais, ambiance authentique" },
  { icon: "🎪", label: "Quiksilver Pro", desc: "En septembre, les meilleurs surfeurs du monde sont là" },
];

export default async function LocationHossegorPage() {
  const [photo, placeStats] = await Promise.all([
    fetchPexelsPhoto("hossegor surf waves landes beach france", FALLBACK_IMG),
    getGooglePlaceStats(),
  ]);

  return (
    <>
      {/* Hero */}
      <section className="relative -mt-16 min-h-screen flex items-end overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src={photo?.url ?? FALLBACK_IMG}
            alt="Van aménagé à Hossegor face à l'Atlantique"
            fill
            className="object-cover object-center sm:object-center object-right"
            priority
            unoptimized
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-900/50 to-slate-900/20" />
          <div className="absolute inset-0 bg-gradient-to-r from-blue-950/30 via-transparent to-transparent" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 pb-20 pt-32 w-full">
          <nav aria-label="Fil d'Ariane" className="mb-6">
            <ol className="flex items-center gap-2 text-white/50 text-xs font-medium">
              <li><Link href="/" className="hover:text-white/80 transition-colors">Accueil</Link></li>
              <li>›</li>
              <li><Link href="/location" className="hover:text-white/80 transition-colors">Location</Link></li>
              <li>›</li>
              <li className="text-white/80">Hossegor</li>
            </ol>
          </nav>

          <div className="max-w-2xl">
            <a
              href="https://www.google.com/maps/place/?q=place_id:ChIJ7-3ASe0oTyQR6vNHg7YRicA"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-4 py-2 mb-6 transition-transform hover:scale-105 cursor-pointer"
            >
              <span className="text-amber-400">★★★★★</span>
              <span className="text-white/90 text-sm font-medium">{placeStats.reviewCount} avis Google · Départ Cambo-les-Bains</span>
            </a>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-white leading-[1.05] mb-6">
              Location van aménagé<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-[#4BC3E3]">
                à Hossegor
              </span>
            </h1>

            <p className="text-xl text-white/75 leading-relaxed mb-8 max-w-xl">
              Van aménagé tout équipé pour explorer Hossegor, Capbreton et la côte Landes-Basque.
              Dormez à 500 m de La Gravière — le spot de surf le plus mythique d&apos;Europe.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/location#nos-vans"
                className="btn-shine inline-flex items-center justify-center gap-2 bg-white text-slate-900 font-bold px-8 py-4 rounded-xl hover:bg-blue-50 transition-colors text-lg shadow-2xl"
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

          <div className="hidden lg:flex gap-4 absolute bottom-20 right-6">
            {[
              { value: "65€", label: "/ nuit", sub: "à partir de" },
              { value: "2", label: "vans", sub: "exclusifs" },
              { value: `${placeStats.ratingDisplay}★`, label: "Google", sub: `${placeStats.reviewCount} avis` },
            ].map((stat) => (
              <div key={stat.label} className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-5 py-4 text-center min-w-[100px]">
                <div className="text-xs text-white/60 font-medium mb-0.5">{stat.sub}</div>
                <div className="text-2xl font-black text-white">{stat.value}</div>
                <div className="text-xs text-white/70 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {photo?.photographer && (
          <p className="absolute bottom-2 right-4 text-white/30 text-[10px] z-10">
            Photo: {photo.photographer} / Pexels
          </p>
        )}

        <a href="#infos" className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 text-white/50 hover:text-white/80 transition-colors animate-bounce">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </a>
      </section>

      {/* Confiance */}
      <section className="bg-slate-950 py-5 border-t border-white/5">
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex flex-wrap justify-center md:justify-between items-center gap-y-4 gap-x-8 text-white/60 text-sm font-medium">
            {[
              { icon: "📍", text: "Départ Cambo-les-Bains — 45 min d'Hossegor" },
              { icon: "🛡️", text: "Assurance tous risques incluse" },
              { icon: "💰", text: "Dès 65€/nuit" },
              { icon: "⭐", text: `${placeStats.ratingDisplay}/5 sur ${placeStats.reviewCount} avis Google` },
              { icon: "🌊", text: "Conseil spots surf offert" },
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
      <section id="infos" className="py-20 bg-white scroll-mt-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <span className="badge-glass !px-4 !py-1.5 text-sm font-semibold mb-4 inline-block" style={{ color: "#4D5FEC" }}>
              La destination
            </span>
            <h2 className="text-4xl font-black text-slate-900 mb-3">
              Hossegor en van — le paradis du surf
            </h2>
            <p className="text-slate-500 text-lg max-w-xl mx-auto">
              À 45 min de Cambo-les-Bains, Hossegor est la Mecque du surf français. En van,
              réveillez-vous au son de l&apos;Atlantique et choisissez votre vague selon la marée.
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
                Infos pratiques — Hossegor en van
              </h2>
              <div className="space-y-4">
                {[
                  { label: "Récupération du van", value: "Cambo-les-Bains (45 min d'Hossegor) — route simple via A63" },
                  { label: "Spot nuit recommandé", value: "Forêt landaise (chemin forestier) ou aire Capbreton (10€/nuit)" },
                  { label: "Meilleure saison", value: "Septembre-Octobre — La Gravière à son sommet, peu de monde" },
                  { label: "Tarif van", value: "Dès 65€/nuit — assurance et équipements inclus" },
                  { label: "Surf accessoire", value: "Rack à planche disponible sur les vans Vanzon" },
                  { label: "À combiner avec", value: "Biarritz (30 min), Bayonne, Saint-Jean-de-Luz" },
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
                src="https://cdn.sanity.io/images/lewexa74/production/04d93973d30c5eede51f954d1432a50a5f82ef9b-1080x750.png"
                alt="Van Xalbat Vanzon Explorer en route vers Hossegor"
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          </div>
        </div>
      </section>

      {/* Google Maps — Point de départ */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-2xl font-black text-slate-900 mb-2 text-center">
            Votre point de départ : Cambo-les-Bains
          </h2>
          <p className="text-slate-500 text-center mb-8">
            À 45 min d&apos;Hossegor. Remise des clés sur place, parking gratuit.
          </p>
          <div className="rounded-3xl overflow-hidden shadow-lg border border-slate-100">
            <iframe
              src="https://maps.google.com/maps?q=Cambo-les-Bains,64250,France&t=&z=13&ie=UTF8&iwloc=&output=embed"
              width="100%"
              height="350"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Cambo-les-Bains — Point de départ vers Hossegor"
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, #0F153A 0%, #1e2d6b 100%)" }} />
        <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-5 leading-tight">
            La Gravière vous attend.<br />Le van aussi.
          </h2>
          <p className="text-white/70 text-xl mb-10">
            Dès <strong className="text-white">65€/nuit</strong> — assurance incluse, van tout équipé,
            clés remises à Cambo-les-Bains.
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
