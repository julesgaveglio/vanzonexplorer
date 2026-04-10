// src/lib/road-trip/poi-cache.ts
// Cache-first POI lookup + fallback scraping Tavily pour le wizard Road Trip Pays Basque

import { createSupabaseAdmin } from '@/lib/supabase/server'
import { groqWithFallback } from '@/lib/groq-with-fallback'
import type {
  POIRow,
  POIUpsert,
  InterestKey,
  OvernightPreference,
  OvernightType,
  BudgetLevel,
} from '@/types/roadtrip'

// ─── Mappings intérêts → tags de recherche ──────────────────────────────────
export const INTEREST_TAG_MAP: Record<InterestKey, string[]> = {
  sport: ['sport', 'aventure', 'surf', 'rafting', 'escalade', 'vtt', 'canyoning'],
  nature: ['nature', 'randonnee', 'montagne', 'foret', 'cascade'],
  gastronomie: ['gastronomie', 'restaurant', 'marche', 'pintxos', 'fromagerie'],
  culture: ['culture', 'patrimoine', 'musee', 'village', 'histoire'],
  plages: ['plage', 'detente', 'mer', 'cote', 'ocean'],
  soirees: ['soiree', 'bar', 'festif', 'nuit', 'concert'],
}

// Préférence nuit → types de spots cache-first acceptables
export const OVERNIGHT_PREFERENCE_TO_TYPES: Record<OvernightPreference, OvernightType[]> = {
  gratuit: ['parking_gratuit', 'spot_sauvage'],
  aires_officielles: ['parking_gratuit', 'aire_camping_car'],
  camping: ['aire_camping_car', 'camping_van'],
  mix: ['parking_gratuit', 'aire_camping_car', 'camping_van', 'spot_sauvage'],
}

// ─── Lecture cache ──────────────────────────────────────────────────────────
interface CacheResult {
  pois: POIRow[]
  overnightSpots: POIRow[]
}

export async function getPOIsFromCache(
  interests: InterestKey[],
  overnightPreference: OvernightPreference
): Promise<CacheResult> {
  const supabase = createSupabaseAdmin()
  const targetTags = interests.flatMap((i) => INTEREST_TAG_MAP[i] ?? [])
  const overnightTypes = OVERNIGHT_PREFERENCE_TO_TYPES[overnightPreference]

  const [poisRes, spotsRes] = await Promise.all([
    supabase
      .from('poi_cache')
      .select('*')
      .overlaps('tags', targetTags.length > 0 ? targetTags : ['nature'])
      .neq('category', 'spot_nuit')
      .limit(40),
    supabase
      .from('poi_cache')
      .select('*')
      .eq('category', 'spot_nuit')
      .in('overnight_type', overnightTypes)
      .limit(20),
  ])

  return {
    pois: (poisRes.data as POIRow[] | null) ?? [],
    overnightSpots: (spotsRes.data as POIRow[] | null) ?? [],
  }
}

// ─── Upsert POI dans le cache ───────────────────────────────────────────────
export async function upsertPOIs(pois: POIUpsert[]): Promise<number> {
  if (pois.length === 0) return 0
  const supabase = createSupabaseAdmin()
  const { error, count } = await supabase
    .from('poi_cache')
    .upsert(pois, { onConflict: 'name,location_city', count: 'exact' })
  if (error) {
    console.error('[poi-cache] upsert error:', error.message)
    return 0
  }
  return count ?? pois.length
}

// ─── Tavily search helper ───────────────────────────────────────────────────
interface TavilyResult {
  title?: string
  url?: string
  content?: string
}

export async function tavilySearch(query: string, maxResults = 8): Promise<TavilyResult[]> {
  if (!process.env.TAVILY_API_KEY) return []
  try {
    const res = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: process.env.TAVILY_API_KEY,
        query,
        max_results: maxResults,
        include_answer: false,
      }),
      signal: AbortSignal.timeout(15000),
    })
    if (!res.ok) return []
    const data = (await res.json()) as { results?: TavilyResult[] }
    return data.results ?? []
  } catch {
    return []
  }
}

// ─── Extraction JSON strict via Groq ────────────────────────────────────────
const JSON_SYSTEM_PROMPT = `Tu es un extracteur de POI pour un wizard de road trip van au Pays Basque.
À partir de résultats web, tu identifies des lieux concrets et réels (activités, restaurants, spots de nuit van).
Réponds UNIQUEMENT avec du JSON valide. Aucun texte avant ou après. Aucun backtick markdown.
Format : un objet { "pois": [...] } où chaque POI respecte strictement le schéma demandé.
Si tu ne trouves pas de POI exploitable, retourne { "pois": [] }.`

