// src/lib/serpapi-with-fallback.ts
// Client SerpAPI avec rotation de 3 clés API (même pattern que groq-with-fallback).
// Quand une clé atteint son quota mensuel (250 req/mois plan gratuit), switch auto.

export interface SerpApiImageResult {
  original: string
  title: string
  source: string
  thumbnail: string
}

export interface SerpApiSearchResult {
  images: SerpApiImageResult[]
  keyUsed: number // index de la clé utilisée (1, 2 ou 3)
}

function getKeys(): string[] {
  return [
    process.env.SERPAPI_KEY,
    process.env.SERPAPI_KEY_2,
    process.env.SERPAPI_KEY_3,
  ].filter(Boolean) as string[]
}

function isQuotaError(status: number, body: string): boolean {
  return (
    status === 429 ||
    status === 403 ||
    body.includes('quota') ||
    body.includes('limit') ||
    body.includes('exceeded') ||
    body.includes('Your plan') ||
    body.includes('upgrade')
  )
}

/**
 * Recherche Google Images via SerpAPI avec rotation de clés.
 * Retourne les N premiers résultats images.
 */
export async function serpApiImageSearch(
  query: string,
  opts: { num?: number; gl?: string; hl?: string } = {}
): Promise<SerpApiSearchResult> {
  const keys = getKeys()
  if (keys.length === 0) throw new Error('No SERPAPI_KEY configured')

  const { num = 5, gl = 'fr', hl = 'fr' } = opts
  let lastError: Error = new Error('SerpAPI: all keys exhausted')

  for (let i = 0; i < keys.length; i++) {
    const apiKey = keys[i]
    const params = new URLSearchParams({
      engine: 'google_images',
      q: query,
      api_key: apiKey,
      num: String(num),
      gl,
      hl,
      safe: 'active',
      ijn: '0',
    })

    try {
      const res = await fetch(`https://serpapi.com/search.json?${params}`, {
        signal: AbortSignal.timeout(20000),
      })

      const bodyText = await res.text()

      if (!res.ok) {
        if (isQuotaError(res.status, bodyText)) {
          console.warn(`[serpapi] key ${i + 1} quota exceeded, switching...`)
          continue
        }
        throw new Error(`SerpAPI HTTP ${res.status}: ${bodyText.slice(0, 200)}`)
      }

      const data = JSON.parse(bodyText) as {
        images_results?: Array<{
          original?: string
          title?: string
          source?: string
          thumbnail?: string
        }>
        error?: string
      }

      if (data.error) {
        if (data.error.includes('quota') || data.error.includes('limit') || data.error.includes('upgrade')) {
          console.warn(`[serpapi] key ${i + 1} quota in response body, switching...`)
          continue
        }
        throw new Error(`SerpAPI error: ${data.error}`)
      }

      const images: SerpApiImageResult[] = (data.images_results ?? [])
        .filter((r) => r.original && r.original.startsWith('http'))
        .map((r) => ({
          original: r.original!,
          title: r.title ?? '',
          source: r.source ?? '',
          thumbnail: r.thumbnail ?? '',
        }))

      return { images, keyUsed: i + 1 }
    } catch (err) {
      lastError = err as Error
      console.warn(`[serpapi] key ${i + 1} failed: ${lastError.message.slice(0, 120)}`)
    }
  }

  throw lastError
}
