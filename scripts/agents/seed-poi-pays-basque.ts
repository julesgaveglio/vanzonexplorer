#!/usr/bin/env tsx
/**
 * seed-poi-pays-basque.ts
 *
 * Premier scraping structuré pour pré-remplir la table `poi_cache` côté Pays Basque.
 * Phase 1 (obligatoire) : spots de nuit van (priorité absolue).
 * Phase 2 : activités sport / nature / gastronomie / culture / plages.
 *
 * À lancer une seule fois : npx tsx scripts/agents/seed-poi-pays-basque.ts
 *
 * Required env vars:
 *   SUPABASE_SERVICE_ROLE_KEY
 *   NEXT_PUBLIC_SUPABASE_URL
 *   TAVILY_API_KEY
 *   GROQ_API_KEY (+ GROQ_API_KEY_2 / KEY_3 en fallback)
 *   GEMINI_API_KEY (dernier recours)
 */

import { createClient } from '@supabase/supabase-js'
import Groq from 'groq-sdk'
import * as dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

// ─── Clients ─────────────────────────────────────────────────────────────────
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

// ─── Types locaux (évite de dépendre de @/types qui dépend du bundler Next) ─
type POICategory = 'restaurant' | 'activite' | 'culture' | 'nature' | 'spot_nuit'
type OvernightType = 'parking_gratuit' | 'aire_camping_car' | 'camping_van' | 'spot_sauvage'

interface POIUpsert {
  name: string
  category: POICategory
  subcategory: string | null
  budget_level: string | null
  location_city: string
  address: string | null
  google_maps_url: string | null
  external_url: string | null
  rating: number | null
  description: string | null
  tags: string[]
  parking_nearby: boolean
  parking_info: string | null
  overnight_allowed: boolean
  overnight_type: OvernightType | null
  overnight_price_per_night: number | null
  overnight_capacity: string | null
  overnight_amenities: string[]
  overnight_restrictions: string | null
  overnight_coordinates: string | null
  source: string
}

// ─── Tavily helper ───────────────────────────────────────────────────────────
interface TavilyResult {
  title?: string
  url?: string
  content?: string
}

async function tavilySearch(query: string, maxResults = 8): Promise<TavilyResult[]> {
  if (!process.env.TAVILY_API_KEY) {
    console.error('❌ TAVILY_API_KEY manquante')
    return []
  }
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
  } catch (err) {
    console.warn(`⚠️  Tavily failed: ${(err as Error).message}`)
    return []
  }
}