function extractJson(raw: string): { pois: POIUpsert[] } {
  try {
    return JSON.parse(raw.trim()) as { pois: POIUpsert[] }
  } catch {
    /* fallthrough */
  }
  const stripped = raw
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/, '')
    .trim()
  try {
    return JSON.parse(stripped) as { pois: POIUpsert[] }
  } catch {
    /* fallthrough */
  }
  const match = raw.match(/\{[\s\S]*\}/)
  if (match) {
    try {
      return JSON.parse(match[0]) as { pois: POIUpsert[] }
    } catch {
      /* fallthrough */
    }
  }
  return { pois: [] }
}

// ─── Scraping spots de nuit van ─────────────────────────────────────────────
const OVERNIGHT_QUERIES: Record<OvernightPreference, string[]> = {
  gratuit: [
    'parking gratuit van camping-car Pays Basque nuit autorisée park4night',
    'spot sauvage van nuit Biarritz Bayonne Saint-Jean-de-Luz légal',
  ],
  aires_officielles: [
    'aire camping-car gratuite Pays Basque liste officielle',
    'aire services camping-car Biarritz Hendaye Saint-Jean-de-Luz Anglet',
  ],
  camping: [
    'camping van aménagé Pays Basque pas cher emplacement',
    'camping bord de mer Biarritz Bayonne moins de 25 euros van',
  ],
  mix: [
    'parking van nuit Pays Basque park4night gratuit et aire',
    'camping-car aire gratuite Biarritz Bayonne Hendaye',
  ],
}

