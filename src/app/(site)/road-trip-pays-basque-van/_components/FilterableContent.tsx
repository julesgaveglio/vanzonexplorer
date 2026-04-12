// src/app/(site)/road-trip-pays-basque-van/_components/FilterableContent.tsx
// Client island : FilterBar + 3 vues (Incontournables / Itinéraire / Carte).
// Itinéraire géographiquement optimisé, 1-2 activités/jour, durées réalistes.

'use client'

import { useState, useMemo } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import Image from 'next/image'
import type { POIRowWithCoords } from '@/types/road-trip-pb'
import { parseCoordinates } from '@/types/road-trip-pb'
import FilterBar from './FilterBar'
import type { FilterState, AdventureStyle } from './filter-utils'
import {
  wizardUrlFromFilters,
  getCityCoords,
  estimateActivityDuration,
  formatDuration,
  haversineKm,
} from './filter-utils'
import {
  INTEREST_TO_POI_TAGS,
  CATEGORY_COLORS,
  CATEGORY_EMOJIS,
  PB_CENTER,
} from '@/lib/road-trip-pb/constants'

const RoadTripMap = dynamic(() => import('./RoadTripMap'), {
  ssr: false,
  loading: () => <div className="h-[380px] w-full animate-pulse rounded-2xl bg-slate-200" />,
})

// ─── Style → tag mapping ─────────────────────────────────────────────────────
const STYLE_TO_TAGS: Record<AdventureStyle, string[]> = {
  nature: INTEREST_TO_POI_TAGS.nature,
  sport: INTEREST_TO_POI_TAGS.sport,
  culture: INTEREST_TO_POI_TAGS.culture,
  plages: INTEREST_TO_POI_TAGS.plages,
}
function matchesStyles(poi: POIRowWithCoords, styles: AdventureStyle[]): boolean {
  if (styles.length === 0) return true
  const allowed = styles.flatMap((s) => STYLE_TO_TAGS[s])
  return poi.tags?.some((t) => allowed.includes(t)) ?? false
}

// ─── Labels ──────────────────────────────────────────────────────────────────
const BUDGET_DOTS: Record<string, string> = { gratuit: '·', faible: '€', moyen: '€€', eleve: '€€€' }
const OVERNIGHT_LABELS: Record<string, string> = {
  parking_gratuit: 'Parking gratuit',
  aire_camping_car: 'Aire camping-car',
  camping_van: 'Camping van',
  spot_sauvage: 'Spot sauvage',
}

// ═══════════════════════════════════════════════════════════════════════════════
// Intelligent itinerary builder
// ═══════════════════════════════════════════════════════════════════════════════

interface ItineraryStop {
  poi: POIRowWithCoords
  coords: [number, number] | null
  startTime: string
  duration: number // minutes
}

interface ItineraryDay {
  day: number
  theme: string
  activities: ItineraryStop[]
  overnight: POIRowWithCoords | null
  overnightCoords: [number, number] | null
}

/**
 * Sort POIs along the geographic path from departure to arrival (or loop).
 * Uses dot-product projection onto the departure→arrival vector.
 * POIs close together end up on the same day.
 */
function sortPoisAlongRoute(
  pois: POIRowWithCoords[],
  departureCoords: [number, number],
  arrivalCoords: [number, number] | null
): POIRowWithCoords[] {
  // Get coords for each POI
  const withCoords = pois
    .map((p) => ({ poi: p, coords: parseCoordinates(p.coordinates) }))
    .filter((x): x is { poi: POIRowWithCoords; coords: [number, number] } => x.coords !== null)

  if (withCoords.length === 0) return pois // fallback: original order

  const target = arrivalCoords ?? departureCoords // loop if no arrival
  const dx = target[0] - departureCoords[0]
  const dy = target[1] - departureCoords[1]
  const routeLength = Math.sqrt(dx * dx + dy * dy)

  if (routeLength < 0.001) {
    // Same departure/arrival → sort by angle (circular route)
    withCoords.sort((a, b) => {
      const angleA = Math.atan2(a.coords[1] - departureCoords[1], a.coords[0] - departureCoords[0])
      const angleB = Math.atan2(b.coords[1] - departureCoords[1], b.coords[0] - departureCoords[0])
      return angleA - angleB
    })
  } else {
    // Sort by projection along the departure→arrival direction
    withCoords.sort((a, b) => {
      const projA = ((a.coords[0] - departureCoords[0]) * dx + (a.coords[1] - departureCoords[1]) * dy) / routeLength
      const projB = ((b.coords[0] - departureCoords[0]) * dx + (b.coords[1] - departureCoords[1]) * dy) / routeLength
      return projA - projB
    })
  }

  return withCoords.map((x) => x.poi)
}

