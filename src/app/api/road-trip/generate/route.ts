// src/app/api/road-trip/generate/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import Groq from 'groq-sdk'
import { Resend } from 'resend'
import { createSupabaseAdmin } from '@/lib/supabase/server'
import { buildRoadTripEmail } from '@/emails/road-trip'
import {
  INTERETS_OPTIONS,
  MOIS_OPTIONS,
} from '@/lib/road-trip/constants'

export const maxDuration = 60

// ── Rate limiting (in-memory, best-effort) ───────────────────────────────────
const ipRequestMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT = 3
const RATE_WINDOW_MS = 60 * 60 * 1000

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = ipRequestMap.get(ip)
  if (!entry || now > entry.resetAt) {
    ipRequestMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS })
    return true
  }
  if (entry.count >= RATE_LIMIT) return false
  entry.count++
  return true
}

// ── Zod schema ────────────────────────────────────────────────────────────────
const InteretEnum = z.enum(
  INTERETS_OPTIONS.map((o) => o.value) as [string, ...string[]]
)

const RoadTripSchema = z.object({
  prenom: z.string().min(2).max(50),
  email: z.string().email(),
  region: z.string().min(2).max(100),
  duree: z.coerce.number().int().min(1).max(14),
  interets: z.array(InteretEnum).min(1).max(7),
  style_voyage: z.enum(['lent', 'explorer', 'aventure']),
  periode: z.enum(MOIS_OPTIONS),
  profil_voyageur: z.enum(['solo', 'couple', 'famille', 'amis']),
  budget: z.enum(['economique', 'confort', 'premium']),
  experience_van: z.boolean(),
})

type RoadTripInput = z.infer<typeof RoadTripSchema>

// ── Types ─────────────────────────────────────────────────────────────────────
interface SpotBase {
  nom: string
  description: string
  type: string
  search_query?: string
}

interface SpotEnriched extends SpotBase {
  mapsUrl: string
  photo?: { url: string; photographer: string; photoUrl: string; source?: string }
  wiki?: { extract: string; url: string; thumbnail?: string }
}

interface CampingOption {
  name: string
  mapsUrl: string
  fee?: string        // 'yes' | 'no'
  motorhome?: string  // 'yes' | 'designated'
  website?: string
  lat?: number
  lon?: number
}

interface RestaurantInfo {
  nom: string
  type: string
  specialite: string
  description: string
}

interface JourItineraire {
  numero: number
  titre: string
  spots: SpotBase[] | SpotEnriched[]
  camping: string
  campingMapsUrl?: string
  campingOptions?: CampingOption[]
  restaurant?: RestaurantInfo
  tips: string
}

interface ItineraireData {
  intro: string
  jours: JourItineraire[]
  conseils_pratiques: string[]
}

// ── Geocoding (Nominatim) ─────────────────────────────────────────────────────
interface GeoResult {
  mapsUrl: string
  lat?: number
  lon?: number
}

async function geocodeSpot(name: string, region: string): Promise<GeoResult> {
  try {
    const query = region ? `${name}, ${region}, France` : `${name}, France`
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&countrycodes=fr`,
      { headers: { 'User-Agent': 'VanzonExplorer/1.0 (contact@vanzonexplorer.com)' } }
    )
    if (!res.ok) throw new Error('nominatim error')
    const data = (await res.json()) as Array<{ lat?: string; lon?: string }>
    if (data[0]?.lat && data[0]?.lon) {
      return {
        mapsUrl: `https://www.google.com/maps?q=${data[0].lat},${data[0].lon}`,
        lat: parseFloat(data[0].lat),
        lon: parseFloat(data[0].lon),
      }
    }
  } catch {
    // fall through
  }
  return {
    mapsUrl: `https://maps.google.com/?q=${encodeURIComponent(name + (region ? ' ' + region : '') + ' France')}`,
  }
}

