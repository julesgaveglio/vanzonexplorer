// src/app/(site)/road-trip-pays-basque-van/_components/FilterableContent.tsx
// Client island : FilterBar + carte + POI/overnight cards, filtrage côté client.
// Reçoit TOUTES les données en props (serialized), filtre en JS selon les filtres actifs.

'use client'

import { useState, useMemo } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import Image from 'next/image'
import type { POIRowWithCoords } from '@/types/road-trip-pb'
import FilterBar from './FilterBar'
import type { FilterState, AdventureStyle } from './filter-utils'
import { wizardUrlFromFilters } from './filter-utils'
import { INTEREST_TO_POI_TAGS, CATEGORY_COLORS, CATEGORY_EMOJIS } from '@/lib/road-trip-pb/constants'

const RoadTripMap = dynamic(() => import('./RoadTripMap'), {
  ssr: false,
  loading: () => (
    <div className="h-[380px] w-full animate-pulse rounded-2xl bg-slate-200" />
  ),
})

// ─── Tag mapping : style → poi tags ──────────────────────────────────────────
const STYLE_TO_TAGS: Record<AdventureStyle, string[]> = {
  nature: INTEREST_TO_POI_TAGS.nature,
  sport: INTEREST_TO_POI_TAGS.sport,
  culture: INTEREST_TO_POI_TAGS.culture,
  plages: INTEREST_TO_POI_TAGS.plages,
}

function matchesStyles(poi: POIRowWithCoords, styles: AdventureStyle[]): boolean {
  if (styles.length === 0) return true // no filter = show all
  const allowedTags = styles.flatMap((s) => STYLE_TO_TAGS[s])
  return poi.tags?.some((t) => allowedTags.includes(t)) ?? false
}

// ─── Budget badge ────────────────────────────────────────────────────────────
const BUDGET_DOTS: Record<string, string> = {
  gratuit: '·',
  faible: '€',
  moyen: '€€',
  eleve: '€€€',
}

// ─── Overnight type labels ───────────────────────────────────────────────────
const OVERNIGHT_LABELS: Record<string, string> = {
  parking_gratuit: 'Parking gratuit',
  aire_camping_car: 'Aire camping-car',
  camping_van: 'Camping van',
  spot_sauvage: 'Spot sauvage',
}

// ─── Component ───────────────────────────────────────────────────────────────

interface FilterableContentProps {
  allPois: POIRowWithCoords[]
  allOvernight: POIRowWithCoords[]
  initialFilters: FilterState
}

export default function FilterableContent({
  allPois,
  allOvernight,
  initialFilters,
}: FilterableContentProps) {
  const [filters, setFilters] = useState<FilterState>(initialFilters)

  const filteredPois = useMemo(
    () => allPois.filter((p) => matchesStyles(p, filters.styles)),
    [allPois, filters.styles]
  )

  const filteredOvernight = useMemo(
    () => allOvernight.filter((p) => matchesStyles(p, filters.styles)),
    [allOvernight, filters.styles]
  )

  // For the map, merge POIs + overnight
  const mapPois = useMemo(
    () => [...filteredPois, ...filteredOvernight],
    [filteredPois, filteredOvernight]
  )

  // If overnight doesn't match any style, show all overnight (they're always relevant)
  const visibleOvernight = filteredOvernight.length > 0 ? filteredOvernight : allOvernight

  const wizardUrl = wizardUrlFromFilters(filters)

  return (
    <>
      {/* Filter Bar */}
      <section className="mt-8">
        <FilterBar filters={filters} onChange={setFilters} />
      </section>

      {/* Map */}
      <section className="mx-auto mt-8 max-w-6xl px-4">
        <RoadTripMap pois={mapPois} />
      </section>

      {/* Results summary */}
      <div className="mx-auto mt-8 max-w-6xl px-4">
        <p className="text-sm text-slate-500">
          {filteredPois.length} activité{filteredPois.length > 1 ? 's' : ''} ·{' '}
          {visibleOvernight.length} spot{visibleOvernight.length > 1 ? 's' : ''} nuit
          {filters.styles.length > 0 && (
            <> · Filtré par : {filters.styles.join(', ')}</>
          )}
        </p>
      </div>

      {/* Activités */}
      {filteredPois.length > 0 && (
        <section className="mx-auto mt-8 max-w-6xl px-4">
          <h2 className="text-2xl font-bold text-slate-900 md:text-3xl">
            {filters.styles.length > 0 ? 'Activités filtrées' : 'Les incontournables'}
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredPois.slice(0, 12).map((poi) => (
              <POICardInline key={poi.id} poi={poi} />
            ))}
          </div>
        </section>
      )}

      {/* Spots nuit */}
      {visibleOvernight.length > 0 && (
        <section className="mx-auto mt-12 max-w-6xl px-4">
          <h2 className="text-2xl font-bold text-slate-900 md:text-3xl">
            Où dormir en van au Pays Basque
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visibleOvernight.slice(0, 6).map((spot) => (
              <OvernightCardInline key={spot.id} spot={spot} />
            ))}
          </div>
        </section>
      )}

      {/* Sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur-sm lg:hidden">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <span className="text-sm font-medium text-slate-700">
            {filters.days}j · {filteredPois.length} spots
          </span>
          <Link
            href={wizardUrl}
            className="rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-blue-700"
          >
            Génère mon road trip →
          </Link>
        </div>
      </div>

      {/* Desktop CTA section */}
      <section className="mx-auto my-16 max-w-4xl px-4 max-lg:hidden">
        <div className="rounded-3xl bg-gradient-to-br from-blue-600 to-blue-800 p-8 text-white shadow-xl md:p-12">
          <h2 className="text-2xl font-bold md:text-3xl">Cet itinéraire te plaît ?</h2>
          <p className="mt-3 max-w-2xl text-blue-100">
            Génère ta version 100% personnalisée avec tes dates exactes, tes envies et ton budget.
            Tu reçois tout par email en 2 minutes, gratuitement.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={wizardUrl}
              className="inline-flex items-center rounded-full bg-white px-6 py-3 font-semibold text-blue-700 shadow transition hover:-translate-y-0.5"
            >
              Génère mon road trip →
            </Link>
            <Link
              href="/location/cambo-les-bains"
              className="inline-flex items-center rounded-full border border-white/50 px-6 py-3 font-semibold text-white transition hover:bg-white/10"
            >
              Louer un van Vanzon
            </Link>
          </div>
          <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-blue-100">
            <li>✓ Gratuit</li>
            <li>✓ Reçu par email</li>
            <li>✓ 2 minutes</li>
          </ul>
        </div>
      </section>

      {/* Padding pour CTA sticky mobile */}
      <div className="h-20 lg:hidden" />
    </>
  )
}

