import type { Metadata } from "next";
import Image from "next/image";
import { Percent, Shield, Zap, Users, ArrowRight } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Proposer votre van à la location | Vanzon Explorer",
  description:
    "Vous louez déjà votre van ? Ajoutez Vanzon Explorer comme canal de visibilité gratuit. 0% de commission pendant le lancement, trafic organique qualifié, aucune exclusivité.",
  alternates: { canonical: "https://vanzonexplorer.com/proposer-votre-van" },
  openGraph: {
    title: "Proposer votre van à la location | Vanzon Explorer",
    description:
      "Un canal de visibilité gratuit pour votre van aménagé. 0% de commission pendant le lancement, trafic organique qualifié, zéro exclusivité.",
    type: "website",
    url: "https://vanzonexplorer.com/proposer-votre-van",
    images: [
      {
        url: "https://cdn.sanity.io/images/lewexa74/production/d445397965472d300e3dc13d6b1c37503fe8ba25-1920x1080.png?auto=format&q=82",
        width: 1920,
        height: 1080,
        alt: "Van aménagé au Pays Basque — Vanzon Explorer",
      },
    ],
  },
};

const BENEFITS = [
  {
    icon: Percent,
    title: "0% de commission pendant le lancement",
    description:
      "Les plateformes prennent 15% ou plus. Vanzon pendant le lancement : 0%. On vous offre de la visibilité gratuite via notre référencement Google.",
    color: "bg-blue-50 text-blue-600",
  },
  {
    icon: Shield,
    title: "Aucune exclusivité",
    description:
      "Gardez vos plateformes actuelles. Vanzon est un canal supplémentaire qui vous amène des réservations en plus, pas un remplacement.",
    color: "bg-teal-50 text-teal-600",
  },
  {
    icon: Zap,
    title: "Trafic organique qualifié",
    description:
      "Notre blog attire chaque mois des milliers de passionnés vanlife via Google. Ces visiteurs cherchent un van pour leur prochain road trip — pas un comparateur de prix.",
    color: "bg-amber-50 text-amber-600",
  },
  {
    icon: Users,
    title: "Construit par des propriétaires",
    description:
      "On loue nous-mêmes deux vans au Pays Basque. On connaît les questions des locataires, la saisonnalité, les imprévus. La plateforme est pensée pour des gens comme nous.",
    color: "bg-purple-50 text-purple-600",
  },
];

const STEPS = [
  {
    number: "01",
    title: "Remplissez le formulaire",
    description: "2 minutes, aucun engagement. On a juste besoin des infos de base sur votre van.",
  },
  {
    number: "02",
    title: "On crée votre page van",
    description: "Votre van obtient sa propre page référencée sur Google, avec un lien vers votre annonce existante.",
  },
  {
    number: "03",
    title: "Vous gagnez en visibilité",
    description: "Les visiteurs de Vanzon Explorer découvrent votre van et sont redirigés vers votre plateforme de location.",
  },
];

