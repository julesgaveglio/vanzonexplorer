import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { adminReadClient } from "@/lib/sanity/adminClient";
import { groq } from "next-sanity";

const mediaQuery = groq`
  *[_type == "mediaAsset"] | order(_createdAt desc) {
    _id,
    title,
    category,
    "url": image.asset->url + "?auto=format&fit=max&q=82",
    "alt": image.alt,
    "width": image.asset->metadata.dimensions.width,
    "height": image.asset->metadata.dimensions.height,
  }
`;

export async function GET() {
  const check = await requireAdmin();
  if (check instanceof NextResponse) return check;

  const items = await adminReadClient.fetch(mediaQuery) ?? [];
  return NextResponse.json(items);
}