// ─── Inline POI card (client-safe, pas d'import server-only) ─────────────────

function POICardInline({ poi }: { poi: POIRowWithCoords }) {
  const color = CATEGORY_COLORS[poi.category] ?? '#64748b'
  const emoji = CATEGORY_EMOJIS[poi.category] ?? '📍'
  const hasImage = Boolean(poi.image_url)
  const budgetLabel = poi.budget_level ? BUDGET_DOTS[poi.budget_level] : null

  const inner = (
    <>
      <div className="relative h-40 w-full overflow-hidden rounded-t-xl">
        {hasImage ? (
          <Image
            src={poi.image_url!}
            alt={poi.name}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover"
            unoptimized
          />
        ) : (
          <div
            className="flex h-full items-center justify-center text-5xl"
            style={{ background: `linear-gradient(135deg, ${color}22, ${color}55)` }}
          >
            {emoji}
          </div>
        )}
        <span
          className="absolute left-2 top-2 rounded-full px-2 py-0.5 text-xs font-semibold text-white shadow"
          style={{ backgroundColor: color }}
        >
          {poi.category}
        </span>
        {budgetLabel && (
          <span className="absolute right-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-xs font-semibold text-slate-700 shadow">
            {budgetLabel}
          </span>
        )}
      </div>
      <div className="p-4">
        <h3 className="line-clamp-2 text-base font-bold text-slate-900">{poi.name}</h3>
        <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">{poi.location_city}</p>
        {poi.description && (
          <p className="mt-2 line-clamp-3 text-sm text-slate-600">{poi.description}</p>
        )}
      </div>
    </>
  )

  const cls =
    'group block overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md'

  return poi.external_url ? (
    <a href={poi.external_url} target="_blank" rel="noopener noreferrer" className={cls}>
      {inner}
    </a>
  ) : (
    <article className={cls}>{inner}</article>
  )
}

// ─── Inline overnight card ───────────────────────────────────────────────────

function OvernightCardInline({ spot }: { spot: POIRowWithCoords }) {
  const typeLabel = spot.overnight_type
    ? OVERNIGHT_LABELS[spot.overnight_type] ?? spot.overnight_type
    : 'Spot nuit'
  const price =
    spot.overnight_price_per_night && spot.overnight_price_per_night > 0
      ? `${spot.overnight_price_per_night}€/nuit`
      : 'Gratuit'

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="relative h-36 w-full">
        {spot.image_url ? (
          <Image
            src={spot.image_url}
            alt={spot.name}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover"
            unoptimized
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 text-4xl">
            🌙
          </div>
        )}
        <span className="absolute left-2 top-2 rounded-full bg-blue-600 px-2 py-0.5 text-xs font-semibold text-white">
          {typeLabel}
        </span>
        <span className="absolute right-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-xs font-semibold text-slate-700">
          {price}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-2 font-bold text-slate-900">{spot.name}</h3>
        <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">{spot.location_city}</p>
        {spot.description && (
          <p className="mt-2 line-clamp-3 text-sm text-slate-600">{spot.description}</p>
        )}
        {spot.overnight_amenities && spot.overnight_amenities.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-1">
            {spot.overnight_amenities.slice(0, 4).map((a) => (
              <li key={a} className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                {a}
              </li>
            ))}
          </ul>
        )}
      </div>
    </article>
  )
}
