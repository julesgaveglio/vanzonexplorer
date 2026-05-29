/**
 * Meta Marketing API — fetch ad spend & insights in real-time.
 *
 * Env vars required:
 *   META_ADS_ACCESS_TOKEN — long-lived user access token (60 days)
 *   META_ADS_ACCOUNT_ID   — ad account ID (e.g. act_1292205829643389)
 */

const API_VERSION = "v25.0";
const BASE = `https://graph.facebook.com/${API_VERSION}`;

function getToken() {
  const token = process.env.META_ADS_ACCESS_TOKEN;
  if (!token) throw new Error("META_ADS_ACCESS_TOKEN is not set");
  return token;
}

function getAccountId() {
  return process.env.META_ADS_ACCOUNT_ID ?? "act_1292205829643389";
}

export interface MetaInsights {
  spend: number;
  impressions: number;
  clicks: number;
  cpc: number;
  cpm: number;
  ctr: number;
  reach: number;
}

export interface MetaDailyInsight extends MetaInsights {
  date: string;
}

/**
 * Fetch aggregated insights for a date range.
 */
export async function fetchMetaInsights(
  since: string,
  until: string
): Promise<MetaInsights> {
  const params = new URLSearchParams({
    fields: "spend,impressions,clicks,cpc,cpm,ctr,reach",
    time_range: JSON.stringify({ since, until }),
    access_token: getToken(),
  });

  const res = await fetch(`${BASE}/${getAccountId()}/insights?${params}`);
  if (!res.ok) {
    const err = await res.json();
    console.error("[meta-ads] API error:", err.error?.message);
    return { spend: 0, impressions: 0, clicks: 0, cpc: 0, cpm: 0, ctr: 0, reach: 0 };
  }

  const json = await res.json();
  const d = json.data?.[0];
  if (!d) return { spend: 0, impressions: 0, clicks: 0, cpc: 0, cpm: 0, ctr: 0, reach: 0 };

  return {
    spend: parseFloat(d.spend ?? "0"),
    impressions: parseInt(d.impressions ?? "0"),
    clicks: parseInt(d.clicks ?? "0"),
    cpc: parseFloat(d.cpc ?? "0"),
    cpm: parseFloat(d.cpm ?? "0"),
    ctr: parseFloat(d.ctr ?? "0"),
    reach: parseInt(d.reach ?? "0"),
  };
}

/**
 * Fetch daily breakdown of insights.
 */
export async function fetchMetaDailyInsights(
  since: string,
  until: string
): Promise<MetaDailyInsight[]> {
  const params = new URLSearchParams({
    fields: "spend,impressions,clicks,cpc,cpm,ctr,reach",
    time_range: JSON.stringify({ since, until }),
    time_increment: "1",
    access_token: getToken(),
  });

  const res = await fetch(`${BASE}/${getAccountId()}/insights?${params}`);
  if (!res.ok) return [];

  const json = await res.json();
  return (json.data ?? []).map((d: Record<string, string>) => ({
    date: d.date_start,
    spend: parseFloat(d.spend ?? "0"),
    impressions: parseInt(d.impressions ?? "0"),
    clicks: parseInt(d.clicks ?? "0"),
    cpc: parseFloat(d.cpc ?? "0"),
    cpm: parseFloat(d.cpm ?? "0"),
    ctr: parseFloat(d.ctr ?? "0"),
    reach: parseInt(d.reach ?? "0"),
  }));
}
