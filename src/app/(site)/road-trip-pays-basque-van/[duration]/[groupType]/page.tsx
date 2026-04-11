// src/app/(site)/road-trip-pays-basque-van/[duration]/[groupType]/page.tsx
// Page finale SEO : combinaison duration × groupType.
// Server Component, ISR 24h, JSON-LD TouristTrip + FAQPage si template présent.

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Breadcrumbs from '@/components/ui/Breadcrumbs'
import {
  ALL_DURATION_SLUGS,
  ALL_GROUP_TYPES,
  DURATION_TO_DAYS_SLUG,
} from '@/types/road-trip-pb'
import type { DurationSlug } from '@/types/road-trip-pb'
import type { GroupType } from '@/types/roadtrip'
import {
  DURATION_LABELS,
  GROUP_LABELS,
  GROUP_LABELS_SHORT,
  PICKUP_CITY,
  durationPath,
  finalPath,
  hubPath,
} from '@/lib/road-trip-pb/constants'
import { buildFinalPageMetadata } from '@/lib/road-trip-pb/metadata'
import {
  getTemplate,
  getPOIsByIds,
  getPOIsForGroupType,
  getOvernightSpots,
} from '@/lib/road-trip-pb/queries'
import POISection from '../../_components/POISection'
import OvernightSection from '../../_components/OvernightSection'
import ItineraryDisplay from '../../_components/ItineraryDisplay'
import WizardCTA from '../../_components/WizardCTA'
import FAQSection from '../../_components/FAQSection'
import BudgetFilter from '../../_components/BudgetFilter'

// ISR
export const revalidate = 86400

// Pre-build toutes les combos (16 au total, dont 4 noindex /1-jour/*)
export async function generateStaticParams() {
  return ALL_DURATION_SLUGS.flatMap((duration) =>
    ALL_GROUP_TYPES.map((groupType) => ({ duration, groupType }))
  )
}

const RoadTripMap = dynamic(() => import('../../_components/RoadTripMap'), {
  ssr: false,
  loading: () => (
    <div className="mx-auto max-w-6xl px-4">
      <div className="h-[380px] w-full animate-pulse rounded-2xl bg-slate-200" />
    </div>
  ),
})

interface PageParams {
  duration: DurationSlug
  groupType: GroupType
}

