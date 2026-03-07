import { createClient } from "@sanity/client";
import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";

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
    const category = (formData.get("category") as string) || "divers";

    if (!file) return Response.json({ error: "Fichier manquant" }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const contentType = file.type || "image/jpeg";

    // Upload asset to Sanity CDN
    const asset = await writeClient.assets.upload("image", buffer, {
      filename: file.name,
      contentType,
    });

    // Create mediaAsset document
    const doc = await writeClient.create({
      _type: "mediaAsset",
      title: title || file.name.replace(/\.[^/.]+$/, ""),
      category,
      image: {
        _type: "image",
        asset: { _type: "reference", _ref: asset._id },
        alt: alt || title,
        hotspot: { x: 0.5, y: 0.5, width: 0.5, height: 0.5 },
        crop: { top: 0, bottom: 0, left: 0, right: 0 },
      },
    });

    return Response.json({
      success: true,
      assetId: asset._id,
      docId: doc._id,
      url: asset.url,
      webpUrl: `${asset.url}?auto=format&fit=max&q=82`,
      dimensions: asset.metadata?.dimensions,
    });
  } catch (err) {
    console.error("[upload]", err);
    return Response.json({ error: "Erreur upload Sanity" }, { status: 500 });
  }
}
