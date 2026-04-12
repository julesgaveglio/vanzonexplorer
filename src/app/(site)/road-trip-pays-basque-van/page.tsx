// src/app/(site)/road-trip-pays-basque-van/page.tsx
// Hub principal — filtres interactifs (durée slider, styles, Espagne).
// Le contenu (map, POIs, overnight) se filtre côté client via FilterableContent.

import ScrollingBanner from '@/components/ui/ScrollingBanner'
import type { Metadata } from 'next'
import { PICKUP_CITY, REGION_NAME, hubPath } from '@/lib/road-trip-pb/constants'
import { buildHubMetadata } from '@/lib/road-trip-pb/metadata'
import {
  getTopActivities,
  getOvernightSpots,
  getRegionStats,
} from '@/lib/road-trip-pb/queries'
import FilterableContent from './_components/FilterableContent'
import WizardCTA from './_components/WizardCTA'

export const revalidate = 86400

export async function generateMetadata(): Promise<Metadata> {
  return buildHubMetadata()
}

export default async function HubPage() {
  const [allPois, allOvernight, stats] = await Promise.all([
    getTopActivities(50),
    getOvernightSpots(30),
    getRegionStats(),
  ])

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
      <header className="bg-gradient-to-br from-blue-700 to-blue-900 px-4 py-12 text-white md:py-20">
        <div className="mx-auto max-w-5xl">
          <h1 className="text-4xl font-bold leading-tight md:text-6xl">
            Road Trip en Van au {REGION_NAME}
          </h1>
          <p className="mt-6 max-w-3xl text-lg text-blue-100 md:text-xl">
            Itinéraires van life sur mesure au Pays Basque. Spots nuit validés, activités par profil, cartes GPS. Départ {PICKUP_CITY}.
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

      <ScrollingBanner />

      <FilterableContent
        allPois={allPois}
        allOvernight={allOvernight}
        initialFilters={{ days: 3, styles: [], includeSpain: false, departure: 'Cambo-les-Bains', arrival: '' }}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
    </main>
  )
}
