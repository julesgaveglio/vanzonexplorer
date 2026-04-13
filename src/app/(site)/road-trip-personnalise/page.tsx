import type { Metadata } from 'next'
import Link from 'next/link'
import Breadcrumbs from '@/components/ui/Breadcrumbs'
import { SparklesText } from '@/components/ui/SparklesText'
import ScrollingBanner from '@/components/ui/ScrollingBanner'
import RoadTripWizard from './RoadTripWizard'
import { faqItems, itineraires, destinations } from './seo-data'
import { createSupabaseAdmin } from '@/lib/supabase/server'

export const revalidate = 3600 // 1h pour le compteur

export const metadata: Metadata = {
  title: 'Générateur Road Trip Van Pays Basque — Itinéraire Personnalisé Gratuit',
  description:
    'Créez votre road trip van au Pays Basque ultra-personnalisé en 1 minute. Spots de nuit van, activités, gastronomie basque — 100 % gratuit, reçu par email. Biarritz, Bayonne, Espelette, Iraty.',
  alternates: {
    canonical: 'https://vanzonexplorer.com/road-trip-personnalise',
  },
  openGraph: {
    title: 'Générateur Road Trip Van Pays Basque — Itinéraire Personnalisé Gratuit',
    description:
      'Road trip van Pays Basque ultra-personnalisé par IA. Spots nuit, activités, gastronomie basque — gratuit, reçu par email.',
    type: 'website',
    url: 'https://vanzonexplorer.com/road-trip-personnalise',
  },
}

const webAppJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Générateur de Road Trip Van Pays Basque Ultra-personnalisé',
  applicationCategory: 'TravelApplication',
  description: 'Génère ton itinéraire road trip en van au Pays Basque ultra-personnalisé par IA',
  url: 'https://vanzonexplorer.com/road-trip-personnalise',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR' },
}

const breadcrumbJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Accueil', item: 'https://vanzonexplorer.com' },
    { '@type': 'ListItem', position: 2, name: 'Road Trip Personnalisé', item: 'https://vanzonexplorer.com/road-trip-personnalise' },
  ],
}

const steps = [
  { icon: '📝', title: 'Vos envies', description: 'Durée, style, budget' },
  { icon: '🤖', title: "L'IA génère", description: 'Spots & itinéraire sur mesure' },
  { icon: '📧', title: 'Par email', description: 'Prêt en 60 secondes' },
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
    url: 'https://vanzonexplorer.com/road-trip-personnalise#wizard',
  })),
}

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqItems.map((item) => ({
    '@type': 'Question',
    name: item.question,
    acceptedAnswer: { '@type': 'Answer', text: item.answer },
  })),
}

