import type { Metadata } from 'next'
import Link from 'next/link'
import RoadTripWizard from './RoadTripWizard'

export const metadata: Metadata = {
  title: 'Crée ton road trip en van personnalisé | Vanzon Explorer',
  description:
    'Génère gratuitement ton itinéraire road trip en van sur mesure. Spots, activités, camping selon tes envies et ta destination en France.',
}

const webAppJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Générateur de road trip van personnalisé',
  applicationCategory: 'TravelApplication',
  description:
    'Génère ton itinéraire road trip en van sur mesure partout en France',
  url: 'https://vanzonexplorer.com/road-trip-personnalise',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
}

const steps = [
  {
    number: '1',
    icon: '📝',
    title: 'Remplis le formulaire',
    description:
      'Dis-nous ta destination, tes envies, ton profil de voyageur',
  },
  {
    number: '2',
    icon: '⚡',
    title: 'On génère ton itinéraire',
    description:
      "Notre IA analyse des centaines de spots et crée ton plan jour par jour",
  },
  {
    number: '3',
    icon: '📧',
    title: 'Tu reçois ton road trip',
    description:
      'Un email complet avec tous les détails arrive dans ta boîte mail',
  },
]

const testimonials = [
  {
    quote:
      "Ce générateur est incroyable ! J'ai reçu un itinéraire complet pour la Bretagne en moins d'une minute.",
    author: 'Marie & Tom',
    context: 'couple',
  },
  {
    quote:
      "Parfait pour préparer notre premier road trip en van. Les conseils pratiques sont vraiment adaptés aux débutants.",
    author: 'Julien',
    context: 'solo',
  },
  {
    quote:
      "On a suivi l'itinéraire Alpes à la lettre. Chaque spot était une pépite.",
    author: 'Lisa & Max',
    context: 'en couple',
  },
]

export default function RoadTripPersonnalisePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }}
      />

      {/* ── 1. Hero ──────────────────────────────────────────────────────── */}
      <section className="py-20 md:py-28" style={{ background: 'var(--bg-primary)' }}>
        <div className="max-w-3xl mx-auto px-6 text-center">
          <div className="text-5xl mb-6">🚐</div>
          <h1 className="text-4xl md:text-5xl font-bold text-[var(--text-primary)] leading-tight">
            Ton road trip en van sur mesure,{' '}
            <span style={{ color: 'var(--accent-blue)' }}>
              partout en France
            </span>
          </h1>
          <p className="mt-6 text-lg text-[var(--text-secondary)] max-w-xl mx-auto leading-relaxed">
            Remplis le formulaire, notre IA génère ton itinéraire personnalisé.
            Tu reçois tout par email — spots, campings, conseils pratiques.{' '}
            <span className="font-semibold text-[var(--text-primary)]">Gratuit.</span>
          </p>
          <a
            href="#wizard"
            className="inline-flex flex-col items-center gap-1 mt-10 text-sm font-medium text-[var(--text-muted)] hover:text-[var(--accent-blue)] transition-colors"
            aria-label="Aller au formulaire"
          >
            <span>Commencer</span>
            <svg
              className="w-5 h-5 animate-bounce"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </a>
        </div>
      </section>

      {/* ── 2. Wizard ────────────────────────────────────────────────────── */}
      <section
        id="wizard"
        className="py-16"
        style={{ background: 'var(--bg-secondary, #F8FAFC)' }}
      >
        <div className="max-w-2xl mx-auto px-6">
          <RoadTripWizard />
        </div>
      </section>

      {/* ── 3. Comment ça marche ─────────────────────────────────────────── */}
      <section className="py-20" style={{ background: '#FAF6F0' }}>
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900">
              Comment ça marche ?
            </h2>
            <p className="text-slate-500 mt-3 max-w-xl mx-auto">
              En trois étapes simples, tu reçois un itinéraire 100% personnalisé.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {steps.map((step) => (
              <div key={step.number} className="glass-card p-6 relative">
                <div className="flex items-start gap-4">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                    style={{ background: 'var(--accent-blue)' }}
                  >
                    {step.number}
                  </div>
                  <div className="flex-1">
                    <div className="text-2xl mb-2">{step.icon}</div>
                    <h3 className="text-base font-semibold text-slate-900">
                      {step.title}
                    </h3>
                    <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. Témoignages ───────────────────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900">
              Ils ont testé le générateur
            </h2>
            <p className="text-slate-500 mt-2">
              Des road trips personnalisés, vraiment.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div key={t.author} className="glass-card p-6 flex flex-col gap-4">
                <div className="text-2xl">⭐⭐⭐⭐⭐</div>
                <p className="text-slate-600 text-sm leading-relaxed flex-1">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div>
                  <p className="font-semibold text-slate-900 text-sm">{t.author}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{t.context}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5. Secondary CTA ─────────────────────────────────────────────── */}
      <section className="py-20" style={{ background: '#FAF6F0' }}>
        <div className="max-w-2xl mx-auto px-6 text-center">
          <div className="text-4xl mb-4">🗺️</div>
          <h2 className="text-3xl font-bold text-slate-900">
            Tu préfères qu&apos;on s&apos;en occupe ?
          </h2>
          <p className="text-slate-500 mt-3 max-w-lg mx-auto leading-relaxed">
            Loue un van Vanzon Explorer tout équipé pour ton prochain road trip.
          </p>
          <Link
            href="/location"
            className="btn-primary inline-block mt-8 px-8 py-4 text-base"
          >
            Voir les vans disponibles →
          </Link>
        </div>
      </section>
    </>
  )
}
