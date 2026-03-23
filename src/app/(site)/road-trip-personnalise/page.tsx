import type { Metadata } from 'next'
import Link from 'next/link'
import RoadTripWizard from './RoadTripWizard'

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

const features = [
  { icon: '✨', label: 'Généré par IA' },
  { icon: '📍', label: 'Toute la France' },
  { icon: '⚡', label: 'En 60 secondes' },
  { icon: '🎁', label: '100% gratuit' },
]

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

const testimonials = [
  {
    quote: "J'ai reçu un itinéraire complet pour la Bretagne en moins d'une minute. Les spots sont vraiment hors des sentiers battus.",
    author: 'Marie & Tom',
    context: 'Road trip Bretagne · 7 jours',
    emoji: '🌊',
  },
  {
    quote: "Parfait pour mon premier road trip en van. Les conseils pratiques m'ont vraiment aidé à ne rien oublier.",
    author: 'Julien',
    context: 'Solo · Alpes · 10 jours',
    emoji: '⛰️',
  },
  {
    quote: "On a suivi l'itinéraire Provence à la lettre. Chaque spot était une pépite, aucun camping décevant.",
    author: 'Lisa & Max',
    context: 'Couple · Provence · 5 jours',
    emoji: '🌻',
  },
]

const stats = [
  { value: '13+', label: 'régions couvertes' },
  { value: '100+', label: 'spots référencés' },
  { value: '< 60s', label: 'de génération' },
  { value: '0 €', label: 'pour toujours' },
]

export default function RoadTripPersonnalisePage() {
  return (
    <div className="bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }}
      />

      {/* ── 1. Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-white pt-28 pb-20 md:pt-36 md:pb-28">
        {/* Subtle background decorations */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] opacity-[0.07] pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at 50% 0%, #3B82F6 0%, transparent 65%)',
          }}
        />
        <div
          className="absolute top-20 right-0 w-72 h-72 opacity-[0.06] rounded-full blur-3xl pointer-events-none"
          style={{ background: '#B9945F' }}
        />
        <div
          className="absolute bottom-0 left-0 w-96 h-96 opacity-[0.05] rounded-full blur-3xl pointer-events-none"
          style={{ background: '#3B82F6' }}
        />

        {/* Dot grid */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.025]"
          style={{
            backgroundImage: 'radial-gradient(circle, #94a3b8 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />

        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          {/* Badge */}
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8 text-sm font-medium"
            style={{
              background: 'linear-gradient(135deg, #eff6ff 0%, #fefce8 100%)',
              border: '1px solid #bfdbfe',
              color: '#2563eb',
            }}
          >
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse inline-block" />
            Propulsé par l&apos;intelligence artificielle
          </div>

          {/* H1 */}
          <h1 className="text-5xl md:text-7xl font-bold leading-[1.05] tracking-tight text-slate-900 mb-6">
            Ton road trip van
            <br />
            <span
              style={{
                background: 'linear-gradient(135deg, #2563eb 0%, #B9945F 60%, #d97706 100%)',
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

          {/* Subheadline */}
          <p className="text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed mb-10">
            Dis-nous où tu veux aller — l&apos;IA génère ton itinéraire jour par jour.
            Spots secrets, campings, conseils van.{' '}
            <span className="text-slate-900 font-semibold">Reçu par email en 60 secondes.</span>
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap justify-center gap-3 mb-12">
            {features.map((f) => (
              <span
                key={f.label}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-slate-50 text-slate-600 border border-slate-200"
              >
                {f.icon} {f.label}
              </span>
            ))}
          </div>

          {/* CTA */}
          <a
            href="#wizard"
            className="inline-flex items-center gap-3 px-8 py-4 rounded-full text-base font-semibold text-white transition-all active:scale-95 hover:shadow-xl"
            style={{
              background: 'linear-gradient(135deg, #2563eb 0%, #0ea5e9 100%)',
              boxShadow: '0 4px 20px rgba(37,99,235,0.35)',
            }}
          >
            Générer mon road trip gratuit
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </a>
          <p className="text-slate-400 text-sm mt-4">Gratuit · Aucune inscription requise</p>
        </div>

        {/* Floating decorative text */}
        <div className="hidden lg:block absolute bottom-12 left-12 text-6xl opacity-10 select-none">🏔️</div>
        <div className="hidden lg:block absolute top-24 right-16 text-5xl opacity-10 select-none">🌊</div>
        <div className="hidden lg:block absolute bottom-20 right-28 text-5xl opacity-10 select-none">🌲</div>
      </section>

      {/* ── 2. Stats bar ─────────────────────────────────────────────────────── */}
      <section className="border-y border-slate-100 bg-slate-50">
        <div className="max-w-4xl mx-auto px-6 py-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {stats.map((s) => (
            <div key={s.label}>
              <div
                className="text-3xl font-bold"
                style={{
                  background: 'linear-gradient(135deg, #2563eb, #B9945F)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                {s.value}
              </div>
              <div className="text-slate-500 text-sm mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

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

      {/* ── 5. Témoignages ───────────────────────────────────────────────────── */}
      <section className="py-24 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <p
              className="text-sm font-semibold uppercase tracking-widest mb-3"
              style={{ color: '#B9945F' }}
            >
              Ils ont testé
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900">
              Des road trips qui ont vraiment eu lieu
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div
                key={t.author}
                className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col gap-4"
              >
                <div className="flex items-center justify-between">
                  <span className="text-2xl">{t.emoji}</span>
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className="text-amber-400 text-sm">★</span>
                    ))}
                  </div>
                </div>
                <p className="text-slate-600 text-sm leading-relaxed flex-1 italic">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div>
                  <p className="font-semibold text-slate-900 text-sm">{t.author}</p>
                  <p className="text-xs mt-0.5 font-medium" style={{ color: '#B9945F' }}>
                    {t.context}
                  </p>
                </div>
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
