// scripts/reenrich-and-resend.ts
// Ré-enrichit le dernier road trip (photos + maps) et le renvoie

import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import * as dotenv from 'dotenv'
import * as path from 'path'
import { buildRoadTripEmail } from '../src/emails/road-trip'

dotenv.config({ path: path.join(__dirname, '..', '.env.local') })

// ── Types ────────────────────────────────────────────────────────────────────
interface SpotBase { nom: string; description: string; type: string; search_query?: string }
interface SpotEnriched extends SpotBase {
  mapsUrl: string
  photo?: { url: string; photographer: string; photoUrl: string; source?: string }
  wiki?: { extract: string; url: string; thumbnail?: string }
  _lat?: number; _lon?: number
}
interface CampingOption { name: string; mapsUrl: string; fee?: string; motorhome?: string; lat?: number; lon?: number }
interface JourItineraire { numero: number; titre: string; spots: SpotBase[]; camping: string; campingMapsUrl?: string; campingOptions?: CampingOption[]; tips: string }
interface ItineraireData { intro: string; jours: JourItineraire[]; conseils_pratiques: string[] }

// ── Geocode ──────────────────────────────────────────────────────────────────
async function geocodeSpot(name: string, region: string): Promise<{ mapsUrl: string; lat?: number; lon?: number }> {
  try {
    const q = region ? `${name}, ${region}, France` : `${name}, France`
    const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1&countrycodes=fr`,
      { headers: { 'User-Agent': 'VanzonExplorer/1.0 (contact@vanzonexplorer.com)' } })
    const data = await res.json() as Array<{ lat?: string; lon?: string }>
    if (data[0]?.lat && data[0]?.lon) {
      return { mapsUrl: `https://www.google.com/maps?q=${data[0].lat},${data[0].lon}`, lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) }
    }
  } catch { /* ignore */ }
  return { mapsUrl: `https://maps.google.com/?q=${encodeURIComponent(name + (region ? ' ' + region : '') + ' France')}` }
}

// ── Pexels ───────────────────────────────────────────────────────────────────
async function fetchPexels(query: string) {
  if (!process.env.PEXELS_API_KEY) return null
  try {
    const res = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`,
      { headers: { Authorization: process.env.PEXELS_API_KEY } })
    const data = await res.json() as { photos?: Array<{ src: { large: string }; photographer: string; url: string }> }
    const p = data.photos?.[0]
    return p ? { url: p.src.large, photographer: p.photographer, photoUrl: p.url, source: 'pexels' } : null
  } catch { return null }
}

// ── Wikipedia ────────────────────────────────────────────────────────────────
async function fetchWiki(name: string) {
  try {
    const res = await fetch(`https://fr.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(name)}`,
      { headers: { 'User-Agent': 'VanzonExplorer/1.0' } })
    if (!res.ok) return null
    const d = await res.json() as { type?: string; extract?: string; content_urls?: { desktop?: { page?: string } }; thumbnail?: { source?: string } }
    if (d.type === 'disambiguation') return null
    return { extract: d.extract?.slice(0, 200) ?? '', url: d.content_urls?.desktop?.page ?? '', thumbnail: d.thumbnail?.source }
  } catch { return null }
}

// ── Overpass ─────────────────────────────────────────────────────────────────
async function fetchOverpass(lat: number, lon: number): Promise<CampingOption[]> {
  try {
    const q = `[out:json][timeout:12];(node["tourism"="camp_site"](around:80000,${lat},${lon});node["tourism"="caravan_site"](around:80000,${lat},${lon}););out body 12;`
    const res = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `data=${encodeURIComponent(q)}`, signal: AbortSignal.timeout(14000)
    })
    if (!res.ok) return []
    const data = await res.json() as { elements?: Array<{ lat?: number; lon?: number; tags?: Record<string, string> }> }
    return (data.elements ?? []).filter(e => e.tags?.name && e.lat && e.lon).slice(0, 12).map(e => ({
      name: e.tags!.name!, lat: e.lat, lon: e.lon,
      mapsUrl: `https://www.google.com/maps?q=${e.lat},${e.lon}`,
      fee: e.tags?.fee, motorhome: e.tags?.motorhome ?? e.tags?.motorcar
    }))
  } catch { return [] }
}