/**
 * Find nearest overnight spot to a given coordinate.
 */
function findNearestOvernight(
  coords: [number, number],
  overnightSpots: POIRowWithCoords[],
  usedIds: Set<string>
): POIRowWithCoords | null {
  let best: POIRowWithCoords | null = null
  let bestDist = Infinity
  for (const spot of overnightSpots) {
    if (usedIds.has(spot.id)) continue
    const sc = parseCoordinates(spot.coordinates)
    if (!sc) continue
    const d = haversineKm(coords, sc)
    if (d < bestDist) {
      bestDist = d
      best = spot
    }
  }
  // If all used, recycle
  if (!best && overnightSpots.length > 0) {
    for (const spot of overnightSpots) {
      const sc = parseCoordinates(spot.coordinates)
      if (!sc) continue
      const d = haversineKm(coords, sc)
      if (d < bestDist) {
        bestDist = d
        best = spot
      }
    }
  }
  return best
}

/**
 * Smart itinerary builder.
 *
 * Overnight strategy:
 * - Look ahead: the spot nuit is chosen at the closest to the FIRST activity
 *   of the NEXT day, so you wake up right next to your morning activity.
 * - For nature/randonnée activities that start the day → sleep at the trailhead.
 * - Last day → no overnight (you arrive at destination).
 * - If no next-day activity (last day or empty), fallback to nearest to current last activity.
 *
 * Activity scheduling:
 * - 1 to 2 activities max per day.
 * - Randonnées/nature → morning (9h00) to benefit from cool hours.
 * - Plages → afternoon (14h00).
 * - Others → distribute morning/afternoon.
 */
