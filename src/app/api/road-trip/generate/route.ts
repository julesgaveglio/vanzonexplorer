// src/app/api/road-trip/generate/route.ts
// v2 — Road Trip Personnalisé Pays Basque (lead magnet)
// Flow : form → cache POI → (fallback Tavily) → Groq itinéraire → Resend email → save lead
// SSE streaming pour progress UX + rate limit IP conservés.

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { Resend } from 'resend'
import { createSupabaseAdmin } from '@/lib/supabase/server'
import { groqWithFallback } from '@/lib/groq-with-fallback'
import { buildRoadTripEmailV2 } from '@/emails/road-trip-v2'
import {
  getPOIsFromCache,
  scrapePOIsViaTavily,
  scrapeOvernightSpotsViaTavily,
  upsertPOIs,
} from '@/lib/road-trip/poi-cache'
import {
  DURATION_TO_DAYS,
  BUDGET_LEVEL_TO_LEGACY,
  INTEREST_TO_LEGACY,
} from '@/types/roadtrip'
import type {
  GeneratedItineraryV2,
  POIRow,
  InterestKey,
  OvernightPreference,
  DurationKey,
  BudgetLevel,
  GroupType,
  VanStatus,
} from '@/types/roadtrip'
import {
  notifySuccess,
  notifyError as telegramNotifyError,
} from '@/lib/road-trip/telegram'

export const maxDuration = 60

// ─── Rate limiting (in-memory, best-effort) ──────────────────────────────────
const ipRequestMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT = 3
const RATE_WINDOW_MS = 60 * 60 * 1000 // 1h

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

// ─── Zod schema (form v2) ────────────────────────────────────────────────────
const RoadTripV2Schema = z.object({
  firstname: z.string().min(2).max(50),
  email: z.string().email(),
  groupType: z.enum(['solo', 'couple', 'amis', 'famille']),
  vanStatus: z.enum(['proprietaire', 'locataire']),
  scope: z.enum(['france', 'france_espagne']),
  duration: z.enum(['1j', '2-3j', '4-5j', '1sem']),
  interests: z
    .array(z.enum(['sport', 'nature', 'gastronomie', 'culture', 'plages', 'soirees']))
    .min(1)
    .max(6),
  budgetLevel: z.enum(['faible', 'moyen', 'eleve']),
  overnightPreference: z.enum(['gratuit', 'aires_officielles', 'camping', 'mix']),
})

type RoadTripV2Input = z.infer<typeof RoadTripV2Schema>

// ─── SSE emitter ─────────────────────────────────────────────────────────────
type EmitFn = (type: string, payload?: Record<string, unknown>) => Promise<void>

function createEmitter(writer: WritableStreamDefaultWriter<Uint8Array>): EmitFn {
  const encoder = new TextEncoder()
  return async (type, payload = {}) => {
    try {
      await writer.write(
        encoder.encode(`data: ${JSON.stringify({ type, ...payload })}\n\n`)
      )
    } catch {
      /* client disconnected */
    }
  }
}

// ─── Fetch POIs (cache-first) ────────────────────────────────────────────────
async function fetchPOIsForProfile(
  interests: InterestKey[],
  budgetLevel: BudgetLevel,
  overnightPreference: OvernightPreference
): Promise<{ pois: POIRow[]; overnightSpots: POIRow[] }> {
  const { pois, overnightSpots } = await getPOIsFromCache(interests, overnightPreference)

  let finalPOIs = pois
  let finalOvernight = overnightSpots

  if (pois.length < 10) {
    console.log(`[road-trip/generate] POI cache insufficient (${pois.length}) — scraping Tavily`)
    const scraped = await scrapePOIsViaTavily(interests, budgetLevel)
    if (scraped.length > 0) {
      await upsertPOIs(scraped)
      finalPOIs = [...pois, ...(scraped as unknown as POIRow[])]
    }
  }

  if (overnightSpots.length < 3) {
    console.log(
      `[road-trip/generate] Overnight cache insufficient (${overnightSpots.length}) — scraping Tavily`
    )
    const scraped = await scrapeOvernightSpotsViaTavily(overnightPreference)
    if (scraped.length > 0) {
      await upsertPOIs(scraped)
      finalOvernight = [...overnightSpots, ...(scraped as unknown as POIRow[])]
    }
  }

  return { pois: finalPOIs, overnightSpots: finalOvernight }
}