// ─── Groq extraction ─────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `Tu es un extracteur de POI précis pour un wizard road trip van Pays Basque.
Tu lis des résultats web et tu identifies des lieux RÉELS et CONCRETS.
Ignore tout contenu générique, publicitaire ou de référencement flou.
Réponds UNIQUEMENT avec du JSON valide. Aucun texte avant ou après. Aucun backtick markdown.`

async function callGroq(userPrompt: string): Promise<string> {
  const keys = [
    process.env.GROQ_API_KEY,
    process.env.GROQ_API_KEY_2,
    process.env.GROQ_API_KEY_3,
  ].filter(Boolean) as string[]

  const models = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'gemma2-9b-it']

  for (const model of models) {
    for (const apiKey of keys) {
      try {
        const groq = new Groq({ apiKey })
        const completion = await groq.chat.completions.create({
          model,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.3,
          max_tokens: 4000,
          response_format: { type: 'json_object' },
        })
        return completion.choices[0]?.message?.content ?? ''
      } catch (err) {
        console.warn(`   ↪ ${model} failed: ${(err as Error).message.slice(0, 80)}`)
      }
    }
  }

  // Dernier recours Gemini 2.5 Flash
  if (process.env.GEMINI_API_KEY) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
            contents: [{ parts: [{ text: userPrompt }] }],
            generationConfig: {
              temperature: 0.3,
              maxOutputTokens: 4000,
              responseMimeType: 'application/json',
            },
          }),
        }
      )
      if (!res.ok) throw new Error(`Gemini HTTP ${res.status}`)
      const json = (await res.json()) as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
      }
      return json.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
    } catch (err) {
      console.warn(`   ↪ Gemini failed: ${(err as Error).message}`)
    }
  }

  return ''
}

function extractJson(raw: string): { pois: POIUpsert[] } {
  if (!raw) return { pois: [] }
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

function sanitize(pois: POIUpsert[]): POIUpsert[] {
  if (!Array.isArray(pois)) return []
  return pois
    .filter((p) => p && typeof p.name === 'string' && p.name.length > 1)
    .filter((p) => typeof p.location_city === 'string' && p.location_city.length > 0)
    .map((p) => ({
      name: p.name.trim().slice(0, 200),
      category: p.category,
      subcategory: p.subcategory ?? null,
      budget_level: p.budget_level ?? null,
      location_city: (p.location_city ?? 'Pays Basque').trim().slice(0, 100),
      address: p.address ?? null,
      google_maps_url: p.google_maps_url ?? null,
      external_url: p.external_url ?? null,
      rating: p.rating ?? null,
      description: p.description ?? null,
      tags: Array.isArray(p.tags) ? p.tags.slice(0, 12) : [],
      parking_nearby: Boolean(p.parking_nearby),
      parking_info: p.parking_info ?? null,
      overnight_allowed: Boolean(p.overnight_allowed),
      overnight_type: p.overnight_type ?? null,
      overnight_price_per_night:
        typeof p.overnight_price_per_night === 'number' ? p.overnight_price_per_night : null,
      overnight_capacity: p.overnight_capacity ?? null,
      overnight_amenities: Array.isArray(p.overnight_amenities)
        ? p.overnight_amenities.slice(0, 10)
        : [],
      overnight_restrictions: p.overnight_restrictions ?? null,
      overnight_coordinates: p.overnight_coordinates ?? null,
      source: p.source ?? 'tavily',
    }))
}

// ─── Upsert ──────────────────────────────────────────────────────────────────
async function upsertPOIs(pois: POIUpsert[]): Promise<number> {
  if (pois.length === 0) return 0
  const { error, data } = await supabase
    .from('poi_cache')
    .upsert(pois, { onConflict: 'name,location_city' })
    .select('id')
  if (error) {
    console.error(`❌ upsert error: ${error.message}`)
    return 0
  }
  return data?.length ?? pois.length
}

// ─── Requêtes de scraping groupées ───────────────────────────────────────────
interface QueryBatch {
  label: string
  queries: string[]
  prompt: (context: string) => string
}

const OVERNIGHT_BATCHES: QueryBatch[] = [
  {
    label: 'parking_gratuit',
    queries: [
      'parking nuit van gratuit Biarritz autorisé park4night',
      'parking camping-car gratuit Bayonne nuit park4night',
      'parking gratuit van Saint-Jean-de-Luz nuit',
      'stationnement nuit camping-car Hendaye gratuit',
    ],
    prompt: (ctx) => buildOvernightPrompt(ctx, 'parking_gratuit'),
  },
  {
    label: 'aire_camping_car',
    queries: [
      'aire camping-car gratuite Biarritz officielle',
      'aire services camping-car Pays Basque liste complète',
      'aire camping-car Bayonne Anglet Hendaye',
      'aire camping-car Saint-Jean-Pied-de-Port Espelette',
    ],
    prompt: (ctx) => buildOvernightPrompt(ctx, 'aire_camping_car'),
  },
  {
    label: 'camping_van',
    queries: [
      'camping van aménagé Pays Basque pas cher emplacements',
      'camping bord de mer Biarritz van moins de 25 euros',
      'camping rustique Pyrénées basques van nature',
    ],
    prompt: (ctx) => buildOvernightPrompt(ctx, 'camping_van'),
  },
  {
    label: 'spot_sauvage',
    queries: [
      'bivouac van pays basque légal toléré',
      'spot nuit van discret bord de mer pays basque',
    ],
    prompt: (ctx) => buildOvernightPrompt(ctx, 'spot_sauvage'),
  },
]

const ACTIVITY_BATCHES: QueryBatch[] = [
  {
    label: 'sport',
    queries: [
      'école surf Biarritz Anglet débutant tarif',
      'rafting Nive Cambo-les-Bains prestataire',
      'escalade Pays Basque Itxassou Bidarray',
      'canyoning Pyrénées basques Sainte-Engrâce Kakuetta',
    ],
    prompt: (ctx) => buildActivityPrompt(ctx, 'activite', 'sport'),
  },
  {
    label: 'nature',
    queries: [
      'La Rhune crémaillère sentier randonnée parking',
      'forêt Iraty randonnée parking camping-car',
      'Gorges de Kakuetta parking entrée tarif',
      'GR10 Pays Basque points départ parking van',
    ],
    prompt: (ctx) => buildActivityPrompt(ctx, 'nature', 'nature'),
  },
  {
    label: 'gastronomie',
    queries: [
      'bars à pintxos Bayonne meilleurs petit budget',
      'restaurant typique basque Espelette Saint-Jean-Pied-de-Port',
      'gastronomie étoilée Biarritz table reconnue',
      'fromagerie Ossau-Iraty Pays Basque visite',
    ],
    prompt: (ctx) => buildActivityPrompt(ctx, 'restaurant', 'gastronomie'),
  },
  {
    label: 'culture',
    queries: [
      'Musée Basque Bayonne horaires tarif parking',
      "village d'Ainhoa plus beau village visite",
      'Espelette coopérative piment visite marché',
      'Saint-Jean-Pied-de-Port forteresse Chemin Saint-Jacques',
    ],
    prompt: (ctx) => buildActivityPrompt(ctx, 'culture', 'culture'),
  },
  {
    label: 'plages',
    queries: [
      'Grande Plage Biarritz parking van réglementation',
      "plage Hendaye aire camping-car proximité",
      'plage Guéthary surf parking',
      'plage des Cavaliers Anglet parking van',
    ],
    prompt: (ctx) => buildActivityPrompt(ctx, 'nature', 'plages'),
  },
]

// ─── Prompt builders ─────────────────────────────────────────────────────────
function buildOvernightPrompt(context: string, overnightType: OvernightType): string {
  return `À partir de ces résultats web, extrais jusqu'à 10 spots de nuit van RÉELS au Pays Basque (France).