async function getRoadTripCount(): Promise<number> {
  try {
    const supabase = createSupabaseAdmin()
    const { count } = await supabase
      .from('road_trip_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'sent')
    return count ?? 0
  } catch {
    return 0
  }
}

function StepsRow() {
  return (
    <div className="flex items-center justify-center max-w-sm mx-auto mb-8">
      {steps.map((step, i) => (
        <div key={step.title} className="flex items-center">
          <div className="flex flex-col items-center text-center w-20 sm:w-24">
            <span className="text-xl sm:text-2xl mb-1">{step.icon}</span>
            <p className="text-xs font-bold text-slate-900 leading-tight">{step.title}</p>
            <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5 leading-tight">{step.description}</p>
          </div>
          {i < steps.length - 1 && (
            <div className="flex-none w-6 sm:w-8 border-t border-dashed border-slate-300 mt-[-1rem]" />
          )}
        </div>
      ))}
    </div>
  )
}

export default async function RoadTripPersonnalisePage({
  searchParams,
}: {
  searchParams: { [key: string]: string | undefined }
}) {
  const isAdTraffic = Boolean(
    searchParams.from === 'ad' ||
    searchParams.utm_source ||
    searchParams.utm_medium === 'paid'
  )

  const tripCount = await getRoadTripCount()
  // Affiche un nombre arrondi crédible (minimum 50 pour le social proof)
  const displayCount = Math.max(50, Math.floor(tripCount / 10) * 10) + '+'

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howToJsonLd) }} />
      {!isAdTraffic && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      )}

      <main className="min-h-screen bg-bg-primary">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          {!isAdTraffic && (
            <Breadcrumbs items={[{ label: 'Accueil', href: '/' }, { label: 'Road Trips', href: '/road-trip' }, { label: 'Personnalisé' }]} />
          )}

          {/* ═══ HERO ═══ */}
          <div className="text-center mb-10 pt-4">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 mb-5 leading-tight">
              Générateur de Road Trip Pays Basque{' '}
              <SparklesText
                text="Ultra-personnalisé"
                className="bg-gradient-to-r from-[#3B82F6] to-[#0EA5E9] bg-clip-text text-transparent"
                colors={{ first: '#FBBF24', second: '#F59E0B' }}
                sparklesCount={12}
              />
            </h1>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto mb-6">
              {isAdTraffic
                ? 'Ton itinéraire van au Pays Basque sur mesure en 2 minutes. Spots nuit, activités, gastronomie basque — gratuit, reçu par email.'
                : 'Itinéraire van Pays Basque personnalisé en 1 minute : étapes jour par jour, spots de nuit van (parkings gratuits, aires, campings), gastronomie basque et activités. 100% gratuit, reçu par email.'
              }
            </p>

            {/* Réassurance au-dessus du fold */}
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-slate-600 mb-8">
              <span className="flex items-center gap-1.5">✅ 100% gratuit</span>
              <span className="flex items-center gap-1.5">📧 Reçu par email</span>
              <span className="flex items-center gap-1.5">⚡ En 60 secondes</span>
              <span className="flex items-center gap-1.5">🗺️ {displayCount} road trips générés</span>
            </div>

            <a href="#wizard" className="btn-primary relative px-8 py-3.5 rounded-full text-white font-semibold text-lg shadow-lg hover:shadow-xl transition-all">
              {isAdTraffic ? 'Générer mon road trip gratuit →' : 'Créer mon itinéraire gratuit'}
              <span aria-hidden="true" className="absolute inset-0 rounded-full" style={{ boxShadow: 'inset 0 1.5px 1px rgba(255,255,255,0.55), inset 0 -1px 1px rgba(0,0,0,0.20), inset 2px 0 2px rgba(255,255,255,0.10), inset -2px 0 2px rgba(0,0,0,0.10), inset 0 0 10px rgba(255,255,255,0.14)' }} />
            </a>
          </div>

          {/* Bandeau images défilantes Pays Basque */}
          <ScrollingBanner />

          {/* ═══ MODE ADS : wizard immédiat, pas de SEO fluff ═══ */}
          {isAdTraffic ? (
            <>
              <StepsRow />

              {/* Wizard */}
              <section id="wizard" className="mb-12 scroll-mt-8">
                <div className="max-w-2xl mx-auto">
                  <div className="glass-card rounded-2xl p-6 sm:p-8">
                    <RoadTripWizard />
                  </div>
                </div>
              </section>

            </>
          ) : (
            /* ═══ MODE ORGANIQUE : page SEO complète ═══ */
            <>
              {/* Comment ça marche */}
              <section className="mb-16">
                <div className="text-center mb-8">
                  <p className="text-xs font-semibold tracking-[0.25em] uppercase text-accent-blue mb-3">Comment ça marche</p>
                </div>
                <StepsRow />
              </section>

              {/* Wizard */}
              <section id="wizard" className="mb-16 scroll-mt-24">
                <div className="max-w-2xl mx-auto">
                  <div className="text-center mb-8">
                    <p className="text-xs font-semibold tracking-[0.25em] uppercase text-accent-blue mb-3">Le générateur</p>
                    <h2 className="text-2xl md:text-3xl font-black text-slate-900 mb-2">
                      Créez votre itinéraire en 5 étapes
                    </h2>
                    <p className="text-slate-500">L&apos;IA s&apos;occupe du reste — vous recevez tout par email.</p>
                  </div>
                  <div className="glass-card rounded-2xl p-6 sm:p-8">
                    <RoadTripWizard />
                  </div>
                </div>
              </section>

              {/* Exemples d'itinéraires */}
              <section className="mb-16">
                <div className="text-center mb-10">
                  <p className="text-xs font-semibold tracking-[0.25em] uppercase text-accent-blue mb-3">Exemples d&apos;itinéraires</p>
                  <h2 className="text-2xl md:text-3xl font-black text-slate-900">Quelques idées pour vous inspirer</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-5xl mx-auto">
                  {itineraires.map((itin) => (
                    <div key={itin.titre} className="glass-card rounded-2xl p-7 flex flex-col">
                      <div className="text-3xl mb-3">{itin.emoji}</div>
                      <div className="flex items-center gap-2 mb-3">
                        <h3 className="text-sm font-bold text-slate-900">{itin.titre}</h3>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-accent-blue flex-shrink-0">{itin.duree}</span>
                      </div>
                      <p className="text-sm text-slate-500 leading-relaxed mb-4 flex-1">{itin.description}</p>
                      <ul className="flex flex-wrap gap-2 mb-5">
                        {itin.highlights.map((h) => (
                          <li key={h} className="text-xs px-2 py-1 rounded-lg bg-slate-100 text-slate-700">{h}</li>
                        ))}
                      </ul>
                      <a href="#wizard" className="text-sm font-semibold text-center py-2.5 rounded-xl bg-blue-50 text-accent-blue transition-all hover:bg-blue-100">
                        Créer un itinéraire similaire
                      </a>
                    </div>
                  ))}
                </div>
              </section>

              {/* Destinations populaires */}
              <section className="mb-16">
                <div className="text-center mb-10">
                  <p className="text-xs font-semibold tracking-[0.25em] uppercase text-accent-blue mb-3">Destinations</p>
                  <h2 className="text-2xl md:text-3xl font-black text-slate-900">Destinations populaires</h2>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-4xl mx-auto mb-6">
                  {destinations.map((dest) => (
                    <Link
                      key={dest.href}
                      href={dest.href}
                      className="glass-card-hover rounded-xl p-4 flex items-center gap-3 group transition-all"
                    >
                      <span className="text-2xl flex-shrink-0">{dest.emoji}</span>
                      <span className="text-sm font-semibold text-slate-700 group-hover:text-accent-blue transition-colors">{dest.nom}</span>
                    </Link>
                  ))}
                </div>
                <div className="text-center">
                  <Link href="/road-trip" className="text-sm font-semibold text-accent-blue hover:underline">
                    Voir tous les itinéraires
                  </Link>
                </div>
              </section>

              {/* FAQ */}
              <section className="mb-16">
                <div className="text-center mb-10">
                  <p className="text-xs font-semibold tracking-[0.25em] uppercase text-accent-blue mb-3">FAQ</p>
                  <h2 className="text-2xl md:text-3xl font-black text-slate-900">Questions fréquentes</h2>
                </div>
                <div className="max-w-3xl mx-auto space-y-3">
                  {faqItems.map((item) => (
                    <details key={item.question} className="group glass-card rounded-2xl overflow-hidden">
                      <summary className="flex items-center justify-between gap-4 p-6 cursor-pointer list-none select-none">
                        <span className="font-semibold text-sm sm:text-base text-slate-900">{item.question}</span>
                        <svg className="flex-shrink-0 transition-transform duration-300 group-open:rotate-180 text-accent-blue" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M6 9l6 6 6-6" />
                        </svg>
                      </summary>
                      <div className="px-6 pb-6 text-sm leading-relaxed text-slate-500">{item.answer}</div>
                    </details>
                  ))}
                </div>
              </section>

              {/* CTA Final */}
              <div className="text-center glass-card rounded-2xl p-10 sm:p-14 mb-8">
                <h2 className="text-2xl md:text-3xl font-black text-slate-900 mb-3">Prêt pour l&apos;aventure ?</h2>
                <p className="text-slate-500 mb-8 max-w-md mx-auto">
                  Louez un van Vanzon Explorer tout équipé et partez sur la route dès demain.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <a href="#wizard" className="btn-primary px-8 py-3.5 rounded-xl text-white font-semibold">
                    Générer mon itinéraire gratuit
                  </a>
                  <Link href="/location" className="btn-ghost px-8 py-3.5 rounded-xl font-semibold">
                    Voir les vans disponibles
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </>
  )
}