// ─── Prompt descriptors ──────────────────────────────────────────────────────
const GROUP_LABELS: Record<GroupType, string> = {
  solo: 'voyageur solo',
  couple: 'couple',
  amis: "groupe d'amis",
  famille: 'famille avec enfants',
}

const BUDGET_LABELS: Record<BudgetLevel, string> = {
  faible: 'budget serré (< 30€/pers/jour)',
  moyen: 'budget confort (30-80€/pers/jour)',
  eleve: 'budget premium (80€+/pers/jour)',
}

const OVERNIGHT_LABELS: Record<OvernightPreference, string> = {
  gratuit: 'parkings gratuits & spots sauvages tolérés',
  aires_officielles: 'aires camping-car officielles (gratuit ou < 15€/nuit)',
  camping: 'campings van-friendly (15-30€/nuit)',
  mix: 'mix des options selon les étapes',
}

const SCOPE_INSTRUCTIONS: Record<'france' | 'france_espagne', string> = {
  france: `Périmètre : Pays Basque FRANÇAIS uniquement (Labourd, Basse-Navarre, Soule).
Villes/spots autorisés : Biarritz, Bayonne, Anglet, Saint-Jean-de-Luz, Hendaye, Espelette, Ainhoa, Saint-Jean-Pied-de-Port, Itxassou, Sare, La Rhune, Iraty, Gorges de Kakuetta, Larrau, Bidarray, Cambo-les-Bains, etc. N'inclus PAS de spots espagnols.`,
  france_espagne: `Périmètre : Pays Basque FRANÇAIS + ESPAGNOL. L'utilisateur est ouvert à traverser la frontière.
Côté français : Biarritz, Bayonne, Anglet, Saint-Jean-de-Luz, Hendaye, Espelette, Ainhoa, Saint-Jean-Pied-de-Port, Itxassou, Sare, La Rhune, Iraty, etc.
Côté espagnol (Euskadi) : Hondarribia / Fontarrabie, Pasaia, San Sebastián / Donostia, Getaria, Zarautz, Bilbao, Guernica, Bermeo, Lekeitio, Mundaka, etc.
Inclus au moins 1 étape côté espagnol si la durée ≥ 2 jours. Précise la monnaie (€), signale le passage de frontière et rappelle l'assurance van valable en Espagne dans les tips.`,
}

