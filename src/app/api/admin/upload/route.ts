import { createClient } from "@sanity/client";
import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";
import { processVanImage } from "@/lib/ai/imageProcessor";
import { analyzeVanImage } from "@/lib/ai/imageAnalyzer";
import type { ImageRole } from "@/lib/ai/imageProcessor";

const writeClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: "2024-01-01",
  token: process.env.SANITY_API_WRITE_TOKEN || process.env.SANITY_API_READ_TOKEN,
  useCdn: false,
});

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Non autorise" }, { status: 401 });

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const title = (formData.get("title") as string) || "Sans titre";
    const alt = (formData.get("alt") as string) || "";
    // Résoudre la catégorie Sanity à partir du vanName si disponible
    // (les valeurs valides du schéma mediaAsset sont : van-yoni, van-xalbat, equipe, pays-basque, formation, divers)
    const rawCategory = (formData.get("category") as string) || "";
    const vanNameForCat = (formData.get("vanName") as string) || "";
    const category = rawCategory && rawCategory !== "vans"
      ? rawCategory
      : vanNameForCat.toLowerCase().includes("yoni")
        ? "van-yoni"
        : vanNameForCat.toLowerCase().includes("xalbat")
          ? "van-xalbat"
          : "divers";
    const imageRole = ((formData.get("imageRole") as string) || "gallery") as ImageRole;
    const vanName = (formData.get("vanName") as string) || undefined;

    if (!file) return Response.json({ error: "Fichier manquant" }, { status: 400 });

    const rawBuffer = Buffer.from(await file.arrayBuffer());

    // ── 1. Traitement Sharp : conversion WebP, ratio original préservé ──
    const processedBuffer = await processVanImage(rawBuffer, imageRole);

    // ── 2. Analyse Gemini Vision + upload Sanity en parallèle ──
    const [asset, aiMeta] = await Promise.all([
      writeClient.assets.upload("image", processedBuffer, {
        filename: `${vanName ? vanName.toLowerCase().replace(/\s+/g, "-") + "-" : ""}van-amenage.webp`,
        contentType: "image/webp",
      }),
      analyzeVanImage(processedBuffer, { vanName }),
    ]);

    // ── 3. Créer le document mediaAsset avec les métadonnées IA ──
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
      // Suggestions IA pour pré-remplir le formulaire
      aiAlt: aiMeta.alt,
      aiCaption: aiMeta.caption,
      aiFilename: aiMeta.filename,
    });
  } catch (err) {
    console.error("[upload]", err);
    return Response.json({ error: "Erreur upload Sanity" }, { status: 500 });
  }
}
