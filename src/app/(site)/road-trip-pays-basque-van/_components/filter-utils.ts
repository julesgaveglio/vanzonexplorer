// src/app/(site)/road-trip-pays-basque-van/_components/filter-utils.ts
// Helpers partagés pour le filtrage — importables depuis server ET client components.

export type AdventureStyle = 'nature' | 'sport' | 'culture' | 'plages'

export interface FilterState {
  days: number
  styles: AdventureStyle[]
  includeSpain: boolean
}

/** Parse un slug de durée en nombre de jours. */
export function parseDurationSlug(slug: string): number {
  if (slug === 'weekend') return 3
  if (slug === '1-semaine') return 7
  const match = slug.match(/^(\d+)-jours?$/)
  if (match) return Math.min(14, Math.max(1, Number(match[1])))
  return 3 // fallback
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

/** Construit l'URL wizard pré-remplie depuis les filtres actifs. */
export function wizardUrlFromFilters(f: FilterState): string {
  const params = new URLSearchParams()
  params.set('duration', daysToSlug(f.days))
  if (f.styles.length > 0) params.set('interests', f.styles.join(','))
  if (f.includeSpain) params.set('scope', 'france_espagne')
  return `/road-trip-personnalise?${params.toString()}`
}

const VALID_STYLES: AdventureStyle[] = ['nature', 'sport', 'culture', 'plages']

/** Parse les filtres depuis searchParams. */
export function parseStylesFromParams(searchParams: { get(key: string): string | null }): AdventureStyle[] {
  const raw = searchParams.get('style') ?? ''
  return raw.split(',').filter((s): s is AdventureStyle => VALID_STYLES.includes(s as AdventureStyle))
}