export default function ProposerVotreVanPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Accueil",
        item: "https://vanzonexplorer.com",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Proposer votre van",
        item: "https://vanzonexplorer.com/proposer-votre-van",
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ── HERO ─────────────────────────────────────────────────── */}
      <section className="relative -mt-16 min-h-[520px] lg:min-h-[600px] flex items-end overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="https://cdn.sanity.io/images/lewexa74/production/d445397965472d300e3dc13d6b1c37503fe8ba25-1920x1080.png?auto=format&q=82"
            alt="Van aménagé au bord de l'océan au Pays Basque"
            fill
            sizes="100vw"
            className="object-cover object-[30%_70%] lg:object-[25%_70%]"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-900/40 to-slate-900/10" />
          <div className="absolute inset-0 bg-gradient-to-r from-blue-950/50 via-blue-950/20 to-transparent lg:via-transparent" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 pt-28 pb-14 lg:pb-20 w-full">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-4 py-2 mb-8">
              <span className="text-green-400">●</span>
              <span className="text-white/90 text-sm font-medium">Inscription gratuite — aucune exclusivité</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-[1.08] mb-4">
              Vous louez déjà votre van ?
            </h1>
            <p className="text-base sm:text-lg text-white/70 leading-relaxed max-w-xl mb-8">
              On vous{" "}
              <span className="bg-gradient-to-r from-blue-400 to-sky-300 bg-clip-text text-transparent font-semibold">
                offre
              </span>{" "}
              de la{" "}
              <span className="bg-gradient-to-r from-blue-400 to-sky-300 bg-clip-text text-transparent font-semibold">
                visibilité
              </span>{" "}
              gratuitement via notre référencement Google.
            </p>

            <Link
              href="/proposer-votre-van/inscription"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-sky-400 text-white font-semibold px-7 py-3.5 rounded-full hover:from-blue-600 hover:to-sky-500 transition-all shadow-lg shadow-blue-500/25"
            >
              Déposer une annonce <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="hidden lg:flex gap-4 absolute bottom-20 right-6">
            {[
              { value: "0%", label: "commission", sub: "pendant le lancement" },
              { value: "0€", label: "inscription", sub: "gratuite" },
              { value: "0", label: "exclusivité", sub: "requise" },
            ].map((stat) => (
              <div key={stat.label} className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-5 py-4 text-center min-w-[100px]">
                <div className="text-xs text-white/60 font-medium mb-0.5">{stat.sub}</div>
                <div className="text-2xl font-black text-white">{stat.value}</div>
                <div className="text-xs text-white/70 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── AVANTAGES ────────────────────────────────────────────── */}
      <section id="avantages" className="py-20 bg-white scroll-mt-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-14">
            <span className="badge-glass !px-4 !py-1.5 text-sm font-semibold mb-4 inline-block text-blue-500">
              Pourquoi ajouter Vanzon
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-3">
              Un canal de visibilité en plus, gratuitement.
            </h2>
            <p className="text-slate-500 text-lg max-w-2xl mx-auto">
              Vous connaissez déjà la location de van. Nous aussi — on loue deux fourgons
              aménagés depuis le Pays Basque. Vanzon, c&apos;est la plateforme
              qu&apos;on a construite pour répondre à nos propres frustrations.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            {BENEFITS.map((b) => (
              <div key={b.title} className="glass-card-hover p-6 sm:p-7">
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-2xl ${b.color} mb-4`}>
                  <b.icon className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-900 text-lg mb-2">{b.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{b.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── COMMENT ÇA MARCHE ────────────────────────────────────── */}
      <section className="py-20" style={{ background: "linear-gradient(160deg, #EFF6FF 0%, #F0FDFF 100%)" }}>
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-14">
            <span className="badge-glass !px-4 !py-1.5 text-sm font-semibold mb-4 inline-block" style={{ color: "#4D5FEC" }}>
              Comment ça marche
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-3">
              3 étapes, aucune prise de tête.
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {STEPS.map((step, i) => (
              <div key={step.number} className="relative text-center">
                <div className="text-5xl font-black text-blue-100 mb-3">{step.number}</div>
                <h3 className="font-bold text-slate-900 text-lg mb-2">{step.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{step.description}</p>
                {i < STEPS.length - 1 && (
                  <ArrowRight className="hidden md:block absolute top-8 -right-4 w-5 h-5 text-slate-300" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ────────────────────────────────────────────── */}
      <section className="relative py-28 overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="https://cdn.sanity.io/images/lewexa74/production/d445397965472d300e3dc13d6b1c37503fe8ba25-1920x1080.png?auto=format&q=82"
            alt="Van aménagé au bord de l'océan"
            fill
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(15,21,58,0.92) 0%, rgba(77,95,236,0.6) 100%)" }} />
        </div>

        <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-5 leading-tight">
            Même van, zéro effort,
            <br />
            visibilité en plus.
          </h2>
          <p className="text-white/70 text-xl mb-10 leading-relaxed">
            2 minutes pour s&apos;inscrire. On crée votre page van gratuitement.
          </p>
          <Link
            href="/proposer-votre-van/inscription"
            className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/30 text-white font-semibold px-8 py-4 rounded-full hover:bg-white/20 transition-colors"
          >
            Proposer mon van <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </>
  );
}
