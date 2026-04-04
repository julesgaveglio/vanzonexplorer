import { createClient } from "@sanity/client";
import { requireAdmin } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

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
    const docId = formData.get("docId") as string;

    if (!file || !docId) {
      return Response.json({ error: "Fichier ou docId manquant" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const contentType = file.type || "image/jpeg";

    // 1. Upload new asset to Sanity CDN
    const asset = await writeClient.assets.upload("image", buffer, {
      filename: file.name,
      contentType,
    });

    // 2. Patch the mediaAsset document — replace only the asset reference
    //    All metadata (alt, hotspot, crop, title, tags) are preserved
    await writeClient
      .patch(docId)
      .set({
        "image.asset": { _type: "reference", _ref: asset._id },
        // Reset hotspot/crop since dimensions may have changed
        "image.hotspot": { x: 0.5, y: 0.5, width: 0.5, height: 0.5 },
        "image.crop": { top: 0, bottom: 0, left: 0, right: 0 },
      })
      .commit();

    revalidatePath("/admin/media");
    revalidatePath("/");

    return Response.json({
      success: true,
      assetId: asset._id,
      url: asset.url,
      webpUrl: `${asset.url}?auto=format&fit=max&q=82`,
      dimensions: asset.metadata?.dimensions,
    });
  } catch (err) {
    console.error("[replace-asset]", err);
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
