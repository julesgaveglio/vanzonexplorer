import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { fetchPexelsPhoto } from "@/lib/pexels";
import { getGooglePlaceStats } from "@/lib/google-places";
import { LocationRentalJsonLd } from "@/components/seo/JsonLd";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Location Van Aménagé Bayonne — Base de départ | Vanzon Explorer",
  description:
    "Louez un van aménagé à Bayonne dès 65€/nuit. Ville de départ idéale pour explorer le Pays Basque en van — Biarritz à 20 min, Saint-Jean-de-Luz à 25 min, les Pyrénées à 1h.",
  alternates: {
    canonical: "https://vanzonexplorer.com/location/bayonne",
  },
};

const FALLBACK_IMG = "https://cdn.sanity.io/images/lewexa74/production/e9664378c5fdc652c33ae7342dfc52cc4960c8bf-1080x750.png";

const highlights = [
  { icon: "🏛️", label: "Vieille ville de Bayonne", desc: "Cathédrale Sainte-Marie, remparts Vauban, rues médiévales à explorer" },
  { icon: "🥩", label: "Jambon de Bayonne", desc: "IGP reconnu mondialement — dégustez-le aux Halles de Bayonne" },
  { icon: "🍫", label: "Chocolat de Bayonne", desc: "Première ville chocolatière de France depuis le XVIe siècle" },
  { icon: "🏉", label: "Culture basque", desc: "Pelote basque, fêtes de Bayonne, chants traditionnels" },
  { icon: "🛤️", label: "Hub idéal", desc: "À 20 min de Biarritz, 25 min de Saint-Jean-de-Luz, 30 min d'Hossegor" },
  { icon: "🚐", label: "Point de départ Vanzon", desc: "Remise et retour des vans à Cambo-les-Bains — logistique simplifiée" },
];

export default async function LocationBayonnePage() {
  const [photo, placeStats] = await Promise.all([
    fetchPexelsPhoto("bayonne basque city cathedral france", FALLBACK_IMG),
    getGooglePlaceStats(),
  ]);

  return (
    <>
      <LocationRentalJsonLd
        destination="Bayonne"
        url="https://vanzonexplorer.com/location/bayonne"
      />

      {/* Hero */}
      <section className="relative -mt-16 min-h-screen flex items-end overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src={photo?.url ?? FALLBACK_IMG}
            alt="Van Vanzon Explorer à Bayonne, base de départ Pays Basque"
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
              <li className="text-white/80">Bayonne</li>
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
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4D5FEC] to-[#4BC3E3]">
                à Bayonne
              </span>
            </h1>

            <p className="text-xl text-white/75 leading-relaxed mb-8 max-w-xl">
              Récupérez votre van aménagé à Cambo-les-Bains (15 min) et partez explorer le Pays
              Basque dans toutes les directions — océan, montagne, Espagne.
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
              { icon: "📍", text: "Départ Cambo-les-Bains — 15 min de Bayonne" },
              { icon: "🛡️", text: "Assurance tous risques incluse" },
              { icon: "💰", text: "Dès 65€/nuit" },
              { icon: "⭐", text: `${placeStats.ratingDisplay}/5 sur ${placeStats.reviewCount} avis Google` },
              { icon: "💡", text: "Conseils locaux offerts par Jules" },
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
              Bayonne — hub stratégique
            </span>
            <h2 className="text-4xl font-black text-slate-900 mb-3">
              Pourquoi partir de Bayonne ?
            </h2>
            <p className="text-slate-500 text-lg max-w-xl mx-auto">
              Bayonne est le carrefour parfait : au croisement de la côte basque, des Pyrénées
              et des Landes. En van, toutes les destinations s&apos;atteignent en moins d&apos;une heure.
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

      {/* Carte des distances */}
      <section className="py-20" style={{ background: "linear-gradient(160deg, #EFF6FF 0%, #F0FDFF 100%)" }}>
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-slate-900 mb-3">
              Tout est à portée de roues
            </h2>
            <p className="text-slate-500 text-lg">Distances depuis Cambo-les-Bains en van</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { dest: "Bayonne", time: "15 min", km: "13 km" },
              { dest: "Biarritz", time: "25 min", km: "22 km" },
              { dest: "Saint-Jean-de-Luz", time: "20 min", km: "18 km" },
              { dest: "Hossegor", time: "45 min", km: "40 km" },
              { dest: "Espelette", time: "10 min", km: "8 km" },
              { dest: "La Rhune", time: "30 min", km: "30 km" },
              { dest: "Forêt d'Irati", time: "45 min", km: "55 km" },
              { dest: "San Sebastián (ES)", time: "40 min", km: "45 km" },
            ].map((item) => (
              <div key={item.dest} className="glass-card p-4 text-center">
                <div className="font-bold text-slate-800 text-sm mb-1">{item.dest}</div>
                <div className="text-2xl font-black" style={{ color: "#4D5FEC" }}>{item.time}</div>
                <div className="text-xs text-slate-400 mt-0.5">{item.km}</div>
              </div>
            ))}
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
            À 15 min de Bayonne. Remise des clés sur place, parking gratuit.
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
              title="Cambo-les-Bains — Point de départ vers Bayonne"
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, #0F153A 0%, #1e2d6b 100%)" }} />
        <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-5 leading-tight">
            Cambo-les-Bains → partout.<br />Le van vous attend.
          </h2>
          <p className="text-white/70 text-xl mb-10">
            Dès <strong className="text-white">65€/nuit</strong> — clés remises à Cambo-les-Bains,
            assurance incluse.
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