// ── Pexels photo ──────────────────────────────────────────────────────────────
async function fetchPexelsPhoto(
  query: string
): Promise<{ url: string; photographer: string; photoUrl: string } | null> {
  try {
    if (!process.env.PEXELS_API_KEY) return null
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`,
      { headers: { Authorization: process.env.PEXELS_API_KEY } }
    )
    if (!res.ok) return null
    const data = (await res.json()) as {
      photos?: Array<{ src: { large: string }; photographer: string; url: string }>
    }
    const photo = data.photos?.[0]
    if (!photo) return null
    return { url: photo.src.large, photographer: photo.photographer, photoUrl: photo.url }
  } catch {
    return null
  }
}

// ── Best photo (specific + generic Pexels in parallel → Wikipedia thumbnail) ──
async function fetchBestPhoto(
  spot: SpotBase,
  region: string,
  wikiThumbnail?: string
): Promise<{ url: string; photographer: string; photoUrl: string; source: string } | null> {
  const specificQuery = spot.search_query || `${spot.nom} ${region} France`
  const genericQuery = `${spot.type} ${region} France`

  // Run both Pexels queries in parallel to save time
  const [specific, generic] = await Promise.all([
    fetchPexelsPhoto(specificQuery),
    fetchPexelsPhoto(genericQuery),
  ])

  if (specific) return { ...specific, source: 'pexels' }
  if (generic) return { ...generic, source: 'pexels-generic' }

  // Wikipedia thumbnail as last resort (no extra API cost — already fetched)
  if (wikiThumbnail) {
    return { url: wikiThumbnail, photographer: 'Wikipedia', photoUrl: '', source: 'wikipedia' }
  }

  return null
}

// ── Wikipedia ─────────────────────────────────────────────────────────────────
async function fetchWikipedia(
  spotName: string
): Promise<{ extract: string; url: string; thumbnail?: string } | null> {
  try {
    const res = await fetch(
      `https://fr.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(spotName)}`,
      { headers: { 'User-Agent': 'VanzonExplorer/1.0' } }
    )
    if (!res.ok) return null
    const data = (await res.json()) as {
      type?: string
      extract?: string
      content_urls?: { desktop?: { page?: string } }
      thumbnail?: { source?: string }
    }
    if (data.type === 'disambiguation') return null
    return {
      extract: data.extract?.slice(0, 200) ?? '',
      url: data.content_urls?.desktop?.page ?? '',
      thumbnail: data.thumbnail?.source,
    }
  } catch {
    return null
  }
}

// ── Overpass campings ─────────────────────────────────────────────────────────
async function fetchOverpassCampings(
  lat: number,
  lon: number,
  radiusMeters = 40000
): Promise<CampingOption[]> {
  try {
    const query = `
[out:json][timeout:12];
(
  node["tourism"="camp_site"](around:${radiusMeters},${lat},${lon});
  node["tourism"="caravan_site"](around:${radiusMeters},${lat},${lon});
);
out body 20;
    `.trim()

    const res = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `data=${encodeURIComponent(query)}`,
      signal: AbortSignal.timeout(14000),
    })

    if (!res.ok) return []

    const data = (await res.json()) as {
      elements?: Array<{
        lat?: number
        lon?: number
        tags?: Record<string, string>
      }>
    }

    return (data.elements ?? [])
      .filter((el) => el.tags?.name && el.lat && el.lon)
      .slice(0, 12)
      .map((el) => ({
        name: el.tags!.name!,
        lat: el.lat,
        lon: el.lon,
        mapsUrl: `https://www.google.com/maps?q=${el.lat},${el.lon}`,
        fee: el.tags?.fee,
        motorhome: el.tags?.motorhome ?? el.tags?.motorcar,
        website: el.tags?.website,
      }))
  } catch {
    return []
  }
}

// ── Nearest campings (Euclidean distance) ────────────────────────────────────
function nearestCampings(
  campings: CampingOption[],
  lat: number,
  lon: number,
  count = 3
): CampingOption[] {
  return [...campings]
    .map((c) => ({
      ...c,
      _dist: Math.sqrt(((c.lat ?? lat) - lat) ** 2 + ((c.lon ?? lon) - lon) ** 2),
    }))
    .sort((a, b) => a._dist - b._dist)
    .slice(0, count)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    .map(({ _dist, ...rest }) => rest)
}

// ── Tavily search ─────────────────────────────────────────────────────────────
async function searchTavily(input: RoadTripInput): Promise<string> {
  try {
    const interetsLabels = input.interets
      .map((v) => INTERETS_OPTIONS.find((o) => o.value === v)?.label ?? v)
      .join(' ')

    const query = `road trip van ${input.region} France spots activités ${interetsLabels} ${input.periode}`

    const res = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: process.env.TAVILY_API_KEY,
        query,
        max_results: 6,
        include_answer: false,
      }),
    })

    if (!res.ok) return ''

    const data = (await res.json()) as {
      results?: Array<{ title?: string; content?: string }>
    }

    return (data.results ?? [])
      .slice(0, 6)
      .map((r) => `${r.title ?? ''}: ${r.content ?? ''}`)
      .join('\n\n')
      .slice(0, 3000)
  } catch {
    return ''
  }
}

