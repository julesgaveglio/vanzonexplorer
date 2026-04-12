// src/app/(site)/road-trip-pays-basque-van/_components/FilterableContent.tsx
// Client island : FilterBar + carte + toggle (Incontournables / Itinéraire) + POI/overnight cards.
// Reçoit TOUTES les données en props, filtre en JS selon les filtres actifs.

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
  if (styles.length === 0) return true
  const allowedTags = styles.flatMap((s) => STYLE_TO_TAGS[s])
  return poi.tags?.some((t) => allowedTags.includes(t)) ?? false
}

// ─── Labels ──────────────────────────────────────────────────────────────────
const BUDGET_DOTS: Record<string, string> = {
  gratuit: '·', faible: '€', moyen: '€€', eleve: '€€€',
}
const OVERNIGHT_LABELS: Record<string, string> = {
  parking_gratuit: 'Parking gratuit',
  aire_camping_car: 'Aire camping-car',
  camping_van: 'Camping van',
  spot_sauvage: 'Spot sauvage',
}

// ─── Itinerary builder : répartit les POIs sur N jours ───────────────────────

interface ItineraryDay {
  day: number
  theme: string
  stops: POIRowWithCoords[]
  overnight: POIRowWithCoords | null
}

const TIMES = ['9h00', '11h30', '14h00', '16h30', '18h00']

function buildItinerary(
  pois: POIRowWithCoords[],
  overnight: POIRowWithCoords[],
  days: number
): ItineraryDay[] {
  const result: ItineraryDay[] = []
  const stopsPerDay = Math.max(2, Math.ceil(pois.length / Math.max(days, 1)))

  for (let d = 0; d < days; d++) {
    const dayStops = pois.slice(d * stopsPerDay, (d + 1) * stopsPerDay)
    const spot = overnight[d % overnight.length] ?? null

    // Theme based on dominant category
    const cats = dayStops.map((p) => p.category)
    const dominant = cats.sort((a, b) =>
      cats.filter((c) => c === b).length - cats.filter((c) => c === a).length
    )[0]
    const themes: Record<string, string> = {
      nature: 'Nature & grands espaces',
      activite: 'Sport & aventure',
      restaurant: 'Gastronomie basque',
      culture: 'Culture & patrimoine',
      spot_nuit: 'Découverte',
      parking: 'Découverte',
    }
    const cities = Array.from(new Set(dayStops.map((p) => p.location_city)))
    const theme =
      cities.length > 0
        ? `${themes[dominant] ?? 'Découverte'} — ${cities.slice(0, 2).join(' & ')}`
        : themes[dominant] ?? 'Découverte'

    result.push({ day: d + 1, theme, stops: dayStops, overnight: spot })
  }
  return result
}

// ─── View mode ───────────────────────────────────────────────────────────────

type ViewMode = 'spots' | 'itinerary'

