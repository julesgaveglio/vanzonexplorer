/**
 * image-pipeline.ts
 * Pipeline d'images pour les articles road trip.
 * Chaîne de fallback : Pixabay → SerpApi → Wikipedia thumbnail
 * Upload vers Supabase Storage + Sanity assets + création mediaAsset
 */

import https from "https";
import http from "http";
import { createClient } from "@sanity/client";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

const PIXABAY_KEY = process.env.PIXABAY_API_KEY || "";
const SERPAPI_KEY = process.env.SERPAPI_KEY || "";
const SANITY_PROJECT = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "lewexa74";
const SANITY_DATASET = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";
const SANITY_WRITE_TOKEN = process.env.SANITY_API_WRITE_TOKEN || "";

export interface SpotImage {
  url: string;
  alt: string;
  credit: string;
  photographer?: string;
  source: "pixabay" | "serpapi" | "wikipedia" | "none";
  sanityAssetId?: string;
  supabaseUrl?: string;
}

/**
 * Télécharge une URL en Buffer.
 */
async function downloadBuffer(url: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const client = url.startsWith("https") ? https : http;
    client.get(url, (res) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return downloadBuffer(res.headers.location).then(resolve).catch(reject);
      }
      const chunks: Buffer[] = [];
      res.on("data", (chunk: Buffer) => chunks.push(chunk));
      res.on("end", () => resolve(Buffer.concat(chunks)));
      res.on("error", reject);
    }).on("error", reject);
  });
}

/**
 * Cherche une image sur Pixabay pour un spot + région.
 */
async function searchPixabay(spot: string, region: string): Promise<string | null> {
  if (!PIXABAY_KEY) return null;
  try {
    const q = encodeURIComponent(`${spot} ${region} France landscape`);
    const url = `https://pixabay.com/api/?key=${PIXABAY_KEY}&q=${q}&image_type=photo&orientation=horizontal&per_page=3&lang=fr&safesearch=true`;
    const res = await fetch(url);
    const data = await res.json() as { hits?: Array<{ largeImageURL: string }> };
    return data.hits?.[0]?.largeImageURL || null;
  } catch (err) {
    console.warn("[image-pipeline] Pixabay error:", err);
    return null;
  }
}

/**
 * Cherche une image via SerpApi (Google Images).
 */
async function searchSerpApi(spot: string, region: string): Promise<string | null> {
  if (!SERPAPI_KEY) return null;
  try {
    const q = encodeURIComponent(`${spot} ${region} van life paysage`);
    const url = `https://serpapi.com/search.json?engine=google_images&q=${q}&api_key=${SERPAPI_KEY}&num=3&ijn=0`;
    const res = await fetch(url);
    const data = await res.json() as { images_results?: Array<{ original: string }> };
    return data.images_results?.[0]?.original || null;
  } catch (err) {
    console.warn("[image-pipeline] SerpApi error:", err);
    return null;
  }
}

/**
 * Génère l'alt text SEO pour un spot.
 */
function buildAltText(spot: string, region: string, type = "paysage"): string {
  return `Vue de ${spot} en ${region}, ${type} — road trip van France`;
}

/**
 * Upload un buffer vers Sanity comme asset image.
 * Retourne l'asset ID Sanity.
 */
async function uploadToSanity(buffer: Buffer, filename: string): Promise<string | null> {
  if (!SANITY_WRITE_TOKEN) return null;
  try {
    const sanity = createClient({
      projectId: SANITY_PROJECT,
      dataset: SANITY_DATASET,
      apiVersion: "2024-01-01",
      token: SANITY_WRITE_TOKEN,
      useCdn: false,
    });
    const asset = await sanity.assets.upload("image", buffer, {
      filename,
      contentType: "image/jpeg",
    });
    return asset._id;
  } catch (err) {
    console.warn("[image-pipeline] Sanity upload error:", err);
    return null;
  }
}

/**
 * Upload vers Supabase Storage bucket 'road-trip-images'.
 * Retourne l'URL publique.
 */
