import type { Metadata } from "next";
import VSLClient from "./VSLClient";

export const metadata: Metadata = {
  title: "Vidéo Formation | Van Business Academy",
  robots: { index: false, follow: false },
};

const FALLBACK_VIDEO_ID = "7739a3f1-ad32-4839-ba56-e4dc60a27a47";
const FALLBACK_LIBRARY_ID = "641831";

async function getActiveVSL() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://vanzonexplorer.com";
    const res = await fetch(`${baseUrl}/api/vsl/active`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) throw new Error("Failed to fetch active VSL");
    return await res.json();
  } catch {
    return {
      id: "fallback",
      bunny_video_id: FALLBACK_VIDEO_ID,
      bunny_library_id: FALLBACK_LIBRARY_ID,
    };
  }
}

export default async function VSLPage() {
  const vsl = await getActiveVSL();
  return (
    <VSLClient
      videoId={vsl.bunny_video_id}
      libraryId={vsl.bunny_library_id}
      vslVersionId={vsl.id}
    />
  );
}
