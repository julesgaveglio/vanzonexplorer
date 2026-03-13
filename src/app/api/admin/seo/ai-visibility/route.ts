import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { dfsPostRaw, DFS_TARGET } from "@/lib/dataforseo";

export const revalidate = 3600;

// ⚠️ Vérifier ces chemins contre les DataForSEO API docs si erreur 40400
const ENDPOINT_METRICS = "/ai_optimization/llm_mentions/aggregate_metrics/live";
const ENDPOINT_TOP_PAGES = "/ai_optimization/llm_mentions/top_pages/live";

interface DfsRawResponse {
  status_code: number;
  status_message: string;
  tasks?: Array<{
    status_code: number;
    status_message: string;
    result?: Array<Record<string, unknown>>;
  }>;
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  try {
    const metricsRaw = await dfsPostRaw<DfsRawResponse>(
      ENDPOINT_METRICS,
      [{ target: DFS_TARGET }]
    );

    const taskStatusCode = metricsRaw?.tasks?.[0]?.status_code;

    if (taskStatusCode === 40602) {
      return NextResponse.json({ available: false, reason: "domain_not_registered" });
    }

    if (taskStatusCode !== 20000) {
      const msg = metricsRaw?.tasks?.[0]?.status_message ?? "Erreur inconnue";
      return NextResponse.json({ error: `DataForSEO: ${taskStatusCode} — ${msg}` }, { status: 500 });
    }

    const metrics = metricsRaw?.tasks?.[0]?.result?.[0] ?? {};

    const topPagesRaw = await dfsPostRaw<DfsRawResponse>(
      ENDPOINT_TOP_PAGES,
      [{ target: DFS_TARGET, limit: 3 }]
    );
    const topPages = topPagesRaw?.tasks?.[0]?.result ?? [];

    return NextResponse.json({ available: true, metrics, topPages });
  } catch (err) {
    console.error("[seo/ai-visibility]", err);
    return NextResponse.json({ error: "Erreur DataForSEO" }, { status: 500 });
  }
}
