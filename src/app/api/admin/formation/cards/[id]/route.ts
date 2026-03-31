import { NextRequest, NextResponse } from "next/server";
import { adminReadClient, adminWriteClient } from "@/lib/sanity/adminClient";
import { groq } from "next-sanity";
import { revalidatePath } from "next/cache";

function urlToAssetRef(url: string): string | null {
  try {
    const clean = url.split("?")[0];
    const filename = clean.split("/").pop();
    if (!filename) return null;
    const dotIdx = filename.lastIndexOf(".");
    if (dotIdx === -1) return null;
    const base = filename.slice(0, dotIdx);
    const ext = filename.slice(dotIdx + 1);
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

  if (imageFile && imageFile.size > 0) {
    const buffer = Buffer.from(await imageFile.arrayBuffer());
    const asset = await adminWriteClient.assets.upload("image", buffer, {
      filename: imageFile.name,
      contentType: imageFile.type,
    });
    return { _type: "image", asset: { _type: "reference", _ref: asset._id }, alt: fallbackAlt };
  }

  if (libraryUrl) {
    const assetId = urlToAssetRef(libraryUrl);
    if (assetId) {
      return { _type: "image", asset: { _type: "reference", _ref: assetId }, alt: libraryAlt };
    }
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

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const formData = await req.formData();
    const title = formData.get("title") as string | null;
    const description = formData.get("description") as string | null;
    const sortOrder = formData.get("sortOrder");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const patch: Record<string, any> = {};
    if (title !== null) patch.title = title.trim();
    if (description !== null) patch.description = description.trim() || undefined;
    if (sortOrder !== null) patch.sortOrder = parseInt(sortOrder as string, 10);

    const imageRef = await resolveImageRef(formData, patch.title || title || "");
    if (imageRef) patch.image = imageRef;

    await adminWriteClient.patch(id).set(patch).commit();
    revalidatePath("/formation");
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Formation Cards PATCH]", err);
    return NextResponse.json({ error: "Erreur lors de la mise à jour" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await adminWriteClient.delete(id);
    revalidatePath("/formation");
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Formation Cards DELETE]", err);
    return NextResponse.json({ error: "Erreur lors de la suppression" }, { status: 500 });
  }
}
