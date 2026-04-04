import { createClient } from "@sanity/client";
import { requireAdmin } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";

const writeClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: "2024-01-01",
  token: process.env.SANITY_API_WRITE_TOKEN || process.env.SANITY_API_READ_TOKEN,
  useCdn: false,
});

/**
 * Process a logo image:
 * 1. Auto-trim whitespace/padding (removes transparent or near-white borders)
 * 2. Add a small symmetric padding
 * 3. Output as PNG with transparency preserved
 */
async function processLogo(buffer: Buffer): Promise<Buffer> {
  // Ensure we work with a format sharp can process
  let pipeline = sharp(buffer).ensureAlpha();

  // Trim: removes near-white or transparent background borders
  // threshold 20 = removes pixels with color distance < 20 from the border color
  pipeline = pipeline.trim({ threshold: 30 });

  // Re-add symmetric padding (5% of the trimmed size, min 8px)
  const trimmed = await pipeline.toBuffer({ resolveWithObject: true });
  const pad = Math.max(8, Math.round(Math.max(trimmed.info.width, trimmed.info.height) * 0.05));

  const processed = await sharp(trimmed.data)
    .extend({ top: pad, bottom: pad, left: pad, right: pad, background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9 })
    .toBuffer();

  return processed;
}

export async function POST(req: NextRequest) {
  const check = await requireAdmin();
  if (check instanceof NextResponse) return check;

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return Response.json({ error: "Fichier manquant" }, { status: 400 });

    const rawBuffer = Buffer.from(await file.arrayBuffer());

    // Process logo: smart trim + PNG output
    let processedBuffer: Buffer;
    try {
      processedBuffer = await processLogo(rawBuffer);
    } catch {
      // Fallback: upload original if processing fails
      processedBuffer = rawBuffer;
    }

    const baseName = file.name.replace(/\.[^.]+$/, "");
    const filename = `logo-${baseName}-processed.png`;

    const asset = await writeClient.assets.upload("image", processedBuffer, {
      filename,
      contentType: "image/png",
    });

    return Response.json({ url: asset.url });
  } catch (err) {
    console.error("[club/upload-image]", err);
    return Response.json({ error: "Erreur upload" }, { status: 500 });
  }
}
