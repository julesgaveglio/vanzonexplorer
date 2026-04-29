import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@sanity/client";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { notifySearchEngines } from "@/lib/search-indexing";

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "lewexa74",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  apiVersion: "2024-01-01",
  token: process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
});

const supabase = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const check = await requireAdmin();
  if (check instanceof NextResponse) return check;

  const { sanityId, supabaseId, regionSlug, articleSlug } = await req.json();

  if (!sanityId || !supabaseId) {
    return NextResponse.json({ error: "sanityId and supabaseId required" }, { status: 400 });
  }

  try {
    const publishedAt = new Date().toISOString();

    // 1. Mettre à jour Sanity
    await sanity.patch(sanityId)
      .set({ status: "published", publishedAt })
      .commit();

    // 2. Mettre à jour Supabase
    await supabase
      .from("road_trip_requests")
      .update({ status: "published" })
      .eq("id", supabaseId);

    // 3. Notify search engines (IndexNow + Google Ping)
    const articleUrl = `https://vanzonexplorer.com/road-trip/${regionSlug}/${articleSlug}`;
    await notifySearchEngines([
      articleUrl,
      `https://vanzonexplorer.com/road-trip/${regionSlug}`,
      "https://vanzonexplorer.com/road-trip",
    ]);

    return NextResponse.json({ ok: true, url: articleUrl });
  } catch (err) {
    console.error("[publish] Error:", err);
    return NextResponse.json({ error: "Publication failed" }, { status: 500 });
  }
}
