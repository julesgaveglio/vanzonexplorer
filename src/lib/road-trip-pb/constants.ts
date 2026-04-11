// src/lib/road-trip-pb/constants.ts
// Constantes partagées pour la refonte SEO Road Trip Pays Basque.
// Toute valeur "magique" (slug, label, centroid, ville de départ) vit ici.

import type { DurationSlug, POIRowWithCoords } from '@/types/road-trip-pb'
import type { GroupType, InterestKey, BudgetLevel } from '@/types/roadtrip'

// ─── Métadonnées région ──────────────────────────────────────────────────────
export const REGION_SLUG = 'pays-basque' as const
export const REGION_NAME = 'Pays Basque' as const
export const PICKUP_CITY = 'Cambo-les-Bains' as const
export const PICKUP_POSTAL = '64250' as const

// MapLibre utilise [lng, lat]
export const PB_CENTER: [number, number] = [-1.48, 43.48]
export const PB_DEFAULT_ZOOM = 9
export const PB_MAX_BOUNDS: [[number, number], [number, number]] = [
  [-2.5, 42.8], // SW
  [0.2, 44.2],  // NE
]

// ─── Labels FR ───────────────────────────────────────────────────────────────
export const DURATION_LABELS: Record<DurationSlug, string> = {
  '1-jour': '1 jour',
  weekend: 'Weekend',
  '5-jours': '5 jours',
  '1-semaine': '1 semaine',
}

export const DURATION_LABELS_LONG: Record<DurationSlug, string> = {
  '1-jour': 'en 1 journée',
  weekend: 'en weekend',
  '5-jours': 'en 5 jours',
  '1-semaine': 'en 1 semaine',
}

export const GROUP_LABELS: Record<GroupType, string> = {
  solo: 'en solo',
  couple: 'en couple',
  amis: 'entre amis',
  famille: 'en famille',
}

export const GROUP_LABELS_SHORT: Record<GroupType, string> = {
  solo: 'Solo',
  couple: 'Couple',
  amis: 'Amis',
  famille: 'Famille',
}

export const GROUP_EMOJIS: Record<GroupType, string> = {
  solo: '🧍',
  couple: '💑',
  amis: '👥',
  famille: '👨‍👩‍👧',
}

// ─── Mapping groupType → InterestKeys déduits ────────────────────────────────
// Utilisé pour filtrer les POIs du cache selon le profil voyageur
export const GROUP_TYPE_INTERESTS: Record<GroupType, InterestKey[]> = {
  solo: ['sport', 'nature', 'culture'],
  couple: ['gastronomie', 'culture', 'plages', 'nature'],
  amis: ['sport', 'plages', 'soirees', 'gastronomie'],
  famille: ['nature', 'plages', 'culture'],
}

// ─── Mapping interest → tags poi_cache ───────────────────────────────────────
// Aligné avec INTEREST_TAG_MAP de src/lib/road-trip/poi-cache.ts pour cohérence
export const INTEREST_TO_POI_TAGS: Record<InterestKey, string[]> = {
  sport: ['sport', 'aventure', 'surf', 'rafting', 'escalade', 'vtt', 'canyoning'],
  nature: ['nature', 'randonnee', 'montagne', 'foret', 'cascade'],
  gastronomie: ['gastronomie', 'restaurant', 'marche', 'pintxos', 'fromagerie'],
  culture: ['culture', 'patrimoine', 'musee', 'village', 'histoire'],
  plages: ['plage', 'detente', 'mer', 'cote', 'ocean'],
  soirees: ['soiree', 'bar', 'festif', 'nuit', 'concert'],
}

// ─── Budget filter ordre d'affichage ─────────────────────────────────────────
export const BUDGET_ORDER: BudgetLevel[] = ['faible', 'moyen', 'eleve']

export const BUDGET_LABELS: Record<BudgetLevel | 'all', string> = {
  all: 'Tous',
  faible: 'Petit budget',
  moyen: 'Budget moyen',
  eleve: 'Confort',
}

// ─── Catégorie → couleur marker map (hex) ────────────────────────────────────
export const CATEGORY_COLORS = {
  restaurant: '#ef4444',   // rouge
  activite: '#f97316',     // orange
  nature: '#16a34a',       // vert
  culture: '#a855f7',      // violet
  spot_nuit: '#2563eb',    // bleu
  parking: '#64748b',      // slate
} as const

export const CATEGORY_EMOJIS: Record<POIRowWithCoords['category'], string> = {
  restaurant: '🍽️',
  activite: '🏄',
  nature: '🌲',
  culture: '🏛️',
  spot_nuit: '🌙',
  parking: '🅿️',
}

// ─── Route helpers ──────────────────────────────────────────────────────────
export const ROAD_TRIP_PB_BASE = '/road-trip-pays-basque-van' as const

export function hubPath(): string {
  return ROAD_TRIP_PB_BASE
}
export function durationPath(d: DurationSlug): string {
  return `${ROAD_TRIP_PB_BASE}/${d}`
}
export function finalPath(d: DurationSlug, g: GroupType): string {
  return `${ROAD_TRIP_PB_BASE}/${d}/${g}`
}

// CTA wizard pré-rempli
export function wizardPrefillUrl(params: {
  duration?: DurationSlug
  groupType?: GroupType
  budgetLevel?: BudgetLevel
}): string {
  const qs = new URLSearchParams()
  if (params.duration) qs.set('duration', params.duration)
  if (params.groupType) qs.set('groupType', params.groupType)
  if (params.budgetLevel) qs.set('budgetLevel', params.budgetLevel)
  const q = qs.toString()
  return `/road-trip-personnalise${q ? `?${q}` : ''}`
}