Type ciblé : ${overnightType}.
Ne garde que les spots concrets (nom précis + ville). Ignore les articles génériques.

Résultats web :
${context}

Retourne STRICTEMENT ce JSON (aucun texte avant/après) :
{
  "pois": [
    {
      "name": "Nom exact du spot",
      "category": "spot_nuit",
      "subcategory": "${overnightType}",
      "budget_level": "gratuit"|"faible"|"moyen"|null,
      "location_city": "ville",
      "address": "adresse ou null",
      "google_maps_url": "url ou null",
      "external_url": "URL source ou null",
      "rating": null,
      "description": "1-2 phrases concrètes",
      "tags": ["spot_nuit", "gratuit"|"payant", "bord_de_mer"|"montagne"|"ville", "couple", "solo", "amis"],
      "parking_nearby": false,
      "parking_info": null,
      "overnight_allowed": true,
      "overnight_type": "${overnightType}",
      "overnight_price_per_night": null ou nombre en euros,
      "overnight_capacity": "ex: 20 emplacements ou null",
      "overnight_amenities": ["eau potable", "vidange", "electricite", "douche", "wifi"],
      "overnight_restrictions": "ex: 72h max ou null",
      "overnight_coordinates": "lat,lng ou null",
      "source": "tavily"
    }
  ]
}`
}

function buildActivityPrompt(context: string, category: POICategory, theme: string): string {
  return `À partir de ces résultats web, extrais jusqu'à 10 POI RÉELS au Pays Basque (France).
