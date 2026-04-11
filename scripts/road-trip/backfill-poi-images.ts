#!/usr/bin/env tsx
// scripts/road-trip/backfill-poi-images.ts
// Retrofit image_url sur poi_cache via extractOGImage() existant.
// Idempotent.
// Usage:
//   npx tsx --env-file=.env.local scripts/road-trip/backfill-poi-images.ts
//   npx tsx --env-file=.env.local scripts/road-trip/backfill-poi-images.ts --dry-run

import { createClient } from '@supabase/supabase-js'
import { extractOGImage } from '../../src/lib/admin/poi-scraper'

const isDryRun = process.argv.includes('--dry-run')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function main() {
  console.log(`🖼️  backfill-poi-images — ${isDryRun ? 'DRY RUN' : 'LIVE'}`)

  const { data: pois, error } = await supabase
    .from('poi_cache')
    .select('id, name, external_url, image_url')
    .is('image_url', null)
    .not('external_url', 'is', null)

  if (error) throw new Error(`fetch error: ${error.message}`)
  if (!pois || pois.length === 0) {
    console.log('✅ Aucun POI à retrofit.')
    return
  }

  console.log(`📋 ${pois.length} POIs à traiter`)

  let found = 0
  let missed = 0

  for (const poi of pois) {
    if (!poi.external_url) continue
    process.stdout.write(`  → ${poi.name} ... `)
    const img = await extractOGImage(poi.external_url)
    if (img) {
      console.log(`OK`)
      found++
      if (!isDryRun) {
        await supabase
          .from('poi_cache')
          .update({ image_url: img })
          .eq('id', poi.id)
      }
    } else {
      console.log(`—`)
      missed++
    }
    await new Promise((r) => setTimeout(r, 400))
  }

  console.log(`\n🎉 Done. found=${found} missed=${missed}`)
}

main().catch((e) => {
  console.error('❌', e.message)
  process.exit(1)
})
