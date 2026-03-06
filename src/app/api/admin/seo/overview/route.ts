import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { dfsPost, DFS_TARGET, DFS_LOCATION, DFS_LANGUAGE_CODE } from "@/lib/dataforseo";

export const revalidate = 300;

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Non autorise" }, { status: 401 });

  try {
    const data = await dfsPost("/dataforseo_labs/google/domain_rank_overview/live", [
      {
        target: DFS_TARGET,
        location_name: DFS_LOCATION,
        language_code: DFS_LANGUAGE_CODE,
        ignore_synonyms: true,
      },
    ]);

    return NextResponse.json(data);
  } catch (err) {
    console.error("[seo/overview]", err);
    return NextResponse.json({ error: "Erreur DataForSEO" }, { status: 500 });
  }
}
