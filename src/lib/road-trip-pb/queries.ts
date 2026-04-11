// src/lib/road-trip-pb/queries.ts
// Server-only helpers Supabase pour les pages /road-trip-pays-basque-van/*.
// Appelés en RSC au build time / ISR revalidate, jamais côté client.

import 'server-only'
import { createSupabaseAdmin } from '@/lib/supabase/server'
import type { GroupType } from '@/types/roadtrip'
import type {
  DurationSlug,
  POIRowWithCoords,
  RoadTripTemplateRow,
} from '@/types/road-trip-pb'
import {
  REGION_SLUG,
  GROUP_TYPE_INTERESTS,
  INTEREST_TO_POI_TAGS,
} from './constants'

// ─── Helpers internes ────────────────────────────────────────────────────────

export const PAYS_BASQUE_CITIES = [
  'Biarritz', 'Bayonne', 'Anglet', 'Saint-Jean-de-Luz', 'Hendaye',
  'Espelette', 'Ainhoa', 'Saint-Jean-Pied-de-Port', 'Itxassou',
  'Sare', 'Bidarray', 'Cambo-les-Bains', 'Guéthary', 'Bidart',
  'Urrugne', 'Larrau', 'Sainte-Engrace', 'Lecumberry', 'Iraty',
]

// ─── Top POIs de la région (toutes catégories sauf spot_nuit) ────────────────

export async function getTopActivities(limit = 6): Promise<POIRowWithCoords[]> {
  const supabase = createSupabaseAdmin()
  const { data, error } = await supabase
    .from('poi_cache')
    .select('*')
    .neq('category', 'spot_nuit')
    .neq('category', 'parking')
    .in('location_city', PAYS_BASQUE_CITIES)
    .order('scraped_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('[road-trip-pb/queries] getTopActivities:', error.message)
    return []
  }
  return (data as POIRowWithCoords[] | null) ?? []
}

// ─── POIs filtrés par groupType ──────────────────────────────────────────────

export async function getPOIsForGroupType(
  groupType: GroupType,
  limit = 20
): Promise<POIRowWithCoords[]> {
  const supabase = createSupabaseAdmin()
  const interests = GROUP_TYPE_INTERESTS[groupType]
  const tags = interests.flatMap((i) => INTEREST_TO_POI_TAGS[i] ?? [])

  const { data, error } = await supabase
    .from('poi_cache')
    .select('*')
    .neq('category', 'spot_nuit')
    .neq('category', 'parking')
    .in('location_city', PAYS_BASQUE_CITIES)
    .overlaps('tags', tags.length > 0 ? tags : ['nature'])
    .limit(limit)

  if (error) {
    console.error('[road-trip-pb/queries] getPOIsForGroupType:', error.message)
    return []
  }

  // Fallback : si aucun match tags, on retourne des POIs génériques
  if (!data || data.length === 0) {
    return getTopActivities(limit)
  }
  return data as POIRowWithCoords[]
}

// ─── Spots nuit top N ────────────────────────────────────────────────────────

export async function getOvernightSpots(limit = 6): Promise<POIRowWithCoords[]> {
  const supabase = createSupabaseAdmin()
  const { data, error } = await supabase
    .from('poi_cache')
    .select('*')
    .eq('category', 'spot_nuit')
    .eq('overnight_allowed', true)
    .in('location_city', PAYS_BASQUE_CITIES)
    .order('scraped_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('[road-trip-pb/queries] getOvernightSpots:', error.message)
    return []
  }
  return (data as POIRowWithCoords[] | null) ?? []
}

// ─── Template pour un combo exact ────────────────────────────────────────────

export async function getTemplate(
  duration: DurationSlug,
  groupType: GroupType
): Promise<RoadTripTemplateRow | null> {
  const supabase = createSupabaseAdmin()
  const { data, error } = await supabase
    .from('road_trip_templates')
    .select('*')
    .eq('region_slug', REGION_SLUG)
    .eq('duration_key', duration)
    .eq('group_type', groupType)
    .eq('published', true)
    .maybeSingle()

  if (error) {
    console.error('[road-trip-pb/queries] getTemplate:', error.message)
    return null
  }
  return (data as RoadTripTemplateRow | null) ?? null
}

// ─── POIs by id list (utilisé par les pages qui résolvent un template) ──────

export async function getPOIsByIds(ids: string[]): Promise<POIRowWithCoords[]> {
  if (ids.length === 0) return []
  const supabase = createSupabaseAdmin()
  const { data, error } = await supabase
    .from('poi_cache')
    .select('*')
    .in('id', ids)

  if (error) {
    console.error('[road-trip-pb/queries] getPOIsByIds:', error.message)
    return []
  }
  return (data as POIRowWithCoords[] | null) ?? []
}

// ─── Stats région pour le hub ────────────────────────────────────────────────

export interface RegionStats {
  totalPois: number
  totalOvernight: number
  cities: string[]
}

export async function getRegionStats(): Promise<RegionStats> {
  const supabase = createSupabaseAdmin()
  const { data, error } = await supabase
    .from('poi_cache')
    .select('category, location_city')
    .in('location_city', PAYS_BASQUE_CITIES)

  if (error || !data) {
    return { totalPois: 0, totalOvernight: 0, cities: [] }
  }

  const totalPois = data.filter((r) => r.category !== 'spot_nuit').length
  const totalOvernight = data.filter((r) => r.category === 'spot_nuit').length
  const cities = Array.from(new Set(data.map((r) => r.location_city))).sort()

  return { totalPois, totalOvernight, cities }
}
