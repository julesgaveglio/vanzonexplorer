import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { dfsPost, DFS_LOCATION, DFS_LANGUAGE_CODE } from "@/lib/dataforseo";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Non autorise" }, { status: 401 });

  const { keyword } = await req.json();
  if (!keyword) return NextResponse.json({ error: "Keyword requis" }, { status: 400 });

  try {
    const data = await dfsPost("/dataforseo_labs/google/keyword_ideas/live", [
      {
        keywords: [keyword],
        location_name: DFS_LOCATION,
        language_code: DFS_LANGUAGE_CODE,
        limit: 50,
        order_by: ["keyword_info.search_volume,desc"],
        ignore_synonyms: false,
      },
    ]);

    return NextResponse.json(data);
  } catch (err) {
    console.error("[seo/ideas]", err);
    return NextResponse.json({ error: "Erreur DataForSEO" }, { status: 500 });
  }
}