function buildSmartItinerary(
  pois: POIRowWithCoords[],
  overnightSpots: POIRowWithCoords[],
  days: number,
  departure: string,
  arrival: string
): ItineraryDay[] {
  const departureCoords = getCityCoords(departure) ?? PB_CENTER
  const arrivalCoords = arrival ? getCityCoords(arrival) : null

  const activityPois = pois.filter((p) => p.category !== 'spot_nuit')
  const sorted = sortPoisAlongRoute(activityPois, departureCoords, arrivalCoords)

  const maxPerDay = 2
  const totalSlots = days * maxPerDay
  const selected = sorted.slice(0, Math.min(sorted.length, totalSlots))

  // ── Phase 1: distribute POIs into days ──
  const dayBuckets: POIRowWithCoords[][] = []
  let poiIdx = 0
  for (let d = 0; d < days; d++) {
    const count = Math.min(maxPerDay, Math.ceil((selected.length - poiIdx) / Math.max(1, days - d)))
    const bucket: POIRowWithCoords[] = []
    for (let s = 0; s < count && poiIdx < selected.length; s++) {
      bucket.push(selected[poiIdx++])
    }
    dayBuckets.push(bucket)
  }

  // ── Phase 2: schedule activities with smart times ──
  function scheduleDay(bucket: POIRowWithCoords[]): ItineraryStop[] {
    if (bucket.length === 0) return []
    if (bucket.length === 1) {
      const poi = bucket[0]
      const isNatureMorning = poi.tags?.some((t) => ['randonnee', 'montagne', 'cascade', 'nature', 'foret'].includes(t))
      const isBeach = poi.tags?.some((t) => ['plage', 'detente', 'mer', 'ocean'].includes(t))
      const time = isNatureMorning ? '9h00' : isBeach ? '14h00' : '10h00'
      return [{ poi, coords: parseCoordinates(poi.coordinates), startTime: time, duration: estimateActivityDuration(poi) }]
    }
    // 2 activities: sort nature/rando first (morning), beach/leisure second (afternoon)
    const a = [...bucket]
    a.sort((x, y) => {
      const xMorning = x.tags?.some((t) => ['randonnee', 'montagne', 'cascade', 'nature', 'foret', 'sport', 'surf', 'rafting'].includes(t)) ? 0 : 1
      const yMorning = y.tags?.some((t) => ['randonnee', 'montagne', 'cascade', 'nature', 'foret', 'sport', 'surf', 'rafting'].includes(t)) ? 0 : 1
      return xMorning - yMorning
    })
    return [
      { poi: a[0], coords: parseCoordinates(a[0].coordinates), startTime: '9h30', duration: estimateActivityDuration(a[0]) },
      { poi: a[1], coords: parseCoordinates(a[1].coordinates), startTime: '14h30', duration: estimateActivityDuration(a[1]) },
    ]
  }

  // ── Phase 3: assign overnight based on NEXT day's first activity ──
  const result: ItineraryDay[] = []
  const usedOvernightIds = new Set<string>()

  for (let d = 0; d < days; d++) {
    const activities = scheduleDay(dayBuckets[d])

    // Theme
    const cities = Array.from(new Set(activities.map((a) => a.poi.location_city)))
    const catLabels: Record<string, string> = {
      nature: 'Nature', activite: 'Aventure', restaurant: 'Gastronomie',
      culture: 'Culture', spot_nuit: 'Découverte', parking: 'Découverte',
    }
    const dominantCat = activities[0]?.poi.category ?? 'nature'
    const theme = cities.length > 0
      ? `${catLabels[dominantCat] ?? 'Découverte'} — ${cities.slice(0, 2).join(' & ')}`
      : 'Journée libre'

    // Overnight: look ahead to next day's first activity
    let overnight: POIRowWithCoords | null = null
    let overnightCoords: [number, number] | null = null

    if (d < days - 1) {
      // Find coords of the first activity of NEXT day
      const nextDayBucket = dayBuckets[d + 1]
      const nextDayScheduled = scheduleDay(nextDayBucket)
      const nextFirstCoords = nextDayScheduled[0]?.coords ?? null

      if (nextFirstCoords) {
        // Sleep near tomorrow's first activity (especially for morning hikes)
        overnight = findNearestOvernight(nextFirstCoords, overnightSpots, usedOvernightIds)
      } else {
        // Fallback: sleep near today's last activity
        const lastCoords = activities[activities.length - 1]?.coords ?? departureCoords
        overnight = findNearestOvernight(lastCoords, overnightSpots, usedOvernightIds)
      }

      if (overnight) {
        usedOvernightIds.add(overnight.id)
        overnightCoords = parseCoordinates(overnight.coordinates)
      }
    }

    result.push({ day: d + 1, theme, activities, overnight, overnightCoords })
  }

  return result
}

/** Build ordered route coords for the map polyline. */
function buildRouteCoords(
  itinerary: ItineraryDay[],
  departureCoords: [number, number],
  arrivalCoords: [number, number] | null
): [number, number][] {
  const coords: [number, number][] = [departureCoords]
  for (const day of itinerary) {
    for (const stop of day.activities) {
      if (stop.coords) coords.push(stop.coords)
    }
    if (day.overnightCoords) coords.push(day.overnightCoords)
  }
  if (arrivalCoords) coords.push(arrivalCoords)
  return coords
}

// ═══════════════════════════════════════════════════════════════════════════════
// View modes
// ═══════════════════════════════════════════════════════════════════════════════

type ViewMode = 'spots' | 'itinerary' | 'carte'

