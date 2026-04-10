// src/lib/admin/poi-scraper.ts
// Helpers partagés par /api/admin/poi/scrape-url et /scrape-bulk
// - fetchJinaReader : extrait le contenu texte propre d'une URL via Jina r.jina.ai
// - extractOGImage  : parse les meta tags de la page HTML pour récupérer og:image
// - extractPOIFromText : appel Groq → JSON POI structuré
// - sanitizePOI : normalise et défend les valeurs avant upsert Supabase

import { groqWithFallback } from '@/lib/groq-with-fallback'
import type { POICacheRow, POIUpdate } from '@/types/poi'

// ─── Jina reader ────────────────────────────────────────────────────────────
export async function fetchJinaReader(url: string): Promise<string> {
  try {
    const headers: Record<string, string> = {
      Accept: 'text/plain',
      'X-Return-Format': 'text',
    }
    if (process.env.JINA_API_KEY) {
      headers.Authorization = `Bearer ${process.env.JINA_API_KEY}`
    }
    const res = await fetch(`https://r.jina.ai/${url}`, {
      headers,
      signal: AbortSignal.timeout(20000),
    })
    if (!res.ok) return ''
    const text = await res.text()
    return text.slice(0, 12000)
  } catch (err) {
    console.warn('[poi-scraper] jina failed:', (err as Error).message)
    return ''
  }
}

