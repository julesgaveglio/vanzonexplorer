import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { dfsPost } from "@/lib/dataforseo";

export const revalidate = 3600;

const HOMEPAGE_URL = "https://vanzonexplorer.com/vanzon";

interface Resource {
  resource_type?: string;
  url?: string;
  size?: number;
  attributes?: { alt?: string };
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  try {
    const result = await dfsPost<{
      items?: Array<{
        resources?: Resource[];
      }>;
    }>("/on_page/instant_pages", [
      { url: HOMEPAGE_URL, load_resources: true, enable_javascript: false },
    ]);

    const resources: Resource[] = result?.items?.[0]?.resources ?? [];
    const images = resources.filter((r) => r.resource_type === "image");

    const noAlt = images.filter((r) => !r.attributes?.alt || r.attributes.alt === "");
    const nonOptimized = images.filter((r) => !r.url?.match(/\.(webp|avif)(\?.*)?$/i));
    const tooHeavy = images.filter((r) => (r.size ?? 0) > 204800);

    return NextResponse.json({
      total: images.length,
      noAlt: noAlt.map((r) => r.url),
      nonOptimized: nonOptimized.map((r) => r.url),
      tooHeavy: tooHeavy.map((r) => ({ url: r.url, sizeKb: Math.round((r.size ?? 0) / 1024) })),
    });
  } catch (err) {
    console.error("[seo/images]", err);
    return NextResponse.json({ error: "Erreur DataForSEO" }, { status: 500 });
  }
}