// ─── Groq itinerary generation ───────────────────────────────────────────────
async function generateItineraryV2(
  input: RoadTripV2Input,
  pois: POIRow[],
  overnightSpots: POIRow[]
): Promise<GeneratedItineraryV2> {
  const durationDays = DURATION_TO_DAYS[input.duration]
  const groupLabel = GROUP_LABELS[input.groupType]
  const budgetLabel = BUDGET_LABELS[input.budgetLevel]
  const overnightLabel = OVERNIGHT_LABELS[input.overnightPreference]
  const scopeInstruction = SCOPE_INSTRUCTIONS[input.scope]

  // POIs/overnight passés au modèle — version réduite pour économiser les tokens
  const poiSummary = pois.slice(0, 30).map((p) => ({
    name: p.name,
    category: p.category,
    subcategory: p.subcategory,
    city: p.location_city,
    address: p.address,
    description: p.description,
    url: p.external_url || p.google_maps_url,
    tags: p.tags,
    budget: p.budget_level,
  }))

  const overnightSummary = overnightSpots.slice(0, 15).map((o) => ({
    name: o.name,
    type: o.overnight_type,
    price: o.overnight_price_per_night,
    city: o.location_city,
    address: o.address,
    coordinates: o.overnight_coordinates,
    maps_url: o.google_maps_url,
    amenities: o.overnight_amenities,
    restrictions: o.overnight_restrictions,
    description: o.description,
    capacity: o.overnight_capacity,
  }))

  const systemPrompt = `Tu es un expert du Pays Basque et un vanlifer expérimenté. Tu crées des itinéraires van pratiques, locaux et authentiques. Tu connais les spots de nuit discrets, les parkings adaptés aux grands véhicules, et les meilleures adresses selon les profils. Chaque journée se termine OBLIGATOIREMENT par un spot de nuit concret (parking, aire, camping) avec les informations pratiques pour garer et dormir dans le van.

Réponds UNIQUEMENT avec du JSON valide. Aucun texte avant ou après. Aucun backtick markdown.`

  const userPrompt = `Crée un road trip van au Pays Basque pour ce profil :
- Voyageur : ${groupLabel} (${input.firstname})
- Durée : ${durationDays} jour${durationDays > 1 ? 's' : ''}
- Centres d'intérêt : ${input.interests.join(', ')}
- Budget activités/repas : ${budgetLabel}
- Préférence nuit en van : ${overnightLabel}

${scopeInstruction}

POIs activités disponibles (utilise en priorité, avec leurs URLs exactes) :
${JSON.stringify(poiSummary)}

Spots de nuit disponibles (OBLIGATOIRE : 1 spot par nuit, utilise ceux-ci en priorité) :
${JSON.stringify(overnightSummary)}

Contraintes :
- Exactement ${durationDays} journée${durationDays > 1 ? 's' : ''}.
- Chaque journée = 3 à 5 étapes ("stops") dans l'ordre chronologique (matin → soir).
- Chaque journée termine par un champ "overnight" concret (jamais inventé, piocher dans la liste ci-dessus en priorité).
- Budgets indicatifs réalistes pour chaque stop.
- Les URLs viennent des POI réels fournis, pas d'invention.

Retourne STRICTEMENT ce JSON (aucun texte avant/après, aucun backtick) :
{
  "title": "Titre accrocheur du road trip",
  "intro": "2-3 phrases d'introduction personnalisée à ${input.firstname}",
  "days": [
    {
      "day": 1,
      "theme": "Thème évocateur de la journée",
      "stops": [
        {
          "time": "9h00",
          "name": "Nom du lieu",
          "type": "activite|restaurant|culture|nature|plage|soiree",
          "description": "2-3 phrases pratiques et évocatrices",
          "address": "adresse complète",
          "url": "lien externe (site officiel ou Google Maps)",
          "budget_indicatif": "gratuit | 5-15€ | 20-50€"
        }
      ],
      "overnight": {
        "name": "Nom du spot de nuit",
        "type": "parking_gratuit|aire_camping_car|camping_van|spot_sauvage",
        "price": "gratuit | 8€/nuit | 22€/nuit",
        "address": "adresse",
        "coordinates": "lat,lng",
        "google_maps_url": "url",
        "amenities": ["eau potable", "vidange"],
        "restrictions": "ex: 72h max, interdit en août",
        "tip": "astuce pratique pour ce spot (heure d'arrivée conseillée, discrétion, etc.)"
      }
    }
  ],
  "tips_van": [
    "conseil pratique spécifique van 1",
    "conseil 2",
    "conseil 3"
  ],
  "cta": "phrase d'appel à l'action pour louer un van Vanzon"
}`

  const { content, modelUsed, fallbackUsed } = await groqWithFallback({
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    model: 'llama-3.3-70b-versatile',
    temperature: 0.6,
    response_format: { type: 'json_object' },
    max_tokens: 5000,
  })

  const parsed = extractItineraryJson(content)
  return { ...parsed, version: 'v2', _modelMeta: { modelUsed, fallbackUsed } } as GeneratedItineraryV2 & {
    _modelMeta: { modelUsed: string; fallbackUsed: boolean }
  }
}

function extractItineraryJson(raw: string): Omit<GeneratedItineraryV2, 'version'> {
  const tryParse = (s: string) => JSON.parse(s) as Omit<GeneratedItineraryV2, 'version'>
  try {
    return tryParse(raw.trim())
  } catch {
    /* fallthrough */
  }
  const stripped = raw
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/, '')
    .trim()
  try {
    return tryParse(stripped)
  } catch {
    /* fallthrough */
  }
  const match = raw.match(/\{[\s\S]*\}/)
  if (match) {
    try {
      return tryParse(match[0])
    } catch {
      /* fallthrough */
    }
  }
  throw new Error('[road-trip/generate v2] invalid JSON in Groq response')
}

// ─── Legacy field mapping for road_trip_requests NOT NULL constraints ────────
function buildLegacyFields(input: RoadTripV2Input) {
  const currentMonth = [
    'janvier', 'fevrier', 'mars', 'avril', 'mai', 'juin',
    'juillet', 'aout', 'septembre', 'octobre', 'novembre', 'decembre',
  ][new Date().getMonth()]

  return {
    prenom: input.firstname,
    email: input.email,
    region: 'Pays Basque',
    region_slug: 'pays-basque',
    duree: DURATION_TO_DAYS[input.duration],
    interets: input.interests.map((i) => INTEREST_TO_LEGACY[i]),
    style_voyage: 'explorer',
    periode: currentMonth,
    profil_voyageur: input.groupType,
    budget: BUDGET_LEVEL_TO_LEGACY[input.budgetLevel],
    experience_van: input.vanStatus === 'proprietaire',
  }
}

