// src/app/api/admin/poi/scrape-bulk/route.ts
// Scraping en masse par catégorie : Tavily → Jina/content → Groq → upsert
// SSE streaming via createSSEResponse (pattern identique à /api/admin/club/prospect/discover)

import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth'
import { createSupabaseAdmin } from '@/lib/supabase/server'
import { createSSEResponse } from '@/lib/sse'
import {
  fetchJinaReader,
  extractOGImage,
  extractPOIFromText,
  sanitizePOI,
} from '@/lib/admin/poi-scraper'
import type { BulkScrapeCategoryKey } from '@/types/poi'

export const maxDuration = 300 // 5 min max pour gros batch

// ─── Query map par catégorie ────────────────────────────────────────────────
const QUERY_MAP: Record<BulkScrapeCategoryKey, string[]> = {
  sport: [
    'école surf Biarritz Anglet avis adresse',
    'rafting Nive Cambo-les-Bains réservation',
    'escalade Pays Basque site officiel',
    'canyoning Pyrénées basques',
    'VTT location Pays Basque activité',
  ],
  nature: [
    'randonnée La Rhune crémaillère parking',
    'forêt Iraty randonnée parking camping-car',
    'gorges Kakuetta visite tarif',
    'GR10 Pays Basque départ parking van',
  ],
  gastronomie_faible: [
    'meilleur bar pintxos Bayonne pas cher adresse',
    'restaurant basque économique Biarritz avis',
    'cidrerie Pays Basque prix abordable',
  ],
  gastronomie_moyen: [
    'restaurant basque authentique Espelette avis',
    'table basque Saint-Jean-Pied-de-Port adresse',
    'restaurant Biarritz Bayonne recommandé',
  ],
  gastronomie_eleve: [
    'restaurant gastronomique Biarritz étoilé',
    'bistronomie haut de gamme Pays Basque',
    'chef basque adresse premium',
  ],
  culture: [
    'musée basque Bayonne horaires tarifs',
    'village Ainhoa visite Pays Basque',
    'Espelette piment coopérative visite',
    'Saint-Jean-Pied-de-Port forteresse citadelle',
  ],
  plages: [
    'grande plage Biarritz parking van camping-car',
    'plage Hendaye aire camping-car',
    'Guéthary plage surf accès parking',
    'plage des Cavaliers Anglet parking',
  ],
  spot_nuit_gratuit: [
    'parking gratuit nuit van Biarritz autorisé',
    'parking camping-car gratuit Bayonne nuit',
    'stationnement nuit van Saint-Jean-de-Luz',
    'parking gratuit camping-car Hendaye',
    'site:park4night.com Pays Basque parking gratuit',
  ],
  spot_nuit_aire: [
    'aire camping-car officielle Biarritz gratuite',
    'aire services camping-car Pays Basque',
    'campingcar-infos aire Bayonne Anglet',
  ],
  spot_nuit_camping: [
    'camping van aménagé Pays Basque pas cher',
    'camping bord mer Biarritz van emplacement',
    'camping nature Pyrénées basques van',
  ],
}

const CATEGORY_LABELS: Record<BulkScrapeCategoryKey, string> = {
  sport: 'Sport & Aventure',
  nature: 'Nature & Randonnée',
  gastronomie_faible: 'Gastronomie (faible)',
  gastronomie_moyen: 'Gastronomie (moyen)',
  gastronomie_eleve: 'Gastronomie (élevé)',
  culture: 'Culture & Patrimoine',
  plages: 'Plages',
  spot_nuit_gratuit: 'Spots de nuit — Parking gratuit',
  spot_nuit_aire: 'Spots de nuit — Aires officielles',
  spot_nuit_camping: 'Spots de nuit — Campings van',
}

interface TavilyResult {
  url?: string
  title?: string
  content?: string
}

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
  } catch {
    return []
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin()
  if (auth instanceof NextResponse) return auth

  let body: { categories?: BulkScrapeCategoryKey[] }
  try {
    body = (await req.json()) as { categories?: BulkScrapeCategoryKey[] }
  } catch {
    return NextResponse.json({ error: 'JSON invalide' }, { status: 400 })
  }

  const categories = (body.categories ?? []).filter((c) => c in QUERY_MAP)
  if (categories.length === 0) {
    return NextResponse.json(
      { error: 'Sélectionnez au moins une catégorie valide' },
      { status: 400 }
    )
  }

  return createSSEResponse(async (send) => {
    const stats = { added: 0, duplicates: 0, errors: 0 }
    const supabase = createSupabaseAdmin()

    send({
      type: 'progress',
      message: `🚀 Lancement du scraping pour ${categories.length} catégorie(s)...`,
    })

    for (const category of categories) {
      const label = CATEGORY_LABELS[category]
      const queries = QUERY_MAP[category]

      send({
        type: 'progress',
        message: `\n📂 ${label} — ${queries.length} requêtes Tavily`,
      })

      // 1. Collecter tous les résultats Tavily pour cette catégorie
      const allResults: TavilyResult[] = []
      for (const query of queries) {
        send({ type: 'progress', message: `   🔎 ${query}` })
        const results = await tavilySearch(query)
        allResults.push(...results)
      }

      // Dédup par URL dans le batch courant
      const seenUrls = new Set<string>()
      const uniqueResults = allResults.filter((r) => {
        if (!r.url) return false
        if (seenUrls.has(r.url)) return false
        seenUrls.add(r.url)
        return true
      })

      send({
        type: 'progress',
        message: `   → ${uniqueResults.length} URLs uniques à analyser`,
      })

      // 2. Pour chaque URL : Jina + Groq extraction + upsert
      // Limiter à ~8 URLs par catégorie pour rester sous le maxDuration
      const urlsToProcess = uniqueResults.slice(0, 8)

      for (const result of urlsToProcess) {
        if (!result.url) continue

        // Skip domains qui bloquent le scraping
        if (/facebook\.com|instagram\.com|tiktok\.com/i.test(result.url)) {
          continue
        }

        try {
          const [pageContent, imageUrl] = await Promise.all([
            fetchJinaReader(result.url),
            extractOGImage(result.url),
          ])

          if (!pageContent || pageContent.length < 200) {
            continue // Ignore silencieusement les pages vides
          }

          const extracted = await extractPOIFromText(pageContent, result.url)
          if (!extracted) continue

          const payload = sanitizePOI(extracted, {
            image_url: imageUrl,
            source: 'tavily',
            external_url: result.url,
          })
          if (!payload) continue

          // Check doublon
          const { data: existing } = await supabase
            .from('poi_cache')
            .select('id')
            .eq('name', payload.name)
            .eq('location_city', payload.location_city)
            .maybeSingle()

          if (existing) {
            stats.duplicates++
            send({ type: 'duplicate', name: payload.name })
            continue
          }

          const { data, error } = await supabase
            .from('poi_cache')
            .upsert(payload, { onConflict: 'name,location_city' })
            .select('name, category, location_city')
            .single()

          if (error) {
            stats.errors++
            send({
              type: 'error',
              message: `DB: ${payload.name} — ${error.message.slice(0, 80)}`,
            })
            continue
          }

          stats.added++
          send({
            type: 'poi_added',
            poi: {
              name: data.name,
              category: data.category,
              location_city: data.location_city,
            },
          })
        } catch (err) {
          stats.errors++
          send({
            type: 'error',
            message: `${result.url?.slice(0, 60)} — ${(err as Error).message.slice(0, 60)}`,
          })
        }
      }
    }

    send({ type: 'complete', stats })
  })
}
