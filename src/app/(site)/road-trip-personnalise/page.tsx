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
        <section className="min-h-screen flex flex-col justify-center px-8 sm:px-16 lg:px-28 pt-28 pb-20">

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