// ── Groq itinerary generation ─────────────────────────────────────────────────
async function generateItineraire(
  input: RoadTripInput,
  tavilyContext: string
): Promise<ItineraireData> {
  if (!process.env.GROQ_API_KEY) throw new Error('[road-trip] GROQ_API_KEY is not set')
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

  const hasGastronomie = input.interets.includes('gastronomie')

  const interetsLabels = input.interets
    .map((v) => INTERETS_OPTIONS.find((o) => o.value === v)?.label ?? v)
    .join(', ')

  const styleDesc = {
    lent: 'rythme lent avec 2-3 stops maximum, immersion profonde dans chaque lieu',
    explorer: 'maximum de spots et de découvertes, rythme soutenu',
    aventure: 'nature sauvage, off-road, bivouacs isolés',
  }[input.style_voyage]

  const budgetDesc = {
    economique: 'camping gratuit, bivouac, aires naturelles',
    confort: 'aires de camping-cars payantes avec équipements, campings 2-3 étoiles',
    premium: 'glamping, campings premium, spots exclusifs',
  }[input.budget]

  const profilDesc = {
    solo: 'voyageur solo',
    couple: 'couple',
    famille: 'famille avec enfants (adapter avec activités kids-friendly)',
    amis: "groupe d'amis",
  }[input.profil_voyageur]

  const restaurantSchemaDesc = hasGastronomie
    ? `      "restaurant": {
        "nom": "string (nom précis et réel du restaurant ou lieu de restauration)",
        "type": "string (Restaurant, Marché, Boulangerie artisanale, Cave à vins, Fromagerie…)",
        "specialite": "string (spécialité locale ou plat typique)",
        "description": "string (1-2 phrases évocatrices qui donnent envie)"
      },`
    : ''

  const restaurantInstruction = hasGastronomie
    ? `- Ajoute un champ "restaurant" à chaque jour : un vrai restaurant ou lieu gastronomique de la région, bien connu et réputé, avec son nom précis, son type, sa spécialité locale et une courte description évocatrice.`
    : ''

  const systemPrompt = `Tu es un expert du voyage en van en France. Tu génères des itinéraires road trip détaillés, authentiques et pratiques.
Réponds UNIQUEMENT avec du JSON valide, sans texte avant ou après. Le JSON doit respecter exactement ce schéma :
{
  "intro": "string (2-3 phrases d'intro poétiques et évocatrices sur la région et le voyage)",
  "jours": [
    {
      "numero": 1,
      "titre": "string (titre évocateur du jour)",
      "spots": [
        {
          "nom": "string (nom précis du lieu, tel qu'on le trouverait sur Wikipedia ou Google Maps)",
          "description": "string (2-3 phrases riches et évocatrices, imagées, qui donnent envie de s'y rendre)",
          "type": "string (Village, Plage, Montagne, Forêt, Cascade, Lac, Gorges, Col, Cap, Abbaye, Marché, etc.)",
          "search_query": "string (requête en anglais optimisée pour chercher une belle photo, ex: 'Étretat cliffs Normandy France sunset')"
        }
      ],
${restaurantSchemaDesc}
      "camping": "string (lieu précis où dormir ce soir, avec le nom du camping ou du spot bivouac)",
      "tips": "string (astuce pratique van pour ce jour)"
    }
  ],
  "conseils_pratiques": ["string", "string", "string"]
}`

  const userPrompt = `Génère un road trip en van de ${input.duree} jours en ${input.region}, France.
Profil : ${profilDesc}
Intérêts : ${interetsLabels}
Style : ${styleDesc}
Budget hébergement : ${budgetDesc}
Période : ${input.periode}
Expérience van : ${input.experience_van ? 'habitué' : 'première fois'}

Informations trouvées sur la région :
${tavilyContext || 'Pas de contexte supplémentaire — utilise tes connaissances générales.'}

Important :
- Génère exactement ${input.duree} jours. Chaque jour = 2-3 spots.
- Spots réels, précis et connus (pas inventés).
- Descriptions en 2-3 phrases imagées et poétiques.
- search_query en anglais, précise et optimisée pour trouver une belle photo (inclure pays/région/saison).
${restaurantInstruction}`

  function extractJson(raw: string): ItineraireData {
    // Strategy 1: try to parse the full response directly
    try {
      return JSON.parse(raw.trim()) as ItineraireData
    } catch { /* fall through */ }

    // Strategy 2: strip markdown code fences
    const stripped = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim()
    try {
      return JSON.parse(stripped) as ItineraireData
    } catch { /* fall through */ }

    // Strategy 3: extract first {...} block (handles "Here is the JSON: {...}")
    const match = raw.match(/\{[\s\S]*\}/)
    if (match) return JSON.parse(match[0]) as ItineraireData

    throw new Error('No valid JSON found in Groq response')
  }

  async function callGroq(temperature: number): Promise<ItineraireData> {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature,
      max_tokens: 4000,
      response_format: { type: 'json_object' },
    })
    const raw = completion.choices[0]?.message?.content ?? ''
    return extractJson(raw)
  }

  try {
    return await callGroq(0.7)
  } catch (err) {
    console.error('[road-trip] callGroq(0.7) failed:', err)
    return await callGroq(0)
  }
}

