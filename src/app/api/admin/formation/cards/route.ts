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
    const imageFile = formData.get("image") as File | null;

    if (!title?.trim()) {
      return NextResponse.json({ error: "Le titre est obligatoire" }, { status: 400 });
    }

    // Upload image si fournie
    let imageRef: { _type: "image"; asset: { _type: "reference"; _ref: string }; alt: string } | undefined;
    if (imageFile && imageFile.size > 0) {
      const buffer = Buffer.from(await imageFile.arrayBuffer());
      const asset = await adminWriteClient.assets.upload("image", buffer, {
        filename: imageFile.name,
        contentType: imageFile.type,
      });
      imageRef = {
        _type: "image",
        asset: { _type: "reference", _ref: asset._id },
        alt: title,
      };
    }

    // Créer le document formationCard
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
