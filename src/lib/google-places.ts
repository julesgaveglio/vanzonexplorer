export interface GooglePlaceStats {
  rating: number;
  reviewCount: number;
  ratingDisplay: string;
}

/** Un avis Google réel, tel que renvoyé par l'API Place Details. */
export interface GoogleReview {
  author: string;
  authorUrl: string | null;
  photoUrl: string | null;
  rating: number;
  text: string;
  relativeTime: string;
  time: number;
}

export interface GooglePlaceData extends GooglePlaceStats {
  /** Lien vers la fiche Google Maps (onglet avis). */
  mapsUrl: string | null;
  /** Avis réels — l'API Google en renvoie 5 au maximum (limite Google). */
  reviews: GoogleReview[];
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

/**
 * Fiche complète avec les avis réels.
 *
 * ⚠️ Limite Google : l'API Place Details ne renvoie QUE 5 avis (les plus
 * pertinents). Il n'existe aucun moyen officiel d'en récupérer davantage —
 * l'accès à tous les avis passe par le Google Business Profile (compte
 * propriétaire), pas par l'API Places publique. On affiche donc les 5 avis
 * réels + la note et le nombre total réels, avec un lien vers la fiche
 * complète sur Google Maps.
 *
 * Renvoie `null` si l'API n'est pas configurée ou échoue — l'appelant décide
 * alors quoi afficher (repli statique).
 */
export async function getGooglePlaceData(): Promise<GooglePlaceData | null> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  const placeId = process.env.GOOGLE_PLACE_ID;

  if (!apiKey || !placeId) return null;

  try {
    const res = await fetch(
      "https://maps.googleapis.com/maps/api/place/details/json?" +
        new URLSearchParams({
          place_id: placeId,
          fields: "rating,user_ratings_total,reviews,url",
          reviews_sort: "most_relevant",
          reviews_no_translations: "true",
          language: "fr",
          key: apiKey,
        }),
      { next: { revalidate: 900 } }
    );

    if (!res.ok) return null;

    const data = await res.json();
    const result = data?.result;
    if (!result) return null;

    const rating = typeof result.rating === "number" ? result.rating : FALLBACK.rating;
    const reviewCount =
      typeof result.user_ratings_total === "number" ? result.user_ratings_total : FALLBACK.reviewCount;

    const reviews: GoogleReview[] = Array.isArray(result.reviews)
      ? result.reviews
          .filter((r: { text?: string }) => typeof r.text === "string" && r.text.trim().length > 0)
          .map(
            (r: {
              author_name?: string;
              author_url?: string;
              profile_photo_url?: string;
              rating?: number;
              text?: string;
              relative_time_description?: string;
              time?: number;
            }): GoogleReview => ({
              author: r.author_name ?? "Client Google",
              authorUrl: r.author_url ?? null,
              photoUrl: r.profile_photo_url ?? null,
              rating: typeof r.rating === "number" ? r.rating : 5,
              text: (r.text ?? "").trim(),
              relativeTime: r.relative_time_description ?? "",
              time: typeof r.time === "number" ? r.time : 0,
            })
          )
      : [];

    return {
      rating,
      reviewCount,
      ratingDisplay: rating.toFixed(1),
      mapsUrl: typeof result.url === "string" ? result.url : null,
      reviews,
    };
  } catch {
    return null;
  }
}
