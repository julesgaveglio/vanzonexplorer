import { requireAdmin } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { dfsPost, DFS_LOCATION_CODE, DFS_LANGUAGE_CODE } from "@/lib/dataforseo";

export async function POST(req: NextRequest) {
  const check = await requireAdmin();
  if (check instanceof NextResponse) return check;

  const { keyword } = await req.json();
  if (!keyword) return NextResponse.json({ error: "Keyword requis" }, { status: 400 });

  try {
    const data = await dfsPost("/serp/google/organic/live/advanced", [
      {
        keyword,
        location_code: DFS_LOCATION_CODE,
        language_code: DFS_LANGUAGE_CODE,
        device: "desktop",
        os: "windows",
        depth: 20,
      },
    ]);

    return NextResponse.json(data);
  } catch (err) {
    console.error("[seo/serp]", err);
    return NextResponse.json({ error: "Erreur DataForSEO" }, { status: 500 });
  }
}
