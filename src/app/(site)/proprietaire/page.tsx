import type { Metadata } from "next";
import type React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import FAQSection from "./_components/FAQSection";

export const metadata: Metadata = {
  title: "Votre van mérite d'être vu",
  description:
    "Votre van mérite d'être vu par plus de monde. Vanzon Explorer vous offre une page dédiée, référencée sur Google, sans commission et sans exclusivité.",
  alternates: { canonical: "https://vanzonexplorer.com/proprietaire" },
  openGraph: {
    title: "Votre van mérite d'être vu",
    description:
      "Une page dédiée, référencée sur Google, sans commission et sans exclusivité. Un canal de visibilité en plus, sans rien changer à votre organisation.",
    type: "website",
    url: "https://vanzonexplorer.com/proprietaire",
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

const BENEFITS: { emoji: string; title: string; body: React.ReactNode }[] = [
  {
    emoji: "🔓",
    title: "0% de commission pendant le lancement",
    body: "Pendant notre phase de lancement, vous gardez l'intégralité de vos revenus. Pas de prélèvement, pas de frais cachés.",
  },
  {
    emoji: "🔗",
    title: "Aucune exclusivité, jamais",
    body: "Vous continuez à opérer sur toutes vos plateformes actuelles. Vanzon vient s'y ajouter, il ne les remplace pas.",
  },
  {
    emoji: "📈",
    title: "Un trafic qualifié, pas un trafic de prix",
    body: (
      <>
        Notre{" "}
        <a
          href="https://vanzonexplorer.com/articles"
          className="text-blue-600 underline underline-offset-2 hover:text-blue-700 transition-colors"
        >
          blog vanlife
        </a>{" "}
        attire des visiteurs qui planifient activement un road trip via Google. Pas des chasseurs de bons plans — des gens en phase de décision qui cherchent le bon van. Plusieurs centaines de visiteurs organiques par mois, en croissance chaque semaine.
      </>
    ),
  },
  {
    emoji: "🚐",
    title: "Pensé par des propriétaires, pour des propriétaires",
    body: "On connaît la saisonnalité, les questions des locataires, les imprévus. Vanzon est conçu avec cette réalité en tête.",
  },
];

const STEPS = [
  {
    number: "01",
    title: "Remplissez le formulaire",
    body: "2 minutes, aucun engagement. Les infos de base sur votre van, quelques photos, le lien vers votre annonce existante.",
  },
  {
    number: "02",
    title: "On crée votre page van",
    body: "Votre van obtient sa propre page optimisée pour Google. Photos, description, équipements, zone de départ. Rédigée et mise en ligne par notre équipe.",
  },
  {
    number: "03",
    title: "Vous gagnez en visibilité",
    body: "Les visiteurs de Vanzon découvrent votre van et sont redirigés vers votre plateforme habituelle. Vous gérez les réservations comme avant.",
  },
];

const CTA_HREF = "/proprietaire/inscription";
const SUB_CTA = "Sans engagement · Sans exclusivité · 0% de commission pendant le lancement";

export default function ProposerVotreVanPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Accueil", item: "https://vanzonexplorer.com" },
      { "@type": "ListItem", position: 2, name: "Proposer votre van", item: "https://vanzonexplorer.com/proprietaire" },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative -mt-16 min-h-[580px] lg:min-h-[680px] flex items-end overflow-hidden">
        <div className="absolute inset-0">
          {/* Mobile */}
          <Image
            src="https://cdn.sanity.io/images/lewexa74/production/5f9b15ad64282b02abed9e8ea36951c1365a27f8-617x836.webp?auto=format&fit=max&q=82"
            alt="Van aménagé au Pays Basque"
            fill
            sizes="100vw"
            className="object-cover object-center sm:hidden"
            priority
          />
          {/* Desktop */}
          <Image
            src="https://cdn.sanity.io/images/lewexa74/production/d445397965472d300e3dc13d6b1c37503fe8ba25-1920x1080.png?auto=format&q=82"
            alt="Van aménagé au bord de l'océan au Pays Basque"
            fill
            sizes="100vw"
            className="object-cover object-[30%_70%] lg:object-[25%_70%] hidden sm:block"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-900/50 to-slate-900/10" />
          <div className="absolute inset-0 bg-gradient-to-r from-blue-950/50 via-blue-950/20 to-transparent" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 pt-32 pb-16 lg:pb-24 w-full">
          <div className="max-w-2xl">
            {/* Surtitre */}
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-4 py-2 mb-6">
              <span className="text-green-400 text-xs">●</span>
              <span className="text-white/90 text-sm font-medium">Propriétaires de vans aménagés</span>
            </div>

            {/* Titre */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-[1.06] mb-5">
              Votre van mérite d&apos;être vu par plus de monde.
            </h1>

            {/* Sous-titre */}
            <p className="text-base sm:text-lg text-white/70 leading-relaxed max-w-xl mb-8">
              Vanzon Explorer vous offre une page dédiée, référencée sur Google, sans commission et sans exclusivité.
              Un canal de visibilité en plus, sans rien changer à votre organisation actuelle.
            </p>

            {/* CTA */}
            <Link
              href={CTA_HREF}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-sky-400 text-white font-semibold px-7 py-3.5 rounded-full hover:from-blue-600 hover:to-sky-500 transition-all shadow-lg shadow-blue-500/30 mb-4"
            >
              Ajouter mon van gratuitement <ArrowRight className="w-4 h-4 flex-shrink-0" />
            </Link>

            {/* Sous-CTA */}
            <p className="text-white/45 text-sm">{SUB_CTA}</p>
          </div>

          {/* Stats desktop */}
          <div className="hidden lg:flex gap-3 absolute bottom-24 right-6">
            {[
              { value: "0%", label: "de commission", sub: "pendant le lancement" },
              { value: "0€", label: "d'inscription", sub: "requise" },
              { value: "0", label: "exclusivité", sub: "exigée" },
            ].map((s) => (
              <div key={s.label} className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-5 py-4 text-center min-w-[110px]">
                <div className="text-[11px] text-white/55 font-medium mb-0.5">{s.sub}</div>
                <div className="text-2xl font-black text-white">{s.value}</div>
                <div className="text-[11px] text-white/70 font-medium">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BANDEAU RÉASSURANCE ──────────────────────────────────────────── */}
      <section className="bg-slate-950 py-8 border-t border-white/5">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <p className="text-white/60 text-sm sm:text-base leading-relaxed">
            Les plateformes existantes ont leur place. Vanzon en a une autre :{" "}
            <span className="text-white/90 font-medium">
              vous offrir un canal supplémentaire, gratuit, sans friction
            </span>
            , pendant que vous continuez à opérer exactement comme avant.
          </p>
        </div>
      </section>

      {/* ── POURQUOI VANZON ──────────────────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <span className="badge-glass !px-4 !py-1.5 text-sm font-semibold mb-4 inline-block text-blue-500">
              Pourquoi Vanzon
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">
              Un canal de plus. Pas une contrainte de plus.
            </h2>
            <p className="text-slate-500 text-base max-w-2xl mx-auto leading-relaxed">
              Vanzon Explorer est une plateforme vanlife construite par des opérateurs de terrain. On opère nous-mêmes des vans aménagés au Pays Basque et c&apos;est cette expérience qui a dicté chaque décision de la plateforme.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            {BENEFITS.map((b) => (
              <div key={b.title} className="glass-card-hover rounded-2xl p-6 sm:p-7">
                <div className="text-3xl mb-4">{b.emoji}</div>
                <h3 className="font-bold text-slate-900 text-base mb-2">{b.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{b.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── COMMENT ÇA MARCHE ────────────────────────────────────────────── */}
      <section className="py-20" style={{ background: "linear-gradient(160deg, #EFF6FF 0%, #F0FDFF 100%)" }}>
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-14">
            <span className="badge-glass !px-4 !py-1.5 text-sm font-semibold mb-4 inline-block" style={{ color: "#4D5FEC" }}>
              Comment ça marche
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900">
              3 étapes. Aucune prise de tête.
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {STEPS.map((step, i) => (
              <div key={step.number} className="relative text-center">
                <div className="text-6xl font-black text-blue-100 mb-3 leading-none">{step.number}</div>
                <h3 className="font-bold text-slate-900 text-base mb-2">{step.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{step.body}</p>
                {i < STEPS.length - 1 && (
                  <ArrowRight className="hidden md:block absolute top-9 -right-4 w-5 h-5 text-slate-300" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── LES FONDATEURS ───────────────────────────────────────────────── */}
      <section className="py-16 bg-slate-950">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <span className="text-xs font-bold uppercase tracking-widest text-white/30 mb-4 block">
            Qui est derrière Vanzon ?
          </span>
          <p className="text-white/70 text-base sm:text-lg leading-relaxed mb-6">
            Vanzon Explorer, c&apos;est Jules et Elio, deux associés qui opèrent des vans aménagés depuis{" "}
            <span className="text-white font-medium">Cambo-les-Bains</span>, au cœur du Pays Basque.
          </p>
          <Link
            href="/a-propos"
            className="inline-flex items-center gap-1.5 text-white/50 hover:text-white text-sm font-medium transition-colors"
          >
            En savoir plus sur l&apos;équipe <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="max-w-2xl mx-auto px-6">
          <div className="text-center mb-10">
            <span className="badge-glass !px-4 !py-1.5 text-sm font-semibold mb-4 inline-block text-blue-500">
              FAQ
            </span>
            <h2 className="text-3xl font-black text-slate-900">
              Vos questions, nos réponses.
            </h2>
          </div>
          <FAQSection />
        </div>
      </section>

      {/* ── CTA FINAL ────────────────────────────────────────────────────── */}
      <section className="relative py-28 overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="https://cdn.sanity.io/images/lewexa74/production/d445397965472d300e3dc13d6b1c37503fe8ba25-1920x1080.png?auto=format&q=82"
            alt="Van aménagé au bord de l'océan"
            fill
            sizes="100vw"
            className="object-cover"
          />
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(135deg, rgba(15,21,58,0.94) 0%, rgba(77,95,236,0.65) 100%)" }}
          />
        </div>

        <div className="relative z-10 max-w-2xl mx-auto px-6 text-center">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-4 leading-tight">
            Même van. Zéro effort.<br />Visibilité en plus.
          </h2>
          <p className="text-white/65 text-lg mb-8 leading-relaxed">
            2 minutes pour s&apos;inscrire. Votre page est créée gratuitement par notre équipe.
          </p>
          <Link
            href={CTA_HREF}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-sky-400 text-white font-semibold px-8 py-4 rounded-full hover:from-blue-600 hover:to-sky-500 transition-all shadow-lg shadow-blue-500/25 mb-5"
          >
            Proposer mon van gratuitement <ArrowRight className="w-4 h-4 flex-shrink-0" />
          </Link>
          <p className="text-white/35 text-sm">{SUB_CTA}</p>
        </div>
      </section>
    </>
  );
}
