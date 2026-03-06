import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { dfsPost, DFS_LOCATION, DFS_LANGUAGE_CODE } from "@/lib/dataforseo";
import { KEYWORDS, KeywordData } from "@/app/admin/keywords/data/keywords";

interface DFSKeywordItem {
  keyword?: string;
  keyword_info?: {
    search_volume?: number;
    cpc?: number;
    competition_level?: string;
    monthly_searches?: Record<string, number>;
    search_volume_trend?: { yearly?: number };
  };
  keyword_properties?: {
    keyword_difficulty?: number;
  };
}

interface DFSResult {
  items?: DFSKeywordItem[];
}

export async function POST() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Non autorise" }, { status: 401 });

  try {
    const keywordList = KEYWORDS.map((k) => k.keyword);

    const data = await dfsPost<DFSResult>(
      "/dataforseo_labs/google/keyword_overview/live",
      [
        {
          keywords: keywordList,
          location_name: DFS_LOCATION,
          language_code: DFS_LANGUAGE_CODE,
        },
      ]
    );

    const itemsMap = new Map<string, DFSKeywordItem>();
    (data?.items ?? []).forEach((item) => {
      if (item.keyword) itemsMap.set(item.keyword, item);
    });

    const merged: KeywordData[] = KEYWORDS.map((kw) => {
      const live = itemsMap.get(kw.keyword);
      if (!live) return kw;
      return {
        ...kw,
        search_volume: live.keyword_info?.search_volume ?? kw.search_volume,
        cpc: live.keyword_info?.cpc ?? kw.cpc,
        competition_level: (live.keyword_info?.competition_level as "LOW" | "MEDIUM" | "HIGH") ?? kw.competition_level,
        keyword_difficulty: live.keyword_properties?.keyword_difficulty ?? kw.keyword_difficulty,
        monthly_searches: live.keyword_info?.monthly_searches ?? kw.monthly_searches,
        trend_yearly: live.keyword_info?.search_volume_trend?.yearly ?? kw.trend_yearly,
      };
    });

    return NextResponse.json({ items: merged, fetched_at: new Date().toISOString() });
  } catch (err) {
    console.error("[keywords-research]", err);
    return NextResponse.json({ error: "Erreur DataForSEO" }, { status: 500 });
  }
}
