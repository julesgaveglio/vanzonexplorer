import type { Metadata } from 'next'
import Link from 'next/link'
import Breadcrumbs from '@/components/ui/Breadcrumbs'
import RoadTripWizard from './RoadTripWizard'
import { faqItems, itineraires, destinations, socialProof } from './seo-data'

export const metadata: Metadata = {
  title: 'Road Trip Van Pays Basque Personnalisé | Itinéraire Gratuit',
  description:
    'Créez votre road trip van au Pays Basque en 1 minute. Spots de nuit van (parkings gratuits, aires, campings), activités, gastronomie — 100 % gratuit, reçu par email.',
  alternates: {
    canonical: 'https://vanzonexplorer.com/road-trip-personnalise',
  },
  openGraph: {
    title: 'Road Trip Van Pays Basque Personnalisé | Itinéraire Gratuit',
    description:
      'Créez votre road trip van au Pays Basque en 1 minute. Spots de nuit van, activités, gastronomie basque — 100 % gratuit, reçu par email.',
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
    icon: '1',
    title: 'Remplissez le formulaire',
    description: 'Profil, situation van, durée, envies, budget, nuit — 5 étapes simples.',
  },
  {
    icon: '2',
    title: "L'IA construit votre plan",
    description: "Notre algorithme analyse les meilleurs spots du Pays Basque et sélectionne vos spots de nuit van.",
  },
  {
    icon: '3',
    title: 'Reçu par email',
    description: 'Étapes jour par jour, spots de nuit van, conseils pratiques — livré en moins de 60 secondes.',
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
    url: 'https://vanzonexplorer.com/road-trip-personnalise#wizard',
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

      <main className="min-h-screen bg-bg-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Breadcrumbs items={[{ label: 'Accueil', href: '/' }, { label: 'Road Trips', href: '/road-trip' }, { label: 'Personnalisé' }]} />

          {/* Hero */}
          <div className="text-center mb-16 pt-8">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 mb-5">
              Votre Road Trip Van au Pays Basque
            </h1>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto mb-8">
              Itinéraire personnalisé en 1 minute : étapes jour par jour, spots de nuit van
              (parkings gratuits, aires, campings), gastronomie et activités. 100% gratuit, reçu par email.
            </p>
            <a href="#wizard" className="btn-primary px-8 py-3.5 rounded-xl text-white font-semibold">
              Créer mon itinéraire gratuit
            </a>
          </div>

          {/* Intro SEO */}
          <section className="mb-16 glass-card rounded-2xl p-8 max-w-3xl mx-auto">
            <p className="text-sm leading-relaxed text-slate-600">
              Notre <strong className="text-slate-800">générateur de road trip en van</strong> gratuit vous aide à{' '}
              <strong className="text-slate-800">planifier votre road trip</strong> en quelques clics. Que vous rêviez
              d&apos;un <strong className="text-slate-800">itinéraire personnalisé</strong> sur la côte atlantique,
              d&apos;un <strong className="text-slate-800">road trip France</strong> à travers les Pyrénées ou d&apos;une
              escapade en <strong className="text-slate-800">voyage en van aménagé</strong> sur les routes secondaires,
              notre IA analyse des centaines de spots pour créer votre plan idéal. Chaque itinéraire inclut les étapes
              jour par jour, les recommandations de <strong className="text-slate-800">camping</strong> et bivouac,
              les <strong className="text-slate-800">activités</strong> incontournables et les conseils pratiques van.
            </p>
          </section>

          {/* Comment ça marche */}
          <section className="mb-16">
            <div className="text-center mb-10">
              <p className="text-xs font-semibold tracking-[0.25em] uppercase text-accent-blue mb-3">Comment ça marche</p>
              <h2 className="text-2xl md:text-3xl font-black text-slate-900">
                De zéro à votre road trip en 3 étapes
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-4xl mx-auto">
              {steps.map((step) => (
                <div key={step.title} className="glass-card rounded-2xl p-7 text-center">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-sm font-bold mx-auto mb-4">
                    {step.icon}
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 mb-2">{step.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{step.description}</p>
                </div>
              ))}
            </div>
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
              <h2 className="text-2xl md:text-3xl font-black text-slate-900">
                Quelques idées pour vous inspirer
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-5xl mx-auto">
              {itineraires.map((itin) => (
                <div key={itin.titre} className="glass-card rounded-2xl p-7 flex flex-col">
                  <div className="text-3xl mb-3">{itin.emoji}</div>
                  <div className="flex items-center gap-2 mb-3">
                    <h3 className="text-sm font-bold text-slate-900">{itin.titre}</h3>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-accent-blue flex-shrink-0">
                      {itin.duree}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 leading-relaxed mb-4 flex-1">{itin.description}</p>
                  <ul className="flex flex-wrap gap-2 mb-5">
                    {itin.highlights.map((h) => (
                      <li key={h} className="text-xs px-2 py-1 rounded-lg bg-slate-100 text-slate-700">
                        {h}
                      </li>
                    ))}
                  </ul>
                  <a
                    href="#wizard"
                    className="text-sm font-semibold text-center py-2.5 rounded-xl bg-blue-50 text-accent-blue transition-all hover:bg-blue-100"
                  >
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
              <h2 className="text-2xl md:text-3xl font-black text-slate-900">
                Destinations populaires
              </h2>
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

          {/* Preuve sociale — Compteurs */}
          <section className="mb-16">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 max-w-4xl mx-auto mb-8">
              {[
                { chiffre: '+500', label: 'Road trips générés' },
                { chiffre: '100%', label: 'Gratuit' },
                { chiffre: '< 60s', label: 'Pour recevoir son plan' },
              ].map((stat) => (
                <div key={stat.label} className="glass-card rounded-2xl p-7 text-center">
                  <p className="text-4xl font-black text-slate-900 mb-2">{stat.chiffre}</p>
                  <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Témoignages */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-4xl mx-auto">
              {socialProof.map((t) => (
                <div key={t.initiales} className="glass-card rounded-2xl p-6">
                  <div className="flex items-center gap-1 mb-3">
                    {Array.from({ length: t.etoiles }).map((_, i) => (
                      <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill="#3B82F6">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                    ))}
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed mb-4">&ldquo;{t.texte}&rdquo;</p>
                  <p className="text-xs font-bold text-slate-900">{t.initiales}</p>
                </div>
              ))}
            </div>
          </section>

          {/* FAQ */}
          <section className="mb-16">
            <div className="text-center mb-10">
              <p className="text-xs font-semibold tracking-[0.25em] uppercase text-accent-blue mb-3">FAQ</p>
              <h2 className="text-2xl md:text-3xl font-black text-slate-900">
                Questions fréquentes
              </h2>
            </div>
            <div className="max-w-3xl mx-auto space-y-3">
              {faqItems.map((item) => (
                <details key={item.question} className="group glass-card rounded-2xl overflow-hidden">
                  <summary className="flex items-center justify-between gap-4 p-6 cursor-pointer list-none select-none">
                    <span className="font-semibold text-sm sm:text-base text-slate-900">
                      {item.question}
                    </span>
                    <svg
                      className="flex-shrink-0 transition-transform duration-300 group-open:rotate-180 text-accent-blue"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </summary>
                  <div className="px-6 pb-6 text-sm leading-relaxed text-slate-500">
                    {item.answer}
                  </div>
                </details>
              ))}
            </div>
          </section>

          {/* CTA Final */}
          <div className="text-center glass-card rounded-2xl p-10 sm:p-14 mb-8">
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 mb-3">
              Prêt pour l&apos;aventure ?
            </h2>
            <p className="text-slate-500 mb-8 max-w-md mx-auto">
              Louez un van Vanzon Explorer tout équipé et partez sur la route dès demain.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="#wizard" className="btn-primary px-8 py-3.5 rounded-xl text-white font-semibold">
                Générer mon itinéraire gratuit
              </a>
              <Link
                href="/location"
                className="btn-ghost px-8 py-3.5 rounded-xl font-semibold"
              >
                Voir les vans disponibles
              </Link>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
