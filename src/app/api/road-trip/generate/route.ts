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
const RATE_WINDOW_MS = 60 * 60 * 1000 // 1 hour

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
  photo?: { url: string; photographer: string; photoUrl: string }
  wiki?: { extract: string; url: string; thumbnail?: string }
}

interface JourItineraire {
  numero: number
  titre: string
  spots: SpotBase[] | SpotEnriched[]
  camping: string
  campingMapsUrl?: string
  tips: string
}

interface ItineraireData {
  intro: string
  jours: JourItineraire[]
  conseils_pratiques: string[]
}

// ── Groq itinerary generation ─────────────────────────────────────────────────
async function generateItineraire(
  input: RoadTripInput,
  tavilyContext: string
): Promise<ItineraireData> {
  if (!process.env.GROQ_API_KEY) {
    throw new Error('[road-trip] GROQ_API_KEY is not set')
  }
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

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
    famille: "famille avec enfants (adapter avec activités kids-friendly)",
    amis: "groupe d'amis",
  }[input.profil_voyageur]

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
          "description": "string (2-3 phrases riches et évocatrices, imagées, qui donnent envie de s'y rendre — pas factuelle sèche)",
          "type": "string (Village, Plage, Montagne, Forêt, Cascade, Lac, Gorges, Col, Cap, Abbaye, Marché, etc.)",
          "search_query": "string (requête en anglais optimisée pour chercher une belle photo du lieu, ex: 'Étretat cliffs Normandy France')"
        }
      ],
      "camping": "string (lieu précis où dormir ce soir, avec le nom du camping ou du spot)",
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

Informations trouvées sur la région (utilise-les comme inspiration) :
${tavilyContext || 'Pas de contexte supplémentaire — utilise tes connaissances générales.'}

Important :
- Génère exactement ${input.duree} jours. Chaque jour = 2-3 spots.
- Spots réels, précis et connus (pas inventés).
- Descriptions en 2-3 phrases imagées et poétiques qui donnent vraiment envie de visiter.
- search_query en anglais, précise et optimisée pour trouver une belle photo (inclure pays/région).`

  async function callGroq(temperature: number): Promise<ItineraireData> {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature,
      max_tokens: 3500,
    })
    const raw = completion.choices[0]?.message?.content ?? ''
    const cleaned = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
    return JSON.parse(cleaned) as ItineraireData
  }

  try {
    return await callGroq(0.7)
  } catch {
    // Retry once with temperature=0 on any failure (JSON parse error or API error).
    // This is intentional: if the API is down, second call will also fail and
    // propagate to the outer catch in POST handler → status = 'error'.
    return await callGroq(0)
  }
}

// ── Enrichissement helpers ────────────────────────────────────────────────────

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
      photos?: Array<{
        src: { large: string }
        photographer: string
        url: string
      }>
    }
    const photo = data.photos?.[0]
    if (!photo) return null
    return {
      url: photo.src.large,
      photographer: photo.photographer,
      photoUrl: photo.url,
    }
  } catch {
    return null
  }
}

async function fetchGoogleMapsUrl(spotName: string, region: string): Promise<string> {
  try {
    const query = `${spotName}, ${region}, France`
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&countrycodes=fr`,
      { headers: { 'User-Agent': 'VanzonExplorer/1.0 (contact@vanzonexplorer.com)' } }
    )
    if (!res.ok) throw new Error('nominatim error')
    const data = (await res.json()) as Array<{ lat?: string; lon?: string }>
    if (data[0]?.lat && data[0]?.lon) {
      return `https://www.google.com/maps?q=${data[0].lat},${data[0].lon}`
    }
  } catch {
    // fall through to text-based fallback
  }
  return `https://maps.google.com/?q=${encodeURIComponent(spotName + ' ' + region + ' France')}`
}

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

