export interface PixabayPhoto {
  url: string;
  alt: string;
  photographer: string;
  photographerUrl: string;
}

/**
 * Fetch a single Pixabay photo for use in pages (server component).
 * Returns fallback if API key not set or request fails.
 * Uses Next.js fetch cache with 24h revalidation.
 */
export async function fetchPixabayPhoto(
  query: string,
  fallbackUrl?: string
): Promise<PixabayPhoto | null> {
  const apiKey = process.env.PIXABAY_API_KEY;

  const fallback = fallbackUrl
    ? { url: fallbackUrl, alt: query, photographer: "", photographerUrl: "" }
    : null;

  if (!apiKey) return fallback;

  try {
    const params = new URLSearchParams({
      key: apiKey,
      q: query,
      image_type: "photo",
      orientation: "horizontal",
      per_page: "5",
      lang: "fr",
      safesearch: "true",
      min_width: "1200",
    });

    const res = await fetch(`https://pixabay.com/api/?${params}`, {
      next: { revalidate: 86400 },
    });

    if (!res.ok) return fallback;

    const data = await res.json();
    const hit = data.hits?.[0];
    if (!hit) return fallback;

    return {
      url: hit.largeImageURL,
      alt: hit.tags || query,
      photographer: hit.user,
      photographerUrl: `https://pixabay.com/users/${hit.user}-${hit.user_id}/`,
    };
  } catch {
    return fallback;
  }
}
