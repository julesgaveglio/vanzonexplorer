// src/app/(site)/road-trip-pays-basque-van/page.tsx
// Hub refondu — remplace la landing monolithique de 645 lignes.

import dynamic from 'next/dynamic'
import type { Metadata } from 'next'
import { PICKUP_CITY, REGION_NAME, hubPath } from '@/lib/road-trip-pb/constants'
import { buildHubMetadata } from '@/lib/road-trip-pb/metadata'
import {
  getTopActivities,
  getOvernightSpots,
  getRegionStats,
} from '@/lib/road-trip-pb/queries'
import DurationGrid from './_components/DurationGrid'
import POISection from './_components/POISection'
import OvernightSection from './_components/OvernightSection'
import WizardCTA from './_components/WizardCTA'

export const revalidate = 86400

export async function generateMetadata(): Promise<Metadata> {
  return buildHubMetadata()
}

const RoadTripMap = dynamic(() => import('./_components/RoadTripMap'), {
  ssr: false,
  loading: () => (
    <div className="mx-auto max-w-6xl px-4">
      <div className="h-[380px] w-full animate-pulse rounded-2xl bg-slate-200" />
    </div>
  ),
})

export default async function HubPage() {
  const [topPOIs, overnight, stats] = await Promise.all([
    getTopActivities(12),
    getOvernightSpots(6),
    getRegionStats(),
  ])
  const mapPOIs = [...topPOIs, ...overnight]

  // JSON-LD BreadcrumbList minimal
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Accueil', item: 'https://vanzonexplorer.com' },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Road Trip Pays Basque',
        item: `https://vanzonexplorer.com${hubPath()}`,
      },
    ],
  }

  return (
    <main className="bg-slate-50 pb-16">
      {/* Hero */}
      <header className="bg-gradient-to-br from-blue-700 to-blue-900 px-4 py-16 text-white md:py-24">
        <div className="mx-auto max-w-5xl">
          <h1 className="text-4xl font-bold leading-tight md:text-6xl">
            Road Trip en Van au {REGION_NAME}
          </h1>
          <p className="mt-6 max-w-3xl text-lg text-blue-100 md:text-xl">
            Des itinéraires van life sur mesure, pensés par des vanlifers qui vivent au Pays Basque depuis 4 ans. Spots nuit validés, activités par profil, cartes GPS prêtes à l&apos;emploi. Départ depuis {PICKUP_CITY}.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <span className="rounded-full bg-white/10 px-3 py-1 text-sm">📍 {stats.totalPois}+ spots</span>
            <span className="rounded-full bg-white/10 px-3 py-1 text-sm">🌙 {stats.totalOvernight} spots nuit</span>
            <span className="rounded-full bg-white/10 px-3 py-1 text-sm">🏘 {stats.cities.length} villes</span>
          </div>
          <div className="mt-8">
            <WizardCTA variant="primary" />
          </div>
        </div>
      </header>

      {/* Map */}
      <section className="mx-auto mt-8 max-w-6xl px-4">
        <RoadTripMap pois={mapPOIs} />
      </section>

      {/* Duration grid */}
      <DurationGrid />

      {/* Top spots nuit */}
      <OvernightSection
        title="Où dormir en van au Pays Basque"
        subtitle="Les meilleurs spots testés et validés"
        spots={overnight}
      />

      {/* Top activités */}
      <POISection
        title="Les incontournables"
        subtitle="Les activités et lieux à ne pas manquer"
        pois={topPOIs}
      />

      {/* CTA final */}
      <WizardCTA />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
    </main>
  )
}
