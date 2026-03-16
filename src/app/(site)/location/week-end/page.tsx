import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { fetchPexelsPhoto } from "@/lib/pexels";
import { getGooglePlaceStats } from "@/lib/google-places";
import { LocationRentalJsonLd } from "@/components/seo/JsonLd";
import VanSelectionSection from "@/components/location/VanSelectionSection";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Location Van Week-end Pays Basque — 2 nuits dès 130€ | Vanzon Explorer",
  description:
    "Louez un van aménagé pour le week-end au Pays Basque dès 65€/nuit. Escape parfaite sur 2–3 jours depuis Cambo-les-Bains — assurance incluse, van tout équipé.",
  alternates: {
    canonical: "https://vanzonexplorer.com/location/week-end",
  },
};

const FALLBACK_IMG = "https://cdn.sanity.io/images/lewexa74/production/d445397965472d300e3dc13d6b1c37503fe8ba25-1920x1080.png";

const weekendIdeas = [
  {
    icon: "🌊",
    title: "Week-end surf à Biarritz",
    days: "2 jours",
    highlights: ["Côte des Basques et Milady", "Bivouac parking vue mer", "Pintxos en soirée"],
    forWho: "Surfers, couples, aventuriers",
  },
  {
    icon: "🍷",
    title: "Week-end gastronomie basque",
    days: "2–3 jours",
    highlights: ["Marché d'Espelette", "Saint-Jean-de-Luz port", "Halles de Bayonne"],
    forWho: "Gourmets, familles, curieux",
  },
  {
    icon: "⛰️",
    title: "Week-end montagne & La Rhune",
    days: "2 jours",
    highlights: ["Col de Saint-Ignace", "Randonnée La Rhune", "Bivouac avec vue 2 pays"],
    forWho: "Randonneurs, amoureux des sommets",
  },
  {
    icon: "🌊🏔️",
    title: "Week-end côte + montagne",
    days: "3 jours",
    highlights: ["Biarritz le vendredi soir", "Hossegor le samedi", "La Rhune le dimanche"],
    forWho: "Le meilleur du Pays Basque en peu de temps",
  },
];

