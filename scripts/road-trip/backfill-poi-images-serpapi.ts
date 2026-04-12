#!/usr/bin/env tsx
// scripts/road-trip/backfill-poi-images-serpapi.ts
// Trouve les POIs sans image_url, scrape via SerpAPI Google Images,
// convertit en WebP, upload dans Supabase Storage, met à jour poi_cache.image_url.
//
// Usage:
//   npx tsx --env-file=.env.local scripts/road-trip/backfill-poi-images-serpapi.ts
//   npx tsx --env-file=.env.local scripts/road-trip/backfill-poi-images-serpapi.ts --dry-run
//   npx tsx --env-file=.env.local scripts/road-trip/backfill-poi-images-serpapi.ts --limit 10

import { createClient } from '@supabase/supabase-js'
import sharp from 'sharp'
import { serpApiImageSearch } from '../../src/lib/serpapi-with-fallback'

const isDryRun = process.argv.includes('--dry-run')
const limitArg = process.argv.find((a) => a.startsWith('--limit'))
const limitIdx = process.argv.indexOf('--limit')
const limit = limitIdx >= 0 ? Number(process.argv[limitIdx + 1]) : 50

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const BUCKET = 'road-trip-images'
const WEBP_QUALITY = 80
const MAX_WIDTH = 800
const MAX_HEIGHT = 600

// Catégories de recherche affinées pour des images pertinentes
const SEARCH_TEMPLATES: Record<string, (name: string, city: string) => string> = {
  nature: (name, city) => `${name} ${city} paysage nature Pays Basque`,
  activite: (name, city) => `${name} ${city} activité Pays Basque`,
  restaurant: (name, city) => `${name} restaurant ${city}`,
  culture: (name, city) => `${name} ${city} visite patrimoine`,
  spot_nuit: (name, city) => `parking van camping-car ${city} Pays Basque`,
  parking: (name, city) => `parking ${city} Pays Basque`,
}

function buildSearchQuery(category: string, name: string, city: string): string {
  const builder = SEARCH_TEMPLATES[category]
  return builder ? builder(name, city) : `${name} ${city} Pays Basque`
}

async function downloadImage(url: string): Promise<Buffer | null> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) VanzonExplorer/1.0',
        Accept: 'image/*',
      },
      signal: AbortSignal.timeout(15000),
      redirect: 'follow',
    })
    if (!res.ok) return null
    const contentType = res.headers.get('content-type') ?? ''
    if (!contentType.includes('image')) return null
    const arrayBuffer = await res.arrayBuffer()
    return Buffer.from(arrayBuffer)
  } catch {
    return null
  }
}

async function convertToWebP(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer)
    .resize(MAX_WIDTH, MAX_HEIGHT, { fit: 'cover', withoutEnlargement: true })
    .webp({ quality: WEBP_QUALITY })
    .toBuffer()
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60)
}

async function main() {
  console.log(`🖼️  backfill-poi-images-serpapi — ${isDryRun ? 'DRY RUN' : 'LIVE'} (limit: ${limit})`)

  // Fetch POIs sans image
  const { data: pois, error } = await supabase
    .from('poi_cache')
    .select('id, name, category, location_city, image_url')
    .is('image_url', null)
    .order('scraped_at', { ascending: false })
    .limit(limit)

  if (error) throw new Error(`fetch error: ${error.message}`)
  if (!pois || pois.length === 0) {
    console.log('✅ Tous les POIs ont déjà une image.')
    return
  }

  console.log(`📋 ${pois.length} POIs sans image à traiter`)

  let success = 0
  let skipped = 0
  let errors = 0

  for (const poi of pois) {
    const label = `${poi.name} (${poi.location_city})`
    process.stdout.write(`\n→ ${label} ... `)

    // 1. Recherche SerpAPI
    const query = buildSearchQuery(poi.category, poi.name, poi.location_city)
    let imageUrl: string | null = null

    try {
      const result = await serpApiImageSearch(query, { num: 5 })
      if (result.images.length === 0) {
        console.log('aucune image trouvée')
        skipped++
        continue
      }

      // Essayer les 3 premiers résultats (certaines URLs peuvent être mortes)
      for (const img of result.images.slice(0, 3)) {
        process.stdout.write('.')
        const raw = await downloadImage(img.original)
        if (!raw || raw.length < 5000) continue // trop petit = icône ou erreur

        // 2. Convertir en WebP
        const webpBuffer = await convertToWebP(raw)
        const filePath = `poi/${slugify(poi.name)}-${poi.id.slice(0, 8)}.webp`

        if (isDryRun) {
          console.log(`OK (dry) — ${filePath} (${(webpBuffer.length / 1024).toFixed(0)}KB)`)
          imageUrl = `https://placeholder/${filePath}`
          success++
          break
        }

        // 3. Upload Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from(BUCKET)
          .upload(filePath, webpBuffer, {
            contentType: 'image/webp',
            upsert: true,
          })

        if (uploadError) {
          console.warn(`upload error: ${uploadError.message}`)
          continue
        }

        // 4. Récupérer l'URL publique
        const { data: publicUrl } = supabase.storage
          .from(BUCKET)
          .getPublicUrl(filePath)

        imageUrl = publicUrl.publicUrl
        console.log(`OK — ${(webpBuffer.length / 1024).toFixed(0)}KB WebP`)
        success++
        break
      }

      if (!imageUrl) {
        console.log('images non téléchargeables')
        skipped++
      }
    } catch (err) {
      console.log(`ERR: ${(err as Error).message.slice(0, 80)}`)
      errors++
      continue
    }

    // 5. Mettre à jour poi_cache.image_url
    if (imageUrl && !isDryRun) {
      const { error: updateErr } = await supabase
        .from('poi_cache')
        .update({ image_url: imageUrl })
        .eq('id', poi.id)
      if (updateErr) {
        console.warn(`  ! update failed: ${updateErr.message}`)
      }
    }

    // Pause entre les recherches (politesse API)
    await new Promise((r) => setTimeout(r, 800))
  }

  console.log(`\n\n🎉 Done. success=${success} skipped=${skipped} errors=${errors}`)
}

main().catch((e) => {
  console.error('❌', e.message)
  process.exit(1)
})
