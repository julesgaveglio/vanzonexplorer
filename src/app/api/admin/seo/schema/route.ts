import { requireAdmin } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { dfsPost } from "@/lib/dataforseo";

const SCHEMA_TYPES = ["LocalBusiness", "Product", "FAQPage", "BreadcrumbList", "Article"];

export async function GET(req: NextRequest) {
  const check = await requireAdmin();
  if (check instanceof NextResponse) return check;

  const url = req.nextUrl.searchParams.get("url");
  if (!url) return NextResponse.json({ error: "url requis" }, { status: 400 });

  try {
    const result = await dfsPost<{
      items?: Array<{
        meta?: {
          structured_data?: Record<string, unknown>;
        };
      }>;
    }>("/on_page/instant_pages", [{ url, load_resources: false, enable_javascript: false }]);

    const structuredData = result?.items?.[0]?.meta?.structured_data ?? {};
    const detected = SCHEMA_TYPES.map((type) => ({
      type,
      present: type in structuredData,
    }));

    return NextResponse.json({ url, detected, raw: structuredData });
  } catch (err) {
    console.error("[seo/schema]", err);
    return NextResponse.json({ error: "Erreur DataForSEO" }, { status: 500 });
  }
}
