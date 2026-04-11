// src/types/road-trip-pb.ts
// Types dédiés à la refonte SEO Road Trip Pays Basque (/road-trip-pays-basque-van)
// Distincts des types wizard dans src/types/roadtrip.ts pour éviter le couplage.

import type { GroupType, POIRow, GeneratedItineraryV2, DurationKey } from './roadtrip'

// ─── URL slugs ───────────────────────────────────────────────────────────────
export type DurationSlug = '1-jour' | 'weekend' | '5-jours' | '1-semaine'

export const ALL_DURATION_SLUGS: DurationSlug[] = ['1-jour', 'weekend', '5-jours', '1-semaine']
export const ALL_GROUP_TYPES: GroupType[] = ['solo', 'couple', 'amis', 'famille']

// Duration slugs indexables SEO (1-jour est noindex)
export const INDEXABLE_DURATION_SLUGS: DurationSlug[] = ['weekend', '5-jours', '1-semaine']

// ─── Row Supabase road_trip_templates ────────────────────────────────────────
export interface FAQItem {
  q: string
  a: string
}

export interface RoadTripTemplateRow {
  id: string
  region_slug: string
  duration_key: DurationSlug
  group_type: GroupType
  title: string
  intro: string | null
  itinerary_json: GeneratedItineraryV2
  poi_ids: string[]
  overnight_ids: string[]
  tips: string[]
  faq: FAQItem[]
  published: boolean
  created_at: string
  updated_at: string
}

// ─── Poi row étendu avec coordinates ─────────────────────────────────────────
// On ne duplique pas POIRow : on l'étend localement pour clarifier qu'on lit
// la nouvelle colonne coordinates.
export interface POIRowWithCoords extends POIRow {
  id: string
  coordinates: string | null
  image_url?: string | null
  price_indication?: string | null
  opening_hours?: string | null
  duration_minutes?: number | null
}

// ─── Helpers parse coordinates ───────────────────────────────────────────────
export function parseCoordinates(raw: string | null | undefined): [number, number] | null {
  if (!raw) return null
  const parts = raw.split(',').map((p) => p.trim())
  if (parts.length !== 2) return null
  const lat = Number(parts[0])
  const lng = Number(parts[1])
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null
  return [lng, lat] // MapLibre utilise [lng, lat]
}

// ─── Wizard DurationKey ↔ DurationSlug mapping ───────────────────────────────
export const DURATION_SLUG_TO_KEY: Record<DurationSlug, DurationKey> = {
  '1-jour': '1j',
  weekend: '2-3j',
  '5-jours': '4-5j',
  '1-semaine': '1sem',
}

export const DURATION_KEY_TO_SLUG: Record<DurationKey, DurationSlug> = {
  '1j': '1-jour',
  '2-3j': 'weekend',
  '4-5j': '5-jours',
  '1sem': '1-semaine',
}

export const DURATION_TO_DAYS_SLUG: Record<DurationSlug, number> = {
  '1-jour': 1,
  weekend: 3,
  '5-jours': 5,
  '1-semaine': 7,
}