export async function scrapeOvernightSpotsViaTavily(
  pref: OvernightPreference
): Promise<POIUpsert[]> {
  const queries = OVERNIGHT_QUERIES[pref]
  const allResults: TavilyResult[] = []
  for (const q of queries) {
    const results = await tavilySearch(q, 6)
    allResults.push(...results)
  }
  if (allResults.length === 0) return []

  const contextBlocks = allResults
    .slice(0, 12)
    .map(
      (r, i) =>
        `[${i + 1}] ${r.title ?? ''}\nURL : ${r.url ?? ''}\n${(r.content ?? '').slice(0, 600)}`
    )
    .join('\n\n')

  const userPrompt = `À partir de ces résultats web, extrais jusqu'à 8 spots de nuit van RÉELS au Pays Basque (France).
Ne garde QUE les lieux concrets et identifiables (nom précis, ville, adresse).
Ignore les articles génériques.

Résultats web :
${contextBlocks}

Retourne ce JSON :
{
  "pois": [
    {
      "name": "Nom exact du spot",
      "category": "spot_nuit",
      "subcategory": "parking_gratuit" | "aire_camping_car" | "camping_van" | "spot_sauvage",
      "budget_level": "gratuit" | "faible" | "moyen" | "eleve" | null,
      "location_city": "ville précise",
      "address": "adresse ou indication géographique ou null",
      "google_maps_url": "https://maps.google.com/?q=... ou null",
      "external_url": "URL source ou null",
      "rating": null,
      "description": "1-2 phrases concrètes sur le spot",
      "tags": ["spot_nuit", "gratuit"|"payant", "bord_de_mer"|"montagne"|"ville", "couple", "solo", "amis"],
      "parking_nearby": false,
      "parking_info": null,
      "overnight_allowed": true,
      "overnight_type": "parking_gratuit" | "aire_camping_car" | "camping_van" | "spot_sauvage",
      "overnight_price_per_night": null ou nombre (en euros),
      "overnight_capacity": "ex: 20 emplacements ou null",
      "overnight_amenities": ["eau potable", "vidange", "electricite", "wifi", "douche"],
      "overnight_restrictions": "ex: 72h max, interdit juillet-août ou null",
      "overnight_coordinates": "lat,lng ou null",
      "source": "tavily"
    }
  ]
}`

  try {
    const { content } = await groqWithFallback({
      messages: [
        { role: 'system', content: JSON_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.3,
      response_format: { type: 'json_object' },
      max_tokens: 3000,
    })
    const parsed = extractJson(content)
    return sanitizePOIs(parsed.pois, 'spot_nuit')
  } catch (err) {
    console.error('[poi-cache] scrapeOvernightSpotsViaTavily failed:', (err as Error).message)
    return []
  }
}

// ─── Scraping POI activités/restos ──────────────────────────────────────────
export async function scrapePOIsViaTavily(
  interests: InterestKey[],
  budgetLevel: BudgetLevel
): Promise<POIUpsert[]> {
  const budgetLabel =
    budgetLevel === 'faible' ? 'pas cher' : budgetLevel === 'eleve' ? 'premium' : 'confort'

  const queries = interests.slice(0, 3).map((i) => {
    const tags = INTEREST_TAG_MAP[i] ?? []
    return `${tags.slice(0, 3).join(' ')} Pays Basque ${budgetLabel} van`
  })

  const allResults: TavilyResult[] = []
  for (const q of queries) {
    const results = await tavilySearch(q, 6)
    allResults.push(...results)
  }
  if (allResults.length === 0) return []

  const contextBlocks = allResults
    .slice(0, 14)
    .map(
      (r, i) =>
        `[${i + 1}] ${r.title ?? ''}\nURL : ${r.url ?? ''}\n${(r.content ?? '').slice(0, 500)}`
    )
    .join('\n\n')

  const interestLabels = interests.join(', ')

  const userPrompt = `À partir de ces résultats web, extrais jusqu'à 15 POI RÉELS au Pays Basque (France).
Intérêts ciblés : ${interestLabels}.
Catégories acceptées : restaurant, activite, culture, nature.
Ne garde QUE les lieux concrets (nom précis, ville identifiable).

Résultats web :
${contextBlocks}

Retourne ce JSON :
{
  "pois": [
    {
      "name": "Nom exact du lieu",
      "category": "restaurant" | "activite" | "culture" | "nature",
      "subcategory": "surf"|"rafting"|"randonnee"|"musee"|"pintxos"|"marche"|... ou null,
      "budget_level": "gratuit"|"faible"|"moyen"|"eleve" ou null,
      "location_city": "ville précise",
      "address": "adresse ou null",
      "google_maps_url": "url ou null",
      "external_url": "URL source ou null",
      "rating": null,
      "description": "2-3 phrases évocatrices",
      "tags": ["tag1", "tag2", ...] (min 3 tags parmi : sport, aventure, surf, rafting, nature, randonnee, gastronomie, restaurant, culture, patrimoine, musee, plage, mer, soiree, bar, famille, couple, solo, amis),
      "parking_nearby": true ou false,
      "parking_info": "ex: parking gratuit à 200m" ou null,
      "overnight_allowed": false,
      "overnight_type": null,
      "overnight_price_per_night": null,
      "overnight_capacity": null,
      "overnight_amenities": [],
      "overnight_restrictions": null,
      "overnight_coordinates": null,
      "source": "tavily"
    }
  ]
}`

  try {
    const { content } = await groqWithFallback({
      messages: [
        { role: 'system', content: JSON_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.3,
      response_format: { type: 'json_object' },
      max_tokens: 4000,
    })
    const parsed = extractJson(content)
    return sanitizePOIs(parsed.pois, 'activite')
  } catch (err) {
    console.error('[poi-cache] scrapePOIsViaTavily failed:', (err as Error).message)
    return []
  }
}

// ─── Sanitation avant upsert Supabase ───────────────────────────────────────
function sanitizePOIs(raw: POIUpsert[], defaultCategory: 'spot_nuit' | 'activite'): POIUpsert[] {
  if (!Array.isArray(raw)) return []
  return raw
    .filter((p) => p && typeof p.name === 'string' && p.name.length > 1)
    .filter((p) => typeof p.location_city === 'string' && p.location_city.length > 0)
    .map((p) => ({
      ...p,
      name: p.name.trim().slice(0, 200),
      category: (p.category ?? defaultCategory) as POIUpsert['category'],
      location_city: (p.location_city ?? 'Pays Basque').trim().slice(0, 100),
      tags: Array.isArray(p.tags) ? p.tags.slice(0, 12) : [],
      overnight_amenities: Array.isArray(p.overnight_amenities)
        ? p.overnight_amenities.slice(0, 10)
        : [],
      parking_nearby: Boolean(p.parking_nearby),
      overnight_allowed: Boolean(p.overnight_allowed ?? (p.category === 'spot_nuit')),
      source: p.source ?? 'tavily',
    }))
}
