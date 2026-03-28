import Link from "next/link";

type ServiceKey = "location" | "achat" | "formation" | "club";

const SERVICES: Record<ServiceKey, {
  emoji: string;
  label: string;
  title: string;
  desc: string;
  zone: string;
  href: string;
  gradient: string;
  accent: string;
}> = {
  location: {
    emoji: "🚐",
    label: "Location",
    title: "Louer un van aménagé",
    desc: "Partez explorer le Pays Basque à bord d'un van entièrement équipé. Liberté totale, sans contrainte, dès 1 jour.",
    zone: "Pays Basque",
    href: "/location",
    gradient: "from-[#4D5FEC] to-[#4BC3E3]",
    accent: "#4D5FEC",
  },
  achat: {
    emoji: "🔑",
    label: "Achat",
    title: "Acheter votre van",
    desc: "Deux Renault Trafic aménagés par nos soins, issus de notre flotte. Historique complet, remise en main propre.",
    zone: "Cambo-les-Bains",
    href: "/achat",
    gradient: "from-[#4D5FEC] to-[#0EA5E9]",
    accent: "#4D5FEC",
  },
  formation: {
    emoji: "🎓",
    label: "Formation",
    title: "Van Business Academy",
    desc: "Aménagement, homologation VASP, mise en location rentable. Un programme complet de A à Z avec Jules & Elio.",
    zone: "Toute la France",
    href: "/formation",
    gradient: "from-[#CDA77B] to-[#B9945F]",
    accent: "#B9945F",
  },
  club: {
    emoji: "✨",
    label: "Club Privé",
    title: "Deals & codes promo vanlife",
    desc: "Accédez gratuitement aux meilleures réductions sur l'équipement van : literie, énergie, cuisine, sécurité… 100% gratuit.",
    zone: "Toute la France",
    href: "/club",
    gradient: "from-[#8B5CF6] to-[#7C3AED]",
    accent: "#8B5CF6",
  },
};

const ALL_KEYS: ServiceKey[] = ["location", "achat", "formation", "club"];

interface OtherServicesProps {
  current: ServiceKey;
  bgColor?: string;
}

export default function OtherServices({ current, bgColor = "#F8FAFC" }: OtherServicesProps) {
  const others = ALL_KEYS.filter((k) => k !== current).map((k) => SERVICES[k]);

  return (
    <section className="py-20 px-6" style={{ background: bgColor }}>
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="text-center mb-12">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">
            L&apos;écosystème Vanzon
          </p>
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 leading-tight">
            On ne s&apos;arrête pas là
          </h2>
          <p className="text-slate-500 mt-3 max-w-xl mx-auto text-sm leading-relaxed">
            Vanzon Explorer c&apos;est bien plus qu&apos;un service — c&apos;est un écosystème complet autour de la vie en van.
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {others.map((s) => (
            <Link
              key={s.href}
              href={s.href}
              className="group bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col"
            >
              {/* Accent bar */}
              <div className={`h-1 w-full bg-gradient-to-r ${s.gradient}`} />

              <div className="p-6 flex flex-col flex-1">
                {/* Icon + label */}
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">{s.emoji}</span>
                  <span
                    className="text-xs font-bold uppercase tracking-widest"
                    style={{ color: s.accent }}
                  >
                    {s.label}
                  </span>
                </div>

                {/* Content */}
                <h3 className="text-lg font-black text-slate-900 mb-2 leading-snug group-hover:text-slate-700 transition-colors">
                  {s.title}
                </h3>
                <p className="text-slate-500 text-sm leading-relaxed flex-1">
                  {s.desc}
                </p>

                {/* Footer */}
                <div className="flex items-center justify-between mt-5 pt-4 border-t border-slate-100">
                  <span className="text-xs font-semibold text-slate-400 bg-slate-50 px-2.5 py-1 rounded-full">
                    📍 {s.zone}
                  </span>
                  <span
                    className="text-sm font-bold flex items-center gap-1 group-hover:gap-2 transition-all"
                    style={{ color: s.accent }}
                  >
                    Découvrir
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
