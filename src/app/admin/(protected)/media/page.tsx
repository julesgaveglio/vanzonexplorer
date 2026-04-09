import { adminReadClient } from "@/lib/sanity/adminClient";
import { groq } from "next-sanity";
import MediaLibrary from "./_components/MediaLibrary";
import { AdminPageHeader } from "@/app/admin/_components/ui";

const mediaQuery = groq`
  *[_type == "mediaAsset"] | order(category asc, title asc) {
    _id,
    title,
    category,
    tags,
    usedIn,
    "url": image.asset->url,
    "webpUrl": image.asset->url + "?auto=format&fit=max&q=82",
    "alt": image.alt,
    "hotspot": image.hotspot,
    "crop": image.crop,
    "width": image.asset->metadata.dimensions.width,
    "height": image.asset->metadata.dimensions.height,
  }
`;

type MediaItem = {
  _id: string;
  title: string;
  category: string;
  tags?: string[];
  usedIn?: string;
  url: string;
  webpUrl: string;
  alt?: string;
  hotspot?: { x: number; y: number; width: number; height: number };
  crop?: { top: number; right: number; bottom: number; left: number };
  width?: number;
  height?: number;
};

export const revalidate = 0;

export default async function AdminMediaPage() {
  const items = await adminReadClient.fetch<MediaItem[]>(mediaQuery) ?? [];

  const withAlt = items.filter((i) => i.alt && i.alt.length >= 5).length;
  const totalSize = items.length;

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <AdminPageHeader
        title="Mediatheque"
        subtitle={`${totalSize} image${totalSize > 1 ? "s" : ""} sur Sanity CDN — ${withAlt}/${totalSize} SEO OK`}
        action={
          <div className="hidden lg:flex items-center gap-2 bg-white border border-slate-100 rounded-xl px-4 py-2.5 shadow-sm text-xs text-slate-500">
            <span className="text-green-500 font-bold">WebP</span>
            <span>auto via Sanity CDN</span>
            <span className="text-slate-200">|</span>
            <span className="text-blue-500 font-bold">Hotspot</span>
            <span>crop intelligent</span>
          </div>
        }
      />

      <MediaLibrary initialItems={items} />
    </div>
  );
}
