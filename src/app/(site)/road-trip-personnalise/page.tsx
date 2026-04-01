import type { Metadata } from 'next'
import Link from 'next/link'
import RoadTripWizard from './RoadTripWizard'
import RoadTripMeshBackground from './RoadTripHero'
import { faqItems, itineraires, destinations, socialProof } from './seo-data'

export const metadata: Metadata = {
  title: 'Générateur de Road Trip en Van Gratuit | Itinéraire Personnalisé',
  description:
    'Créez votre itinéraire road trip en van personnalisé en 1 minute. IA + 200 spots en France. Étapes jour par jour, campings, activités — 100 % gratuit, reçu par email.',
  alternates: {
    canonical: 'https://vanzonexplorer.com/road-trip-personnalise',
  },
  openGraph: {
    title: 'Générateur de Road Trip en Van Gratuit | Itinéraire Personnalisé',
    description:
      'Créez votre itinéraire road trip en van personnalisé en 1 minute. IA + 200 spots en France. Étapes jour par jour, campings, activités — 100 % gratuit, reçu par email.',
    type: 'website',
    url: 'https://vanzonexplorer.com/road-trip-personnalise',
  },
}

const webAppJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Générateur de road trip van personnalisé',
  applicationCategory: 'TravelApplication',
  description: 'Génère ton itinéraire road trip en van sur mesure partout en France',
  url: 'https://vanzonexplorer.com/road-trip-personnalise',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
}

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Accueil',
      item: 'https://vanzonexplorer.com',
    },
    {
      '@type': 'ListItem',
      position: 2,
      name: 'Road Trip Personnalisé',
      item: 'https://vanzonexplorer.com/road-trip-personnalise',
    },
  ],
}

const steps = [
  {
    icon: '🗺️',
    title: 'Tu remplis le formulaire',
    description: 'Région, durée, intérêts, profil de voyageur — 4 étapes simples.',
    url: 'https://vanzonexplorer.com/road-trip-personnalise#wizard',
  },
  {
    icon: '🤖',
    title: "L'IA construit ton plan",
    description: "Notre algo scrute des centaines de spots pour créer l'itinéraire parfait.",
    url: 'https://vanzonexplorer.com/road-trip-personnalise#wizard',
  },
  {
    icon: '📬',
    title: 'Reçu par email',
    description: 'Spots jour par jour, campings, conseils van — livré en moins de 60 secondes.',
    url: 'https://vanzonexplorer.com/road-trip-personnalise#wizard',
  },
]

const howToJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'HowTo',
  name: 'Comment créer un road trip en van personnalisé',
  totalTime: 'PT1M',
  step: steps.map((s, i) => ({
    '@type': 'HowToStep',
    position: i + 1,
    name: s.title,
    text: s.description,
    url: s.url,
  })),
}

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqItems.map((item) => ({
    '@type': 'Question',
    name: item.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: item.answer,
    },
  })),
}

