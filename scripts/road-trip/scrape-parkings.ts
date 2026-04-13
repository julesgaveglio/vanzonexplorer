#!/usr/bin/env tsx
// scripts/road-trip/scrape-parkings.ts
// Scrape des parkings van/camping-car stratégiques au Pays Basque.
// Pipeline : Tavily search → Jina content → Groq extraction → Nominatim geocode → SerpAPI image → poi_cache upsert
//
// Usage:
//   npx tsx --env-file=.env.local scripts/road-trip/scrape-parkings.ts
//   npx tsx --env-file=.env.local scripts/road-trip/scrape-parkings.ts --dry-run

import { createClient } from '@supabase/supabase-js'
import sharp from 'sharp'
import { groqWithFallback } from '../../src/lib/groq-with-fallback'
import { serpApiImageSearch } from '../../src/lib/serpapi-with-fallback'
import {
  geocode,
  formatCoordinates,
  getCityFallback,
  sleep,
} from '../../src/lib/road-trip-pb/geocoding'

const isDryRun = process.argv.includes('--dry-run')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const BUCKET = 'road-trip-images'

// ─── Recherches ciblées par zone stratégique ─────────────────────────────────

const PARKING_SEARCHES = [
  // Plages & côte
  { query: 'parking van camping-car Grande Plage Biarritz stationnement autorisé', city: 'Biarritz', context: 'plage' },
  { query: 'parking van Côte des Basques Biarritz nuit autorisée', city: 'Biarritz', context: 'plage' },
  { query: 'parking camping-car Anglet plage Cavaliers Marinella', city: 'Anglet', context: 'plage' },
  { query: 'parking van Saint-Jean-de-Luz port centre plage', city: 'Saint-Jean-de-Luz', context: 'plage' },
  { query: 'parking camping-car Hendaye plage Sokoburu stationnement', city: 'Hendaye', context: 'plage' },
  { query: 'parking van Guéthary Cenitz plage stationnement', city: 'Guéthary', context: 'plage' },
  { query: 'parking van Bidart plage Erretegia Parlementia', city: 'Bidart', context: 'plage' },
  // Randonnées & montagne
  { query: 'parking départ randonnée La Rhune Col de Saint-Ignace Sare van', city: 'Sare', context: 'randonnée' },
  { query: 'parking randonnée Mondarrain Itxassou départ sentier van', city: 'Itxassou', context: 'randonnée' },
  { query: 'parking Gorges de Kakuetta Sainte-Engrace stationnement', city: 'Sainte-Engrace', context: 'randonnée' },
  { query: 'parking forêt Iraty Chalets plateau camping-car van', city: 'Larrau', context: 'randonnée' },
  { query: 'parking randonnée Artzamendi Baigura Pays Basque van', city: 'Bidarray', context: 'randonnée' },
  // Villages & culture
  { query: 'parking camping-car Espelette village piment stationnement', city: 'Espelette', context: 'village' },
  { query: 'parking camping-car Ainhoa village basque stationnement', city: 'Ainhoa', context: 'village' },
  { query: 'parking van Saint-Jean-Pied-de-Port citadelle stationnement', city: 'Saint-Jean-Pied-de-Port', context: 'village' },
  { query: 'parking camping-car Bayonne centre ville Grand Bayonne', city: 'Bayonne', context: 'ville' },
  { query: 'parking van Sare village centre parking gratuit', city: 'Sare', context: 'village' },
  // Sport & activités
  { query: 'parking van spot surf Lafitenia Erromardie Saint-Jean-de-Luz', city: 'Saint-Jean-de-Luz', context: 'surf' },
  { query: 'parking rafting Nive Bidarray Ossès point de départ van', city: 'Bidarray', context: 'sport' },
  { query: 'parking camping-car Cambo-les-Bains thermes centre', city: 'Cambo-les-Bains', context: 'ville' },
]

// ─── Tavily search ──────────────────────────────────────────────────────────

interface TavilyResult { url?: string; title?: string; content?: string }

async function tavilySearch(query: string): Promise<TavilyResult[]> {
  if (!process.env.TAVILY_API_KEY) return []
  try {
    const res = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: process.env.TAVILY_API_KEY,
        query,
        max_results: 5,
        include_answer: false,
      }),
      signal: AbortSignal.timeout(15000),
    })
    if (!res.ok) return []
    const data = (await res.json()) as { results?: TavilyResult[] }
    return data.results ?? []
  } catch { return [] }
}