// ── Enrich itineraire ─────────────────────────────────────────────────────────
async function enrichItineraire(
  itineraire: ItineraireData,
  region: string,
  allCampings: CampingOption[]
): Promise<ItineraireData> {
  const enrichedJours = await Promise.all(
    itineraire.jours.map(async (jour) => {
      // Enrich each spot: geocode + wikipedia + photos all in parallel
      const enrichedSpots = await Promise.all(
        jour.spots.map(async (spot) => {
          try {
            const [geoResult, wikiResult] = await Promise.allSettled([
              geocodeSpot(spot.nom, region),
              fetchWikipedia(spot.nom),
            ])

            const geo = geoResult.status === 'fulfilled' ? geoResult.value : null
            const wiki = wikiResult.status === 'fulfilled' ? wikiResult.value : null

            const photo = await fetchBestPhoto(spot, region, wiki?.thumbnail ?? undefined)

            return {
              ...spot,
              mapsUrl:
                geo?.mapsUrl ??
                `https://maps.google.com/?q=${encodeURIComponent(spot.nom + ' France')}`,
              photo: photo ?? undefined,
              wiki: wiki ?? undefined,
              _lat: geo?.lat,
              _lon: geo?.lon,
            } as SpotEnriched & { _lat?: number; _lon?: number }
          } catch {
            // If enrichment of a spot fails, return it with a fallback Maps URL
            return {
              ...spot,
              mapsUrl: `https://maps.google.com/?q=${encodeURIComponent(spot.nom + ' France')}`,
              _lat: undefined,
              _lon: undefined,
            } as SpotEnriched & { _lat?: number; _lon?: number }
          }
        })
      )

      // Pick nearest campings for this day (using first spot's coordinates)
      const firstSpot = (enrichedSpots[0] ?? null) as (SpotEnriched & { _lat?: number; _lon?: number }) | null
      let campingOptions: CampingOption[] = []
      if (firstSpot?._lat && firstSpot?._lon && allCampings.length > 0) {
        campingOptions = nearestCampings(allCampings, firstSpot._lat, firstSpot._lon, 3)
      }

      // Strip internal _lat/_lon from final spots
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const cleanSpots = enrichedSpots.map(({ _lat, _lon, ...rest }: SpotEnriched & { _lat?: number; _lon?: number }) => rest as SpotEnriched)

      const campingMapsUrl = `https://maps.google.com/?q=${encodeURIComponent(
        jour.camping + ' ' + region + ' France camping'
      )}`

      return { ...jour, spots: cleanSpots, campingMapsUrl, campingOptions }
    })
  )

  return { ...itineraire, jours: enrichedJours }
}

// ── SSE emitter helper ────────────────────────────────────────────────────────
type EmitFn = (type: string, payload?: Record<string, unknown>) => Promise<void>

function createEmitter(writer: WritableStreamDefaultWriter<Uint8Array>): EmitFn {
  const encoder = new TextEncoder()
  return async (type, payload = {}) => {
    try {
      await writer.write(
        encoder.encode(`data: ${JSON.stringify({ type, ...payload })}\n\n`)
      )
    } catch {
      // client disconnected — ignore
    }
  }
}

