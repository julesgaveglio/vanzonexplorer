export interface GooglePlaceStats {
  rating: number;
  reviewCount: number;
  ratingDisplay: string;
}

const FALLBACK: GooglePlaceStats = {
  rating: 4.9,
  reviewCount: 33,
  ratingDisplay: "4.9",
};

export async function getGooglePlaceStats(): Promise<GooglePlaceStats> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  const placeId = process.env.GOOGLE_PLACE_ID;

  if (!apiKey || !placeId) return FALLBACK;

  try {
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(placeId)}&fields=rating,user_ratings_total&key=${apiKey}`,
      { next: { revalidate: 900 } } // Cached for 15 minutes by Next.js
    );

    if (!res.ok) return FALLBACK;

    const data = await res.json();
    const result = data?.result;
    if (!result) return FALLBACK;

    const rating = typeof result.rating === "number" ? result.rating : FALLBACK.rating;
    const reviewCount = typeof result.user_ratings_total === "number" ? result.user_ratings_total : FALLBACK.reviewCount;

    return {
      rating,
      reviewCount,
      ratingDisplay: rating.toFixed(1),
    };
  } catch {
    return FALLBACK;
  }
}
