#!/usr/bin/env tsx
// scripts/road-trip/backfill-poi-coordinates.ts
// Géocode tous les POIs de poi_cache sans coordinates via Nominatim.
// Idempotent : re-run = no-op sur les POIs déjà géocodés.
// Usage:
//   npx tsx --env-file=.env.local scripts/road-trip/backfill-poi-coordinates.ts
//   npx tsx --env-file=.env.local scripts/road-trip/backfill-poi-coordinates.ts --dry-run
//   npx tsx --env-file=.env.local scripts/road-trip/backfill-poi-coordinates.ts --force

import { createClient } from '@supabase/supabase-js'
import {
  geocode,
  formatCoordinates,
  getCityFallback,
  sleep,
} from '../../src/lib/road-trip-pb/geocoding'

const isDryRun = process.argv.includes('--dry-run')
const isForce = process.argv.includes('--force')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function main() {
  console.log(`🗺️  backfill-poi-coordinates — ${isDryRun ? 'DRY RUN' : 'LIVE'}${isForce ? ' FORCE' : ''}`)

  let query = supabase
    .from('poi_cache')
    .select('id, name, address, location_city, coordinates')
    .order('scraped_at', { ascending: false })

  if (!isForce) query = query.is('coordinates', null)

  const { data: pois, error } = await query
  if (error) throw new Error(`fetch error: ${error.message}`)
  if (!pois || pois.length === 0) {
    console.log('✅ Aucun POI à géocoder.')
    return
  }

  console.log(`📋 ${pois.length} POIs à traiter`)

  let success = 0
  let fallback = 0
  let skipped = 0

  for (const poi of pois) {
    const label = `${poi.name} (${poi.location_city})`
    const queries = [
      `${poi.name}, ${poi.address ?? ''}, ${poi.location_city}, France`.replace(/\s+,/g, ','),
      `${poi.name}, ${poi.location_city}, Pays Basque, France`,
    ].filter((q) => q.trim().length > 5)

    let coords: string | null = null

    for (const q of queries) {
      const result = await geocode(q)
      await sleep(1100) // 1 req/s strict
      if (result) {
        coords = formatCoordinates(result)
        console.log(`  ✓ ${label} → ${coords}`)
        success++
        break
      }
    }

    if (!coords) {
      const fb = getCityFallback(poi.location_city)
      if (fb) {
        coords = `${fb[0].toFixed(6)},${fb[1].toFixed(6)}`
        console.log(`  ~ ${label} → fallback city centroid ${coords}`)
        fallback++
      } else {
        console.log(`  ✗ ${label} — no match, no fallback`)
        skipped++
        continue
      }
    }

    if (!isDryRun && coords) {
      const { error: upErr } = await supabase
        .from('poi_cache')
        .update({ coordinates: coords })
        .eq('id', poi.id)
      if (upErr) {
        console.warn(`  ! update failed ${label}: ${upErr.message}`)
      }
    }
  }

  console.log(`\n🎉 Done. success=${success} fallback=${fallback} skipped=${skipped}`)
}

main().catch((e) => {
  console.error('❌', e.message)
  process.exit(1)
})
