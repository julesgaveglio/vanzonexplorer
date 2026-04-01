import { Metadata } from "next";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { client as sanityClient } from "@/lib/sanity/client";
import { groq } from "next-sanity";
import type { ArticleQueueItem, GscMetrics, GaMetrics } from "../types";
import PublishedArticlesTable from "../_components/PublishedArticlesTable";
import IntegrationsPanel from "../_components/IntegrationsPanel";

export const metadata: Metadata = {
  title: "Articles publiés — Vanzon Admin",
  robots: { index: false, follow: false },
};

// Tous les articles dans Sanity — source de vérité des articles en ligne
const sanityArticlesQuery = groq`
  *[_type == "article"] | order(publishedAt desc) {
    _id,
    title,
    "slug": slug.current,
    excerpt,
    category,
    tag,
    readTime,
    publishedAt,
  }
`;

interface SanityArticle {
  _id: string;
  title: string;
  slug: string;
  excerpt?: string;
  category?: string;
  tag?: string;
  readTime?: string;
  publishedAt?: string;
}

async function getPublishedArticles(): Promise<ArticleQueueItem[]> {
  try {
    // 1. Source de vérité : Sanity — TOUS les articles présents dans le CMS
    const sanityArticles = await sanityClient.fetch<SanityArticle[]>(sanityArticlesQuery);

    if (!sanityArticles || sanityArticles.length === 0) {
      // Fallback : si Sanity inaccessible, on tente la queue
      const sb = createSupabaseAdmin();
      const { data } = await sb
        .from("article_queue")
        .select("*")
        .in("status", ["published", "needs-improvement"])
        .order("published_at", { ascending: false });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (data ?? []).map((row: any) => ({
        id: row.id, slug: row.slug, title: row.title, excerpt: row.excerpt ?? "",
        category: row.category, tag: row.tag ?? null, readTime: row.read_time ?? "5 min",
        targetKeyword: row.target_keyword ?? "", secondaryKeywords: row.secondary_keywords ?? [],
        status: row.status, priority: row.priority, sanityId: row.sanity_id ?? null,
        publishedAt: row.published_at ?? null, lastSeoCheck: null, seoPosition: row.seo_position ?? null,
        searchVolume: row.search_volume, competitionLevel: row.competition_level, seoScore: row.seo_score,
        createdAt: row.created_at,
      })) as ArticleQueueItem[];
    }

    // 2. Enrichir avec les données de article_queue (target_keyword, seo_position, etc.)
    const sb = createSupabaseAdmin();
    const { data: queueRows } = await sb
      .from("article_queue")
      .select("slug, target_keyword, seo_position, seo_score, search_volume, competition_level, sanity_id, status, priority, created_at");

    // Index par slug pour lookup O(1)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const queueBySlug = new Map<string, any>();
    for (const row of queueRows ?? []) {
      if (row.slug) queueBySlug.set(row.slug, row);
    }

    // 3. Construire la liste finale depuis Sanity, enrichie de la queue
    return sanityArticles.map((a) => {
      const q = queueBySlug.get(a.slug);
      return {
        id:               q?.id ?? a._id,
        slug:             a.slug,
        title:            a.title ?? "",
        excerpt:          a.excerpt ?? "",
        category:         (a.category ?? "Business Van") as ArticleQueueItem["category"],
        tag:              a.tag ?? null,
        readTime:         a.readTime ?? "5 min",
        targetKeyword:    q?.target_keyword ?? "",
        secondaryKeywords: [],
        status:           (q?.status === "published" || !q ? "published" : q.status) as ArticleQueueItem["status"],
        priority:         q?.priority ?? 99,
        sanityId:         a._id,
        publishedAt:      a.publishedAt ?? null,
        lastSeoCheck:     null,
        seoPosition:      q?.seo_position ?? null,
        searchVolume:     q?.search_volume,
        competitionLevel: q?.competition_level,
        seoScore:         q?.seo_score,
        createdAt:        q?.created_at,
      } as ArticleQueueItem;
    });
  } catch (e) {
    console.error("[ArticlesPublies]", e);
    return [];
  }
}

