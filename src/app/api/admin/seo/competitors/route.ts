import { requireAdmin } from "@/lib/auth";
import { NextResponse } from "next/server";
import { dfsPost, DFS_TARGET, DFS_LOCATION, DFS_LANGUAGE_CODE } from "@/lib/dataforseo";

export async function GET() {
  const check = await requireAdmin();
  if (check instanceof NextResponse) return check;

  try {
    const data = await dfsPost("/dataforseo_labs/google/competitors_domain/live", [
      {
        target: DFS_TARGET,
        location_name: DFS_LOCATION,
        language_code: DFS_LANGUAGE_CODE,
        limit: 20,
        exclude_top_domains: true,
        ignore_synonyms: true,
        item_types: ["organic"],
      },
    ]);

    return NextResponse.json(data);
  } catch (err) {
    console.error("[seo/competitors]", err);
    return NextResponse.json({ error: "Erreur DataForSEO" }, { status: 500 });
  }
}
