import { createClient } from "next-sanity";
import { createImageUrlBuilder } from "@sanity/image-url";

export const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "placeholder";
export const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";
const apiVersion = "2024-01-01";

/** true si le projectId Sanity est configuré */
export const isSanityConfigured = projectId !== "placeholder" && projectId.length > 0;

export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: process.env.NODE_ENV === "production",
});

/**
 * Fetch sécurisé — retourne un fallback si Sanity n'est pas configuré
 */
export async function sanityFetch<T>(
  query: string,
  params?: Record<string, string>
): Promise<T | null> {
  if (!isSanityConfigured) return null;
  try {
    if (params) {
      return await client.fetch<T>(query, params);
    }
    return await client.fetch<T>(query);
  } catch (error) {
    console.error("[Sanity] Fetch error:", error);
    return null;
  }
}

// ── Image URL builder ──
const builder = createImageUrlBuilder(client);

export function urlFor(source: Parameters<typeof builder.image>[0]) {
  return builder.image(source);
}

// ── Presets CDN prêts à l'emploi ──
export const imagePresets = {
  /** Card van : 600×450, crop center, WebP auto */
  vanCard: (source: Parameters<typeof builder.image>[0]) =>
    urlFor(source).width(600).height(450).fit("crop").auto("format").url(),

  /** Hero : 1400px large, WebP auto */
  hero: (source: Parameters<typeof builder.image>[0]) =>
    urlFor(source).width(1400).auto("format").url(),

  /** Thumbnail miniature : 200×200 */
  thumb: (source: Parameters<typeof builder.image>[0]) =>
    urlFor(source).width(200).height(200).fit("crop").auto("format").url(),

  /** Galerie : 900×600 */
  gallery: (source: Parameters<typeof builder.image>[0]) =>
    urlFor(source).width(900).height(600).fit("crop").auto("format").url(),

  /** Formateur / Équipe portrait : 400×400 */
  portrait: (source: Parameters<typeof builder.image>[0]) =>
    urlFor(source).width(400).height(400).fit("crop").auto("format").url(),
};