export default async function LocationWeekEndPage() {
  const [photo, placeStats] = await Promise.all([
    fetchPexelsPhoto("basque country road trip van camping weekend", FALLBACK_IMG),
    getGooglePlaceStats(),
  ]);

  return (
    <>
      <LocationRentalJsonLd
        destination="Week-end Pays Basque"
        url="https://vanzonexplorer.com/location/week-end"
      />

      {/* Hero */}
      <section className="relative -mt-16 min-h-screen flex items-end overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src={photo?.url ?? FALLBACK_IMG}
            alt="Location van week-end Pays Basque - van aménagé bord de mer"
            fill
            sizes="100vw"
            className="object-cover object-center sm:object-center object-right"
            priority
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
              <li className="text-white/80">Week-end</li>
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
              <span className="text-white/90 text-sm font-medium">{placeStats.reviewCount} avis Google</span>
            </a>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-white leading-[1.05] mb-6">
              Van week-end<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4D5FEC] to-[#4BC3E3]">
                Pays Basque
              </span>
            </h1>

            <p className="text-xl text-white/75 leading-relaxed mb-8 max-w-xl">
              Le Pays Basque en van pour un week-end — la meilleure façon de décompresser.
              Réservez du vendredi au dimanche, et revenez rechargé à bloc dès <strong className="text-white">130€ (2 nuits)</strong>.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/location#nos-vans"
                className="btn-shine inline-flex items-center justify-center gap-2 bg-white text-slate-900 font-bold px-8 py-4 rounded-xl hover:bg-blue-50 transition-colors text-lg shadow-2xl"
              >
                Voir les disponibilités
              </Link>
              <a
                href="https://www.yescapa.fr/campers/89215"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-white/10 backdrop-blur-md border border-white/30 text-white font-bold px-8 py-4 rounded-xl hover:bg-white/20 transition-colors text-lg"
              >
                Réserver sur Yescapa →
              </a>
            </div>
          </div>

          <div className="hidden lg:flex gap-4 absolute bottom-20 right-6">
            {[
              { value: "2", label: "nuits min.", sub: "week-end" },
              { value: "130€", label: "2 nuits", sub: "dès" },
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

        <a href="#idees" className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 text-white/50 hover:text-white/80 transition-colors animate-bounce">
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
              { icon: "📅", text: "Disponible vendredi soir" },
              { icon: "🛡️", text: "Assurance tous risques incluse" },
              { icon: "💰", text: "2 nuits dès 130€" },
              { icon: "⭐", text: `${placeStats.ratingDisplay}/5 sur ${placeStats.reviewCount} avis Google` },
              { icon: "🔑", text: "Remise des clés à Cambo-les-Bains" },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-2">
                <span>{item.icon}</span>
                <span>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Idées week-end */}
      <section id="idees" className="py-20 bg-white scroll-mt-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <span className="badge-glass !px-4 !py-1.5 text-sm font-semibold mb-4 inline-block" style={{ color: "#4D5FEC" }}>
              Idées de week-end
            </span>
            <h2 className="text-4xl font-black text-slate-900 mb-3">
              4 week-ends idéals en van au Pays Basque
            </h2>
            <p className="text-slate-500 text-lg max-w-xl mx-auto">
              Selon vos envies — surf, gastronomie, montagne ou tout à la fois.
              Nos vans sont prêts à partir le vendredi soir.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {weekendIdeas.map((idea) => (
              <div key={idea.title} className="glass-card p-7 hover:shadow-glass-hover transition-all duration-300 group">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="text-4xl">{idea.icon}</div>
                  <span className="text-xs font-semibold bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full flex-shrink-0">
                    {idea.days}
                  </span>
                </div>
                <h3 className="font-black text-slate-900 text-xl mb-3 group-hover:text-[#4D5FEC] transition-colors">
                  {idea.title}
                </h3>
                <ul className="space-y-1.5 mb-4">
                  {idea.highlights.map((h) => (
                    <li key={h} className="flex items-center gap-2 text-slate-600 text-sm">
                      <span className="text-emerald-500 flex-shrink-0">✓</span>
                      {h}
                    </li>
                  ))}
                </ul>
                <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-50 rounded-xl p-3 mt-2">
                  <span>👥</span>
                  <span>{idea.forWho}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comment ça marche */}
      <section className="py-20 text-white" style={{ background: "#0F153A" }}>
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-black text-white mb-3">
              Réserver votre week-end en 3 étapes
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: "01", title: "Choisissez vos dates", desc: "Week-end vendredi soir au dimanche, ou samedi au lundi. Minimum 2 nuits.", color: "from-[#4BC3E3] to-[#4D5FEC]" },
              { step: "02", title: "Réservez sur Yescapa", desc: "Paiement sécurisé en ligne. Assurance tous risques automatiquement incluse.", color: "from-[#4D5FEC] to-[#3B4FDB]" },
              { step: "03", title: "Récupérez le van à Cambo-les-Bains", desc: "Jules vous remet les clés et vous partage ses spots secrets. À vous le Pays Basque !", color: "from-[#3B4FDB] to-[#2A3BC5]" },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center mx-auto mb-5 shadow-lg`}>
                  <span className="text-2xl font-black text-white">{item.step}</span>
                </div>
                <h3 className="font-bold text-white text-xl mb-3">{item.title}</h3>
                <p className="text-white/60 leading-relaxed text-sm">{item.desc}</p>
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
            Remise des clés à Cambo-les-Bains (64250). Parking gratuit sur place.
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
              title="Cambo-les-Bains — Votre base de départ week-end"
            />
          </div>
        </div>
      </section>

      <VanSelectionSection destination="Pays Basque" />

      {/* CTA */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="https://cdn.sanity.io/images/lewexa74/production/e9664378c5fdc652c33ae7342dfc52cc4960c8bf-1080x750.png"
            alt="Van Vanzon Explorer week-end Pays Basque"
            fill
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(15,21,58,0.92) 0%, rgba(77,95,236,0.6) 100%)" }} />
        </div>
        <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-5 leading-tight">
            Ce week-end,<br />le Pays Basque en van.
          </h2>
          <p className="text-white/70 text-xl mb-10">
            <strong className="text-white">2 nuits dès 130€</strong> — assurance incluse, van tout équipé,
            spots partagés par Jules.
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
        </div>
      </section>
    </>
  );
}
