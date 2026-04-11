// src/lib/road-trip-pb/geocoding.ts
// Wrapper Nominatim pour géocoder les POIs du cache.
// Respecte la ToS : 1 req/s max, User-Agent obligatoire, Referer fourni.

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search'
const USER_AGENT = 'VanzonExplorer/1.0 (contact@vanzonexplorer.com)'

export interface GeocodeResult {
  lat: number
  lng: number
  display_name: string
}

export async function geocode(query: string): Promise<GeocodeResult | null> {
  const params = new URLSearchParams({
    q: query,
    format: 'json',
    limit: '1',
    addressdetails: '0',
    countrycodes: 'fr,es', // Pays Basque FR + Euskadi
  })
  const url = `${NOMINATIM_URL}?${params}`
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        Referer: 'https://vanzonexplorer.com',
        'Accept-Language': 'fr',
      },
      signal: AbortSignal.timeout(15000),
    })
    if (!res.ok) {
      console.warn(`[geocoding] ${res.status} for "${query}"`)
      return null
    }
    const data = (await res.json()) as Array<{
      lat: string
      lon: string
      display_name: string
    }>
    if (!data || data.length === 0) return null
    return {
      lat: Number(data[0].lat),
      lng: Number(data[0].lon),
      display_name: data[0].display_name,
    }
  } catch (err) {
    console.warn('[geocoding] error:', (err as Error).message)
    return null
  }
}

export function formatCoordinates(result: { lat: number; lng: number }): string {
  return `${result.lat.toFixed(6)},${result.lng.toFixed(6)}`
}

// Centroid de fallback par ville (pour POIs non géocodables)
export const CITY_FALLBACK_COORDS: Record<string, [number, number]> = {
  'Biarritz': [43.4832, -1.5586],
  'Bayonne': [43.4933, -1.4745],
  'Anglet': [43.4851, -1.5166],
  'Saint-Jean-de-Luz': [43.3895, -1.6626],
  'Hendaye': [43.3587, -1.7755],
  'Espelette': [43.3406, -1.4425],
  'Ainhoa': [43.3058, -1.4983],
  'Saint-Jean-Pied-de-Port': [43.1631, -1.2366],
  'Itxassou': [43.3261, -1.4239],
  'Sare': [43.3122, -1.5800],
  'Bidarray': [43.2706, -1.3508],
  'Cambo-les-Bains': [43.3583, -1.4028],
  'Guéthary': [43.4244, -1.6083],
  'Bidart': [43.4417, -1.5900],
  'Urrugne': [43.3789, -1.6986],
  'Larrau': [42.9589, -1.0164],
  'Sainte-Engrace': [43.0028, -0.9347],
  'Lecumberry': [43.0703, -1.1447],
  'Iraty': [43.0253, -1.0825],
}

export function getCityFallback(city: string): [number, number] | null {
  return CITY_FALLBACK_COORDS[city] ?? null
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