// ─── OG image extraction (fetch HTML + regex meta tags) ────────────────────
export async function extractOGImage(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; VanzonExplorerBot/1.0; +https://vanzonexplorer.com)',
      },
      signal: AbortSignal.timeout(10000),
    })
    if (!res.ok) return null
    const html = (await res.text()).slice(0, 120000)

    // Try og:image, then twitter:image, then link rel="image_src"
    const patterns = [
      /<meta[^>]+property=["']og:image(?::secure_url)?["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image(?::secure_url)?["']/i,
      /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i,
      /<link[^>]+rel=["']image_src["'][^>]+href=["']([^"']+)["']/i,
    ]
    for (const re of patterns) {
      const match = html.match(re)
      if (match?.[1]) {
        const raw = match[1].trim()
        // Resolve relative URLs
        try {
          return new URL(raw, url).toString()
        } catch {
          return raw
        }
      }
    }
    return null
  } catch {
    return null
  }
}

// ─── Groq extraction ────────────────────────────────────────────────────────
const EXTRACTION_SYSTEM_PROMPT = `Tu es un extracteur de POI (Points of Interest) pour le Pays Basque. Tu lis le contenu d'une page web et tu extrais les informations factuelles et structurées sur un lieu concret.
Tu ne réponds QUE pour des lieux réels et identifiables (nom, ville). Si la page ne décrit pas un lieu précis, retourne { "valid": false }.
Réponds UNIQUEMENT avec du JSON valide. Aucun texte avant ou après. Aucun backtick markdown.`

function buildExtractionPrompt(pageContent: string, sourceUrl: string): string {
  return `À partir de cette page web, extrais une fiche POI.
Source URL : ${sourceUrl}

Contenu de la page :
${pageContent.slice(0, 8000)}

Structure JSON attendue :
{
  "valid": true,
  "name": "Nom exact du lieu",
  "category": "restaurant|activite|culture|nature|spot_nuit|parking",
  "subcategory": "surf|rafting|randonnee|musee|pintxos|marche|plage|parking_gratuit|aire_camping_car|camping_van|spot_sauvage|null",
  "budget_level": "gratuit|faible|moyen|eleve|null",
  "location_city": "ville principale",
  "address": "adresse complète si trouvée, sinon null",
  "google_maps_url": "URL Google Maps si mentionnée, sinon null",
  "external_url": "${sourceUrl}",
  "rating": null ou nombre entre 0 et 5,
  "description": "description factuelle en 2-3 phrases",
  "tags": ["tag1", "tag2", "tag3"],
  "parking_nearby": true ou false,
  "parking_info": "info parking ou null",
  "overnight_allowed": true (si category=spot_nuit) ou false,
  "overnight_type": "parking_gratuit|aire_camping_car|camping_van|spot_sauvage|null",
  "overnight_price_per_night": null ou nombre en euros,
  "overnight_capacity": "capacité lisible ou null",
  "overnight_amenities": ["eau potable", "vidange", ...] ou [],
  "overnight_restrictions": "restrictions ou null",
  "overnight_coordinates": "lat,lng ou null",
  "price_indication": "prix lisible ex 12-20€/pers ou null",
  "opening_hours": "horaires lisibles ou null",
  "duration_minutes": null ou nombre estimé pour activité
}

Si la page ne décrit pas un lieu concret, retourne uniquement : { "valid": false }`
}

interface ExtractedPOI {
  valid?: boolean
  name?: string
  category?: string
  subcategory?: string | null
  budget_level?: string | null
  location_city?: string
  address?: string | null
  google_maps_url?: string | null
  external_url?: string | null
  rating?: number | null
  description?: string | null
  tags?: string[]
  parking_nearby?: boolean
  parking_info?: string | null
  overnight_allowed?: boolean
  overnight_type?: string | null
  overnight_price_per_night?: number | null
  overnight_capacity?: string | null
  overnight_amenities?: string[]
  overnight_restrictions?: string | null
  overnight_coordinates?: string | null
  price_indication?: string | null
  opening_hours?: string | null
  duration_minutes?: number | null
}

function parseGroqJson(raw: string): ExtractedPOI | null {
  const tryParse = (s: string): ExtractedPOI | null => {
    try {
      return JSON.parse(s) as ExtractedPOI
    } catch {
      return null
    }
  }
  const direct = tryParse(raw.trim())
  if (direct) return direct
  const stripped = raw
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/, '')
    .trim()
  const cleaned = tryParse(stripped)
  if (cleaned) return cleaned
  const match = raw.match(/\{[\s\S]*\}/)
  if (match) {
    const fromMatch = tryParse(match[0])
    if (fromMatch) return fromMatch
  }
  return null
}

export async function extractPOIFromText(
  pageContent: string,
  sourceUrl: string
): Promise<ExtractedPOI | null> {
  if (!pageContent || pageContent.length < 100) return null
  try {
    const { content } = await groqWithFallback({
      messages: [
        { role: 'system', content: EXTRACTION_SYSTEM_PROMPT },
        { role: 'user', content: buildExtractionPrompt(pageContent, sourceUrl) },
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.1,
      response_format: { type: 'json_object' },
      max_tokens: 2000,
    })
    const parsed = parseGroqJson(content)
    if (!parsed || parsed.valid === false) return null
    return parsed
  } catch (err) {
    console.warn('[poi-scraper] groq extraction failed:', (err as Error).message)
    return null
  }
}

// ─── Sanitize before upsert ─────────────────────────────────────────────────
const VALID_CATEGORIES = [
  'restaurant',
  'activite',
  'culture',
  'nature',
  'spot_nuit',
  'parking',
] as const
const VALID_BUDGET = ['gratuit', 'faible', 'moyen', 'eleve'] as const
const VALID_OVERNIGHT_TYPES = [
  'parking_gratuit',
  'aire_camping_car',
  'camping_van',
  'spot_sauvage',
] as const

export interface POIUpsertPayload extends Omit<POIUpdate, 'id' | 'scraped_at'> {
  name: string
  category: POICacheRow['category']
  location_city: string
}

export function sanitizePOI(
  extracted: ExtractedPOI,
  extras: { image_url?: string | null; source: string; external_url?: string }
): POIUpsertPayload | null {
  if (!extracted.name || typeof extracted.name !== 'string') return null
  if (!extracted.location_city || typeof extracted.location_city !== 'string') return null
  if (!extracted.category || !VALID_CATEGORIES.includes(extracted.category as POICacheRow['category'])) {
    return null
  }

  const category = extracted.category as POICacheRow['category']
  const budget_level =
    extracted.budget_level && VALID_BUDGET.includes(extracted.budget_level as POICacheRow['budget_level'] & string)
      ? (extracted.budget_level as POICacheRow['budget_level'])
      : null

  const overnight_type =
    extracted.overnight_type &&
    VALID_OVERNIGHT_TYPES.includes(extracted.overnight_type as POICacheRow['overnight_type'] & string)
      ? (extracted.overnight_type as POICacheRow['overnight_type'])
      : null

  return {
    name: extracted.name.trim().slice(0, 200),
    category,
    subcategory: extracted.subcategory ?? null,
    budget_level,
    location_city: extracted.location_city.trim().slice(0, 100),
    address: extracted.address ?? null,
    google_maps_url: extracted.google_maps_url ?? null,
    external_url: extras.external_url ?? extracted.external_url ?? null,
    image_url: extras.image_url ?? null,
    rating: typeof extracted.rating === 'number' ? extracted.rating : null,
    description: extracted.description ?? null,
    tags: Array.isArray(extracted.tags) ? extracted.tags.slice(0, 12) : [],
    parking_nearby: Boolean(extracted.parking_nearby),
    parking_info: extracted.parking_info ?? null,
    overnight_allowed: Boolean(extracted.overnight_allowed ?? (category === 'spot_nuit')),
    overnight_type,
    overnight_price_per_night:
      typeof extracted.overnight_price_per_night === 'number'
        ? extracted.overnight_price_per_night
        : null,
    overnight_capacity: extracted.overnight_capacity ?? null,
    overnight_amenities: Array.isArray(extracted.overnight_amenities)
      ? extracted.overnight_amenities.slice(0, 10)
      : [],
    overnight_restrictions: extracted.overnight_restrictions ?? null,
    overnight_coordinates: extracted.overnight_coordinates ?? null,
    price_indication: extracted.price_indication ?? null,
    opening_hours: extracted.opening_hours ?? null,
    duration_minutes:
      typeof extracted.duration_minutes === 'number' ? extracted.duration_minutes : null,
    source: extras.source,
  }
}
