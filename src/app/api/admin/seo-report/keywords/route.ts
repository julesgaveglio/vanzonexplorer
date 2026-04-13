// Étape 6 — Keywords : SerpAPI indexation + DataForSEO keywords_for_site + keyword_ideas
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { dfsPost } from "@/lib/dataforseo";
import type { KeywordsData, IndexedPage, KeywordOpportunity, KeywordIdea } from "@/types/seo-report";

// ─── SerpAPI : pages indexées via site: ──────────────────────────────────────
async function fetchIndexedPages(domain: string): Promise<{ pages: IndexedPage[]; count: number }> {
  const keys = [
    process.env.SERPAPI_KEY,
    process.env.SERPAPI_KEY_2,
    process.env.SERPAPI_KEY_3,
  ].filter(Boolean) as string[];

  for (const key of keys) {
    try {
      const params = new URLSearchParams({
        engine: "google",
        q: `site:${domain}`,
        api_key: key,
        num: "10",
        gl: "fr",
        hl: "fr",
      });
      const res = await fetch(`https://serpapi.com/search.json?${params}`, {
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) continue;
      const data = await res.json() as {
        search_information?: { total_results?: number };
        organic_results?: Array<{ link?: string; title?: string; snippet?: string }>;
      };

      const pages: IndexedPage[] = (data.organic_results ?? [])
        .filter((r) => r.link)
        .map((r) => ({
          url: r.link!,
          title: r.title ?? "",
          snippet: r.snippet ?? "",
        }));

      return {
        pages,
        count: data.search_information?.total_results ?? pages.length,
      };
    } catch {
      continue;
    }
  }
  return { pages: [], count: 0 };
}

// ─── DataForSEO : keywords_for_site ─────────────────────────────────────────
interface DfsKeyword {
  keyword?: string;
  keyword_data?: {
    keyword?: string;
    keyword_info?: {
      search_volume?: number;
      cpc?: number;
      competition_level?: string;
    };
    keyword_properties?: {
      keyword_difficulty?: number;
    };
    serp_info?: {
      serp_item?: {
        rank_absolute?: number;
      };
    };
    search_intent_info?: {
      main_intent?: string;
    };
  };
}

async function fetchKeywordsForSite(domain: string): Promise<KeywordOpportunity[]> {
  try {
    const raw = await dfsPost<{ items?: DfsKeyword[] }>(
      "/dataforseo_labs/google/keywords_for_site/live",
      [{ target: domain, language_code: "fr", location_code: 2250, limit: 20 }]
    );

    return (raw?.items ?? []).map((item) => {
      const kd = item.keyword_data ?? {};
      const vol = kd.keyword_info?.search_volume ?? 0;
      const diff = kd.keyword_properties?.keyword_difficulty ?? 0;
      return {
        keyword: kd.keyword ?? item.keyword ?? "",
        searchVolume: vol,
        difficulty: diff,
        position: kd.serp_info?.serp_item?.rank_absolute ?? null,
        cpc: kd.keyword_info?.cpc ?? null,
        intent: kd.search_intent_info?.main_intent ?? undefined,
        priority: Math.round(vol / Math.max(diff, 1)),
      };
    }).filter((k) => k.keyword.length > 0)
      .sort((a, b) => b.priority - a.priority);
  } catch {
    return [];
  }
}

// ─── DataForSEO : keyword_ideas ─────────────────────────────────────────────
interface DfsKeywordIdea {
  keyword?: string;
  search_volume?: number;
  keyword_difficulty?: number;
  search_intent_info?: { main_intent?: string };
  keyword_info?: { search_volume?: number };
  keyword_properties?: { keyword_difficulty?: number };
}

async function fetchKeywordIdeas(seedKeywords: string[]): Promise<KeywordIdea[]> {
  if (seedKeywords.length === 0) return [];
  try {
    const raw = await dfsPost<{ items?: DfsKeywordIdea[] }>(
      "/dataforseo_labs/google/keyword_ideas/live",
      [{ keywords: seedKeywords.slice(0, 3), language_code: "fr", location_code: 2250, limit: 15 }]
    );

    return (raw?.items ?? []).map((item) => ({
      keyword: item.keyword ?? "",
      searchVolume: item.keyword_info?.search_volume ?? item.search_volume ?? 0,
      difficulty: item.keyword_properties?.keyword_difficulty ?? item.keyword_difficulty ?? 0,
      intent: item.search_intent_info?.main_intent ?? "informational",
    })).filter((k) => k.keyword.length > 0);
  } catch {
    return [];
  }
}

export async function POST(req: NextRequest) {
  const check = await requireAdmin();
  if (check instanceof NextResponse) return check;

  const { url, businessKeywords } = await req.json();
  if (!url) return NextResponse.json({ error: "url requis" }, { status: 400 });

  let domain: string;
  try {
    domain = new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return NextResponse.json({ error: "URL invalide" }, { status: 400 });
  }

  try {
    // Tout en parallèle
    const [indexed, keywordsForSite] = await Promise.allSettled([
      fetchIndexedPages(domain),
      fetchKeywordsForSite(domain),
    ]);

    const indexedResult = indexed.status === "fulfilled" ? indexed.value : { pages: [], count: 0 };
    const kwForSite = keywordsForSite.status === "fulfilled" ? keywordsForSite.value : [];

    // Keyword ideas basées sur les mots-clés business + top keywords trouvés
    const seedKw = [
      ...(businessKeywords ?? []).slice(0, 2),
      ...kwForSite.slice(0, 2).map((k) => k.keyword),
    ].slice(0, 3);

    const kwIdeas = await fetchKeywordIdeas(seedKw);

    const data: KeywordsData = {
      indexedPages: indexedResult.pages,
      indexedCount: indexedResult.count,
      keywordsForSite: kwForSite,
      keywordIdeas: kwIdeas,
    };

    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
