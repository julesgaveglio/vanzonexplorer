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
    const { url, title, alt, category } = await req.json() as {
      url: string;
      title: string;
      alt: string;
      category: string;
    };

    if (!url) return Response.json({ error: "URL manquante" }, { status: 400 });

    // Fetch image from external source
    const response = await fetch(url, {
      headers: { "User-Agent": "VanzonExplorer/1.0" },
    });

    if (!response.ok) {
      return Response.json({ error: `Impossible de recuperer l'image: ${response.status}` }, { status: 400 });
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    const contentType = response.headers.get("content-type") || "image/jpeg";

    // Derive filename from URL
    const urlParts = url.split("/");
    const filename = urlParts[urlParts.length - 1] || "image";

    // Upload to Sanity
    const asset = await writeClient.assets.upload("image", buffer, {
      filename,
      contentType,
    });

    // Slugify title for SEO
    const cleanTitle = (title || filename.replace(/\.[^/.]+$/, ""))
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .substring(0, 80);

    // Create mediaAsset document
    const doc = await writeClient.create({
      _type: "mediaAsset",
      title: cleanTitle,
      category: category || "divers",
      image: {
        _type: "image",
        asset: { _type: "reference", _ref: asset._id },
        alt: alt || title || cleanTitle,
        hotspot: { x: 0.5, y: 0.5, width: 0.5, height: 0.5 },
        crop: { top: 0, bottom: 0, left: 0, right: 0 },
      },
      usedIn: `Migre depuis: ${url}`,
    });

    const baseUrl = asset.url;

    return Response.json({
      success: true,
      assetId: asset._id,
      docId: doc._id,
      originalUrl: url,
      sanityUrl: baseUrl,
      webpUrl: `${baseUrl}?auto=format&fit=max&q=82`,
      cardUrl: `${baseUrl}?w=600&h=450&fit=crop&auto=format&q=80`,
      heroUrl: `${baseUrl}?w=1400&auto=format&q=82`,
      dimensions: asset.metadata?.dimensions,
    });
  } catch (err) {
    console.error("[migrate-image]", err);
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
