import { Metadata } from "next";
import type { ArticleQueueItem, GscMetrics, GaMetrics } from "./types";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import KpiBar from "./_components/KpiBar";
import IntegrationsPanel from "./_components/IntegrationsPanel";
import AgentPanel from "./_components/AgentPanel";

export const metadata: Metadata = {
  title: "Blog & Articles — Vanzon Admin",
  robots: { index: false, follow: false },
};

interface AgentRunRow {
  id: string;
  agentName: string;
  startedAt: string;
  finishedAt: string | null;
  status: "running" | "success" | "error";
  itemsProcessed: number;
  itemsCreated: number;
  errorMessage: string | null;
}

async function getArticleQueue(): Promise<ArticleQueueItem[]> {
  try {
    const sb = createSupabaseAdmin();
    const { data, error } = await sb
      .from("article_queue")
      .select("*")
      .order("priority", { ascending: true })
      .order("created_at", { ascending: true });
    if (error) throw error;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data ?? []).map((row: any) => ({
      id:               row.id,
      slug:             row.slug,
      title:            row.title,
      excerpt:          row.excerpt ?? "",
      category:         row.category,
      tag:              row.tag ?? null,
      readTime:         row.read_time ?? "5 min",
      targetKeyword:    row.target_keyword ?? "",
      secondaryKeywords: row.secondary_keywords ?? [],
      targetWordCount:  row.target_word_count,
      wordCountNote:    row.word_count_note,
      status:           row.status,
      priority:         row.priority,
      sanityId:         row.sanity_id ?? null,
      publishedAt:      row.published_at ?? null,
      lastSeoCheck:     row.last_seo_check ?? null,
      seoPosition:      row.seo_position ?? null,
      searchVolume:     row.search_volume,
      competitionLevel: row.competition_level,
      seoScore:         row.seo_score,
      createdAt:        row.created_at,
    })) as ArticleQueueItem[];
  } catch {
    return [];
  }
}

async function getRecentAgentRuns(): Promise<AgentRunRow[]> {
  try {
    const sb = createSupabaseAdmin();
    const { data, error } = await sb
      .from("agent_runs")
      .select("*")
      .order("started_at", { ascending: false })
      .limit(50);
    if (error) return [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data ?? []).map((r: any) => ({
      id:             r.id,
      agentName:      r.agent_name,
      startedAt:      r.started_at,
      finishedAt:     r.finished_at ?? null,
      status:         r.status,
      itemsProcessed: r.items_processed ?? 0,
      itemsCreated:   r.items_created ?? 0,
      errorMessage:   r.error_message ?? null,
    }));
  } catch {
    return [];
  }
}

async function getGscMetrics(): Promise<{ metrics: Record<string, GscMetrics>; connected: boolean }> {
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN || process.env.GOOGLE_GSC_REFRESH_TOKEN;
  if (!refreshToken) return { metrics: {}, connected: false };

  try {
    // Exchange refresh token for access token
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
        body: JSON.stringify({ startDate, endDate, dimensions: ["page"], rowLimit: 100 }),
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

async function getGaMetrics(): Promise<{ metrics: Record<string, GaMetrics>; connected: boolean; activeUsers?: number }> {
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

    // Page-level report: sessions, pageviews, avgSessionDuration, bounceRate
    const [reportRes, realtimeRes] = await Promise.all([
      fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`, {
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
            filter: {
              fieldName: "pagePath",
              stringFilter: { matchType: "BEGINS_WITH", value: "/articles/" },
            },
          },
          limit: 100,
        }),
        next: { revalidate: 300 },
      }),
      fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runRealtimeReport`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ metrics: [{ name: "activeUsers" }] }),
        next: { revalidate: 60 },
      }),
    ]);

    const metrics: Record<string, GaMetrics> = {};
    if (reportRes.ok) {
      const data = await reportRes.json();
      for (const row of data.rows ?? []) {
        const pagePath: string = row.dimensionValues[0].value;
        const match = pagePath.match(/\/vanzon\/articles\/([^/?#]+)/);
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

    let activeUsers: number | undefined;
    if (realtimeRes.ok) {
      const rtData = await realtimeRes.json();
      activeUsers = Math.round(Number(rtData.rows?.[0]?.metricValues?.[0]?.value ?? 0));
    }

    return { metrics, connected: true, activeUsers };
  } catch {
    return { metrics: {}, connected: false };
  }
}

export default async function AdminBlogPage() {
  const [articles, { connected: gscConnected }, { connected: gaConnected, activeUsers }, agentRuns] = await Promise.all([
    getArticleQueue(),
    getGscMetrics(),
    getGaMetrics(),
    getRecentAgentRuns(),
  ]);

  const publishedCount = articles.filter((a) => a.status === "published" || a.status === "needs-improvement").length;
  const pendingCount = articles.filter((a) => a.status === "pending" || a.status === "writing").length;

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="flex items-start sm:items-center justify-between mb-6 md:mb-8 gap-4">
        <div>
          <p className="text-slate-400 text-sm font-medium mb-1">Administration</p>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900">Blog & Articles</h1>
          <p className="text-slate-500 mt-1">
            {publishedCount} publié{publishedCount > 1 ? "s" : ""} · {pendingCount} en attente
          </p>
        </div>
        <a
          href="/vanzon/studio/structure/article"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 font-semibold text-white text-sm px-5 py-2.5 rounded-xl transition-all"
          style={{ background: "linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)", boxShadow: "0 4px 14px rgba(99,102,241,0.35)" }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Sanity Studio
        </a>
      </div>

      {/* KPIs */}
      <KpiBar articles={articles} activeUsers={activeUsers} />

      {/* Agents IA */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <span className="w-8 h-px bg-slate-200" />
          <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">Intelligence IA</span>
        </div>
        <AgentPanel publishedArticles={articles.filter(a => a.status === "published" || a.status === "needs-improvement")} agentRuns={agentRuns} />
      </div>

      {/* Liens rapides */}
      <div className="mb-8 flex gap-3 flex-wrap">
        <a
          href="/admin/formation/queue"
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
        >
          <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
          File d&apos;articles
          <span className="text-xs text-slate-400">→</span>
        </a>
        <a
          href="/admin/blog/published"
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
        >
          <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Articles publiés
          <span className="text-xs text-slate-400">→</span>
        </a>
      </div>

      {/* Intégrations */}
      <IntegrationsPanel gscConnected={gscConnected} gaConnected={gaConnected} />
    </div>
  );
}
