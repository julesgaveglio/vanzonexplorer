import { createClient } from "@sanity/client";
import { requireAdmin } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { processVanImage } from "@/lib/ai/imageProcessor";
import { analyzeVanImage } from "@/lib/ai/imageAnalyzer";

// Vercel serverless : 60s max, body jusqu'à 4.5 MB
export const maxDuration = 60;

const writeClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: "2024-01-01",
  token: process.env.SANITY_API_WRITE_TOKEN || process.env.SANITY_API_READ_TOKEN,
  useCdn: false,
});

export async function POST(req: NextRequest) {
  const check = await requireAdmin();
  if (check instanceof NextResponse) return check;

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const title = (formData.get("title") as string) || "Sans titre";
    const alt = (formData.get("alt") as string) || "";
    const rawCategory = (formData.get("category") as string) || "";
    const vanNameForCat = (formData.get("vanName") as string) || "";
    const category = rawCategory && rawCategory !== "vans"
      ? rawCategory
      : vanNameForCat.toLowerCase().includes("yoni")
        ? "van-yoni"
        : vanNameForCat.toLowerCase().includes("xalbat")
          ? "van-xalbat"
          : "divers";
    const vanName = (formData.get("vanName") as string) || undefined;

    if (!file) return Response.json({ error: "Fichier manquant" }, { status: 400 });

    const rawBuffer = Buffer.from(await file.arrayBuffer());

    // ── 1. Traitement Sharp : conversion WebP, ratio original préservé ──
    let processedBuffer: Buffer;
    let contentType = "image/webp";
    let filename = `${vanName ? vanName.toLowerCase().replace(/\s+/g, "-") + "-" : ""}van-amenage.webp`;
    try {
      processedBuffer = await processVanImage(rawBuffer);
    } catch (sharpErr) {
      console.warn("[upload] Sharp failed, using raw buffer:", sharpErr);
      processedBuffer = rawBuffer;
      contentType = file.type || "image/jpeg";
      filename = file.name || "upload.jpg";
    }

    // ── 2. Upload Sanity (priorité) + analyse Gemini (best-effort) ──
    let aiMeta = { alt: "", caption: "", filename: "" };
    const [asset] = await Promise.all([
      writeClient.assets.upload("image", processedBuffer, { filename, contentType }),
      analyzeVanImage(processedBuffer, { vanName })
        .then((m) => { aiMeta = m; })
        .catch((err) => { console.warn("[upload] AI analysis skipped:", err); }),
    ]);

    // ── 3. Créer le document mediaAsset ──
    const finalAlt = alt || aiMeta.alt;
    const doc = await writeClient.create({
      _type: "mediaAsset",
      title: title || aiMeta.filename,
      category,
      image: {
        _type: "image",
        asset: { _type: "reference", _ref: asset._id },
        alt: finalAlt,
        hotspot: { x: 0.5, y: 0.5, width: 0.5, height: 0.5 },
        crop: { top: 0, bottom: 0, left: 0, right: 0 },
      },
    });

    return Response.json({
      success: true,
      assetId: asset._id,
      docId: doc._id,
      url: asset.url,
      webpUrl: `${asset.url}?auto=format&fit=max&q=85`,
      dimensions: asset.metadata?.dimensions,
      aiAlt: aiMeta.alt,
      aiCaption: aiMeta.caption,
      aiFilename: aiMeta.filename,
    });
  } catch (err) {
    console.error("[upload] Error:", err);
    const message = err instanceof Error ? err.message : "Erreur upload Sanity";
    return Response.json({ error: message }, { status: 500 });
  }
}