function nearestCampings(campings: CampingOption[], lat: number, lon: number, count = 3) {
  return [...campings].map(c => ({ ...c, _d: Math.sqrt(((c.lat ?? lat) - lat) ** 2 + ((c.lon ?? lon) - lon) ** 2) }))
    .sort((a, b) => a._d - b._d).slice(0, count)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    .map(({ _d, ...rest }) => rest)
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const targetEmail = process.argv[2] ?? 'gavegliojules@gmail.com'

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const resend = new Resend(process.env.RESEND_API_KEY!)

  const { data: rt } = await supabase
    .from('road_trip_requests')
    .select('id, prenom, email, region, duree, itineraire_json')
    .eq('email', targetEmail).eq('status', 'sent')
    .order('created_at', { ascending: false }).limit(1).single()

  if (!rt) { console.error('Aucun road trip trouvé'); process.exit(1) }
  console.log(`Road trip : ${rt.prenom} · ${rt.region} · ${rt.duree}j`)

  const itineraire = rt.itineraire_json as ItineraireData

  // Geocode region for Overpass
  console.log('🏕️  Recherche campings Overpass...')
  let allCampings: CampingOption[] = []
  const regionGeo = await geocodeSpot(rt.region, '')
  if (regionGeo.lat && regionGeo.lon) {
    allCampings = await fetchOverpass(regionGeo.lat, regionGeo.lon)
    console.log(`   → ${allCampings.length} campings trouvés`)
  }

  // Enrich each spot
  console.log('📸  Enrichissement photos + Maps...')
  let photoCount = 0
  const enrichedJours = await Promise.all(itineraire.jours.map(async (jour) => {
    const enrichedSpots: SpotEnriched[] = await Promise.all(jour.spots.map(async (spot) => {
      try {
        const [geo, wiki] = await Promise.all([geocodeSpot(spot.nom, rt.region), fetchWiki(spot.nom)])
        const specificQ = spot.search_query ?? `${spot.nom} ${rt.region} France`
        const genericQ = `${spot.type} ${rt.region} France`
        const [specific, generic] = await Promise.all([fetchPexels(specificQ), fetchPexels(genericQ)])
        const photo = specific ?? generic ?? (wiki?.thumbnail ? { url: wiki.thumbnail, photographer: 'Wikipedia', photoUrl: '', source: 'wikipedia' } : undefined)
        if (photo) photoCount++
        return { ...spot, mapsUrl: geo.mapsUrl, photo: photo ?? undefined, wiki: wiki ?? undefined, _lat: geo.lat, _lon: geo.lon }
      } catch {
        return { ...spot, mapsUrl: `https://maps.google.com/?q=${encodeURIComponent(spot.nom + ' France')}` }
      }
    }))

    const first = enrichedSpots[0] as SpotEnriched & { _lat?: number; _lon?: number }
    let campingOptions: CampingOption[] = []
    if (first?._lat && first?._lon && allCampings.length > 0) {
      campingOptions = nearestCampings(allCampings, first._lat, first._lon)
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const cleanSpots = enrichedSpots.map(({ _lat, _lon, ...rest }: SpotEnriched & { _lat?: number; _lon?: number }) => rest as SpotEnriched)
    const campingMapsUrl = `https://maps.google.com/?q=${encodeURIComponent(jour.camping + ' ' + rt.region + ' France camping')}`
    return { ...jour, spots: cleanSpots, campingMapsUrl, campingOptions }
  }))

  const enrichedItineraire = { ...itineraire, jours: enrichedJours }
  console.log(`   → ${photoCount}/${itineraire.jours.reduce((a, j) => a + j.spots.length, 0)} spots illustrés`)

  // Build + send email
  const emailEncoded = encodeURIComponent(rt.email)
  const { subject, html } = buildRoadTripEmail({ prenom: rt.prenom, region: rt.region, duree: rt.duree, itineraire: enrichedItineraire, emailEncoded })

  const { error: resendError } = await resend.emails.send({
    from: 'Vanzon Explorer <noreply@vanzonexplorer.com>',
    to: rt.email,
    subject: `[RESEND ✨] ${subject}`,
    html,
  })

  if (resendError) { console.error('❌ Resend error:', resendError); process.exit(1) }
  console.log(`📬 Email renvoyé à ${rt.email} avec photos !`)
}

main()