async function uploadToSupabase(buffer: Buffer, path: string): Promise<string | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) return null;
  try {
    const supabase = createSupabaseClient(supabaseUrl, supabaseKey);
    const { error } = await supabase.storage
      .from("road-trip-images")
      .upload(path, buffer, { contentType: "image/jpeg", upsert: true });
    if (error) throw error;
    const { data } = supabase.storage.from("road-trip-images").getPublicUrl(path);
    return data.publicUrl;
  } catch (err) {
    console.warn("[image-pipeline] Supabase upload error:", err);
    return null;
  }
}

/**
 * Crée un document mediaAsset dans Sanity pour l'image uploadée.
 */
async function createMediaAsset(
  sanityAssetId: string,
  spot: string,
  region: string,
  alt: string,
  source: string,
  credit: string
): Promise<void> {
  if (!SANITY_WRITE_TOKEN || !sanityAssetId) return;
  try {
    const sanity = createClient({
      projectId: SANITY_PROJECT,
      dataset: SANITY_DATASET,
      apiVersion: "2024-01-01",
      token: SANITY_WRITE_TOKEN,
      useCdn: false,
    });
    await sanity.create({
      _type: "mediaAsset",
      title: `${spot} — ${region}`,
      category: "road-trip",
      image: {
        _type: "image",
        asset: { _type: "reference", _ref: sanityAssetId },
        alt,
        credit: credit || source,
      },
      tags: ["road-trip", region, spot],
      usedIn: `Road trip ${region}`,
    });
  } catch (err) {
    console.warn("[image-pipeline] mediaAsset creation error:", err);
  }
}

/**
 * Point d'entrée principal : trouve et prépare l'image pour un spot.
 */
export async function fetchSpotImage(
  spot: string,
  region: string,
  type = "paysage",
  wikiThumbnail?: string
): Promise<SpotImage> {
  const alt = buildAltText(spot, region, type);
  const slugify = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const filename = `${slugify(region)}-${slugify(spot)}-${Date.now()}.jpg`;
  const storagePath = `${slugify(region)}/${filename}`;

  // 1. Pixabay
  let imageUrl = await searchPixabay(spot, region);
  let source: SpotImage["source"] = "pixabay";
  let credit = "Pixabay";

  // 2. SerpApi fallback
  if (!imageUrl) {
    imageUrl = await searchSerpApi(spot, region);
    source = "serpapi";
    credit = "Google Images";
  }

  // 3. Wikipedia thumbnail fallback
  if (!imageUrl && wikiThumbnail) {
    imageUrl = wikiThumbnail;
    source = "wikipedia";
    credit = "Wikipedia";
  }

  if (!imageUrl) {
    return { url: "", alt, credit: "—", source: "none" };
  }

  // Download + upload
  let sanityAssetId: string | undefined;
  let supabaseUrl: string | undefined;

  try {
    const buffer = await downloadBuffer(imageUrl);

    // Vérifier que c'est bien une image (JPEG/PNG magic bytes)
    const isJpeg = buffer[0] === 0xFF && buffer[1] === 0xD8;
    const isPng = buffer[0] === 0x89 && buffer[1] === 0x50;
    const isWebP = buffer.slice(8, 12).toString() === "WEBP";
    if (!isJpeg && !isPng && !isWebP) {
      console.warn(`[image-pipeline] Non-image data received for ${spot}, skipping upload`);
      return { url: imageUrl, alt, credit, source };
    }

    // Upload en parallèle
    const [sanityId, supaUrl] = await Promise.all([
      uploadToSanity(buffer, filename),
      uploadToSupabase(buffer, storagePath),
    ]);

    sanityAssetId = sanityId || undefined;
    supabaseUrl = supaUrl || undefined;

    // Créer mediaAsset Sanity
    if (sanityId) {
      await createMediaAsset(sanityId, spot, region, alt, source, credit);
    }
  } catch (err) {
    console.warn(`[image-pipeline] Upload failed for ${spot}:`, err);
  }

  return {
    url: supabaseUrl || imageUrl,
    alt,
    credit,
    source,
    sanityAssetId,
    supabaseUrl,
  };
}