// ── Main handler ──────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  // ── Pre-flight (return JSON errors before starting stream) ────────────────
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { success: false, error: 'Trop de demandes, réessaie dans une heure.' },
      { status: 429 }
    )
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ success: false, error: 'Données invalides.' }, { status: 400 })
  }

  const parsed = RoadTripSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: 'Données invalides.', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const input = parsed.data
  const supabase = createSupabaseAdmin()

  const { data: unsub } = await supabase
    .from('email_unsubscribes')
    .select('id')
    .eq('email', input.email)
    .maybeSingle()

  if (unsub) {
    return NextResponse.json({ success: false, error: 'Cet email est désabonné.' }, { status: 400 })
  }

  const { data: existing } = await supabase
    .from('road_trip_requests')
    .select('id')
    .eq('email', input.email)
    .eq('status', 'sent')
    .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .maybeSingle()

  if (existing) {
    return NextResponse.json(
      { success: false, error: "Tu as déjà reçu un road trip aujourd'hui. Réessaie demain !" },
      { status: 429 }
    )
  }

  const { data: record, error: insertError } = await supabase
    .from('road_trip_requests')
    .insert({
      prenom: input.prenom,
      email: input.email,
      region: input.region,
      duree: input.duree,
      interets: input.interets,
      style_voyage: input.style_voyage,
      periode: input.periode,
      profil_voyageur: input.profil_voyageur,
      budget: input.budget,
      experience_van: input.experience_van,
      status: 'pending',
    })
    .select('id')
    .single()

  if (insertError || !record) {
    return NextResponse.json(
      { success: false, error: 'Erreur interne, réessaie dans quelques instants.' },
      { status: 500 }
    )
  }

  // ── Start SSE stream ───────────────────────────────────────────────────────
  const { readable, writable } = new TransformStream<Uint8Array, Uint8Array>()
  const writer = writable.getWriter()
  const emit = createEmitter(writer)

  // Run async work in background (not awaited — stream starts immediately)
  void (async () => {
    try {
      // Step 1: Tavily search
      await emit('progress', { message: `🗺️  On prépare ton aventure en ${input.region}...` })
      const tavilyContext = await searchTavily(input)

      // Step 2: Groq generation
      await emit('progress', { message: '🔍  On explore les meilleurs spots de la région...' })
      const itineraire = await generateItineraire(input, tavilyContext)
      const spotCount = itineraire.jours.reduce((a, j) => a + j.spots.length, 0)

      await emit('progress', { message: `📍  On a trouvé ${spotCount} endroits qui vont te plaire...` })
      await emit('progress', { message: '🌅  On construit ton itinéraire jour par jour...' })

      // Step 3: Geocode region + fetch all Overpass campings once (non-blocking)
      await emit('progress', { message: '🏕️  On recherche les bivouacs et campings de la région...' })
      let allCampings: CampingOption[] = []
      try {
        const regionGeo = await geocodeSpot(input.region, '')
        if (regionGeo.lat && regionGeo.lon) {
          allCampings = await fetchOverpassCampings(regionGeo.lat, regionGeo.lon, 80000)
        }
      } catch {
        // Overpass failure is non-fatal — we continue without real campings
        console.error('[road-trip] Overpass fetch failed, continuing without camping options')
      }

      // Step 4: Enrich spots (photos, maps, wikipedia) + assign campings per day
      await emit('progress', { message: '📸  On illustre chaque étape avec de belles photos...' })
      let enrichedItineraire: ItineraireData
      try {
        enrichedItineraire = await enrichItineraire(itineraire, input.region, allCampings)
      } catch (enrichErr) {
        console.error('[road-trip] enrichItineraire failed, using raw itinerary:', enrichErr)
        // Fall back to the raw LLM-generated itinerary (no photos, no maps links, no camping options)
        enrichedItineraire = itineraire
      }

      await emit('progress', { message: '✍️  On rédige tes conseils pratiques sur mesure...' })

      // Step 5: Build + send email
      if (!process.env.RESEND_API_KEY) throw new Error('[road-trip] RESEND_API_KEY is not set')
      const resend = new Resend(process.env.RESEND_API_KEY)

      const emailEncoded = encodeURIComponent(input.email)
      const { subject, html } = buildRoadTripEmail({
        prenom: input.prenom,
        region: input.region,
        duree: input.duree,
        itineraire: enrichedItineraire,
        emailEncoded,
      })

      await emit('progress', { message: '📬  On finalise ton road trip et on t\'envoie tout ça...' })

      const { error: resendError } = await resend.emails.send({
        from: 'Vanzon Explorer <noreply@vanzonexplorer.com>',
        to: input.email,
        subject,
        html,
      })
      if (resendError) throw new Error(`[road-trip] Resend error: ${JSON.stringify(resendError)}`)

      // Step 6: Update Supabase (sent)
      await supabase
        .from('road_trip_requests')
        .update({
          status: 'sent',
          itineraire_json: enrichedItineraire,
          sent_at: new Date().toISOString(),
        })
        .eq('id', record.id)

      await emit('progress', { message: '✅  C\'est prêt ! Vérifie ta boîte mail 🎉' })
      await emit('done', {})
    } catch (err) {
      console.error('[road-trip/generate]', err)
      await emit('error', { message: 'Erreur interne, réessaie dans quelques instants.' })
      await supabase
        .from('road_trip_requests')
        .update({ status: 'error' })
        .eq('id', record.id)
    } finally {
      try {
        await writer.close()
      } catch {
        // already closed (client disconnected)
      }
    }
  })()

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'X-Accel-Buffering': 'no',
      Connection: 'keep-alive',
    },
  })
}
