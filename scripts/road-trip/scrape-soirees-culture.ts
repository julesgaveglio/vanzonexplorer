#!/usr/bin/env tsx
// scripts/road-trip/scrape-soirees-culture.ts
// Scrape POIs "soirées" (bars, fêtes basques) + "culture" supplémentaires.
// Pipeline : Tavily → Jina → Groq → Nominatim → SerpAPI → poi_cache

import { createClient } from '@supabase/supabase-js'
import sharp from 'sharp'
import { groqWithFallback } from '../../src/lib/groq-with-fallback'
import { serpApiImageSearch } from '../../src/lib/serpapi-with-fallback'
import { geocode, formatCoordinates, getCityFallback, sleep } from '../../src/lib/road-trip-pb/geocoding'

const isDryRun = process.argv.includes('--dry-run')
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
const BUCKET = 'road-trip-images'

const SEARCHES = [
  // ── Soirées & bars ──
  { query: 'meilleur bar soirée Biarritz ambiance terrasse', city: 'Biarritz', cat: 'soiree' },
  { query: 'bar pintxos soirée Bayonne Petit Bayonne ambiance', city: 'Bayonne', cat: 'soiree' },
  { query: 'bar soirée Saint-Jean-de-Luz port terrasse', city: 'Saint-Jean-de-Luz', cat: 'soiree' },
  { query: 'fêtes de Bayonne fêtes basques force basque', city: 'Bayonne', cat: 'soiree' },
  { query: 'bar surf Anglet Biarritz soirée vue océan', city: 'Anglet', cat: 'soiree' },
  { query: 'cidrerie basque sagardotegi Pays Basque soirée', city: 'Espelette', cat: 'soiree' },
  { query: 'marché nocturne Pays Basque été Saint-Jean-de-Luz', city: 'Saint-Jean-de-Luz', cat: 'soiree' },
  // ── Culture supplémentaire ──
  { query: 'Villa Arnaga Cambo-les-Bains Edmond Rostand visite', city: 'Cambo-les-Bains', cat: 'culture' },
  { query: 'Citadelle Vauban Saint-Jean-Pied-de-Port visite patrimoine', city: 'Saint-Jean-Pied-de-Port', cat: 'culture' },
  { query: 'église Saint-Jean-Baptiste Saint-Jean-de-Luz visite', city: 'Saint-Jean-de-Luz', cat: 'culture' },
  { query: 'port de pêche Saint-Jean-de-Luz maison Infante', city: 'Saint-Jean-de-Luz', cat: 'culture' },
  { query: 'train de la Rhune crémaillère Sare Ascain patrimoine', city: 'Sare', cat: 'culture' },
  { query: 'pelote basque fronton trinquet Pays Basque match', city: 'Bayonne', cat: 'culture' },
  { query: 'grottes Sare Lezea visite préhistoire', city: 'Sare', cat: 'culture' },
  { query: 'cathédrale Sainte-Marie Bayonne visite patrimoine', city: 'Bayonne', cat: 'culture' },
  { query: 'chocolaterie Bayonne visite atelier Cazenave', city: 'Bayonne', cat: 'culture' },
]

interface TavilyResult { url?: string; title?: string; content?: string }

async function tavilySearch(query: string): Promise<TavilyResult[]> {
  if (!process.env.TAVILY_API_KEY) return []
  try {
    const res = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: process.env.TAVILY_API_KEY, query, max_results: 4, include_answer: false }),
      signal: AbortSignal.timeout(15000),
    })
    if (!res.ok) return []
    return ((await res.json()) as { results?: TavilyResult[] }).results ?? []
  } catch { return [] }
}

async function jinaRead(url: string): Promise<string> {
  try {
    const headers: Record<string, string> = { Accept: 'text/plain', 'X-Return-Format': 'text' }
    if (process.env.JINA_API_KEY) headers.Authorization = `Bearer ${process.env.JINA_API_KEY}`
    const res = await fetch(`https://r.jina.ai/${url}`, { headers, signal: AbortSignal.timeout(18000) })
    if (!res.ok) return ''
    return (await res.text()).slice(0, 8000)
  } catch { return '' }
}