// ─── Main Component ──────────────────────────────────────────────────────────

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
  const [viewMode, setViewMode] = useState<ViewMode>('spots')

  const filteredPois = useMemo(
    () => allPois.filter((p) => matchesStyles(p, filters.styles)),
    [allPois, filters.styles]
  )
  const filteredOvernight = useMemo(
    () => allOvernight.filter((p) => matchesStyles(p, filters.styles)),
    [allOvernight, filters.styles]
  )
  const mapPois = useMemo(
    () => [...filteredPois, ...filteredOvernight],
    [filteredPois, filteredOvernight]
  )
  const visibleOvernight = filteredOvernight.length > 0 ? filteredOvernight : allOvernight

  const itinerary = useMemo(
    () => buildItinerary(filteredPois, visibleOvernight, filters.days),
    [filteredPois, visibleOvernight, filters.days]
  )

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

      {/* Results summary + View Toggle */}
      <div className="mx-auto mt-8 max-w-6xl px-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-500">
            {filteredPois.length} activité{filteredPois.length > 1 ? 's' : ''} ·{' '}
            {visibleOvernight.length} spot{visibleOvernight.length > 1 ? 's' : ''} nuit
            {filters.styles.length > 0 && <> · Filtré par : {filters.styles.join(', ')}</>}
          </p>
          <div className="flex rounded-lg border border-slate-200 bg-white p-1">
            <button
              type="button"
              onClick={() => setViewMode('spots')}
              className={`rounded-md px-4 py-2 text-sm font-semibold transition ${
                viewMode === 'spots'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🗺️ Les incontournables
            </button>
            <button
              type="button"
              onClick={() => setViewMode('itinerary')}
              className={`rounded-md px-4 py-2 text-sm font-semibold transition ${
                viewMode === 'itinerary'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              📅 Voir l&apos;itinéraire
            </button>
          </div>
        </div>
      </div>

      {/* ═══ VIEW: Incontournables (spots) ═══ */}
      {viewMode === 'spots' && (
        <>
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
        </>
      )}

      {/* ═══ VIEW: Itinéraire jour par jour ═══ */}
      {viewMode === 'itinerary' && (
        <section className="mx-auto mt-8 max-w-5xl px-4">
          <h2 className="text-2xl font-bold text-slate-900 md:text-3xl">
            Itinéraire {filters.days} jour{filters.days > 1 ? 's' : ''} au Pays Basque
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Suggestion d&apos;itinéraire basée sur vos filtres. Ajustez la durée et le style pour personnaliser.
          </p>
          <div className="mt-8 space-y-6">
            {itinerary.map((day) => (
              <DayCard key={day.day} day={day} />
            ))}
          </div>
        </section>
      )}

      {/* Sticky CTA mobile */}
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

      {/* Desktop CTA */}
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

      <div className="h-20 lg:hidden" />
    </>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// Day Card (itinerary view)
// ═══════════════════════════════════════════════════════════════════════════════

function DayCard({ day }: { day: ItineraryDay }) {
  // Hero image = first POI with image, or gradient fallback
  const heroPoi = day.stops.find((p) => p.image_url) ?? day.stops[0]
  const heroColor = heroPoi ? (CATEGORY_COLORS[heroPoi.category] ?? '#64748b') : '#64748b'
  const heroEmoji = heroPoi ? (CATEGORY_EMOJIS[heroPoi.category] ?? '📍') : '📍'

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* Day header + hero image */}
      <div className="relative h-48 w-full">
        {heroPoi?.image_url ? (
          <Image
            src={heroPoi.image_url}
            alt={`Jour ${day.day}`}
            fill
            sizes="(max-width: 768px) 100vw, 800px"
            className="object-cover"
            unoptimized
          />
        ) : (
          <div
            className="flex h-full items-center justify-center text-6xl"
            style={{ background: `linear-gradient(135deg, ${heroColor}22, ${heroColor}55)` }}
          >
            {heroEmoji}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-4 left-5 right-5">
          <span className="text-sm font-semibold uppercase tracking-wider text-white/80">
            Jour {day.day}
          </span>
          <h3 className="mt-1 text-xl font-bold text-white">{day.theme}</h3>
        </div>
      </div>

      {/* Stops timeline */}
      <div className="divide-y divide-slate-100 px-5 py-4">
        {day.stops.map((poi, idx) => (
          <div key={poi.id} className="flex gap-4 py-4 first:pt-0 last:pb-0">
            <div className="flex-none pt-0.5">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-sm font-bold text-blue-700">
                {TIMES[idx] ?? `${9 + idx * 2}h`}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-start gap-2">
                <span className="text-lg">{CATEGORY_EMOJIS[poi.category] ?? '📍'}</span>
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900">{poi.name}</p>
                  <p className="text-xs uppercase tracking-wide text-slate-500">
                    {poi.location_city}
                    {poi.budget_level && ` · ${BUDGET_DOTS[poi.budget_level] ?? ''}`}
                  </p>
                </div>
              </div>
              {poi.description && (
                <p className="mt-1.5 line-clamp-2 text-sm text-slate-600">{poi.description}</p>
              )}
              <div className="mt-2 flex flex-wrap gap-2">
                {poi.external_url && (
                  <a
                    href={poi.external_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold text-blue-600 hover:underline"
                  >
                    Voir le site →
                  </a>
                )}
                {poi.google_maps_url && (
                  <a
                    href={poi.google_maps_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold text-blue-600 hover:underline"
                  >
                    Google Maps →
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Overnight */}
        {day.overnight && (
          <div className="flex gap-4 border-t border-blue-100 bg-blue-50/50 py-4 -mx-5 px-5">
            <div className="flex-none pt-0.5">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-lg">
                🌙
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Nuit</p>
              <p className="mt-0.5 font-semibold text-slate-900">{day.overnight.name}</p>
              <p className="text-sm text-slate-600">
                {day.overnight.location_city}
                {' · '}
                {day.overnight.overnight_price_per_night && day.overnight.overnight_price_per_night > 0
                  ? `${day.overnight.overnight_price_per_night}€/nuit`
                  : 'Gratuit'}
                {day.overnight.overnight_type && (
                  <> · {OVERNIGHT_LABELS[day.overnight.overnight_type] ?? day.overnight.overnight_type}</>
                )}
              </p>
              {day.overnight.google_maps_url && (
                <a
                  href={day.overnight.google_maps_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-block text-xs font-semibold text-blue-600 hover:underline"
                >
                  Google Maps →
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </article>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// Inline POI card (spots view — inchangé)
// ═══════════════════════════════════════════════════════════════════════════════

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

// ═══════════════════════════════════════════════════════════════════════════════
// Inline overnight card (spots view — inchangé)
// ═══════════════════════════════════════════════════════════════════════════════

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
