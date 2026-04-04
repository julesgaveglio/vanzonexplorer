import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";

async function getAccessToken(): Promise<string> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_GSC_CLIENT_ID!,
      client_secret: process.env.GOOGLE_GSC_CLIENT_SECRET!,
      refresh_token: process.env.GOOGLE_GSC_REFRESH_TOKEN!,
      grant_type: "refresh_token",
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Token refresh failed: ${JSON.stringify(data)}`);
  return data.access_token;
}

export async function GET() {
  const check = await requireAdmin();
  if (check instanceof NextResponse) return check;
  const refreshToken = process.env.GOOGLE_GSC_REFRESH_TOKEN;
  if (!refreshToken) {
    return NextResponse.json({ error: "not_connected" }, { status: 401 });
  }

  try {
    const accessToken = await getAccessToken();
    const siteUrl = process.env.GSC_SITE_URL!;
    const encodedSite = encodeURIComponent(siteUrl);

    // Last 28 days
    const endDate = new Date().toISOString().slice(0, 10);
    const startDate = new Date(Date.now() - 28 * 86400000).toISOString().slice(0, 10);

    // Fetch by page (to match articles)
    const res = await fetch(
      `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodedSite}/searchAnalytics/query`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          startDate,
          endDate,
          dimensions: ["page"],
          rowLimit: 100,
        }),
      }
    );

    if (!res.ok) {
      const err = await res.json();
      return NextResponse.json({ error: err }, { status: res.status });
    }

    const data = await res.json();

    // Build a map: slug → metrics
    const metrics: Record<string, { clicks: number; impressions: number; ctr: number; position: number }> = {};
    for (const row of data.rows ?? []) {
      const pageUrl: string = row.keys[0];
      // Extract slug from URL
      const match = pageUrl.match(/\/articles\/([^/?#]+)/);
      if (match) {
        metrics[match[1]] = {
          clicks: row.clicks,
          impressions: row.impressions,
          ctr: row.ctr,
          position: Math.round(row.position * 10) / 10,
        };
      }
    }

    return NextResponse.json({ metrics, startDate, endDate }, {
      headers: { "Cache-Control": "s-maxage=3600, stale-while-revalidate" },
    });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
