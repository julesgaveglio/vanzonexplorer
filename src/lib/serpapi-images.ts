/**
 * Fetch a specific image via SERPAPI Google Images search.
 * Returns the best high-resolution original image (≥1200px wide when possible).
 * Falls back to provided URL if API fails or key is missing.
 * Cached 7 days via Next.js fetch cache.
 */

interface SerpApiImageResult {
  thumbnail?: string;
  original?: string;
  original_width?: number;
  original_height?: number;
  title?: string;
  source?: string;
}

export interface SerpApiImage {
  url: string;       // high-res original URL
  thumbnail: string; // Google CDN thumbnail (fallback)
  title: string;
  source: string;
}

export async function fetchSerpApiImage(
  query: string,
  fallbackUrl?: string
): Promise<SerpApiImage | null> {
  const apiKey = process.env.SERPAPI_KEY;
  const fallback = fallbackUrl ?? null;

  if (!apiKey) {
    return fallback ? { url: fallback, thumbnail: fallback, title: query, source: '' } : null;
  }

  try {
    const params = new URLSearchParams({
      q: query,
      tbm: 'isch',
      api_key: apiKey,
      num: '10',        // more candidates to pick from
      gl: 'fr',
      hl: 'fr',
      safe: 'active',
      tbs: 'isz:l',     // large images only
    });

    const res = await fetch(`https://serpapi.com/search.json?${params}`, {
      next: { revalidate: 86400 * 7 }, // cache 1 week
    });

    if (!res.ok) {
      return fallback ? { url: fallback, thumbnail: fallback, title: query, source: '' } : null;
    }

    const data: { images_results?: SerpApiImageResult[] } = await res.json();
    const images = data.images_results;

    if (!images?.length) {
      return fallback ? { url: fallback, thumbnail: fallback, title: query, source: '' } : null;
    }

    // Pick the best image: prefer ≥1200px wide, then ≥800px, then anything with an original
    const best =
      images.find((img) => img.original && img.original_width && img.original_width >= 1200) ??
      images.find((img) => img.original && img.original_width && img.original_width >= 800) ??
      images.find((img) => img.original) ??
      images[0];

    const thumbnail = best.thumbnail ?? fallback ?? '';
    const original = best.original ?? thumbnail;

    return {
      url: original,
      thumbnail,
      title: best.title ?? query,
      source: best.source ?? '',
    };
  } catch {
    return fallback ? { url: fallback, thumbnail: fallback, title: query, source: '' } : null;
  }
}

/**
 * Fetch multiple SERPAPI images in parallel.
 * Returns an array aligned with the input queries.
 */
export async function fetchSerpApiImages(
  queries: string[],
  fallbackUrl?: string
): Promise<(SerpApiImage | null)[]> {
  return Promise.all(queries.map((q) => fetchSerpApiImage(q, fallbackUrl)));
}