// ─── Metadata ─────────────────────────────────────────────────────────────────
export async function generateMetadata({
  params,
}: {
  params: PageParams
}): Promise<Metadata> {
  if (!ALL_DURATION_SLUGS.includes(params.duration)) notFound()
  if (!ALL_GROUP_TYPES.includes(params.groupType)) notFound()
  return buildFinalPageMetadata(params.duration, params.groupType)
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default async function FinalPage({ params }: { params: PageParams }) {
  const { duration, groupType } = params
  if (!ALL_DURATION_SLUGS.includes(duration)) notFound()
  if (!ALL_GROUP_TYPES.includes(groupType)) notFound()

  const [template, overnight, fallbackPOIs] = await Promise.all([
    getTemplate(duration, groupType),
    getOvernightSpots(6),
    getPOIsForGroupType(groupType, 18),
  ])

  const templatePOIs = template
    ? await getPOIsByIds([...template.poi_ids, ...template.overnight_ids])
    : []
  const mapPOIs = templatePOIs.length > 0 ? templatePOIs : [...fallbackPOIs, ...overnight]

  const dLabel = DURATION_LABELS[duration]
  const gLabel = GROUP_LABELS[groupType]
  const days = DURATION_TO_DAYS_SLUG[duration]

  const h1 = template?.title ?? `Road Trip Pays Basque ${dLabel} en Van — ${gLabel}`

  // JSON-LD
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Accueil', item: 'https://vanzonexplorer.com' },
      { '@type': 'ListItem', position: 2, name: 'Road Trip Pays Basque', item: `https://vanzonexplorer.com${hubPath()}` },
      { '@type': 'ListItem', position: 3, name: dLabel, item: `https://vanzonexplorer.com${durationPath(duration)}` },
      { '@type': 'ListItem', position: 4, name: GROUP_LABELS_SHORT[groupType], item: `https://vanzonexplorer.com${finalPath(duration, groupType)}` },
    ],
  }

  const touristTripJsonLd = template
    ? {
        '@context': 'https://schema.org',
        '@type': 'TouristTrip',
        name: template.title,
        description: template.intro,
        touristType: gLabel,
        itinerary: {
          '@type': 'ItemList',
          numberOfItems: days,
        },
      }
    : null

  return (
    <main className="bg-slate-50 pb-16">
      {/* Hero */}
      <header className="bg-gradient-to-br from-blue-700 to-blue-900 px-4 py-12 text-white md:py-20">
        <div className="mx-auto max-w-5xl">
          <Breadcrumbs
            items={[
              { label: 'Road Trip Pays Basque', href: hubPath() },
              { label: dLabel, href: durationPath(duration) },
              { label: GROUP_LABELS_SHORT[groupType] },
            ]}
          />
          <h1 className="mt-4 text-3xl font-bold leading-tight md:text-5xl">{h1}</h1>
          <p className="mt-4 max-w-3xl text-lg text-blue-100">
            Itinéraire complet au départ de {PICKUP_CITY}, {days} jour
            {days > 1 ? 's' : ''}, spots nuit validés, activités adaptées {gLabel}.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <span className="rounded-full bg-white/10 px-3 py-1 text-sm">⏱ {dLabel}</span>
            <span className="rounded-full bg-white/10 px-3 py-1 text-sm">
              👥 {GROUP_LABELS_SHORT[groupType]}
            </span>
            <span className="rounded-full bg-white/10 px-3 py-1 text-sm">🚐 Départ {PICKUP_CITY}</span>
          </div>
          <div className="mt-8">
            <WizardCTA duration={duration} groupType={groupType} variant="primary" />
          </div>
        </div>
      </header>

      {/* Map */}
      <section className="mx-auto mt-8 max-w-6xl px-4">
        <RoadTripMap pois={mapPOIs} template={template ?? undefined} />
      </section>

      {/* Itinéraire */}
      {template ? (
        <ItineraryDisplay template={template} pois={templatePOIs} />
      ) : (
        <section className="mx-auto mt-12 max-w-4xl px-4 text-center">
          <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-slate-600">
            Itinéraire personnalisé bientôt disponible — en attendant, génère ta version 100% sur mesure via notre wizard IA gratuit.
          </p>
          <div className="mt-4">
            <WizardCTA duration={duration} groupType={groupType} variant="primary" />
          </div>
        </section>
      )}

      {/* POIs filtrés par budget */}
      <BudgetFilter>
        <POISection
          title={`Activités recommandées ${gLabel}`}
          subtitle="Filtre par budget pour affiner"
          pois={fallbackPOIs}
          limit={12}
        />
      </BudgetFilter>

      {/* Spots nuit */}
      <OvernightSection
        title="Spots nuit recommandés"
        subtitle={`Où dormir en van pendant votre road trip ${dLabel.toLowerCase()}`}
        spots={overnight}
        limit={6}
      />

      {/* Tips */}
      {template && template.tips.length > 0 && (
        <section className="mx-auto mt-12 max-w-4xl px-4">
          <h2 className="text-2xl font-bold text-slate-900 md:text-3xl">Conseils van</h2>
          <ul className="mt-4 space-y-2">
            {template.tips.map((tip, i) => (
              <li key={i} className="flex gap-3 rounded-xl border border-slate-200 bg-white p-4">
                <span className="flex-none text-xl">💡</span>
                <p className="text-sm text-slate-700">{tip}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* FAQ */}
      {template && <FAQSection items={template.faq} />}

      {/* Cross-links */}
      <section className="mx-auto mt-16 max-w-5xl px-4">
        <h2 className="text-xl font-bold text-slate-900">Autres idées d&apos;itinéraires</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-sm font-semibold text-slate-700">Autres durées, même profil</p>
            <ul className="mt-2 space-y-1">
              {ALL_DURATION_SLUGS.filter((d) => d !== duration).map((d) => (
                <li key={d}>
                  <Link href={finalPath(d, groupType)} className="text-blue-600 hover:underline">
                    {DURATION_LABELS[d]} {gLabel} →
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-sm font-semibold text-slate-700">Autres profils, même durée</p>
            <ul className="mt-2 space-y-1">
              {ALL_GROUP_TYPES.filter((g) => g !== groupType).map((g) => (
                <li key={g}>
                  <Link href={finalPath(duration, g)} className="text-blue-600 hover:underline">
                    {dLabel} {GROUP_LABELS[g]} →
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* CTA final */}
      <WizardCTA duration={duration} groupType={groupType} />

      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      {touristTripJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(touristTripJsonLd) }}
        />
      )}
    </main>
  )
}
