// src/app/(site)/road-trip-pays-basque-van/[duration]/page.tsx
// Page durée : FilterBar (slider pré-positionné) + POIs filtrés client-side.
// Accepte N-jours arbitraires (1-jour, 3-jours, 14-jours, weekend, 1-semaine).
// GroupTypeGrid supprimée (le profil reste uniquement dans le wizard).
// generateStaticParams + generateMetadata intacts pour les 4 slugs SEO pré-existants.

import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Breadcrumbs from '@/components/ui/Breadcrumbs'
import { ALL_DURATION_SLUGS } from '@/types/road-trip-pb'
import type { DurationSlug } from '@/types/road-trip-pb'
import { PICKUP_CITY, hubPath } from '@/lib/road-trip-pb/constants'
import { buildDurationPageMetadata } from '@/lib/road-trip-pb/metadata'
import {
  getTopActivities,
  getOvernightSpots,
} from '@/lib/road-trip-pb/queries'
import FilterableContent from '../_components/FilterableContent'
import { parseDurationSlug } from '../_components/filter-utils'

export const revalidate = 86400

// Pre-build les 4 slugs SEO historiques. Les autres (3-jours, 7-jours...) sont ISR on-demand.
export async function generateStaticParams() {
  return ALL_DURATION_SLUGS.map((duration) => ({ duration }))
}

// Metadata : les 4 slugs connus ont leur meta SEO riche. Les autres → meta générique.
export async function generateMetadata({
  params,
}: {
  params: { duration: string }
}): Promise<Metadata> {
  if (ALL_DURATION_SLUGS.includes(params.duration as DurationSlug)) {
    return buildDurationPageMetadata(params.duration as DurationSlug)
  }
  // Slug dynamique (ex: /3-jours) → meta générique
  const days = parseDurationSlug(params.duration)
  return {
    title: `Road Trip Pays Basque ${days} jours en Van — Spots & Itinéraire`,
    description: `Itinéraire van ${days} jours au Pays Basque. Spots nuit, activités, cartes GPS. Départ ${PICKUP_CITY}.`,
    robots: { index: false, follow: true }, // noindex pour les slugs non-canoniques
  }
}

export default async function DurationPage({
  params,
}: {
  params: { duration: string }
}) {
  const { duration } = params

  // Valider que c'est un slug de durée reconnu (N-jours, weekend, 1-semaine)
  const days = parseDurationSlug(duration)
  if (days < 1 || days > 14) notFound()

  const [allPois, allOvernight] = await Promise.all([
    getTopActivities(50),
    getOvernightSpots(30),
  ])

  const dLabel = days === 1 ? '1 jour' : `${days} jours`

  return (
    <main className="bg-slate-50 pb-16">
      <header className="bg-gradient-to-br from-blue-700 to-blue-900 px-4 py-12 text-white md:py-20">
        <div className="mx-auto max-w-5xl">
          <Breadcrumbs
            items={[
              { label: 'Road Trip Pays Basque', href: hubPath() },
              { label: dLabel },
            ]}
          />
          <h1 className="mt-4 text-3xl font-bold leading-tight md:text-5xl">
            Road Trip Pays Basque {dLabel} en Van
          </h1>
          <p className="mt-4 max-w-3xl text-lg text-blue-100">
            {dLabel} d&apos;immersion vanlife au Pays Basque, au départ de {PICKUP_CITY}. Ajustez la durée et le style ci-dessous pour explorer les meilleurs spots.
          </p>
        </div>
      </header>

      <FilterableContent
        allPois={allPois}
        allOvernight={allOvernight}
        initialFilters={{ days, styles: [], includeSpain: false, departure: 'Cambo-les-Bains', arrival: '' }}
      />
    </main>
  )
}