async function enrichItineraire(
  itineraire: ItineraireData,
  region: string
): Promise<ItineraireData> {
  const enrichedJours = await Promise.all(
    itineraire.jours.map(async (jour) => {
      const enrichedSpots = await Promise.all(
        jour.spots.map(async (spot) => {
          const searchQuery =
            (spot as SpotBase).search_query || `${spot.nom} ${region} France`

          const [photoResult, mapsResult, wikiResult] = await Promise.allSettled([
            fetchPexelsPhoto(searchQuery),
            fetchGoogleMapsUrl(spot.nom, region),
            fetchWikipedia(spot.nom),
          ])

          return {
            ...spot,
            mapsUrl:
              mapsResult.status === 'fulfilled'
                ? mapsResult.value
                : `https://maps.google.com/?q=${encodeURIComponent(spot.nom + ' France')}`,
            photo:
              photoResult.status === 'fulfilled' ? photoResult.value ?? undefined : undefined,
            wiki:
              wikiResult.status === 'fulfilled' ? wikiResult.value ?? undefined : undefined,
          } as SpotEnriched
        })
      )

      const campingMapsUrl = `https://maps.google.com/?q=${encodeURIComponent(jour.camping + ' ' + region + ' France camping')}`

      return { ...jour, spots: enrichedSpots, campingMapsUrl }
    })
  )

  return { ...itineraire, jours: enrichedJours }
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

// ── Main handler ──────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  // Rate limiting
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { success: false, error: 'Trop de demandes, réessaie dans une heure.' },
      { status: 429 }
    )
  }

  // Parse body
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json(
      { success: false, error: 'Données invalides.' },
      { status: 400 }
    )
  }

  // Validate
  const parsed = RoadTripSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: 'Données invalides.', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const input = parsed.data
  const supabase = createSupabaseAdmin()

  // Check unsubscribes — maybeSingle() returns null (not error) when no row found
  const { data: unsub } = await supabase
    .from('email_unsubscribes')
    .select('id')
    .eq('email', input.email)
    .maybeSingle()

  if (unsub) {
    return NextResponse.json(
      { success: false, error: 'Cet email est désabonné.' },
      { status: 400 }
    )
  }

  // Deduplication — 24h cooldown — maybeSingle() returns null when no row found
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

  // Save to Supabase (pending)
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

  try {
    // Tavily search
    const tavilyContext = await searchTavily(input)

    // Groq generation
    const itineraire = await generateItineraire(input, tavilyContext)

    // Enrich spots with Pexels photos, Google Maps links, Wikipedia summaries
    const enrichedItineraire = await enrichItineraire(itineraire, input.region)

    // Build email
    const emailEncoded = encodeURIComponent(input.email)
    const { subject, html } = buildRoadTripEmail({
      prenom: input.prenom,
      region: input.region,
      duree: input.duree,
      itineraire: enrichedItineraire,
      emailEncoded,
    })

    // Send email via Resend
    if (!process.env.RESEND_API_KEY) {
      throw new Error('[road-trip] RESEND_API_KEY is not set')
    }
    const resend = new Resend(process.env.RESEND_API_KEY)
    const { error: resendError } = await resend.emails.send({
      from: 'Vanzon Explorer <noreply@vanzonexplorer.com>',
      to: input.email,
      subject,
      html,
    })
    if (resendError) {
      throw new Error(`[road-trip] Resend error: ${JSON.stringify(resendError)}`)
    }

    // Update Supabase (sent)
    await supabase
      .from('road_trip_requests')
      .update({
        status: 'sent',
        itineraire_json: enrichedItineraire,
        sent_at: new Date().toISOString(),
      })
      .eq('id', record.id)

    return NextResponse.json({ success: true, message: 'Road trip envoyé !' })
  } catch (err) {
    console.error('[road-trip/generate]', err)

    // Mark as error in Supabase
    const { error: updateErr } = await supabase
      .from('road_trip_requests')
      .update({ status: 'error' })
      .eq('id', record.id)
    if (updateErr) console.error('[road-trip/generate] failed to set error status', updateErr)

    return NextResponse.json(
      { success: false, error: 'Erreur interne, réessaie dans quelques instants.' },
      { status: 500 }
    )
  }
}
