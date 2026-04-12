// src/app/(site)/road-trip-pays-basque-van/_components/filter-utils.ts
// Helpers partagés pour le filtrage — importables depuis server ET client components.

export type AdventureStyle = 'nature' | 'sport' | 'culture' | 'plages'

export interface FilterState {
  days: number
  styles: AdventureStyle[]
  includeSpain: boolean
  departure: string
  arrival: string
}

/** Parse un slug de durée en nombre de jours. */
export function parseDurationSlug(slug: string): number {
  if (slug === 'weekend') return 3
  if (slug === '1-semaine') return 7
  const match = slug.match(/^(\d+)-jours?$/)
  if (match) return Math.min(14, Math.max(1, Number(match[1])))
  return 3
}

export function daysToSlug(days: number): string {
  return days === 1 ? '1-jour' : `${days}-jours`
}

export function buildFilterUrl(days: number, styles: AdventureStyle[], includeSpain: boolean): string {
  const base = `/road-trip-pays-basque-van/${daysToSlug(days)}`
  const params = new URLSearchParams()
  if (styles.length > 0) params.set('style', styles.join(','))
  if (includeSpain) params.set('scope', 'france_espagne')
  const qs = params.toString()
  return qs ? `${base}?${qs}` : base
}

export function wizardUrlFromFilters(f: FilterState): string {
  const params = new URLSearchParams()
  params.set('duration', daysToSlug(f.days))
  if (f.styles.length > 0) params.set('interests', f.styles.join(','))
  if (f.includeSpain) params.set('scope', 'france_espagne')
  return `/road-trip-personnalise?${params.toString()}`
}

const VALID_STYLES: AdventureStyle[] = ['nature', 'sport', 'culture', 'plages']

export function parseStylesFromParams(searchParams: { get(key: string): string | null }): AdventureStyle[] {
  const raw = searchParams.get('style') ?? ''
  return raw.split(',').filter((s): s is AdventureStyle => VALID_STYLES.includes(s as AdventureStyle))
}

// ─── Villes avec coordonnées (suggestions + géolocalisation) ─────────────────

export interface CityOption {
  name: string
  lat: number
  lng: number
}

export const SUGGESTED_CITIES: CityOption[] = [
  { name: 'Cambo-les-Bains', lat: 43.3583, lng: -1.4028 },
  { name: 'Biarritz', lat: 43.4832, lng: -1.5586 },
  { name: 'Bayonne', lat: 43.4933, lng: -1.4745 },
  { name: 'Anglet', lat: 43.4851, lng: -1.5166 },
  { name: 'Saint-Jean-de-Luz', lat: 43.3895, lng: -1.6626 },
  { name: 'Hendaye', lat: 43.3587, lng: -1.7755 },
  { name: 'Espelette', lat: 43.3406, lng: -1.4425 },
  { name: 'Saint-Jean-Pied-de-Port', lat: 43.1631, lng: -1.2366 },
  { name: 'Bidart', lat: 43.4417, lng: -1.5900 },
  { name: 'Guéthary', lat: 43.4244, lng: -1.6083 },
  { name: 'Sare', lat: 43.3122, lng: -1.5800 },
  { name: 'Ainhoa', lat: 43.3058, lng: -1.4983 },
  { name: 'Itxassou', lat: 43.3261, lng: -1.4239 },
  { name: 'Bidarray', lat: 43.2706, lng: -1.3508 },
  { name: 'Iraty', lat: 43.0253, lng: -1.0825 },
  { name: 'San Sebastián', lat: 43.3183, lng: -1.9812 },
  { name: 'Hondarribia', lat: 43.3659, lng: -1.7961 },
  { name: 'Pau', lat: 43.2951, lng: -0.3708 },
  { name: 'Bordeaux', lat: 44.8378, lng: -0.5792 },
  { name: 'Toulouse', lat: 43.6047, lng: 1.4442 },
  { name: 'Paris', lat: 48.8566, lng: 2.3522 },
]

/** Lookup coords pour un nom de ville (case-insensitive, partiel). */
export function getCityCoords(name: string): [number, number] | null {
  if (!name) return null
  const lower = name.toLowerCase()
  const match = SUGGESTED_CITIES.find((c) => c.name.toLowerCase() === lower)
  if (match) return [match.lng, match.lat] // [lng, lat] pour MapLibre
  return null
}

// ─── Estimation durée d'activité (minutes) ───────────────────────────────────

export function estimateActivityDuration(poi: { category: string; tags?: string[]; duration_minutes?: number | null }): number {
  if (poi.duration_minutes && poi.duration_minutes > 0) return poi.duration_minutes
  const tags = poi.tags ?? []
  // Tags spécifiques → durée ajustée
  if (tags.some((t) => ['plage', 'detente', 'mer', 'ocean'].includes(t))) return 240 // 4h
  if (tags.some((t) => ['randonnee', 'montagne', 'cascade'].includes(t))) return 180 // 3h
  if (tags.some((t) => ['surf', 'rafting', 'canyoning'].includes(t))) return 180 // 3h
  if (tags.some((t) => ['musee', 'patrimoine', 'histoire'].includes(t))) return 120 // 2h
  if (tags.some((t) => ['pintxos', 'restaurant', 'marche', 'fromagerie'].includes(t))) return 90 // 1h30
  // Par catégorie générale
  switch (poi.category) {
    case 'nature': return 180
    case 'activite': return 150
    case 'restaurant': return 90
    case 'culture': return 120
    default: return 120
  }
}

export function formatDuration(minutes: number): string {
  if (minutes >= 60) {
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    return m > 0 ? `~${h}h${String(m).padStart(2, '0')}` : `~${h}h`
  }
  return `~${minutes}min`
}

// ─── Distance haversine simplifiée (km) ──────────────────────────────────────

export function haversineKm(a: [number, number], b: [number, number]): number {
  const toRad = (d: number) => (d * Math.PI) / 180
  const [lng1, lat1] = a
  const [lng2, lat2] = b
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const sin2Lat = Math.sin(dLat / 2) ** 2
  const sin2Lng = Math.sin(dLng / 2) ** 2
  const h = sin2Lat + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * sin2Lng
  return 2 * 6371 * Math.asin(Math.sqrt(h))
}
