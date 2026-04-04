import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@sanity/client";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

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

  const { sanityId, supabaseId } = await req.json();

  if (!sanityId || !supabaseId) {
    return NextResponse.json({ error: "sanityId and supabaseId required" }, { status: 400 });
  }

  try {
    // 1. Supprimer le doc Sanity
    await sanity.delete(sanityId);

    // 2. Reset Supabase
    await supabase
      .from("road_trip_requests")
      .update({ status: "sent", article_sanity_id: null, article_slug: null, quality_score: null })
      .eq("id", supabaseId);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[regenerate] Error:", err);
    return NextResponse.json({ error: "Regenerate failed" }, { status: 500 });
  }
}