export default function RoadTripPersonnalisePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      {/* Fond animé fixe sur toute la page */}
      <RoadTripMeshBackground />

      <div className="relative min-h-screen">

        {/* ── FIL D'ARIANE ───────────────────────────────────────────────────── */}
        <nav aria-label="Fil d'Ariane" className="px-8 sm:px-16 lg:px-28 pt-28 pb-0">
          <ol className="flex items-center gap-2 text-xs font-medium" style={{ color: 'rgba(50,50,50,0.50)' }}>
            <li>
              <Link href="/" className="hover:opacity-80 transition-opacity">Accueil</Link>
            </li>
            <li>
              <span className="mx-1">›</span>
            </li>
            <li style={{ color: 'rgba(50,50,50,0.80)' }}>Road Trip Personnalisé</li>
          </ol>
        </nav>

        {/* ── HERO ───────────────────────────────────────────────────────────── */}
        <section className="min-h-screen flex flex-col justify-center px-8 sm:px-16 lg:px-28 pt-6 pb-20">

          {/* Eyebrow */}
          <p className="text-xs font-semibold tracking-[0.35em] uppercase mb-8" style={{ color: 'rgba(50,50,50,0.55)' }}>
            Vanzon Explorer × IA
          </p>

          {/* Titre */}
          <h1
            className="text-[clamp(4rem,12vw,10rem)] leading-[0.92] font-black mb-0 uppercase"
            style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.02em', color: '#323232' }}
          >
            Roadtrip<br />
            <span style={{ color: 'rgba(50,50,50,0.8)' }}>personnalisé</span><br />
            <span style={{ color: 'rgba(50,50,50,0.65)', fontSize: '0.55em', letterSpacing: '0.04em' }}>en 1 minute</span>
          </h1>

          {/* Ligne de séparation */}
          <div className="w-16 h-[2px] mt-10 mb-8" style={{ background: 'rgba(50,50,50,0.25)' }} />

          {/* Description */}
          <p className="text-base sm:text-lg font-light leading-relaxed max-w-sm" style={{ color: 'rgba(50,50,50,0.70)' }}>
            Remplis le formulaire avec tes centres d&apos;intérêt et tes envies et reçois ton road trip van ultra-personnalisé, jour par jour, dans ta boîte mail. En une minute. Gratuitement.
          </p>

          {/* CTA */}
          <div className="mt-10 flex flex-col sm:flex-row items-start gap-4">
            <a
              href="#wizard"
              className="group inline-flex items-center gap-3 text-sm font-semibold tracking-wide transition-all duration-300"
              style={{ color: '#323232' }}
            >
              <span
                className="flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300"
                style={{ border: '2px solid rgba(50,50,50,0.35)' }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 5v14M5 12l7 7 7-7" />
                </svg>
              </span>
              <span className="pb-0.5 transition-colors duration-300" style={{ borderBottom: '1px solid rgba(50,50,50,0.30)' }}>
                Créer mon Road Trip Gratuit
              </span>
            </a>
          </div>

          {/* Stats discrètes */}
          <div className="mt-16 flex gap-8 text-xs font-medium tracking-widest uppercase" style={{ color: 'rgba(50,50,50,0.35)' }}>
            <span>IA générative</span>
            <span>·</span>
            <span>Toute la France</span>
            <span>·</span>
            <span>100% gratuit</span>
          </div>
        </section>

        {/* ── INTRO RICHE EN MOTS-CLÉS ───────────────────────────────────────── */}
        <section className="py-12 px-6">
          <div className="max-w-3xl mx-auto">
            <p className="text-base sm:text-lg leading-relaxed" style={{ color: '#2d6b6b' }}>
              Notre <strong style={{ color: '#0f3535' }}>générateur de road trip en van</strong> gratuit vous aide à{' '}
              <strong style={{ color: '#0f3535' }}>planifier votre road trip</strong> en quelques clics. Que vous rêviez
              d&apos;un <strong style={{ color: '#0f3535' }}>itinéraire personnalisé</strong> sur la côte atlantique,
              d&apos;un <strong style={{ color: '#0f3535' }}>road trip France</strong> à travers les Pyrénées ou d&apos;une
              escapade en <strong style={{ color: '#0f3535' }}>voyage en van aménagé</strong> sur les routes secondaires,
              notre IA analyse des centaines de spots pour créer votre plan idéal. Chaque itinéraire inclut les étapes
              jour par jour, les recommandations de <strong style={{ color: '#0f3535' }}>camping</strong> et bivouac,
              les <strong style={{ color: '#0f3535' }}>activités</strong> incontournables (surf, randonnée, gastronomie)
              et les conseils pratiques van. 100% gratuit, reçu par email en moins de 60 secondes. Partout en France.
            </p>
          </div>
        </section>

        {/* ── WIZARD ─────────────────────────────────────────────────────────── */}
        <section id="wizard" className="py-20 px-6">
          <div className="max-w-2xl mx-auto">

            {/* Header section */}
            <div className="text-center mb-10">
              <p className="text-sm font-bold uppercase tracking-widest mb-3" style={{ color: '#5a9090' }}>Le générateur</p>
              <h2 className="text-3xl md:text-4xl font-bold mb-3" style={{ color: '#0f3535' }}>
                Crée ton itinéraire en 4 étapes
              </h2>
              <p style={{ color: '#2d6b6b' }}>
                L&apos;IA s&apos;occupe du reste — tu reçois tout par email.
              </p>
            </div>

            {/* Wizard card */}
            <div
              className="rounded-3xl overflow-hidden"
              style={{
                background: 'rgba(255,255,255,0.62)',
                backdropFilter: 'blur(24px)',
                border: '1px solid rgba(255,255,255,0.8)',
                boxShadow: '0 24px 64px rgba(15,53,53,0.10), 0 1px 0 rgba(255,255,255,0.9) inset',
              }}
            >
              <div className="p-6 sm:p-8">
                <RoadTripWizard />
              </div>
            </div>
          </div>
        </section>

        {/* ── COMMENT ÇA MARCHE ──────────────────────────────────────────────── */}
        <section className="py-20 px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <p className="text-sm font-bold uppercase tracking-widest mb-3" style={{ color: '#5a9090' }}>Comment ça marche</p>
              <h2 className="text-3xl md:text-4xl font-bold" style={{ color: '#0f3535' }}>
                De zéro à ton road trip en 3 étapes
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {steps.map((step, i) => (
                <div
                  key={step.title}
                  className="rounded-2xl p-7"
                  style={{
                    background: 'rgba(255,255,255,0.52)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255,255,255,0.75)',
                    boxShadow: '0 8px 32px rgba(15,53,53,0.07)',
                  }}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-3xl">{step.icon}</span>
                    <span
                      className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                      style={{ background: '#72b9bb' }}
                    >
                      {i + 1}
                    </span>
                  </div>
                  <h3 className="text-base font-bold mb-2" style={{ color: '#0f3535' }}>{step.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: '#2d6b6b' }}>{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── EXEMPLES D'ITINÉRAIRES ─────────────────────────────────────────── */}
        <section className="py-20 px-6">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <p className="text-sm font-bold uppercase tracking-widest mb-3" style={{ color: '#5a9090' }}>Exemples d&apos;itinéraires</p>
              <h2 className="text-3xl md:text-4xl font-bold" style={{ color: '#0f3535' }}>
                Quelques idées pour t&apos;inspirer
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {itineraires.map((itin) => (
                <div
                  key={itin.titre}
                  className="rounded-2xl p-7 flex flex-col"
                  style={{
                    background: 'rgba(255,255,255,0.52)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255,255,255,0.75)',
                    boxShadow: '0 8px 32px rgba(15,53,53,0.07)',
                  }}
                >
                  <div className="text-3xl mb-3">{itin.emoji}</div>
                  <div className="inline-flex items-center gap-2 mb-3">
                    <h3 className="text-base font-bold" style={{ color: '#0f3535' }}>{itin.titre}</h3>
                    <span
                      className="text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
                      style={{ background: 'rgba(114,185,187,0.15)', color: '#2d6b6b' }}
                    >
                      {itin.duree}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed mb-4 flex-1" style={{ color: '#2d6b6b' }}>{itin.description}</p>
                  <ul className="flex flex-wrap gap-2 mb-5">
                    {itin.highlights.map((h) => (
                      <li
                        key={h}
                        className="text-xs px-2 py-1 rounded-lg"
                        style={{ background: 'rgba(15,53,53,0.06)', color: '#0f3535' }}
                      >
                        {h}
                      </li>
                    ))}
                  </ul>
                  <a
                    href="#wizard"
                    className="text-sm font-semibold text-center py-2.5 rounded-xl transition-all hover:opacity-90"
                    style={{ background: 'rgba(114,185,187,0.20)', color: '#0f3535' }}
                  >
                    Créer un itinéraire similaire →
                  </a>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── DESTINATIONS POPULAIRES ───────────────────────────────────────── */}
        <section className="py-20 px-6">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <p className="text-sm font-bold uppercase tracking-widest mb-3" style={{ color: '#5a9090' }}>Destinations</p>
              <h2 className="text-3xl md:text-4xl font-bold" style={{ color: '#0f3535' }}>
                Destinations populaires
              </h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
              {destinations.map((dest) => (
                <Link
                  key={dest.href}
                  href={dest.href}
                  className="rounded-2xl p-5 flex items-center gap-3 transition-all hover:opacity-90"
                  style={{
                    background: 'rgba(255,255,255,0.52)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255,255,255,0.75)',
                    boxShadow: '0 8px 32px rgba(15,53,53,0.07)',
                  }}
                >
                  <span className="text-2xl flex-shrink-0">{dest.emoji}</span>
                  <span className="text-sm font-semibold" style={{ color: '#0f3535' }}>{dest.nom}</span>
                </Link>
              ))}
            </div>

            <div className="text-center">
              <Link
                href="/pays-basque"
                className="inline-flex items-center gap-2 text-sm font-semibold transition-opacity hover:opacity-70"
                style={{ color: '#2d6b6b' }}
              >
                Découvrir toutes les destinations →
              </Link>
            </div>
          </div>
        </section>

        {/* ── PREUVE SOCIALE ─────────────────────────────────────────────────── */}
        <section className="py-20 px-6">
          <div className="max-w-5xl mx-auto">

            {/* Compteurs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-12">
              {[
                { chiffre: '+500', label: 'Road trips générés' },
                { chiffre: '100%', label: 'Gratuit' },
                { chiffre: '< 60s', label: 'Pour recevoir son plan' },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl p-7 text-center"
                  style={{
                    background: 'rgba(255,255,255,0.52)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255,255,255,0.75)',
                    boxShadow: '0 8px 32px rgba(15,53,53,0.07)',
                  }}
                >
                  <p className="text-4xl font-black mb-2" style={{ color: '#0f3535' }}>{stat.chiffre}</p>
                  <p className="text-sm font-medium" style={{ color: '#2d6b6b' }}>{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Témoignages */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {socialProof.map((t) => (
                <div
                  key={t.initiales}
                  className="rounded-2xl p-6"
                  style={{
                    background: 'rgba(255,255,255,0.52)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255,255,255,0.75)',
                    boxShadow: '0 8px 32px rgba(15,53,53,0.07)',
                  }}
                >
                  <div className="flex items-center gap-1 mb-3">
                    {Array.from({ length: t.etoiles }).map((_, i) => (
                      <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill="#72b9bb">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                    ))}
                  </div>
                  <p className="text-sm leading-relaxed mb-4" style={{ color: '#2d6b6b' }}>&ldquo;{t.texte}&rdquo;</p>
                  <p className="text-xs font-bold" style={{ color: '#0f3535' }}>{t.initiales}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FAQ ───────────────────────────────────────────────────────────── */}
        <section className="py-20 px-6">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <p className="text-sm font-bold uppercase tracking-widest mb-3" style={{ color: '#5a9090' }}>FAQ</p>
              <h2 className="text-3xl md:text-4xl font-bold" style={{ color: '#0f3535' }}>
                Questions fréquentes
              </h2>
            </div>

            <div className="space-y-3">
              {faqItems.map((item) => (
                <details
                  key={item.question}
                  className="group rounded-2xl overflow-hidden"
                  style={{
                    background: 'rgba(255,255,255,0.52)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255,255,255,0.75)',
                    boxShadow: '0 8px 32px rgba(15,53,53,0.07)',
                  }}
                >
                  <summary className="flex items-center justify-between gap-4 p-6 cursor-pointer list-none select-none">
                    <span className="font-semibold text-sm sm:text-base" style={{ color: '#0f3535' }}>
                      {item.question}
                    </span>
                    <svg
                      className="flex-shrink-0 transition-transform duration-300 group-open:rotate-180"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{ color: '#72b9bb' }}
                    >
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </summary>
                  <div className="px-6 pb-6 text-sm leading-relaxed" style={{ color: '#2d6b6b' }}>
                    {item.answer}
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA FINAL ──────────────────────────────────────────────────────── */}
        <section className="py-24 px-6">
          <div
            className="max-w-2xl mx-auto rounded-3xl p-10 sm:p-14 text-center"
            style={{
              background: 'rgba(13,53,53,0.78)',
              backdropFilter: 'blur(24px)',
              border: '1px solid rgba(255,255,255,0.1)',
              boxShadow: '0 24px 64px rgba(13,53,53,0.30)',
            }}
          >
            <div className="text-5xl mb-6">🚐</div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Prêt pour l&apos;aventure ?
            </h2>
            <p className="leading-relaxed mb-10 max-w-md mx-auto" style={{ color: '#b5d9d9' }}>
              Loue un van Vanzon Explorer tout équipé — literie, cuisine, GPS — et pars sur la route dès demain.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="#wizard"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full text-sm font-semibold transition-all hover:opacity-90"
                style={{ background: '#ffffff', color: '#0f3535' }}
              >
                Générer mon itinéraire gratuit
              </a>
              <Link
                href="/location"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full text-sm font-semibold text-white transition-all hover:opacity-90"
                style={{
                  background: '#72b9bb',
                  boxShadow: '0 4px 16px rgba(114,185,187,0.35)',
                }}
              >
                Voir les vans disponibles →
              </Link>
            </div>
          </div>
        </section>

      </div>
    </>
  )
}
