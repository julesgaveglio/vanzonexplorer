import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { dfsPost, DFS_TARGET, DFS_LOCATION, DFS_LANGUAGE_CODE } from "@/lib/dataforseo";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Non autorise" }, { status: 401 });

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
