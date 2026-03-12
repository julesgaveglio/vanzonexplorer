import { Metadata } from "next";
import { readFile } from "fs/promises";
import path from "path";
import type { ArticleQueueItem, GscMetrics } from "./types";
import KpiBar from "./_components/KpiBar";
import PublishedArticlesTable from "./_components/PublishedArticlesTable";
import ArticleQueueList from "./_components/ArticleQueueList";
import IntegrationsPanel from "./_components/IntegrationsPanel";

export const metadata: Metadata = {
  title: "Blog & Articles — Vanzon Admin",
  robots: { index: false, follow: false },
};

async function getArticleQueue(): Promise<ArticleQueueItem[]> {
  try {
    const queuePath = path.resolve(process.cwd(), "scripts/data/article-queue.json");
    const raw = await readFile(queuePath, "utf-8");
    return JSON.parse(raw) as ArticleQueueItem[];
  } catch {
    return [];
  }
}

async function getGscMetrics(): Promise<{ metrics: Record<string, GscMetrics>; connected: boolean }> {
  const refreshToken = process.env.GOOGLE_GSC_REFRESH_TOKEN;
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

export default async function AdminBlogPage() {
  const [articles, { metrics: gscMetrics, connected: gscConnected }] = await Promise.all([
    getArticleQueue(),
    getGscMetrics(),
  ]);

  const publishedCount = articles.filter((a) => a.status === "published").length;
  const pendingCount = articles.filter((a) => a.status === "pending" || a.status === "writing").length;

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-slate-400 text-sm font-medium mb-1">Administration</p>
          <h1 className="text-3xl font-black text-slate-900">Blog & Articles</h1>
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
      <KpiBar articles={articles} />

      {/* Articles publiés */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <span className="w-8 h-px bg-slate-200" />
          <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">Articles publiés</span>
        </div>
        <PublishedArticlesTable articles={articles} gscMetrics={gscMetrics} />
      </div>

      {/* File d'attente */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <span className="w-8 h-px bg-slate-200" />
          <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">File d&apos;attente</span>
        </div>
        <ArticleQueueList articles={articles} />
      </div>

      {/* Intégrations */}
      <IntegrationsPanel gscConnected={gscConnected} />
    </div>
  );
}