// ─── Rate limit error detection ──────────────────────────────────────────────
function isRateLimitError(err: unknown): boolean {
  const msg = (err as Error)?.message ?? ''
  const status = (err as { status?: number })?.status
  return (
    msg.includes('rate_limit_exceeded') ||
    msg.includes('Rate limit') ||
    msg.includes('429') ||
    status === 429
  )
}

// ─── Main handler ────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { success: false, error: 'Trop de demandes, réessayez dans une heure.' },
      { status: 429 }
    )
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ success: false, error: 'Données invalides.' }, { status: 400 })
  }

  const parsed = RoadTripV2Schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: 'Données invalides.', details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const input = parsed.data
  const supabase = createSupabaseAdmin()

  // Désabonnés
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

  // Anti-double envoi : 1 road trip/email/24h
  const { data: existing } = await supabase
    .from('road_trip_requests')
    .select('id')
    .eq('email', input.email)
    .eq('status', 'sent')
    .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    .maybeSingle()
  if (existing) {
    return NextResponse.json(
      { success: false, error: "Vous avez déjà reçu un road trip aujourd'hui. Réessayez demain !" },
      { status: 429 }
    )
  }

  // Insert initial (status pending, skip publisher via article_sanity_id sentinel)
  const legacyFields = buildLegacyFields(input)
  const { data: record, error: insertError } = await supabase
    .from('road_trip_requests')
    .insert({
      ...legacyFields,
      // Nouveaux champs lead v2
      lead_firstname: input.firstname,
      lead_email: input.email,
      van_status: input.vanStatus,
      group_type: input.groupType,
      budget_level: input.budgetLevel,
      overnight_preference: input.overnightPreference,
      contacted: false,
      status: 'pending',
      // Sentinel pour bypass du road-trip-publisher-agent (il ignore les records avec article_sanity_id non NULL)
      article_sanity_id: 'skip_v2',
    })
    .select('id')
    .single()

  if (insertError || !record) {
    console.error('[road-trip/generate v2] insert error:', insertError?.message)
    return NextResponse.json(
      { success: false, error: 'Erreur interne, réessayez dans quelques instants.' },
      { status: 500 }
    )
  }

  // ─── Start SSE stream ──────────────────────────────────────────────────────
  const { readable, writable } = new TransformStream<Uint8Array, Uint8Array>()
  const writer = writable.getWriter()
  const emit = createEmitter(writer)

  void (async () => {
    let modelMeta: { modelUsed: string; fallbackUsed: boolean } | undefined
    try {
      await emit('progress', { message: '🗺️  On prépare votre aventure au Pays Basque...' })

      // Étape 1 : POI cache-first
      await emit('progress', { message: '📍  On sélectionne les meilleurs spots pour votre profil...' })
      const { pois, overnightSpots } = await fetchPOIsForProfile(
        input.interests,
        input.budgetLevel,
        input.overnightPreference
      )

      if (pois.length === 0) {
        throw new Error("Aucun POI disponible — le cache est vide et le scraping a échoué")
      }

      // Étape 2 : Groq itinéraire
      await emit('progress', {
        message: `🌅  On construit votre itinéraire sur ${DURATION_TO_DAYS[input.duration]} jour(s)...`,
      })
      await emit('progress', { message: '🌙  On sélectionne vos spots de nuit van...' })
      const itineraryWithMeta = (await generateItineraryV2(input, pois, overnightSpots)) as GeneratedItineraryV2 & {
        _modelMeta?: { modelUsed: string; fallbackUsed: boolean }
      }
      modelMeta = itineraryWithMeta._modelMeta
      // Strip meta before persisting
      const itinerary: GeneratedItineraryV2 = {
        title: itineraryWithMeta.title,
        intro: itineraryWithMeta.intro,
        days: itineraryWithMeta.days,
        tips_van: itineraryWithMeta.tips_van ?? [],
        cta: itineraryWithMeta.cta ?? 'Louez un van Vanzon Explorer au Pays Basque',
        version: 'v2',
      }

      await emit('progress', { message: '📬  On finalise votre road trip et on vous envoie tout ça...' })

      // Étape 3 : Email Resend
      if (!process.env.RESEND_API_KEY) throw new Error('RESEND_API_KEY is not set')
      const resend = new Resend(process.env.RESEND_API_KEY)
      const emailEncoded = encodeURIComponent(input.email)
      const { subject, html } = buildRoadTripEmailV2({
        firstname: input.firstname,
        duree: DURATION_TO_DAYS[input.duration],
        itinerary,
        emailEncoded,
      })

      const { error: resendError } = await resend.emails.send({
        from: 'Vanzon Explorer <noreply@vanzonexplorer.com>',
        to: input.email,
        subject,
        html,
      })
      if (resendError) throw new Error(`Resend error: ${JSON.stringify(resendError)}`)

      // Étape 4 : Save itinéraire + status sent
      await supabase
        .from('road_trip_requests')
        .update({
          status: 'sent',
          itineraire_json: itinerary,
          sent_at: new Date().toISOString(),
        })
        .eq('id', record.id)

      // Telegram success — message enrichi avec toute la data
      const totalStops = itinerary.days.reduce((a, d) => a + (d.stops?.length ?? 0), 0)
      const daysCount = DURATION_TO_DAYS[input.duration]
      const groupLabels: Record<string, string> = { solo: 'Solo', couple: 'Couple', amis: 'Amis', famille: 'Famille' }
      const budgetLabels: Record<string, string> = { faible: 'Petit budget', moyen: 'Moyen', eleve: 'Confort' }
      const overnightLabels: Record<string, string> = { gratuit: 'Gratuit', aires_officielles: 'Aires officielles', camping: 'Camping', mix: 'Mix' }
      const scopeLabels: Record<string, string> = { france: 'FR uniquement', france_espagne: 'FR + Espagne' }
      const interestLabels: Record<string, string> = { sport: 'Sport', nature: 'Nature', gastronomie: 'Gastro', culture: 'Culture', plages: 'Plages', soirees: 'Soirées' }

      const spotsList = itinerary.days
        .flatMap((d) => (d.stops ?? []).map((s) => s.name))
        .slice(0, 8)
        .join(', ')

      const telegramMsg = [
        `🎉 *Nouveau road trip généré !*`,
        ``,
        `👤 *${input.firstname}*`,
        `📧 \`${input.email}\``,
        `🚐 ${input.vanStatus === 'proprietaire' ? 'Propriétaire' : 'Locataire'}`,
        `👥 ${groupLabels[input.groupType] ?? input.groupType}`,
        `📅 ${daysCount} jour${daysCount > 1 ? 's' : ''}`,
        `🎯 ${input.interests.map((i) => interestLabels[i] ?? i).join(', ')}`,
        `💰 ${budgetLabels[input.budgetLevel] ?? input.budgetLevel}`,
        `🌙 ${overnightLabels[input.overnightPreference] ?? input.overnightPreference}`,
        `🗺️ ${scopeLabels[input.scope] ?? input.scope}`,
        ``,
        `📍 *"${itinerary.title}"*`,
        `🛣️ ${totalStops} étapes · ${overnightSpots.length} spots nuit`,
        `📌 ${spotsList}${totalStops > 8 ? '...' : ''}`,
        ``,
        `🤖 \`${modelMeta?.modelUsed ?? 'unknown'}\`${modelMeta?.fallbackUsed ? ' (fallback)' : ''}`,
        `_${new Date().toLocaleString('fr-FR', { timeZone: 'Europe/Paris' })}_`,
      ].join('\n')

      void (async () => {
        try {
          if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
            await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                chat_id: process.env.TELEGRAM_CHAT_ID,
                text: telegramMsg,
                parse_mode: 'Markdown',
              }),
            })
          }
        } catch { /* non-blocking */ }
      })()

      await emit('progress', { message: "✅  C'est prêt ! Vérifiez votre boîte mail 🎉" })
      await emit('done', {})
    } catch (err) {
      const error = err as Error
      console.error('[road-trip/generate v2]', error.message)

      void telegramNotifyError(
        {
          prenom: input.firstname,
          email: input.email,
          region: 'Pays Basque',
          duree: DURATION_TO_DAYS[input.duration],
        },
        error,
        modelMeta?.modelUsed ? [modelMeta.modelUsed] : []
      )

      const userMessage = isRateLimitError(err)
        ? 'Notre IA est momentanément surchargée 😅 Réessayez dans 2-3 minutes !'
        : 'Erreur interne, réessayez dans quelques instants.'

      await emit('error', { message: userMessage })
      await supabase
        .from('road_trip_requests')
        .update({ status: 'error' })
        .eq('id', record.id)
    } finally {
      try {
        await writer.close()
      } catch {
        /* already closed */
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

// Typage utilitaire — évite l'avertissement no-unused-vars sur VanStatus
export type { VanStatus, DurationKey }
