import Image from "next/image";
import Link from "next/link";

const VANS = [
  {
    id: "yoni",
    name: "Yoni",
    subtitle: "Le van aventurier",
    description: "Renault Trafic L2H1 aménagé — toit relevable, lit 160cm, cuisine complète, panneaux solaires. Parfait pour les amoureux de surf et de nature.",
    image: "https://cdn.sanity.io/images/lewexa74/production/660105a28e577c33f642a8fdff528d88925642e3-1080x750.png",
    price: "65",
    capacity: "2 personnes",
    features: ["🛏️ Lit 160 cm", "🍳 Cuisine équipée", "☀️ Panneaux solaires", "🚿 Douche extérieure", "❄️ Réfrigérateur", "📶 WiFi 4G"],
    bookingUrl: "https://www.yescapa.fr/campers/89215",
    badge: "Le plus populaire",
    badgeColor: "bg-[#4D5FEC] text-white",
  },
  {
    id: "xalbat",
    name: "Xalbat",
    subtitle: "Le van confort",
    description: "Renault Trafic L2H1 aménagé — aménagement premium, chauffage Webasto, isolation 4 saisons. Idéal pour les séjours longue durée en toute saison.",
    image: "https://cdn.sanity.io/images/lewexa74/production/d445397965472d300e3dc13d6b1c37503fe8ba25-1920x1080.png",
    price: "65",
    capacity: "2 personnes",
    features: ["🛏️ Lit 160 cm", "🔥 Chauffage Webasto", "☀️ Panneaux solaires", "🧊 Réfrigérateur 12V", "💡 Éclairage LED", "🎒 Rangements optimisés"],
    bookingUrl: "https://www.yescapa.fr/campers/98869",
    badge: "4 saisons",
    badgeColor: "bg-emerald-500 text-white",
  },
];

interface VanSelectionSectionProps {
  destination: string;
}

export default function VanSelectionSection({ destination }: VanSelectionSectionProps) {
  return (
    <section id="nos-vans" className="py-20 bg-white scroll-mt-20">
      <div className="max-w-6xl mx-auto px-6">

        {/* Header */}
        <div className="text-center mb-14">
          <span className="inline-flex items-center gap-2 bg-blue-50 text-[#4D5FEC] text-sm font-bold px-4 py-1.5 rounded-full mb-4">
            🚐 Nos vans
          </span>
          <h2 className="text-4xl font-black text-slate-900 mb-3">
            Choisissez votre van
          </h2>
          <p className="text-slate-500 text-lg max-w-xl mx-auto">
            Deux vans aménagés, tout équipés, assurance incluse.
            Récupération à Cambo-les-Bains — 30 min de {destination}.
          </p>
        </div>

        {/* Van cards */}
        <div className="grid md:grid-cols-2 gap-8 mb-10">
          {VANS.map((van) => (
            <div key={van.id} className="group relative bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col">

              {/* Badge */}
              <span className={`absolute top-4 left-4 z-10 text-xs font-bold px-3 py-1 rounded-full ${van.badgeColor}`}>
                {van.badge}
              </span>

              {/* Image */}
              <div className="relative aspect-[16/9] overflow-hidden">
                <Image
                  src={van.image}
                  alt={`Van ${van.name} — location van aménagé ${destination}`}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent" />
                <div className="absolute bottom-4 left-4">
                  <p className="text-white font-black text-2xl">{van.name}</p>
                  <p className="text-white/80 text-sm">{van.subtitle}</p>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 flex flex-col flex-1">
                <p className="text-slate-500 text-sm leading-relaxed mb-5">{van.description}</p>

                {/* Features grid */}
                <div className="grid grid-cols-2 gap-2 mb-6">
                  {van.features.map((f) => (
                    <div key={f} className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2">
                      <span className="text-sm">{f}</span>
                    </div>
                  ))}
                </div>

                {/* Price + CTA */}
                <div className="mt-auto flex items-center justify-between gap-4">
                  <div>
                    <span className="text-3xl font-black text-slate-900">{van.price}€</span>
                    <span className="text-slate-400 text-sm"> / nuit</span>
                    <p className="text-xs text-slate-400 mt-0.5">Assurance incluse · {van.capacity}</p>
                  </div>
                  <a
                    href={van.bookingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-shine inline-flex items-center justify-center gap-2 bg-[#4D5FEC] hover:bg-[#3B4FD4] text-white font-bold px-6 py-3.5 rounded-2xl transition-colors text-sm shadow-lg shadow-indigo-200 relative overflow-hidden"
                  >
                    Réserver {van.name} →
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Confiance + lien page location */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50 rounded-2xl px-6 py-4">
          <div className="flex flex-wrap justify-center sm:justify-start items-center gap-x-6 gap-y-2 text-sm text-slate-500">
            <span className="flex items-center gap-1.5">✅ Annulation flexible</span>
            <span className="flex items-center gap-1.5">🛡️ Assurance tous risques</span>
            <span className="flex items-center gap-1.5">📍 Livraison {destination} sur demande</span>
          </div>
          <Link
            href="/location"
            className="text-sm font-semibold text-[#4D5FEC] hover:underline flex-shrink-0"
          >
            Voir tous les détails →
          </Link>
        </div>
      </div>
    </section>
  );
}
