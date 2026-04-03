import sharp from "sharp";

// Conserver pour compatibilité avec les imports existants
export type ImageRole = "gallery";

/**
 * Convertit une image en WebP optimisé en préservant le ratio original.
 * Limite la dimension max à 2000px (sans rogner).
 * Les formats proportionnels (card, hero, OG…) sont générés à la demande
 * via les paramètres d'URL Sanity CDN.
 */
export async function processVanImage(
  buffer: Buffer,
  _role: ImageRole = "gallery"
): Promise<Buffer> {
  return sharp(buffer)
    .resize(2000, 2000, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 85 })
    .toBuffer();
}