Thème : ${theme}. Catégorie cible : ${category}.
Ne garde que les lieux concrets (nom précis + ville). Ignore les articles génériques.

Résultats web :
${context}

Retourne STRICTEMENT ce JSON (aucun texte avant/après) :
{
  "pois": [
    {
      "name": "Nom exact du lieu",
      "category": "${category}",
      "subcategory": "surf"|"rafting"|"randonnee"|"musee"|"pintxos"|"marche"|null,
      "budget_level": "gratuit"|"faible"|"moyen"|"eleve"|null,
      "location_city": "ville",
      "address": "adresse ou null",
      "google_maps_url": "url ou null",
      "external_url": "URL source ou null",
      "rating": null,
      "description": "2-3 phrases évocatrices",
      "tags": ["tag1", "tag2", ...] (min 3 tags parmi : sport, aventure, surf, rafting, nature, randonnee, gastronomie, restaurant, culture, patrimoine, musee, plage, mer, famille, couple, solo, amis),
      "parking_nearby": true|false,
      "parking_info": "ex: parking gratuit à 200m ou null",
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
}

// ─── Pipeline batch ──────────────────────────────────────────────────────────
async function runBatch(batch: QueryBatch): Promise<POIUpsert[]> {
  console.log(`\n🔎 Batch : ${batch.label}`)
  const allResults: TavilyResult[] = []

  for (const q of batch.queries) {
    console.log(`   → Tavily : ${q}`)
    const results = await tavilySearch(q, 5)
    allResults.push(...results)
  }

  if (allResults.length === 0) {
    console.warn(`   ⚠️  Aucun résultat Tavily pour ${batch.label}`)
    return []
  }

  const context = allResults
    .slice(0, 15)
    .map(
      (r, i) =>
        `[${i + 1}] ${r.title ?? ''}\nURL : ${r.url ?? ''}\n${(r.content ?? '').slice(0, 500)}`
    )
    .join('\n\n')

  console.log(`   → Groq extraction (${allResults.length} résultats)...`)
  const raw = await callGroq(batch.prompt(context))
  const { pois } = extractJson(raw)
  const clean = sanitize(pois)

  console.log(`   → ${clean.length} POI extraits pour ${batch.label}`)
  return clean
}

// ─── Main ────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🌱 Seed POI Pays Basque — démarrage')
  console.log('─────────────────────────────────────')

  const counts: Record<string, number> = {
    spot_nuit: 0,
    activite: 0,
    restaurant: 0,
    culture: 0,
    nature: 0,
  }

  // ── Phase 1 : Spots de nuit van (priorité) ────────────────────────────────
  console.log('\n📍 PHASE 1 — Spots de nuit van (priorité absolue)\n')
  for (const batch of OVERNIGHT_BATCHES) {
    const pois = await runBatch(batch)
    const inserted = await upsertPOIs(pois)
    counts.spot_nuit += inserted
    for (const p of pois) {
      console.log(`   ✅ ${p.name} (${p.subcategory}) — ${p.location_city}`)
    }
  }

  // ── Phase 2 : Activités ────────────────────────────────────────────────────
  console.log('\n🎯 PHASE 2 — Activités & POI\n')
  for (const batch of ACTIVITY_BATCHES) {
    const pois = await runBatch(batch)
    const inserted = await upsertPOIs(pois)
    for (const p of pois) {
      counts[p.category] = (counts[p.category] ?? 0) + 1
      console.log(`   ✅ ${p.name} (${p.category}) — ${p.location_city}`)
    }
    if (inserted > 0) {
      // counts already incremented above
    }
  }

  console.log('\n─────────────────────────────────────')
  console.log('📊 Seed terminé :')
  console.log(
    `   ${counts.activite} activités | ${counts.restaurant} restaurants | ${counts.spot_nuit} spots_nuit | ${counts.culture} culture | ${counts.nature} nature`
  )
}

main().catch((err) => {
  console.error('❌ Erreur seed:', err)
  process.exit(1)
})
