import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";

const PERIOD_DAYS: Record<string, number> = { day: 1, week: 7, month: 30, year: 365 };

async function getAccessToken(): Promise<string> {
  // GOOGLE_REFRESH_TOKEN est le token actif (GOOGLE_GSC_REFRESH_TOKEN est commenté)
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN ?? process.env.GOOGLE_GSC_REFRESH_TOKEN;
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_GSC_CLIENT_ID!,
      client_secret: process.env.GOOGLE_GSC_CLIENT_SECRET!,
      refresh_token: refreshToken!,
      grant_type: "refresh_token",
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Token refresh failed: ${JSON.stringify(data)}`);
  return data.access_token;
}

async function gscQuery(token: string, site: string, body: object) {
  const res = await fetch(
    `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(site)}/searchAnalytics/query`,
    { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify(body) }
  );
  if (!res.ok) throw new Error(JSON.stringify(await res.json()));
  return res.json();
}

export async function GET(req: NextRequest) {
  const adminCheck = await requireAdmin();
  if (adminCheck instanceof NextResponse) return adminCheck;

  const site = process.env.GSC_SITE_URL ?? "https://vanzonexplorer.com";
  const period = req.nextUrl.searchParams.get("period") ?? "month";
  const days = PERIOD_DAYS[period] ?? 30;
  const endDate = new Date().toISOString().slice(0, 10);
  const startDate = new Date(Date.now() - days * 864e5).toISOString().slice(0, 10);

  try {
    const token = await getAccessToken();

    const [totals, byQuery, byPage] = await Promise.all([
      gscQuery(token, site, { startDate, endDate, dimensions: [] }),
      gscQuery(token, site, { startDate, endDate, dimensions: ["query"], rowLimit: 15 }),
      gscQuery(token, site, { startDate, endDate, dimensions: ["page"], rowLimit: 15 }),
    ]);

    const t = totals.rows?.[0] ?? { clicks: 0, impressions: 0, ctr: 0, position: 0 };

    return NextResponse.json(
      {
        period,
        totals: {
          clicks: t.clicks ?? 0,
          impressions: t.impressions ?? 0,
          ctr: t.ctr ?? 0,
          position: t.position ? Math.round(t.position * 10) / 10 : 0,
        },
        queries: (byQuery.rows ?? []).map((r: { keys: string[]; clicks: number; impressions: number; position: number }) => ({
          query: r.keys[0],
          clicks: r.clicks,
          impressions: r.impressions,
          position: Math.round(r.position * 10) / 10,
        })),
        pages: (byPage.rows ?? []).map((r: { keys: string[]; clicks: number; impressions: number; position: number }) => ({
          page: r.keys[0].replace(site, ""),
          clicks: r.clicks,
          impressions: r.impressions,
          position: Math.round(r.position * 10) / 10,
        })),
      },
      { headers: { "Cache-Control": "s-maxage=1800, stale-while-revalidate" } }
    );
  } catch (err) {
    console.error("[pulse/seo] error:", err);
    return NextResponse.json({ error: "gsc_failed", detail: (err as Error).message }, { status: 500 });
  }
}
