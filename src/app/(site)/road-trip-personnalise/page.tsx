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
    description: 'Région, durée, tes intérêts, ton profil… 4 étapes simples pour tout personnaliser.',
  },
  {
    number: '02',
    icon: '🤖',
    title: "L'IA construit ton itinéraire",
    description: 'Notre algorithme scrute des centaines de spots, campings et activités pour te créer le road trip parfait.',
  },
  {
    number: '03',
    icon: '📬',
    title: 'Tu reçois tout par email',
    description: 'Spots jour par jour, aires de camping, conseils van — un guide complet dans ta boîte mail.',
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
    quote: "Parfait pour préparer mon premier road trip en van. Les conseils pratiques m'ont vraiment aidé à ne rien oublier.",
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

export default function RoadTripPersonnalisePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }}
      />

      {/* ── 1. Hero ──────────────────────────────────────────────────────────── */}
      <section
        className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden px-6 py-24"
        style={{
          background: 'linear-gradient(160deg, #0a0f1e 0%, #0d1b35 40%, #0f172a 70%, #0c1225 100%)',
        }}
      >
        {/* Glowing orbs */}
        <div
          className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full opacity-20 blur-[120px] pointer-events-none"
          style={{ background: 'radial-gradient(circle, #3B82F6 0%, transparent 70%)' }}
        />
        <div
          className="absolute bottom-[-5%] right-[-5%] w-[600px] h-[600px] rounded-full opacity-15 blur-[140px] pointer-events-none"
          style={{ background: 'radial-gradient(circle, #B9945F 0%, transparent 70%)' }}
        />
        <div
          className="absolute top-[30%] right-[10%] w-[300px] h-[300px] rounded-full opacity-10 blur-[100px] pointer-events-none"
          style={{ background: 'radial-gradient(circle, #8b5cf6 0%, transparent 70%)' }}
        />

        {/* Subtle grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />

        {/* Content */}
        <div className="relative z-10 max-w-4xl mx-auto text-center">

          {/* Badge IA */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8 text-sm font-medium"
            style={{
              background: 'rgba(59,130,246,0.12)',
              border: '1px solid rgba(59,130,246,0.3)',
              color: '#93c5fd',
            }}
          >
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse inline-block" />
            Propulsé par l&apos;intelligence artificielle
          </div>

          {/* H1 */}
          <h1 className="text-5xl md:text-7xl font-bold leading-[1.05] tracking-tight mb-6">
            <span className="text-white">Ton road trip van</span>
            <br />
            <span
              style={{
                background: 'linear-gradient(135deg, #63b3ed 0%, #B9945F 50%, #E4D398 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              ultra-personnalisé
            </span>
            <br />
            <span className="text-white">partout en France</span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed mb-10">
            Dis-nous où tu veux aller, l&apos;IA génère ton itinéraire jour par jour —
            spots secrets, campings, conseils pratiques.{' '}
            <span className="text-white font-semibold">Reçu dans ta boîte mail en 60 secondes.</span>
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap justify-center gap-3 mb-12">
            {features.map((f) => (
              <span
                key={f.label}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium text-slate-300"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
              >
                {f.icon} {f.label}
              </span>
            ))}
          </div>

          {/* CTA */}
          <a
            href="#wizard"
            className="btn-shine inline-flex items-center gap-3 px-8 py-4 rounded-full text-base font-semibold text-white transition-transform active:scale-95"
            style={{
              background: 'linear-gradient(135deg, #3B82F6 0%, #0EA5E9 100%)',
              boxShadow: '0 4px 24px rgba(59,130,246,0.45), 0 1px 4px rgba(14,165,233,0.3)',
            }}
          >
            <span>Générer mon road trip</span>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </a>

          <p className="text-slate-600 text-sm mt-4">Gratuit · Aucune inscription requise</p>
        </div>

        {/* Floating icons */}
        <div className="absolute bottom-10 left-8 text-4xl opacity-20 hidden lg:block" style={{ filter: 'blur(1px)' }}>🏔️</div>
        <div className="absolute top-20 right-12 text-3xl opacity-15 hidden lg:block" style={{ filter: 'blur(1px)' }}>🌊</div>
        <div className="absolute bottom-24 right-20 text-3xl opacity-20 hidden lg:block" style={{ filter: 'blur(1px)' }}>🌲</div>
        <div className="absolute top-1/3 left-8 text-2xl opacity-15 hidden lg:block" style={{ filter: 'blur(1px)' }}>⛺</div>
      </section>

      {/* ── 2. Stats bar ─────────────────────────────────────────────────────── */}
      <section
        style={{
          background: 'linear-gradient(90deg, #0d1b35 0%, #0f172a 100%)',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div className="max-w-5xl mx-auto px-6 py-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { value: '13', label: 'régions couvertes' },
            { value: '100+', label: 'spots référencés' },
            { value: '60s', label: 'temps de génération' },
            { value: '0€', label: 'pour toujours' },
          ].map((stat) => (
            <div key={stat.label}>
              <div
                className="text-3xl font-bold"
                style={{
                  background: 'linear-gradient(135deg, #63b3ed, #E4D398)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                {stat.value}
              </div>
              <div className="text-slate-500 text-sm mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 3. Wizard ────────────────────────────────────────────────────────── */}
      <section
        id="wizard"
        className="py-20"
        style={{ background: 'var(--bg-primary)' }}
      >
        <div className="max-w-2xl mx-auto px-6">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold text-[var(--text-primary)]">
              Crée ton itinéraire en 4 étapes
            </h2>
            <p className="text-[var(--text-secondary)] mt-3">
              L&apos;IA s&apos;occupe du reste — tu reçois tout par email.
            </p>
          </div>
          <RoadTripWizard />
        </div>
      </section>

      {/* ── 4. Comment ça marche ─────────────────────────────────────────────── */}
      <section
        className="py-24"
        style={{ background: 'linear-gradient(160deg, #0a0f1e 0%, #0d1b35 100%)' }}
      >
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-blue-400 text-sm font-semibold uppercase tracking-widest mb-3">Comment ça marche</p>
            <h2 className="text-3xl md:text-4xl font-bold text-white">
              De zéro à ton road trip en 3 étapes
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <div key={step.number} className="relative">
                {/* Connector line */}
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-[calc(100%+1rem)] w-[calc(100%-2rem)] h-px"
                    style={{ background: 'linear-gradient(90deg, rgba(59,130,246,0.4) 0%, transparent 100%)' }}
                  />
                )}
                <div
                  className="glass-card p-8 h-full"
                  style={{ border: '1px solid rgba(59,130,246,0.15)', background: 'rgba(59,130,246,0.04)' }}
                >
                  <div className="flex items-center gap-3 mb-5">
                    <span className="text-3xl">{step.icon}</span>
                    <span
                      className="text-xs font-bold tracking-widest"
                      style={{ color: '#63b3ed' }}
                    >
                      ÉTAPE {step.number}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-3">{step.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5. Témoignages ───────────────────────────────────────────────────── */}
      <section
        className="py-24"
        style={{ background: 'var(--bg-primary)' }}
      >
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <p
              className="text-sm font-semibold uppercase tracking-widest mb-3"
              style={{ color: '#B9945F' }}
            >
              Ils ont testé
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-[var(--text-primary)]">
              Des road trips qui ont vraiment eu lieu
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div
                key={t.author}
                className="glass-card p-6 flex flex-col gap-4"
                style={{ border: '1px solid rgba(185,148,95,0.15)' }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-2xl">{t.emoji}</span>
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className="text-yellow-400 text-sm">★</span>
                    ))}
                  </div>
                </div>
                <p className="text-[var(--text-secondary)] text-sm leading-relaxed flex-1 italic">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div>
                  <p className="font-semibold text-[var(--text-primary)] text-sm">{t.author}</p>
                  <p
                    className="text-xs mt-0.5"
                    style={{ color: '#B9945F' }}
                  >
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
        style={{ background: 'linear-gradient(135deg, #0a0f1e 0%, #0d1b35 100%)' }}
      >
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at center, #3B82F6 0%, transparent 70%)' }}
        />
        <div className="relative z-10 max-w-2xl mx-auto px-6 text-center">
          <div className="text-5xl mb-6">🚐</div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Prêt pour l&apos;aventure ?
          </h2>
          <p className="text-slate-400 leading-relaxed mb-8 max-w-lg mx-auto">
            Loue un van Vanzon Explorer tout équipé — literie, cuisine, GPS — et pars sur la route dès demain.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="#wizard"
              className="btn-shine inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full text-sm font-semibold text-white"
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.15)',
              }}
            >
              Générer mon itinéraire gratuit
            </a>
            <Link
              href="/location"
              className="btn-shine inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full text-sm font-semibold text-white"
              style={{
                background: 'linear-gradient(135deg, #3B82F6 0%, #0EA5E9 100%)',
                boxShadow: '0 4px 18px rgba(59,130,246,0.4)',
              }}
            >
              Voir les vans disponibles →
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