// ─── Jina reader ────────────────────────────────────────────────────────────

async function jinaRead(url: string): Promise<string> {
  try {
    const headers: Record<string, string> = { Accept: 'text/plain', 'X-Return-Format': 'text' }
    if (process.env.JINA_API_KEY) headers.Authorization = `Bearer ${process.env.JINA_API_KEY}`
    const res = await fetch(`https://r.jina.ai/${url}`, {
      headers,
      signal: AbortSignal.timeout(20000),
    })
    if (!res.ok) return ''
    return (await res.text()).slice(0, 10000)
  } catch { return '' }
}

// ─── Groq parking extraction ────────────────────────────────────────────────

interface ExtractedParking {
  name: string
  address: string | null
  city: string
  description: string
  is_free: boolean
  price_per_night: number | null
  height_limit: string | null
  capacity: string | null
  amenities: string[]
  restrictions: string | null
  overnight_allowed: boolean
  overnight_type: 'parking_gratuit' | 'aire_camping_car' | 'camping_van' | 'spot_sauvage'
}

async function extractParkings(
  searchResults: TavilyResult[],
  pageContent: string,
  targetCity: string,
  context: string
): Promise<ExtractedParking[]> {
  const snippets = searchResults
    .slice(0, 4)
    .map((r, i) => `[${i + 1}] ${r.title ?? ''}\n${(r.content ?? '').slice(0, 400)}`)
    .join('\n\n')

  const fullContext = pageContent
    ? `Page web détaillée :\n${pageContent.slice(0, 5000)}\n\nAutres résultats :\n${snippets}`
    : `Résultats web :\n${snippets}`

  const { content } = await groqWithFallback({
    messages: [
      {
        role: 'system',
        content: `Tu es un expert vanlife Pays Basque. Extrais des parkings RÉELS et CONCRETS pour vans/camping-cars. Retourne UNIQUEMENT du JSON valide.`,
      },
      {
        role: 'user',
        content: `Extrais les parkings van/camping-car RÉELS près de ${targetCity} (contexte : ${context}) depuis ces informations.

${fullContext}

Retourne ce JSON STRICTEMENT :
{
  "parkings": [
    {
      "name": "Nom exact du parking",
      "address": "adresse ou indication GPS",
      "city": "${targetCity}",
      "description": "2-3 phrases utiles pour un vanlifer (accès, surface, environnement)",
      "is_free": true ou false,
      "price_per_night": null ou nombre en euros,
      "height_limit": "ex: 2m10" ou null,
      "capacity": "ex: 20 places" ou null,
      "amenities": ["eau potable", "vidange", "electricite", ...] ou [],
      "restrictions": "ex: interdit juillet-août, 48h max" ou null,
      "overnight_allowed": true ou false,
      "overnight_type": "parking_gratuit" | "aire_camping_car" | "camping_van" | "spot_sauvage"
    }
  ]
}

RÈGLES :
- Uniquement des parkings RÉELS avec un nom identifiable
- Pas de parkings inventés
- Si aucun parking identifiable, retourne { "parkings": [] }
- Maximum 3 parkings par recherche`,
      },
    ],
    model: 'llama-3.3-70b-versatile',
    temperature: 0.2,
    response_format: { type: 'json_object' },
    max_tokens: 2000,
  })

  try {
    const parsed = JSON.parse(content.trim()) as { parkings: ExtractedParking[] }
    return (parsed.parkings ?? []).filter(
      (p) => p.name && p.name.length > 3 && p.city
    )
  } catch {
    return []
  }
}

// ─── Image via SerpAPI ──────────────────────────────────────────────────────

