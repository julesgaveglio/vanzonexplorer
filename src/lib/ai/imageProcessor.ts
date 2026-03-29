import sharp from "sharp";

// Toutes les photos de vans sont en 3:2 (format galerie Sanity : 900×600).
// L'image principale utilise le même ratio pour cohérence visuelle.
export type ImageRole = "gallery";

const PRESETS: Record<ImageRole, { width: number; height: number }> = {
  gallery: { width: 1200, height: 800 },   // 3:2 — cohérent avec imagePresets.gallery (900×600)
};

/**
 * Recadre et convertit une image en WebP optimisé.
 * Toujours 1200×800 (3:2), qualité 85.
 * L'input est attendu post-upload de l'utilisateur (taille quelconque).
 */
export async function processVanImage(
  buffer: Buffer,
  role: ImageRole = "gallery"
): Promise<Buffer> {
  const { width, height } = PRESETS[role];
  return sharp(buffer)
    .resize(width, height, { fit: "cover", position: "centre" })
    .webp({ quality: 85 })
    .toBuffer();
}
