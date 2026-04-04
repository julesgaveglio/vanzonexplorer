import type { Metadata } from "next";
import Image from "next/image";
import { Euro, Shield, Zap, Users, ArrowRight } from "lucide-react";
import VanOwnerForm from "./_components/VanOwnerForm";

export const metadata: Metadata = {
  title: "Louez votre van aménagé | Vanzon Explorer",
  description:
    "Votre van dort au garage ? Louez-le sur Vanzon Explorer et gagnez jusqu'à 800€/mois. Inscription gratuite, aucune exclusivité, vous gardez le contrôle.",
  alternates: { canonical: "https://vanzonexplorer.com/proposer-votre-van" },
  openGraph: {
    title: "Louez votre van aménagé | Vanzon Explorer",
    description:
      "Votre van dort au garage ? Louez-le sur Vanzon Explorer et gagnez jusqu'à 800€/mois. Inscription gratuite.",
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
    icon: Euro,
    title: "Gagnez jusqu'à 800€/mois",
    description:
      "Un van loué 7 jours par mois à 95€/jour = 665€ net dans votre poche. En haute saison, certains propriétaires dépassent les 1 000€. Votre van travaille pendant que vous ne l'utilisez pas.",
    color: "bg-blue-50 text-blue-600",
  },
  {
    icon: Shield,
    title: "Vous gardez le contrôle total",
    description:
      "C'est votre van, vos règles. Vous fixez vos prix, vos disponibilités et vos conditions. Aucune exclusivité : gardez vos autres canaux. Vanzon est un revenu en plus, pas un remplacement.",
    color: "bg-teal-50 text-teal-600",
  },
  {
    icon: Zap,
    title: "On s'occupe de tout le reste",
    description:
      "Vous n'avez rien à faire côté marketing. On gère la visibilité de votre van, le référencement Google et la mise en relation avec les voyageurs. Vous, vous accueillez et vous encaissez.",
    color: "bg-amber-50 text-amber-600",
  },
  {
    icon: Users,
    title: "Des locataires passionnés, pas des touristes lambda",
    description:
      "Notre audience, ce sont des passionnés de vanlife qui planifient leur road trip. Ils cherchent un van avec une histoire, pas le premier prix sur un comparateur. Résultat : respect du véhicule et meilleures évaluations.",
    color: "bg-purple-50 text-purple-600",
  },
];

const STEPS = [
  {
    number: "01",
    title: "Vous remplissez le formulaire",
    description: "30 secondes, 4 champs, aucun engagement. On ne vous demande ni CB, ni contrat.",
  },
  {
    number: "02",
    title: "On vous appelle sous 48h",
    description: "On discute de votre van, de vos attentes tarifaires et on crée votre page ensemble.",
  },
  {
    number: "03",
    title: "Vous recevez vos premiers voyageurs",
    description: "Votre van est visible par des milliers de passionnés vanlife. Vous commencez à générer des revenus.",
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
              <span className="text-white/90 text-sm font-medium">Inscription gratuite — aucun engagement</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-[1.08] mb-6">
              Votre van dort au garage ?
              <br />
              <span className="bg-gradient-to-r from-blue-400 to-sky-300 bg-clip-text text-transparent">
                Louez-le. Gagnez jusqu&apos;à 800€/mois.
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-white/70 leading-relaxed max-w-xl">
              Vanzon Explorer est une plateforme de location de vans aménagés entre particuliers.
              On trouve les voyageurs, vous encaissez les revenus. C&apos;est aussi simple que ça.
            </p>
          </div>

          <div className="hidden lg:flex gap-4 absolute bottom-20 right-6">
            {[
              { value: "800€", label: "par mois", sub: "jusqu'à" },
              { value: "0€", label: "inscription", sub: "toujours" },
              { value: "0%", label: "exclusivité", sub: "requise" },
            ].map((stat) => (
              <div key={stat.label} className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-5 py-4 text-center min-w-[100px]">
                <div className="text-xs text-white/60 font-medium mb-0.5">{stat.sub}</div>
                <div className="text-2xl font-black text-white">{stat.value}</div>
                <div className="text-xs text-white/70 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        <a href="#avantages" className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 text-white/50 hover:text-white/80 transition-colors animate-bounce">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </a>
      </section>

      {/* ── TRUST BAR ────────────────────────────────────────────── */}
      <section className="bg-slate-950 py-5 border-t border-white/5">
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex flex-wrap justify-center md:justify-between items-center gap-y-4 gap-x-8 text-white/60 text-sm font-medium">
            {[
              { icon: "🚐", text: "Plateforme 100% spécialisée vanlife" },
              { icon: "💰", text: "Vous fixez vos prix" },
              { icon: "🤝", text: "Aucune exclusivité — gardez vos autres canaux" },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-2">
                <span>{item.icon}</span>
                <span>{item.text}</span>
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
              Ce que vous y gagnez
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-3">
              Votre van rapporte de l&apos;argent au lieu de rouiller.
            </h2>
            <p className="text-slate-500 text-lg max-w-xl mx-auto">
              On est propriétaires de vans nous aussi. On a construit la plateforme qu&apos;on
              aurait aimé trouver : simple, honnête, et faite pour les vrais passionnés.
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
              3 étapes
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-3">
              Simple comme bonjour.
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

      {/* ── FORMULAIRE ───────────────────────────────────────────── */}
      <section id="formulaire" className="py-20 bg-white scroll-mt-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            <div>
              <span className="badge-glass !px-4 !py-1.5 text-sm font-semibold mb-5 inline-block" style={{ color: "#4D5FEC" }}>
                Commencer maintenant
              </span>
              <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-5 leading-tight">
                Inscrivez votre van,
                <br />
                commencez à gagner.
              </h2>
              <p className="text-slate-500 text-lg leading-relaxed mb-8">
                Remplissez le formulaire, on vous rappelle sous 48h pour créer votre page van
                ensemble. Aucun engagement, aucun frais.
              </p>

              <div className="space-y-4">
                {[
                  { icon: "✓", text: "0€ — inscription 100% gratuite" },
                  { icon: "✓", text: "Aucune exclusivité — gardez Yescapa, Le Bon Coin, etc." },
                  { icon: "✓", text: "On crée votre page van pro ensemble" },
                  { icon: "✓", text: "Vous fixez vos prix, vos disponibilités, vos règles" },
                ].map((item) => (
                  <div key={item.text} className="flex items-center gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs font-bold">
                      {item.icon}
                    </span>
                    <span className="text-slate-700 text-sm font-medium">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <VanOwnerForm />
            </div>
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
            Votre van ne rapporte rien
            <br />
            quand il dort au garage.
          </h2>
          <p className="text-white/70 text-xl mb-10 leading-relaxed">
            Inscription gratuite en 30 secondes. On vous rappelle sous 48h.
          </p>
          <a
            href="#formulaire"
            className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/30 text-white font-semibold px-8 py-4 rounded-full hover:bg-white/20 transition-colors"
          >
            Inscrire mon van gratuitement <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </section>
    </>
  );
}