async function getGscMetrics(): Promise<{ metrics: Record<string, GscMetrics>; connected: boolean }> {
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN || process.env.GOOGLE_GSC_REFRESH_TOKEN;
  if (!refreshToken) return { metrics: {}, connected: false };
  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_GSC_CLIENT_ID!,
        client_secret: process.env.GOOGLE_GSC_CLIENT_SECRET!,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
      next: { revalidate: 3600 },
    });
    const tokenData = await tokenRes.json();
    if (!tokenRes.ok) return { metrics: {}, connected: false };
    const accessToken = tokenData.access_token;
    const siteUrl = process.env.GSC_SITE_URL!;
    const endDate = new Date().toISOString().slice(0, 10);
    const startDate = new Date(Date.now() - 28 * 86400000).toISOString().slice(0, 10);
    const res = await fetch(
      `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ startDate, endDate, dimensions: ["page"], rowLimit: 200 }),
        next: { revalidate: 3600 },
      }
    );
    if (!res.ok) return { metrics: {}, connected: true };
    const data = await res.json();
    const metrics: Record<string, GscMetrics> = {};
    for (const row of data.rows ?? []) {
      const match = (row.keys[0] as string).match(/\/articles\/([^/?#]+)/);
      if (match) {
        metrics[match[1]] = {
          clicks: row.clicks,
          impressions: row.impressions,
          ctr: row.ctr,
          position: Math.round(row.position * 10) / 10,
        };
      }
    }
    return { metrics, connected: true };
  } catch {
    return { metrics: {}, connected: false };
  }
}

async function getGaMetrics(): Promise<{ metrics: Record<string, GaMetrics>; connected: boolean }> {
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN || process.env.GOOGLE_GA_REFRESH_TOKEN;
  if (!refreshToken) return { metrics: {}, connected: false };
  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_GSC_CLIENT_ID!,
        client_secret: process.env.GOOGLE_GSC_CLIENT_SECRET!,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      }),
      next: { revalidate: 300 },
    });
    const tokenData = await tokenRes.json();
    if (!tokenRes.ok) return { metrics: {}, connected: false };
    const accessToken = tokenData.access_token;
    const propertyId = process.env.GOOGLE_GA_PROPERTY_ID ?? "483724268";
    const endDate = new Date().toISOString().slice(0, 10);
    const startDate = new Date(Date.now() - 28 * 86400000).toISOString().slice(0, 10);
    const reportRes = await fetch(
      `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          dateRanges: [{ startDate, endDate }],
          dimensions: [{ name: "pagePath" }],
          metrics: [
            { name: "sessions" },
            { name: "screenPageViews" },
            { name: "averageSessionDuration" },
            { name: "bounceRate" },
          ],
          dimensionFilter: {
            filter: { fieldName: "pagePath", stringFilter: { matchType: "BEGINS_WITH", value: "/articles/" } },
          },
          limit: 200,
        }),
        next: { revalidate: 300 },
      }
    );
    const metrics: Record<string, GaMetrics> = {};
    if (reportRes.ok) {
      const data = await reportRes.json();
      for (const row of data.rows ?? []) {
        const pagePath: string = row.dimensionValues[0].value;
        const match = pagePath.match(/\/articles\/([^/?#]+)/);
        if (match) {
          metrics[match[1]] = {
            sessions: Math.round(Number(row.metricValues[0].value)),
            pageviews: Math.round(Number(row.metricValues[1].value)),
            avgDuration: Math.round(Number(row.metricValues[2].value)),
            bounceRate: Math.round(Number(row.metricValues[3].value) * 100),
          };
        }
      }
    }
    return { metrics, connected: reportRes.ok };
  } catch {
    return { metrics: {}, connected: false };
  }
}

export default async function ArticlesPubliesPage() {
  const [articles, { metrics: gscMetrics, connected: gscConnected }, { metrics: gaMetrics, connected: gaConnected }] =
    await Promise.all([getPublishedArticles(), getGscMetrics(), getGaMetrics()]);

  const topPositions = Object.values(gscMetrics).filter(m => (m.position ?? 99) <= 10).length;
  const totalClicks = Object.values(gscMetrics).reduce((acc, m) => acc + (m.clicks ?? 0), 0);
  const totalImpressions = Object.values(gscMetrics).reduce((acc, m) => acc + (m.impressions ?? 0), 0);
  const avgCtr = Object.values(gscMetrics).length > 0
    ? (Object.values(gscMetrics).reduce((acc, m) => acc + (m.ctr ?? 0), 0) / Object.values(gscMetrics).length * 100).toFixed(1)
    : "0";

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <p className="text-slate-400 text-sm font-medium mb-1">SEO/GEO</p>
        <h1 className="text-3xl font-black text-slate-900">Articles publiés</h1>
        <p className="text-slate-500 mt-1">
          {articles.length} article{articles.length !== 1 ? "s" : ""} en ligne · performances Google Search Console + GA4
        </p>
      </div>

      {/* KPIs GSC */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {[
          { label: "Articles en ligne", value: articles.length, icon: "📄", color: "text-slate-900" },
          { label: "Top 10 Google", value: topPositions, icon: "🏆", color: "text-emerald-600" },
          { label: "Clics (28j)", value: totalClicks.toLocaleString("fr-FR"), icon: "👆", color: "text-blue-600" },
          { label: "Impressions (28j)", value: totalImpressions.toLocaleString("fr-FR"), icon: "👁️", color: "text-slate-700" },
          { label: "CTR moyen", value: `${avgCtr}%`, icon: "📊", color: "text-violet-600" },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="text-2xl mb-1">{kpi.icon}</div>
            <p className={`text-2xl font-black ${kpi.color}`}>{kpi.value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <PublishedArticlesTable
        articles={articles}
        gscMetrics={gscMetrics}
        gaMetrics={gaMetrics}
      />

      {/* Integrations status */}
      <div className="mt-8">
        <IntegrationsPanel gscConnected={gscConnected} gaConnected={gaConnected} />
      </div>
    </div>
  );
}
