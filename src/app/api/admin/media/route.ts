import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { adminReadClient } from "@/lib/sanity/adminClient";
import { groq } from "next-sanity";

const ALLOWED_EMAIL = "gavegliojules@gmail.com";

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
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await currentUser();
  const email = user?.emailAddresses?.[0]?.emailAddress;
  if (email !== ALLOWED_EMAIL) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const items = await adminReadClient.fetch(mediaQuery) ?? [];
  return NextResponse.json(items);
}