async function getImage(name: string, city: string): Promise<string | null> {
  try {
    const r = await serpApiImageSearch(`parking van ${name} ${city} Pays Basque`, { num: 3 })
    for (const img of r.images.slice(0, 2)) {
      const res = await fetch(img.original, {
        headers: { 'User-Agent': 'VanzonExplorer/1.0' },
        signal: AbortSignal.timeout(12000),
      })
      if (!res.ok) continue
      const ct = res.headers.get('content-type') ?? ''
      if (!ct.includes('image')) continue
      const buf = Buffer.from(await res.arrayBuffer())
      if (buf.length < 5000) continue
      const webp = await sharp(buf)
        .resize(800, 600, { fit: 'cover', withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer()
      const slug = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').slice(0, 50)
      const path = `poi/parking-${slug}-${Date.now().toString(36)}.webp`
      const { error } = await supabase.storage.from(BUCKET).upload(path, webp, { contentType: 'image/webp', upsert: true })
      if (error) continue
      const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
      return data.publicUrl
    }
  } catch { /* non-fatal */ }
  return null
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function main() {
  console.log(`🅿️  scrape-parkings — ${isDryRun ? 'DRY RUN' : 'LIVE'}`)
  console.log(`📋 ${PARKING_SEARCHES.length} recherches ciblées\n`)

  let added = 0
  let skipped = 0
  let errors = 0

  for (const search of PARKING_SEARCHES) {
    console.log(`\n🔎 ${search.city} (${search.context})`)
    console.log(`   → ${search.query}`)

    // 1. Tavily search
    const results = await tavilySearch(search.query)
    if (results.length === 0) {
      console.log('   ✗ Aucun résultat Tavily')
      errors++
      continue
    }

    // 2. Jina read sur le premier résultat pertinent
    let pageContent = ''
    const bestUrl = results[0]?.url
    if (bestUrl && !/facebook|instagram|tiktok/i.test(bestUrl)) {
      pageContent = await jinaRead(bestUrl)
    }

    // 3. Groq extraction
    const parkings = await extractParkings(results, pageContent, search.city, search.context)
    if (parkings.length === 0) {
      console.log('   ✗ Aucun parking extrait')
      skipped++
      continue
    }

    for (const p of parkings) {
      // Check doublon
      const { data: existing } = await supabase
        .from('poi_cache')
        .select('id')
        .eq('name', p.name)
        .eq('location_city', p.city)
        .maybeSingle()
      if (existing) {
        console.log(`   ~ ${p.name} (doublon)`)
        skipped++
        continue
      }

      // 4. Geocode
      let coords: string | null = null
      const geo = await geocode(`${p.name}, ${p.address ?? ''}, ${p.city}, France`)
      await sleep(1100)
      if (geo) {
        coords = formatCoordinates(geo)
      } else {
        const fb = getCityFallback(p.city)
        if (fb) coords = `${fb[0].toFixed(6)},${fb[1].toFixed(6)}`
      }

      // 5. Image SerpAPI
      let imageUrl: string | null = null
      if (!isDryRun) {
        imageUrl = await getImage(p.name, p.city)
        await sleep(500)
      }

      console.log(`   ✓ ${p.name} — ${p.city} ${p.is_free ? '(gratuit)' : `(${p.price_per_night}€/nuit)`} ${coords ? '📍' : '⚠️'} ${imageUrl ? '🖼️' : ''}`)

      if (!isDryRun) {
        const tags = [
          'parking', 'van', 'stationnement',
          p.overnight_allowed ? 'nuit_autorisee' : 'jour_seulement',
          p.is_free ? 'gratuit' : 'payant',
          search.context,
        ]

        const { error: insertErr } = await supabase.from('poi_cache').upsert({
          name: p.name.trim().slice(0, 200),
          category: p.overnight_allowed ? 'spot_nuit' : 'parking',
          subcategory: p.overnight_type,
          budget_level: p.is_free ? 'gratuit' : 'faible',
          location_city: p.city,
          address: p.address,
          google_maps_url: `https://maps.google.com/?q=${encodeURIComponent(p.name + ' ' + p.city + ' France')}`,
          description: p.description,
          tags,
          parking_nearby: true,
          parking_info: [
            p.capacity,
            p.height_limit ? `Hauteur max: ${p.height_limit}` : null,
          ].filter(Boolean).join(' · ') || null,
          overnight_allowed: p.overnight_allowed,
          overnight_type: p.overnight_type,
          overnight_price_per_night: p.price_per_night,
          overnight_capacity: p.capacity,
          overnight_amenities: p.amenities,
          overnight_restrictions: p.restrictions,
          coordinates: coords,
          image_url: imageUrl,
          source: 'tavily+groq',
        }, { onConflict: 'name,location_city' })

        if (insertErr) {
          console.log(`   ! DB error: ${insertErr.message.slice(0, 80)}`)
          errors++
        } else {
          added++
        }
      } else {
        added++
      }
    }

    // Courtesy pause entre les recherches
    await sleep(800)
  }

  console.log(`\n🎉 Done. added=${added} skipped=${skipped} errors=${errors}`)
}

main().catch((e) => {
  console.error('❌', e.message)
  process.exit(1)
})
