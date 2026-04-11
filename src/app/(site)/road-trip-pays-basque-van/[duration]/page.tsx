// src/app/(site)/road-trip-pays-basque-van/[duration]/page.tsx
// Page duration : H1 + grille groupType + top POIs + top overnight + CTA.

import dynamic from 'next/dynamic'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Breadcrumbs from '@/components/ui/Breadcrumbs'
import { ALL_DURATION_SLUGS, DURATION_TO_DAYS_SLUG } from '@/types/road-trip-pb'
import type { DurationSlug } from '@/types/road-trip-pb'
import {
  DURATION_LABELS,
  PICKUP_CITY,
  hubPath,
} from '@/lib/road-trip-pb/constants'
import { buildDurationPageMetadata } from '@/lib/road-trip-pb/metadata'
import {
  getTopActivities,
  getOvernightSpots,
  getTemplate,
  getPOIsByIds,
} from '@/lib/road-trip-pb/queries'
import GroupTypeGrid from '../_components/GroupTypeGrid'
import POISection from '../_components/POISection'
import OvernightSection from '../_components/OvernightSection'
import ItineraryDisplay from '../_components/ItineraryDisplay'
import WizardCTA from '../_components/WizardCTA'

export const revalidate = 86400

export async function generateStaticParams() {
  return ALL_DURATION_SLUGS.map((duration) => ({ duration }))
}

const RoadTripMap = dynamic(() => import('../_components/RoadTripMap'), {
  ssr: false,
  loading: () => (
    <div className="mx-auto max-w-6xl px-4">
      <div className="h-[380px] w-full animate-pulse rounded-2xl bg-slate-200" />
    </div>
  ),
})

export async function generateMetadata({
  params,
}: {
  params: { duration: DurationSlug }
}): Promise<Metadata> {
  if (!ALL_DURATION_SLUGS.includes(params.duration)) notFound()
  return buildDurationPageMetadata(params.duration)
}

export default async function DurationPage({
  params,
}: {
  params: { duration: DurationSlug }
}) {
  const { duration } = params
  if (!ALL_DURATION_SLUGS.includes(duration)) notFound()

  // Affiche le template canonique "couple" pour cette durée
  const [template, topPOIs, overnight] = await Promise.all([
    getTemplate(duration, 'couple'),
    getTopActivities(12),
    getOvernightSpots(6),
  ])
  const templatePOIs = template
    ? await getPOIsByIds([...template.poi_ids, ...template.overnight_ids])
    : []
  const mapPOIs = templatePOIs.length > 0 ? templatePOIs : [...topPOIs, ...overnight]

  const dLabel = DURATION_LABELS[duration]
  const days = DURATION_TO_DAYS_SLUG[duration]

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
            {days} jour{days > 1 ? 's' : ''} d&apos;immersion vanlife au Pays Basque, au départ de{' '}
            {PICKUP_CITY}. Choisissez votre profil voyageur ci-dessous ou découvrez l&apos;itinéraire de référence.
          </p>
          <div className="mt-8">
            <WizardCTA duration={duration} variant="primary" />
          </div>
        </div>
      </header>

      <section className="mx-auto mt-8 max-w-6xl px-4">
        <RoadTripMap pois={mapPOIs} template={template ?? undefined} />
      </section>

      <GroupTypeGrid duration={duration} />

      {template && (
        <section className="mx-auto mt-12 max-w-5xl px-4">
          <p className="text-sm uppercase tracking-wide text-slate-500">Itinéraire de référence</p>
          <ItineraryDisplay template={template} pois={templatePOIs} />
        </section>
      )}

      <OvernightSection
        title={`Où dormir en van pendant ${days} jour${days > 1 ? 's' : ''}`}
        spots={overnight}
      />

      <POISection
        title="Les incontournables"
        subtitle="Les meilleures activités à programmer"
        pois={topPOIs}
      />

      <WizardCTA duration={duration} />
    </main>
  )
}
