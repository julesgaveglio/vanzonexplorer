import type { Metadata } from 'next'
import Link from 'next/link'
import RoadTripWizard from './RoadTripWizard'
import RoadTripHero from './RoadTripHero'

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
    number: '01',
    icon: '🗺️',
    title: 'Tu remplis le formulaire',
    description: 'Région, durée, tes intérêts, ton profil de voyageur… 4 étapes simples.',
  },
  {
    number: '02',
    icon: '🤖',
    title: "L'IA construit ton itinéraire",
    description: 'Notre algorithme scrute des centaines de spots et campings pour créer le plan parfait.',
  },
  {
    number: '03',
    icon: '📬',
    title: 'Tu reçois tout par email',
    description: 'Spots jour par jour, campings, conseils pratiques — livré en moins de 60 secondes.',
  },
]

export default function RoadTripPersonnalisePage() {
  return (
    <div className="bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }}
      />

      {/* ── 1. Hero avec MeshGradient animé ─────────────────────────────────── */}
      <RoadTripHero />

      {/* ── 3. Wizard ────────────────────────────────────────────────────────── */}
      <section id="wizard" className="py-20 bg-white">
        <div className="max-w-2xl mx-auto px-6">
          <div className="text-center mb-10">
            <p className="text-blue-600 text-sm font-semibold uppercase tracking-widest mb-3">Le générateur</p>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900">
              Crée ton itinéraire en 4 étapes
            </h2>
            <p className="text-slate-500 mt-3">
              L&apos;IA s&apos;occupe du reste — tu reçois tout par email.
            </p>
          </div>
          <RoadTripWizard />
        </div>
      </section>

      {/* ── 4. Comment ça marche ─────────────────────────────────────────────── */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-blue-600 text-sm font-semibold uppercase tracking-widest mb-3">Comment ça marche</p>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900">
              De zéro à ton road trip en 3 étapes
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {steps.map((step, i) => (
              <div
                key={step.number}
                className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-3 mb-5">
                  <span className="text-3xl">{step.icon}</span>
                  <span className="text-xs font-bold tracking-widest text-blue-500 uppercase">
                    Étape {i + 1}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-3">{step.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 6. Secondary CTA ─────────────────────────────────────────────────── */}
      <section
        className="py-24 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #eff6ff 0%, #fefce8 50%, #f0f9ff 100%)',
        }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle, #94a3b8 1px, transparent 1px)',
            backgroundSize: '32px 32px',
            opacity: 0.04,
          }}
        />
        <div className="relative z-10 max-w-2xl mx-auto px-6 text-center">
          <div className="text-5xl mb-6">🚐</div>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            Prêt pour l&apos;aventure ?
          </h2>
          <p className="text-slate-500 leading-relaxed mb-10 max-w-lg mx-auto">
            Loue un van Vanzon Explorer tout équipé — literie, cuisine, GPS — et pars sur la route dès demain.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="#wizard"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full text-sm font-semibold text-slate-700 bg-white border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all"
            >
              Générer mon itinéraire gratuit
            </a>
            <Link
              href="/location"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full text-sm font-semibold text-white transition-all hover:shadow-lg active:scale-95"
              style={{
                background: 'linear-gradient(135deg, #2563eb 0%, #0ea5e9 100%)',
                boxShadow: '0 4px 16px rgba(37,99,235,0.3)',
              }}
            >
              Voir les vans disponibles →
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
