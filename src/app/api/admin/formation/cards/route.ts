import { NextRequest, NextResponse } from "next/server";
import { adminReadClient, adminWriteClient } from "@/lib/sanity/adminClient";
import { groq } from "next-sanity";

const allCardsQuery = groq`
  *[_type == "formationCard"] | order(sortOrder asc, _createdAt asc) {
    _id,
    title,
    description,
    "image": {
      "url": image.asset->url,
      "alt": image.alt,
      "assetId": image.asset->_id
    },
    sortOrder
  }
`;

/**
 * Résout un asset Sanity depuis une URL CDN.
 * URL format: https://cdn.sanity.io/images/{project}/{dataset}/{hash}-{WxH}.{ext}[?params]
 * Asset _id format: image-{hash}-{WxH}-{ext}
 */
function urlToAssetRef(url: string): string | null {
  try {
    const clean = url.split("?")[0];
    const filename = clean.split("/").pop(); // "hash-WxH.ext"
    if (!filename) return null;
    const dotIdx = filename.lastIndexOf(".");
    if (dotIdx === -1) return null;
    const base = filename.slice(0, dotIdx); // "hash-WxH"
    const ext = filename.slice(dotIdx + 1); // "ext"
    return `image-${base}-${ext}`;
  } catch {
    return null;
  }
}

type ImageRef = {
  _type: "image";
  asset: { _type: "reference"; _ref: string };
  alt: string;
};

async function resolveImageRef(
  formData: FormData,
  fallbackAlt: string
): Promise<ImageRef | undefined> {
  const imageFile = formData.get("image") as File | null;
  const libraryUrl = (formData.get("libraryImageUrl") as string) || "";
  const libraryAlt = (formData.get("libraryImageAlt") as string) || fallbackAlt;

  // 1. Upload depuis l'ordinateur
  if (imageFile && imageFile.size > 0) {
    const buffer = Buffer.from(await imageFile.arrayBuffer());
    const asset = await adminWriteClient.assets.upload("image", buffer, {
      filename: imageFile.name,
      contentType: imageFile.type,
    });
    return { _type: "image", asset: { _type: "reference", _ref: asset._id }, alt: fallbackAlt };
  }

  // 2. Depuis la bibliothèque Vanzon (URL CDN → asset ref)
  if (libraryUrl) {
    const assetId = urlToAssetRef(libraryUrl);
    if (assetId) {
      return { _type: "image", asset: { _type: "reference", _ref: assetId }, alt: libraryAlt };
    }
    // Fallback: requête Sanity pour trouver l'asset depuis l'URL base
    const cleanUrl = libraryUrl.split("?")[0];
    const found = await adminReadClient.fetch<{ _id: string } | null>(
      groq`*[_type == "sanity.imageAsset" && url == $url][0] { _id }`,
      { url: cleanUrl }
    );
    if (found?._id) {
      return { _type: "image", asset: { _type: "reference", _ref: found._id }, alt: libraryAlt };
    }
  }

  return undefined;
}

export async function GET() {
  try {
    const cards = await adminReadClient.fetch(allCardsQuery);
    return NextResponse.json({ cards: cards ?? [] });
  } catch (err) {
    console.error("[Formation Cards GET]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const title = formData.get("title") as string;
    const description = (formData.get("description") as string) || "";
    const sortOrder = parseInt((formData.get("sortOrder") as string) || "0", 10);

    if (!title?.trim()) {
      return NextResponse.json({ error: "Le titre est obligatoire" }, { status: 400 });
    }

    const imageRef = await resolveImageRef(formData, title);

    const doc = await adminWriteClient.create({
      _type: "formationCard",
      title: title.trim(),
      description: description.trim() || undefined,
      sortOrder,
      ...(imageRef ? { image: imageRef } : {}),
    });

    return NextResponse.json({ success: true, id: doc._id });
  } catch (err) {
    console.error("[Formation Cards POST]", err);
    return NextResponse.json({ error: "Erreur lors de la création" }, { status: 500 });
  }
}
