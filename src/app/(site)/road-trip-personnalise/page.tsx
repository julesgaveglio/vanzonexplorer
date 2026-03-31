import type { Metadata } from 'next'
import Link from 'next/link'
import RoadTripWizard from './RoadTripWizard'
import RoadTripMeshBackground from './RoadTripHero'

export const metadata: Metadata = {
  title: 'Crée ton road trip en van personnalisé | Vanzon Explorer',
  description:
    'Génère gratuitement ton itinéraire road trip en van sur mesure. Spots, activités, camping selon tes envies et ta destination en France.',
  alternates: {
    canonical: 'https://vanzonexplorer.com/road-trip-personnalise',
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

const steps = [
  {
    icon: '🗺️',
    title: 'Tu remplis le formulaire',
    description: 'Région, durée, intérêts, profil de voyageur — 4 étapes simples.',
  },
  {
    icon: '🤖',
    title: "L'IA construit ton plan",
    description: 'Notre algo scrute des centaines de spots pour créer l\'itinéraire parfait.',
  },
  {
    icon: '📬',
    title: 'Reçu par email',
    description: 'Spots jour par jour, campings, conseils van — livré en moins de 60 secondes.',
  },
]

export default function RoadTripPersonnalisePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }}
      />

      {/* Fond animé fixe sur toute la page */}
      <RoadTripMeshBackground />

      <div className="relative min-h-screen">

        {/* ── HERO ───────────────────────────────────────────────────────────── */}
        <section className="min-h-screen flex flex-col items-center justify-center px-6 pt-24 pb-16 text-center">

          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8 text-sm font-medium bg-white/50 backdrop-blur-md border border-white/60 text-[#1a5c5c] shadow-sm">
            <span className="w-2 h-2 rounded-full bg-[#72b9bb] animate-pulse inline-block" />
            Propulsé par l&apos;intelligence artificielle
          </div>

          {/* H1 */}
          <h1
            className="font-bold text-6xl sm:text-7xl md:text-8xl leading-none mb-6 max-w-4xl"
            style={{ fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.01em', color: '#0f3535' }}
          >
            Ton road trip van
            <br />
            <span
              style={{
                background: 'linear-gradient(135deg, #2a8080 0%, #72b9bb 50%, #f4a882 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              ultra-personnalisé
            </span>
            <br />
            partout en France
          </h1>

          {/* Accroche */}
          <p className="text-lg sm:text-xl max-w-xl mx-auto leading-relaxed mb-10" style={{ color: '#2d6b6b' }}>
            Remplis le formulaire — l&apos;IA génère ton itinéraire jour par jour avec les meilleurs spots, campings et conseils.{' '}
            <strong className="font-semibold" style={{ color: '#0f3535' }}>Reçu par email en 60 secondes.</strong>
          </p>

          {/* Pills */}
          <div className="flex flex-wrap justify-center gap-3 mb-10">
            {['✨ Généré par IA', '📍 Toute la France', '⚡ 60 secondes', '🎁 100% gratuit'].map((label) => (
              <span
                key={label}
                className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-white/55 backdrop-blur-sm text-[#1a5c5c] border border-white/70 shadow-sm"
              >
                {label}
              </span>
            ))}
          </div>

          {/* CTA scroll */}
          <a
            href="#wizard"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full text-sm font-semibold text-white transition-all hover:scale-[1.03] active:scale-[0.97]"
            style={{
              background: '#2a8080',
              boxShadow: '0 8px 32px rgba(42,128,128,0.30)',
            }}
          >
            Créer mon Road Trip Gratuit
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12l7 7 7-7" />
            </svg>
          </a>

          {/* Scroll hint */}
          <div className="mt-12 flex flex-col items-center gap-2 opacity-40">
            <div className="w-px h-10 bg-[#72b9bb]" style={{ animation: 'pulse 2s infinite' }} />
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