async function extractPOIs(results: TavilyResult[], page: string, city: string, cat: string) {
  const snippets = results.slice(0, 3).map((r, i) => `[${i + 1}] ${r.title}\n${(r.content ?? '').slice(0, 350)}`).join('\n\n')
  const ctx = page ? `Page :\n${page.slice(0, 4000)}\n\nAutres :\n${snippets}` : snippets

  const tagsByCategory: Record<string, string[]> = {
    soiree: ['soiree', 'bar', 'festif', 'nuit', 'concert', 'ambiance'],
    culture: ['culture', 'patrimoine', 'musee', 'village', 'histoire', 'visite'],
  }

  const { content } = await groqWithFallback({
    messages: [
      { role: 'system', content: 'Extrais des lieux RÉELS. JSON valide uniquement.' },
      { role: 'user', content: `Extrais 1 à 3 lieux ${cat === 'soiree' ? 'de sortie/bar/soirée' : 'culturels/patrimoine'} RÉELS à ${city} depuis :\n${ctx}\n\nJSON :\n{"pois":[{"name":"Nom exact","city":"${city}","address":"adresse ou null","description":"2 phrases","budget_level":"gratuit|faible|moyen|eleve","subcategory":"bar|trinquet|musee|eglise|chocolaterie|marche_nocturne|cidrerie|fronton|grotte|villa|port","tags":${JSON.stringify(tagsByCategory[cat] ?? [])}}]}` },
    ],
    model: 'llama-3.3-70b-versatile',
    temperature: 0.2,
    response_format: { type: 'json_object' },
    max_tokens: 1500,
  })

  try {
    const parsed = JSON.parse(content.trim()) as { pois: Array<{ name: string; city: string; address?: string; description?: string; budget_level?: string; subcategory?: string; tags?: string[] }> }
    return (parsed.pois ?? []).filter(p => p.name?.length > 2)
  } catch { return [] }
}

async function getImage(name: string, city: string): Promise<string | null> {
  try {
    const r = await serpApiImageSearch(`${name} ${city} Pays Basque`, { num: 3 })
    for (const img of r.images.slice(0, 2)) {
      const res = await fetch(img.original, { headers: { 'User-Agent': 'VanzonExplorer/1.0' }, signal: AbortSignal.timeout(12000) })
      if (!res.ok || !(res.headers.get('content-type') ?? '').includes('image')) continue
      const buf = Buffer.from(await res.arrayBuffer())
      if (buf.length < 5000) continue
      const webp = await sharp(buf).resize(800, 600, { fit: 'cover', withoutEnlargement: true }).webp({ quality: 80 }).toBuffer()
      const slug = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').slice(0, 50)
      const path = `poi/${slug}-${Date.now().toString(36)}.webp`
      const { error } = await supabase.storage.from(BUCKET).upload(path, webp, { contentType: 'image/webp', upsert: true })
      if (error) continue
      return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl
    }
  } catch {}
  return null
}

async function main() {
  console.log(`🎭 scrape-soirees-culture — ${isDryRun ? 'DRY RUN' : 'LIVE'}\n`)
  let added = 0, skipped = 0, errors = 0

  for (const s of SEARCHES) {
    console.log(`\n🔎 ${s.cat.toUpperCase()} — ${s.city}`)
    const results = await tavilySearch(s.query)
    if (!results.length) { console.log('   ✗ 0 résultats'); errors++; continue }

    let page = ''
    if (results[0]?.url && !/facebook|instagram/i.test(results[0].url)) page = await jinaRead(results[0].url)

    const pois = await extractPOIs(results, page, s.city, s.cat)
    if (!pois.length) { console.log('   ✗ 0 POIs extraits'); skipped++; continue }

    for (const p of pois) {
      const { data: existing } = await supabase.from('poi_cache').select('id').eq('name', p.name).eq('location_city', p.city).maybeSingle()
      if (existing) { console.log(`   ~ ${p.name} (doublon)`); skipped++; continue }

      let coords: string | null = null
      const geo = await geocode(`${p.name}, ${p.address ?? ''}, ${p.city}, France`)
      await sleep(1100)
      if (geo) coords = formatCoordinates(geo)
      else { const fb = getCityFallback(p.city); if (fb) coords = `${fb[0].toFixed(6)},${fb[1].toFixed(6)}` }

      let imageUrl: string | null = null
      if (!isDryRun) { imageUrl = await getImage(p.name, p.city); await sleep(500) }

      console.log(`   ✓ ${p.name} — ${p.city} ${coords ? '📍' : '⚠️'} ${imageUrl ? '🖼️' : ''}`)

      if (!isDryRun) {
        const { error } = await supabase.from('poi_cache').upsert({
          name: p.name.trim().slice(0, 200),
          category: s.cat === 'soiree' ? 'activite' : 'culture',
          subcategory: p.subcategory ?? null,
          budget_level: p.budget_level ?? 'moyen',
          location_city: p.city,
          address: p.address ?? null,
          google_maps_url: `https://maps.google.com/?q=${encodeURIComponent(p.name + ' ' + p.city)}`,
          description: p.description ?? null,
          tags: p.tags ?? (s.cat === 'soiree' ? ['soiree', 'bar', 'festif'] : ['culture', 'patrimoine', 'visite']),
          parking_nearby: false,
          overnight_allowed: false,
          coordinates: coords,
          image_url: imageUrl,
          source: 'tavily+groq',
        }, { onConflict: 'name,location_city' })
        if (error) { errors++; console.log(`   ! ${error.message.slice(0, 60)}`) } else added++
      } else added++
    }
    await sleep(600)
  }

  console.log(`\n🎉 Done. added=${added} skipped=${skipped} errors=${errors}`)
}

main().catch(e => { console.error('❌', e.message); process.exit(1) })
