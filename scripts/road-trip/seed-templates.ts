#!/usr/bin/env tsx
// scripts/road-trip/seed-templates.ts
// Génère 16 templates road_trip_templates (1 par combo duration × groupType)
// via Groq llama-3.3-70b-versatile. Validation post-parse + 1 retry.
// Usage:
//   npx tsx --env-file=.env.local scripts/road-trip/seed-templates.ts
//   npx tsx --env-file=.env.local scripts/road-trip/seed-templates.ts --force
//   npx tsx --env-file=.env.local scripts/road-trip/seed-templates.ts --only weekend/couple
//   npx tsx --env-file=.env.local scripts/road-trip/seed-templates.ts --dry-run

import { createClient } from '@supabase/supabase-js'
import { groqWithFallback } from '../../src/lib/groq-with-fallback'
import {
  ALL_DURATION_SLUGS,
  ALL_GROUP_TYPES,
  DURATION_TO_DAYS_SLUG,
} from '../../src/types/road-trip-pb'
import type { DurationSlug } from '../../src/types/road-trip-pb'
import type { GroupType } from '../../src/types/roadtrip'
import {
  REGION_SLUG,
  GROUP_LABELS,
  GROUP_TYPE_INTERESTS,
  INTEREST_TO_POI_TAGS,
} from '../../src/lib/road-trip-pb/constants'

const isDryRun = process.argv.includes('--dry-run')
const isForce = process.argv.includes('--force')
const onlyIdx = process.argv.indexOf('--only')
const onlyArg = onlyIdx >= 0 ? process.argv[onlyIdx + 1] : undefined

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const PB_CITIES = [
  'Biarritz', 'Bayonne', 'Anglet', 'Saint-Jean-de-Luz', 'Hendaye',
  'Espelette', 'Ainhoa', 'Saint-Jean-Pied-de-Port', 'Itxassou',
  'Sare', 'Bidarray', 'Cambo-les-Bains', 'Guéthary', 'Bidart',
  'Urrugne', 'Larrau', 'Sainte-Engrace', 'Lecumberry', 'Iraty',
]

interface POIInput {
  id: string
  name: string
  category: string
  location_city: string
  description: string | null
  tags: string[]
  budget_level: string | null
}
interface OvernightInput {
  id: string
  name: string
  overnight_type: string | null
  overnight_price_per_night: number | null
  location_city: string
}

async function loadPOIs(
  groupType: GroupType
): Promise<{ pois: POIInput[]; overnight: OvernightInput[] }> {
  const interests = GROUP_TYPE_INTERESTS[groupType]
  const tags = interests.flatMap((i) => INTEREST_TO_POI_TAGS[i] ?? [])

  const [poisRes, ovRes] = await Promise.all([
    supabase
      .from('poi_cache')
      .select('id,name,category,location_city,description,tags,budget_level')
      .neq('category', 'spot_nuit')
      .neq('category', 'parking')
      .in('location_city', PB_CITIES)
      .overlaps('tags', tags.length ? tags : ['nature'])
      .limit(40),
    supabase
      .from('poi_cache')
      .select('id,name,overnight_type,overnight_price_per_night,location_city')
      .eq('category', 'spot_nuit')
      .eq('overnight_allowed', true)
      .in('location_city', PB_CITIES)
      .limit(20),
  ])

  return {
    pois: (poisRes.data as POIInput[]) ?? [],
    overnight: (ovRes.data as OvernightInput[]) ?? [],
  }
}

// ─── Prompt contract ─────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `Tu es un expert vanlifer Pays Basque. Tu ne proposes QUE des POIs réels issus de la liste fournie. Tu ne cites AUCUN lieu hors liste. Tu réponds UNIQUEMENT en JSON valide, sans backtick, sans texte avant/après.`