// ═══════════════════════════════════════════════════════════════════════════════
// Main component
// ═══════════════════════════════════════════════════════════════════════════════

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
  const visibleOvernight = filteredOvernight.length > 0 ? filteredOvernight : allOvernight
  const allMapPois = useMemo(
    () => [...filteredPois, ...visibleOvernight],
    [filteredPois, visibleOvernight]
  )

  // Smart itinerary
  const itinerary = useMemo(
    () => buildSmartItinerary(filteredPois, visibleOvernight, filters.days, filters.departure, filters.arrival),
    [filteredPois, visibleOvernight, filters.days, filters.departure, filters.arrival]
  )

  // Route coords for map polyline
  const departureCoords = getCityCoords(filters.departure) ?? PB_CENTER
  const arrivalCoords = filters.arrival ? getCityCoords(filters.arrival) : null
  const routeCoords = useMemo(
    () => buildRouteCoords(itinerary, departureCoords, arrivalCoords),
    [itinerary, departureCoords, arrivalCoords]
  )

  // POIs used in itinerary (for carte view)
  const itineraryPois = useMemo(() => {
    const pois: POIRowWithCoords[] = []
    for (const day of itinerary) {
      for (const stop of day.activities) pois.push(stop.poi)
      if (day.overnight) pois.push(day.overnight)
    }
    return pois
  }, [itinerary])

  const wizardUrl = wizardUrlFromFilters(filters)

  return (
    <>
      {/* Filter Bar */}
      <section className="mt-8">
        <FilterBar filters={filters} onChange={setFilters} />
      </section>

      {/* View Toggle */}
      <div className="mx-auto mt-8 max-w-6xl px-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-500">
            {filteredPois.length} activité{filteredPois.length > 1 ? 's' : ''} ·{' '}
            {visibleOvernight.length} spot{visibleOvernight.length > 1 ? 's' : ''} nuit
            {filters.styles.length > 0 && <> · {filters.styles.join(', ')}</>}
          </p>
          <div className="flex rounded-lg border border-slate-200 bg-white p-1">
            {(['spots', 'itinerary', 'carte'] as const).map((mode) => {
              const labels = { spots: '🗺️ Incontournables', itinerary: '📅 Itinéraire', carte: '🧭 Carte' }
              return (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setViewMode(mode)}
                  className={`rounded-md px-3 py-2 text-sm font-semibold transition ${
                    viewMode === mode
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {labels[mode]}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* ═══ VIEW: Incontournables ═══ */}
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
              <h2 className="text-2xl font-bold text-slate-900 md:text-3xl">Où dormir en van</h2>
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {visibleOvernight.slice(0, 6).map((spot) => (
                  <OvernightCardInline key={spot.id} spot={spot} />
                ))}
              </div>
            </section>
          )}
          {/* Carte en bas de la vue Incontournables */}
          <section className="mx-auto mt-12 max-w-6xl px-4">
            <h2 className="text-2xl font-bold text-slate-900 md:text-3xl">Carte des spots</h2>
            <div className="mt-6">
              <RoadTripMap pois={allMapPois} />
            </div>
          </section>
        </>
      )}

      {/* ═══ VIEW: Itinéraire jour par jour ═══ */}
      {viewMode === 'itinerary' && (
        <section className="mx-auto mt-8 max-w-5xl px-4">
          <h2 className="text-2xl font-bold text-slate-900 md:text-3xl">
            Itinéraire {filters.days} jour{filters.days > 1 ? 's' : ''}
            {filters.departure && <> — départ {filters.departure}</>}
            {filters.arrival && <> → {filters.arrival}</>}
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Trajet optimisé avec 1 à 2 activités par jour et un spot nuit à proximité.
          </p>
          <div className="mt-8 space-y-6">
            {itinerary.map((day) => (
              <DayCard key={day.day} day={day} />
            ))}
          </div>
        </section>
      )}

      {/* ═══ VIEW: Carte avec tracé ═══ */}
      {viewMode === 'carte' && (
        <section className="mx-auto mt-8 max-w-6xl px-4">
          <h2 className="text-2xl font-bold text-slate-900 md:text-3xl">
            Tracé du road trip
            {filters.departure && <> — {filters.departure}</>}
            {filters.arrival && <> → {filters.arrival}</>}
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            {itinerary.reduce((n, d) => n + d.activities.length, 0)} étapes sur {filters.days} jour{filters.days > 1 ? 's' : ''}
          </p>
          <div className="mt-6">
            <RoadTripMap
              pois={itineraryPois}
              route={routeCoords}
              height={{ desktop: 600, mobile: 450 }}
            />
          </div>
          {/* Legend */}
          <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-3 w-3 rounded-full" style={{ background: CATEGORY_COLORS.activite }} /> Activité
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-3 w-3 rounded-full" style={{ background: CATEGORY_COLORS.nature }} /> Nature
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-3 w-3 rounded-full" style={{ background: CATEGORY_COLORS.restaurant }} /> Restaurant
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-3 w-3 rounded-full" style={{ background: CATEGORY_COLORS.culture }} /> Culture
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-3 w-3 rounded-full" style={{ background: CATEGORY_COLORS.spot_nuit }} /> Spot nuit
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-0.5 w-6 rounded bg-blue-600" /> Itinéraire
            </span>
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
  const heroPoi = day.activities.find((a) => a.poi.image_url)?.poi ?? day.activities[0]?.poi
  const heroColor = heroPoi ? (CATEGORY_COLORS[heroPoi.category] ?? '#64748b') : '#64748b'
  const heroEmoji = heroPoi ? (CATEGORY_EMOJIS[heroPoi.category] ?? '📍') : '📍'

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* Hero */}
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

      {/* Timeline */}
      <div className="divide-y divide-slate-100 px-5 py-4">
        {day.activities.map((stop, idx) => (
          <div key={`${stop.poi.id}-${idx}`} className="flex gap-4 py-4 first:pt-0 last:pb-0">
            <div className="flex-none pt-0.5">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-sm font-bold text-blue-700">
                {stop.startTime}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-start gap-2">
                <span className="text-lg">{CATEGORY_EMOJIS[stop.poi.category] ?? '📍'}</span>
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900">{stop.poi.name}</p>
                  <p className="text-xs text-slate-500">
                    {stop.poi.location_city}
                    {' · '}{formatDuration(stop.duration)}
                    {stop.poi.budget_level && ` · ${BUDGET_DOTS[stop.poi.budget_level] ?? ''}`}
                  </p>
                </div>
              </div>
              {stop.poi.description && (
                <p className="mt-1.5 line-clamp-2 text-sm text-slate-600">{stop.poi.description}</p>
              )}
              <div className="mt-2 flex flex-wrap gap-3">
                {stop.poi.external_url && (
                  <a href={stop.poi.external_url} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-blue-600 hover:underline">
                    Voir le site →
                  </a>
                )}
                {stop.poi.google_maps_url && (
                  <a href={stop.poi.google_maps_url} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-blue-600 hover:underline">
                    Google Maps →
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Overnight */}
        {day.overnight && (
          <div className="-mx-5 flex gap-4 border-t border-blue-100 bg-blue-50/50 px-5 py-4">
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
                <a href={day.overnight.google_maps_url} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-xs font-semibold text-blue-600 hover:underline">
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
// POI Card (spots view)
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
          <Image src={poi.image_url!} alt={poi.name} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover" unoptimized />
        ) : (
          <div className="flex h-full items-center justify-center text-5xl" style={{ background: `linear-gradient(135deg, ${color}22, ${color}55)` }}>{emoji}</div>
        )}
        <span className="absolute left-2 top-2 rounded-full px-2 py-0.5 text-xs font-semibold text-white shadow" style={{ backgroundColor: color }}>{poi.category}</span>
        {budgetLabel && <span className="absolute right-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-xs font-semibold text-slate-700 shadow">{budgetLabel}</span>}
      </div>
      <div className="p-4">
        <h3 className="line-clamp-2 text-base font-bold text-slate-900">{poi.name}</h3>
        <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">{poi.location_city}</p>
        {poi.description && <p className="mt-2 line-clamp-3 text-sm text-slate-600">{poi.description}</p>}
      </div>
    </>
  )
  const cls = 'group block overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md'
  return poi.external_url ? (
    <a href={poi.external_url} target="_blank" rel="noopener noreferrer" className={cls}>{inner}</a>
  ) : (
    <article className={cls}>{inner}</article>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// Overnight Card (spots view)
// ═══════════════════════════════════════════════════════════════════════════════

function OvernightCardInline({ spot }: { spot: POIRowWithCoords }) {
  const typeLabel = spot.overnight_type ? OVERNIGHT_LABELS[spot.overnight_type] ?? spot.overnight_type : 'Spot nuit'
  const price = spot.overnight_price_per_night && spot.overnight_price_per_night > 0 ? `${spot.overnight_price_per_night}€/nuit` : 'Gratuit'
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="relative h-36 w-full">
        {spot.image_url ? (
          <Image src={spot.image_url} alt={spot.name} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover" unoptimized />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 text-4xl">🌙</div>
        )}
        <span className="absolute left-2 top-2 rounded-full bg-blue-600 px-2 py-0.5 text-xs font-semibold text-white">{typeLabel}</span>
        <span className="absolute right-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-xs font-semibold text-slate-700">{price}</span>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-2 font-bold text-slate-900">{spot.name}</h3>
        <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">{spot.location_city}</p>
        {spot.description && <p className="mt-2 line-clamp-3 text-sm text-slate-600">{spot.description}</p>}
        {spot.overnight_amenities && spot.overnight_amenities.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-1">
            {spot.overnight_amenities.slice(0, 4).map((a) => (
              <li key={a} className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{a}</li>
            ))}
          </ul>
        )}
      </div>
    </article>
  )
}
