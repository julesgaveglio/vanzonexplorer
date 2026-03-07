const PEXELS_API_KEY = process.env.PEXELS_API_KEY!;
const BASE_URL = "https://api.pexels.com/v1";

export interface PexelsPhoto {
  id: number;
  url: string;
  photographer: string;
  photographerUrl: string;
  src: {
    original: string;
    large2x: string;
    large: string;
    medium: string;
  };
  alt: string;
}

interface PexelsSearchResponse {
  photos: Array<{
    id: number;
    url: string;
    photographer: string;
    photographer_url: string;
    src: {
      original: string;
      large2x: string;
      large: string;
      medium: string;
    };
    alt: string;
  }>;
  total_results: number;
}

/**
 * Search Pexels for photos matching the given keywords.
 * Returns the best landscape photo, or null if none found.
 */
export async function searchPexelsPhoto(
  query: string,
  orientation: "landscape" | "portrait" | "square" = "landscape"
): Promise<PexelsPhoto | null> {
  if (!PEXELS_API_KEY) {
    throw new Error("PEXELS_API_KEY environment variable is not set");
  }

  const params = new URLSearchParams({
    query,
    orientation,
    per_page: "5",
    size: "large",
  });

  const res = await fetch(`${BASE_URL}/search?${params}`, {
    headers: { Authorization: PEXELS_API_KEY },
  });

  if (!res.ok) {
    throw new Error(`Pexels API error: ${res.status} ${res.statusText}`);
  }

  const data: PexelsSearchResponse = await res.json();

  if (!data.photos || data.photos.length === 0) return null;

  const photo = data.photos[0];
  return {
    id: photo.id,
    url: photo.url,
    photographer: photo.photographer,
    photographerUrl: photo.photographer_url,
    src: photo.src,
    alt: photo.alt,
  };
}

/**
 * Download a Pexels photo as a Buffer (using the large2x size).
 */
export async function downloadPexelsPhoto(photo: PexelsPhoto): Promise<Buffer> {
  const res = await fetch(photo.src.large2x);
  if (!res.ok) {
    throw new Error(`Failed to download photo: ${res.status}`);
  }
  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Build the photo credit string.
 */
export function buildPexelsCredit(photo: PexelsPhoto): string {
  return `Photo by ${photo.photographer} on Pexels`;
}