function buildUserPrompt(
  duration: DurationSlug,
  groupType: GroupType,
  pois: POIInput[],
  overnight: OvernightInput[]
): string {
  const days = DURATION_TO_DAYS_SLUG[duration]
  const group = GROUP_LABELS[groupType]
  return `Crée un itinéraire road trip van pour ce profil :
- Région : Pays Basque (départ Cambo-les-Bains)
- Durée : ${days} jour(s)
- Profil : ${group}

POIs autorisés (tu DOIS uniquement utiliser ces id exacts) :
${JSON.stringify(pois)}

Spots nuit autorisés :
${JSON.stringify(overnight)}

Retourne STRICTEMENT ce JSON :
{
  "title": "titre 60-80 chars SEO-friendly",
  "intro": "80-120 mots personnalisés au profil ${group}",
  "itinerary_json": {
    "days": [
      {
        "day": 1,
        "theme": "thème de la journée",
        "stops": [
          { "poi_id": "<uuid exact de la liste>", "time": "9h00", "note": "2 phrases sur pourquoi ce stop" }
        ],
        "overnight_id": "<uuid exact de la liste overnight>"
      }
    ]
  },
  "poi_ids_used": ["<uuid1>", "<uuid2>"],
  "overnight_ids_used": ["<uuid1>"],
  "tips": ["tip1", "tip2", "tip3", "tip4", "tip5"],
  "faq": [
    { "q": "question pratique", "a": "réponse factuelle" },
    { "q": "...", "a": "..." }
  ]
}

Contraintes :
- EXACTEMENT ${days} jour(s) dans itinerary_json.days
- 3 à 5 stops par jour, chronologiques (matin → soir)
- 1 overnight_id par jour (obligatoire, jamais null)
- Tous les poi_id et overnight_id doivent EXISTER dans les listes ci-dessus (sinon refusé)
- 4 à 6 entrées dans faq
- 5 entrées exactement dans tips`
}

// ─── Parse + validation ─────────────────────────────────────────────────────

interface SeedResult {
  title: string
  intro: string
  itinerary_json: {
    days: Array<{
      day: number
      theme: string
      stops: Array<{ poi_id: string; time: string; note: string }>
      overnight_id: string
    }>
  }
  poi_ids_used: string[]
  overnight_ids_used: string[]
  tips: string[]
  faq: Array<{ q: string; a: string }>
}

function parseJson(raw: string): unknown {
  try {
    return JSON.parse(raw.trim())
  } catch {
    /* fallthrough */
  }
  const stripped = raw
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/, '')
    .trim()
  try {
    return JSON.parse(stripped)
  } catch {
    /* fallthrough */
  }
  const match = raw.match(/\{[\s\S]*\}/)
  if (match) {
    try {
      return JSON.parse(match[0])
    } catch {
      /* fallthrough */
    }
  }
  throw new Error('invalid JSON')
}

function validate(
  result: SeedResult,
  expectedDays: number,
  allowedPoiIds: Set<string>,
  allowedOvernightIds: Set<string>
): string | null {
  if (!result.title || !result.itinerary_json?.days) return 'missing title or days'
  if (result.itinerary_json.days.length !== expectedDays) {
    return `days count ${result.itinerary_json.days.length} !== ${expectedDays}`
  }
  for (const day of result.itinerary_json.days) {
    if (!day.overnight_id || !allowedOvernightIds.has(day.overnight_id)) {
      return `invalid or missing overnight_id on day ${day.day}`
    }
    if (!day.stops || day.stops.length === 0) {
      return `no stops on day ${day.day}`
    }
    for (const stop of day.stops) {
      if (!stop.poi_id || !allowedPoiIds.has(stop.poi_id)) {
        return `invalid poi_id on day ${day.day}: ${stop.poi_id}`
      }
    }
  }
  if (!Array.isArray(result.tips) || result.tips.length === 0) return 'tips empty'
  if (!Array.isArray(result.faq) || result.faq.length < 3) return 'faq too short'
  return null
}

