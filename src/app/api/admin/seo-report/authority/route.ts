import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { dfsPost } from "@/lib/dataforseo";
import type { AuthorityData } from "@/types/seo-report";

interface DfsBacklinksSummary {
  rank?: number;
  backlinks?: number;
  referring_domains?: number;
}

export async function POST(req: NextRequest) {
  const check = await requireAdmin();
  if (check instanceof NextResponse) return check;

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
    const result = await dfsPost<DfsBacklinksSummary>(
      "/backlinks/summary/live",
      [{ target: domain, target_type: "domain", include_subdomains: true }]
    );

    const data: AuthorityData = {
      domainAuthority: Math.round(result?.rank ?? 0),
      backlinksCount: result?.backlinks ?? 0,
      referringDomains: result?.referring_domains ?? 0,
      organicTraffic: 0,
    };

    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
