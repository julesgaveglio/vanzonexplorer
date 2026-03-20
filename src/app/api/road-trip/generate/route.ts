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

// ── Groq itinerary generation ─────────────────────────────────────────────────
interface JourItineraire {
  numero: number
  titre: string
  spots: Array<{ nom: string; description: string; type: string }>
  camping: string
  tips: string
}

interface ItineraireData {
  intro: string
  jours: JourItineraire[]
  conseils_pratiques: string[]
}

async function generateItineraire(
  input: RoadTripInput,
  tavilyContext: string
): Promise<ItineraireData> {
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
  "intro": "string (2-3 phrases d'intro sur la région et le voyage)",
  "jours": [
    {
      "numero": 1,
      "titre": "string (titre évocateur du jour)",
      "spots": [
        { "nom": "string", "description": "string (2-3 phrases)", "type": "string (Village, Plage, Montagne, Forêt, etc.)" }
      ],
      "camping": "string (lieu précis où dormir ce soir)",
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

Important : génère exactement ${input.duree} jours. Chaque jour = 2-3 spots. Spots réels et précis.`

  async function callGroq(temperature: number): Promise<ItineraireData> {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature,
      max_tokens: 3000,
    })
    const raw = completion.choices[0]?.message?.content ?? ''
    return JSON.parse(raw) as ItineraireData
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

    // Build email
    const emailEncoded = encodeURIComponent(input.email)
    const { subject, html } = buildRoadTripEmail({
      prenom: input.prenom,
      region: input.region,
      duree: input.duree,
      itineraire,
      emailEncoded,
    })

    // Send email via Resend
    const resend = new Resend(process.env.RESEND_API_KEY)
    await resend.emails.send({
      from: 'Vanzon Explorer <roadtrip@vanzonexplorer.com>',
      to: input.email,
      subject,
      html,
    })

    // Update Supabase (sent)
    await supabase
      .from('road_trip_requests')
      .update({
        status: 'sent',
        itineraire_json: itineraire,
        sent_at: new Date().toISOString(),
      })
      .eq('id', record.id)

    return NextResponse.json({ success: true, message: 'Road trip envoyé !' })
  } catch (err) {
    console.error('[road-trip/generate]', err)

    // Mark as error in Supabase
    await supabase
      .from('road_trip_requests')
      .update({ status: 'error' })
      .eq('id', record.id)

    return NextResponse.json(
      { success: false, error: 'Erreur interne, réessaie dans quelques instants.' },
      { status: 500 }
    )
  }
}
