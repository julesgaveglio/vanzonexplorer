import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { dfsPostRaw } from "@/lib/dataforseo";
import type { CompetitorsData } from "@/types/seo-report";

interface DfsCompetitorsRaw {
  tasks?: Array<{
    result?: Array<{
      domain: string;
      intersections: number;
      relevance: number;
    }>;
  }>;
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await req.json();
  const { url } = body;
  if (!url) return NextResponse.json({ error: "url requis" }, { status: 400 });

  let domain: string;
  try {
    domain = new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return NextResponse.json({ error: "URL invalide" }, { status: 400 });
  }

  try {
    const raw = await dfsPostRaw<DfsCompetitorsRaw>(
      "/dataforseo_labs/google/competitors_domain/live",
      [{ target: domain, language_name: "French", location_name: "France", limit: 5 }]
    );

    const items = raw?.tasks?.[0]?.result ?? [];
    const competitors = items.map((item) => ({
      domain: item.domain,
      intersections: item.intersections ?? 0,
      relevance: Math.round((item.relevance ?? 0) * 100),
    }));

    const data: CompetitorsData = { competitors };
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
