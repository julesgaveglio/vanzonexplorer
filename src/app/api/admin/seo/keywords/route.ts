import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { dfsPost, DFS_TARGET, DFS_LOCATION, DFS_LANGUAGE_CODE } from "@/lib/dataforseo";

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Non autorise" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get("limit") ?? "100");
  const offset = parseInt(searchParams.get("offset") ?? "0");
  const orderBy = searchParams.get("order") ?? "keyword_data.keyword_info.search_volume,desc";

  try {
    const data = await dfsPost("/dataforseo_labs/google/ranked_keywords/live", [
      {
        target: DFS_TARGET,
        location_name: DFS_LOCATION,
        language_code: DFS_LANGUAGE_CODE,
        limit,
        offset,
        order_by: [orderBy],
        item_types: ["organic"],
        ignore_synonyms: true,
      },
    ]);

    return NextResponse.json(data);
  } catch (err) {
    console.error("[seo/keywords]", err);
    return NextResponse.json({ error: "Erreur DataForSEO" }, { status: 500 });
  }
}