// ─── Génération d'un template ───────────────────────────────────────────────

async function generateOne(
  duration: DurationSlug,
  groupType: GroupType
): Promise<SeedResult> {
  const { pois, overnight } = await loadPOIs(groupType)
  if (pois.length === 0) throw new Error(`no POIs for groupType=${groupType}`)
  if (overnight.length === 0) throw new Error(`no overnight spots for groupType=${groupType}`)

  const expectedDays = DURATION_TO_DAYS_SLUG[duration]
  const allowedPoiIds = new Set(pois.map((p) => p.id))
  const allowedOvernightIds = new Set(overnight.map((o) => o.id))

  const prompt = buildUserPrompt(duration, groupType, pois, overnight)

  for (let attempt = 1; attempt <= 2; attempt++) {
    const { content } = await groqWithFallback({
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.5,
      response_format: { type: 'json_object' },
      max_tokens: 4000,
    })

    try {
      const parsed = parseJson(content) as SeedResult
      const err = validate(parsed, expectedDays, allowedPoiIds, allowedOvernightIds)
      if (err) {
        console.warn(`  ⚠ attempt ${attempt} validation error: ${err}`)
        if (attempt === 2) throw new Error(`validation failed after retry: ${err}`)
        continue
      }
      return parsed
    } catch (e) {
      console.warn(`  ⚠ attempt ${attempt} parse error: ${(e as Error).message}`)
      if (attempt === 2) throw e
    }
  }
  throw new Error('unreachable')
}

// ─── Main loop ──────────────────────────────────────────────────────────────

async function main() {
  console.log(`🤖 seed-templates — ${isDryRun ? 'DRY RUN' : 'LIVE'}${isForce ? ' FORCE' : ''}`)

  let combos: Array<{ duration: DurationSlug; groupType: GroupType }> = []
  if (onlyArg) {
    const [d, g] = onlyArg.split('/') as [DurationSlug, GroupType]
    combos = [{ duration: d, groupType: g }]
  } else {
    for (const d of ALL_DURATION_SLUGS) {
      for (const g of ALL_GROUP_TYPES) {
        combos.push({ duration: d, groupType: g })
      }
    }
  }

  console.log(`📋 ${combos.length} combos à générer`)

  let ok = 0
  let skipped = 0
  let failed = 0

  for (const { duration, groupType } of combos) {
    const label = `${duration}/${groupType}`
    process.stdout.write(`\n→ ${label} ... `)

    if (!isForce) {
      const { data: existing } = await supabase
        .from('road_trip_templates')
        .select('id')
        .eq('region_slug', REGION_SLUG)
        .eq('duration_key', duration)
        .eq('group_type', groupType)
        .maybeSingle()
      if (existing) {
        console.log('EXISTS (skip)')
        skipped++
        continue
      }
    }

    try {
      const result = await generateOne(duration, groupType)
      console.log('OK')

      if (!isDryRun) {
        const { error: upErr } = await supabase
          .from('road_trip_templates')
          .upsert(
            {
              region_slug: REGION_SLUG,
              duration_key: duration,
              group_type: groupType,
              title: result.title,
              intro: result.intro,
              itinerary_json: result.itinerary_json,
              poi_ids: result.poi_ids_used,
              overnight_ids: result.overnight_ids_used,
              tips: result.tips,
              faq: result.faq,
              published: true,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'region_slug,duration_key,group_type' }
          )
        if (upErr) {
          console.warn(`  ! upsert failed: ${upErr.message}`)
          failed++
          continue
        }
      }
      ok++
    } catch (e) {
      console.log(`FAIL: ${(e as Error).message}`)
      failed++
    }
  }

  console.log(`\n🎉 Done. ok=${ok} skipped=${skipped} failed=${failed}`)
  process.exit(failed > 0 ? 1 : 0)
}

main().catch((e) => {
  console.error('❌', e.message)
  process.exit(1)
})
