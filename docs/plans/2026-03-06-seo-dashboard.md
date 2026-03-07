# SEO Dashboard Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build an interactive real-time SEO analytics dashboard at `/admin/seo` using the DataForSEO REST API, integrated into the existing Vanzon Explorer admin panel.

**Architecture:** Next.js API routes (`/api/admin/seo/*`) call DataForSEO REST API with Basic Auth and cache responses for 5 minutes. A client-side React dashboard fetches from these routes using SWR with 30-minute auto-refresh. All data is scoped to `vanzonexplorer.com` in France/French.

**Tech Stack:** Next.js 14 App Router, React, SWR, DataForSEO REST API v3, Tailwind CSS, Framer Motion, Clerk (auth), existing admin design system (dark sidebar `#0B1120`, white content area `#F1F5F9`)

---

## Context & Data Already Gathered

From DataForSEO analysis of `vanzonexplorer.com` (France, FR):
- **88 keywords** ranked organically
- **Position distribution:** 1 at pos 2-3, 9 at pos 4-10, 14 at pos 11-20, 13 at 21-30, 12 at 31-40, 13 at 41-50, 11 at 51-60, 9 at 61-70, 4 at 71-80, 2 at 81-90
- **ETV:** 108.79 | **Avg position:** 37.7
- **Trends:** 34 new KWs, 24 up ↑, 27 down ↓
- **Top competitors:** tourisme64.com, guide-du-paysbasque.com, wikicampers.fr, van-away.com, yescapa.fr, generationvoyage.fr, routard.com, en-pays-basque.fr

---

## Task 1: DataForSEO REST Client + ENV

**Files:**
- Create: `src/lib/dataforseo.ts`
- Modify: `.env.local` (manually add keys)

**Step 1: Add env vars to `.env.local`**

Add these two lines at the end of `.env.local`:
```
DATAFORSEO_LOGIN=your_login_email
DATAFORSEO_PASSWORD=your_api_password
```

> Get credentials at https://app.dataforseo.com/api-access

**Step 2: Create the REST client**

Create `src/lib/dataforseo.ts`:
```typescript
const DFS_BASE = "https://api.dataforseo.com/v3";

function getAuthHeader(): string {
  const login = process.env.DATAFORSEO_LOGIN!;
  const password = process.env.DATAFORSEO_PASSWORD!;
  return "Basic " + Buffer.from(`${login}:${password}`).toString("base64");
}

export async function dfsPost<T = unknown>(
  endpoint: string,
  body: unknown
): Promise<T> {
  const res = await fetch(`${DFS_BASE}${endpoint}`, {
    method: "POST",
    headers: {
      Authorization: getAuthHeader(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    next: { revalidate: 300 }, // 5 min cache
  });

  if (!res.ok) {
    throw new Error(`DataForSEO error ${res.status}: ${await res.text()}`);
  }

  const json = await res.json();
  if (json.status_code !== 20000) {
    throw new Error(`DataForSEO API error: ${json.status_message}`);
  }

  return json.tasks?.[0]?.result?.[0] as T;
}

export const DFS_TARGET = "vanzonexplorer.com";
export const DFS_LOCATION = "France";
export const DFS_LANGUAGE = "fr";
export const DFS_LOCATION_CODE = 2250;
export const DFS_LANGUAGE_CODE = "fr";
```

**Step 3: Commit**
```bash
git add src/lib/dataforseo.ts
git commit -m "feat: add DataForSEO REST client"
```

---

## Task 2: API Route — Domain Overview

**Files:**
- Create: `src/app/api/admin/seo/overview/route.ts`

**Step 1: Create the route**

```typescript
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { dfsPost, DFS_TARGET, DFS_LOCATION, DFS_LANGUAGE_CODE } from "@/lib/dataforseo";

export const revalidate = 300; // 5 min

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Non autorise" }, { status: 401 });

  try {
    const data = await dfsPost("/dataforseo_labs/google/domain_rank_overview/live", [
      {
        target: DFS_TARGET,
        location_name: DFS_LOCATION,
        language_code: DFS_LANGUAGE_CODE,
        ignore_synonyms: true,
      },
    ]);

    return NextResponse.json(data);
  } catch (err) {
    console.error("[seo/overview]", err);
    return NextResponse.json({ error: "Erreur DataForSEO" }, { status: 500 });
  }
}
```

**Step 2: Commit**
```bash
git add src/app/api/admin/seo/overview/route.ts
git commit -m "feat: add SEO overview API route"
```

---

## Task 3: API Route — Ranked Keywords

**Files:**
- Create: `src/app/api/admin/seo/keywords/route.ts`

**Step 1: Create the route**

```typescript
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { dfsPost, DFS_TARGET, DFS_LOCATION, DFS_LANGUAGE_CODE } from "@/lib/dataforseo";

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Non autorise" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const limit = parseInt(searchParams.get("limit") ?? "100");
  const offset = parseInt(searchParams.get("offset") ?? "0");
  const orderBy = searchParams.get("order") ?? "keyword_data.keyword_info.search_volume,desc";

  try {
    const data = await dfsPost("/dataforseo_labs/google/ranked_keywords/live", [
      {
        target: DFS_TARGET,
        location_name: DFS_LOCATION,
        language_code: DFS_LANGUAGE_CODE,
        limit,
        offset,
        order_by: [orderBy],
        item_types: ["organic"],
        ignore_synonyms: true,
      },
    ]);

    return NextResponse.json(data);
  } catch (err) {
    console.error("[seo/keywords]", err);
    return NextResponse.json({ error: "Erreur DataForSEO" }, { status: 500 });
  }
}
```

**Step 2: Commit**
```bash
git add src/app/api/admin/seo/keywords/route.ts
git commit -m "feat: add SEO keywords API route"
```

---

## Task 4: API Route — Competitors

**Files:**
- Create: `src/app/api/admin/seo/competitors/route.ts`

**Step 1: Create the route**

```typescript
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { dfsPost, DFS_TARGET, DFS_LOCATION, DFS_LANGUAGE_CODE } from "@/lib/dataforseo";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Non autorise" }, { status: 401 });

  try {
    const data = await dfsPost("/dataforseo_labs/google/competitors_domain/live", [
      {
        target: DFS_TARGET,
        location_name: DFS_LOCATION,
        language_code: DFS_LANGUAGE_CODE,
        limit: 20,
        exclude_top_domains: true,
        ignore_synonyms: true,
        item_types: ["organic"],
      },
    ]);

    return NextResponse.json(data);
  } catch (err) {
    console.error("[seo/competitors]", err);
    return NextResponse.json({ error: "Erreur DataForSEO" }, { status: 500 });
  }
}
```

**Step 2: Commit**
```bash
git add src/app/api/admin/seo/competitors/route.ts
git commit -m "feat: add SEO competitors API route"
```

---

## Task 5: API Route — Live SERP

**Files:**
- Create: `src/app/api/admin/seo/serp/route.ts`

**Step 1: Create the route**

```typescript
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { dfsPost, DFS_LOCATION_CODE, DFS_LANGUAGE_CODE } from "@/lib/dataforseo";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Non autorise" }, { status: 401 });

  const { keyword } = await req.json();
  if (!keyword) return NextResponse.json({ error: "Keyword requis" }, { status: 400 });

  try {
    const data = await dfsPost("/serp/google/organic/live/advanced", [
      {
        keyword,
        location_code: DFS_LOCATION_CODE,
        language_code: DFS_LANGUAGE_CODE,
        device: "desktop",
        os: "windows",
        depth: 20,
      },
    ]);

    return NextResponse.json(data);
  } catch (err) {
    console.error("[seo/serp]", err);
    return NextResponse.json({ error: "Erreur DataForSEO" }, { status: 500 });
  }
}
```

**Step 2: Commit**
```bash
git add src/app/api/admin/seo/serp/route.ts
git commit -m "feat: add live SERP API route"
```

---

## Task 6: API Route — Keyword Ideas

**Files:**
- Create: `src/app/api/admin/seo/ideas/route.ts`

**Step 1: Create the route**

```typescript
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { dfsPost, DFS_LOCATION, DFS_LANGUAGE_CODE } from "@/lib/dataforseo";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Non autorise" }, { status: 401 });

  const { keyword } = await req.json();
  if (!keyword) return NextResponse.json({ error: "Keyword requis" }, { status: 400 });

  try {
    const data = await dfsPost("/dataforseo_labs/google/keyword_ideas/live", [
      {
        keywords: [keyword],
        location_name: DFS_LOCATION,
        language_code: DFS_LANGUAGE_CODE,
        limit: 50,
        order_by: ["keyword_info.search_volume,desc"],
        ignore_synonyms: false,
      },
    ]);

    return NextResponse.json(data);
  } catch (err) {
    console.error("[seo/ideas]", err);
    return NextResponse.json({ error: "Erreur DataForSEO" }, { status: 500 });
  }
}
```

**Step 2: Commit**
```bash
git add src/app/api/admin/seo/ideas/route.ts
git commit -m "feat: add keyword ideas API route"
```

---

## Task 7: Install SWR

**Step 1: Install**
```bash
npm install swr
```

**Step 2: Commit**
```bash
git add package.json package-lock.json
git commit -m "chore: add swr dependency"
```

---

## Task 8: SEO Dashboard Page + Client Component

**Files:**
- Create: `src/app/admin/seo/page.tsx`
- Create: `src/app/admin/seo/SeoClient.tsx`
- Create: `src/app/admin/seo/components/KpiCard.tsx`
- Create: `src/app/admin/seo/components/PositionChart.tsx`
- Create: `src/app/admin/seo/components/KeywordsTable.tsx`
- Create: `src/app/admin/seo/components/CompetitorsTable.tsx`
- Create: `src/app/admin/seo/components/SerpChecker.tsx`
- Create: `src/app/admin/seo/components/KeywordIdeas.tsx`
- Create: `src/app/admin/seo/components/QuickWins.tsx`

**Step 1: Create server page wrapper**

Create `src/app/admin/seo/page.tsx`:
```typescript
import { Metadata } from "next";
import SeoClient from "./SeoClient";

export const metadata: Metadata = {
  title: "SEO Analytics — Vanzon Admin",
  robots: { index: false, follow: false },
};

export default function SeoPage() {
  return <SeoClient />;
}
```

**Step 2: Create KpiCard component**

Create `src/app/admin/seo/components/KpiCard.tsx`:
```typescript
"use client";

type Trend = "up" | "down" | "neutral";

interface KpiCardProps {
  label: string;
  value: string | number;
  sub?: string;
  trend?: Trend;
  trendValue?: string;
  icon?: string;
  gradient?: string;
}

export function KpiCard({ label, value, sub, trend, trendValue, icon, gradient = "from-blue-500 to-sky-400" }: KpiCardProps) {
  const trendColor = trend === "up" ? "text-emerald-500" : trend === "down" ? "text-red-400" : "text-slate-400";
  const trendIcon = trend === "up" ? "↑" : trend === "down" ? "↓" : "—";

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-xl mb-4 shadow-sm`}>
        {icon}
      </div>
      <p className="text-3xl font-black text-slate-900">{value}</p>
      <p className="text-sm font-semibold text-slate-700 mt-1">{label}</p>
      <div className="flex items-center gap-2 mt-1">
        {sub && <p className="text-xs text-slate-400">{sub}</p>}
        {trendValue && (
          <span className={`text-xs font-bold ${trendColor}`}>
            {trendIcon} {trendValue}
          </span>
        )}
      </div>
    </div>
  );
}
```

**Step 3: Create PositionChart component**

Create `src/app/admin/seo/components/PositionChart.tsx`:
```typescript
"use client";

interface Bucket {
  label: string;
  count: number;
  color: string;
  bg: string;
}

interface PositionChartProps {
  metrics: {
    pos_2_3?: number;
    pos_4_10?: number;
    pos_11_20?: number;
    pos_21_30?: number;
    pos_31_40?: number;
    pos_41_50?: number;
    pos_51_60?: number;
    pos_61_70?: number;
    pos_71_80?: number;
    pos_81_90?: number;
    pos_91_100?: number;
  };
  total: number;
}

export function PositionChart({ metrics, total }: PositionChartProps) {
  const buckets: Bucket[] = [
    { label: "Top 3", count: (metrics.pos_2_3 ?? 0), color: "#10B981", bg: "#D1FAE5" },
    { label: "4-10", count: (metrics.pos_4_10 ?? 0), color: "#3B82F6", bg: "#DBEAFE" },
    { label: "11-20", count: (metrics.pos_11_20 ?? 0), color: "#8B5CF6", bg: "#EDE9FE" },
    { label: "21-30", count: (metrics.pos_21_30 ?? 0), color: "#F59E0B", bg: "#FEF3C7" },
    { label: "31-50", count: ((metrics.pos_31_40 ?? 0) + (metrics.pos_41_50 ?? 0)), color: "#F97316", bg: "#FED7AA" },
    { label: "50+", count: ((metrics.pos_51_60 ?? 0) + (metrics.pos_61_70 ?? 0) + (metrics.pos_71_80 ?? 0) + (metrics.pos_81_90 ?? 0) + (metrics.pos_91_100 ?? 0)), color: "#94A3B8", bg: "#F1F5F9" },
  ];

  const maxCount = Math.max(...buckets.map(b => b.count), 1);

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
      <h2 className="font-bold text-slate-900 mb-5">Distribution des positions</h2>
      <div className="space-y-3">
        {buckets.map((bucket) => (
          <div key={bucket.label} className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-500 w-14 text-right shrink-0">{bucket.label}</span>
            <div className="flex-1 h-7 rounded-lg overflow-hidden" style={{ background: bucket.bg }}>
              <div
                className="h-full rounded-lg transition-all duration-700"
                style={{
                  width: `${(bucket.count / maxCount) * 100}%`,
                  background: bucket.color,
                  minWidth: bucket.count > 0 ? "4px" : "0",
                }}
              />
            </div>
            <span className="text-sm font-bold text-slate-700 w-8 shrink-0">{bucket.count}</span>
          </div>
        ))}
      </div>
      <p className="text-xs text-slate-400 mt-4 text-center">{total} mots-clés total</p>
    </div>
  );
}
```

**Step 4: Create KeywordsTable component**

Create `src/app/admin/seo/components/KeywordsTable.tsx`:
```typescript
"use client";
import { useState } from "react";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then(r => r.json());

function PosBadge({ pos }: { pos: number }) {
  const color =
    pos <= 3 ? "bg-emerald-100 text-emerald-700" :
    pos <= 10 ? "bg-blue-100 text-blue-700" :
    pos <= 20 ? "bg-purple-100 text-purple-700" :
    pos <= 50 ? "bg-amber-100 text-amber-700" :
    "bg-slate-100 text-slate-500";
  return (
    <span className={`inline-flex items-center justify-center w-8 h-6 rounded text-xs font-bold ${color}`}>
      {pos}
    </span>
  );
}

function VolBadge({ vol }: { vol: number }) {
  return (
    <span className="text-xs text-slate-500 font-medium">
      {vol >= 1000 ? `${(vol / 1000).toFixed(1)}k` : vol}
    </span>
  );
}

export function KeywordsTable() {
  const [page, setPage] = useState(0);
  const [orderBy, setOrderBy] = useState("keyword_data.keyword_info.search_volume,desc");
  const limit = 20;

  const { data, isLoading } = useSWR(
    `/api/admin/seo/keywords?limit=${limit}&offset=${page * limit}&order=${orderBy}`,
    fetcher,
    { refreshInterval: 1800000 }
  );

  const keywords = data?.items ?? [];
  const totalCount = data?.total_count ?? 0;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-50">
        <h2 className="font-bold text-slate-900">Mots-clés positionnés</h2>
        <select
          value={orderBy}
          onChange={e => { setOrderBy(e.target.value); setPage(0); }}
          className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-400"
        >
          <option value="keyword_data.keyword_info.search_volume,desc">Volume ↓</option>
          <option value="ranked_serp_element.serp_item.rank_group,asc">Position ↑</option>
          <option value="keyword_data.keyword_info.cpc,desc">CPC ↓</option>
        </select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-50">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Mot-clé</th>
                  <th className="text-center px-3 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Pos.</th>
                  <th className="text-right px-3 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Vol.</th>
                  <th className="text-right px-3 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">CPC</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">URL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {keywords.map((item: any) => {
                  const kw = item.keyword_data?.keyword ?? "—";
                  const pos = item.ranked_serp_element?.serp_item?.rank_group ?? "—";
                  const vol = item.keyword_data?.keyword_info?.search_volume ?? 0;
                  const cpc = item.keyword_data?.keyword_info?.cpc ?? 0;
                  const url = item.ranked_serp_element?.serp_item?.url ?? "";
                  const urlShort = url.replace("https://vanzonexplorer.com", "").replace("https://www.vanzonexplorer.com", "") || "/";

                  return (
                    <tr key={kw} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-6 py-3 font-medium text-slate-800">{kw}</td>
                      <td className="px-3 py-3 text-center"><PosBadge pos={pos} /></td>
                      <td className="px-3 py-3 text-right"><VolBadge vol={vol} /></td>
                      <td className="px-3 py-3 text-right text-xs text-slate-500">{cpc ? `${cpc.toFixed(2)}€` : "—"}</td>
                      <td className="px-6 py-3 text-right">
                        <span className="text-xs text-slate-400 font-mono truncate max-w-[200px] inline-block">{urlShort}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-6 py-3 border-t border-slate-50">
            <p className="text-xs text-slate-400">{totalCount} mots-clés total</p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 rounded-lg disabled:opacity-40 hover:bg-slate-200 transition-colors"
              >
                ← Préc
              </button>
              <span className="text-xs text-slate-500 font-medium">Page {page + 1}</span>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={(page + 1) * limit >= totalCount}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 rounded-lg disabled:opacity-40 hover:bg-slate-200 transition-colors"
              >
                Suiv →
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
```

**Step 5: Create QuickWins component**

Create `src/app/admin/seo/components/QuickWins.tsx`:
```typescript
"use client";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then(r => r.json());

export function QuickWins() {
  // Keywords positions 11-20 with decent volume = easiest to push to page 1
  const { data, isLoading } = useSWR(
    "/api/admin/seo/keywords?limit=100&offset=0&order=ranked_serp_element.serp_item.rank_group,asc",
    fetcher,
    { refreshInterval: 1800000 }
  );

  const quickWins = (data?.items ?? [])
    .filter((item: any) => {
      const pos = item.ranked_serp_element?.serp_item?.rank_group ?? 0;
      const vol = item.keyword_data?.keyword_info?.search_volume ?? 0;
      return pos >= 11 && pos <= 20 && vol >= 50;
    })
    .slice(0, 8);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-50 flex items-center gap-2">
        <span className="text-amber-400">⚡</span>
        <h2 className="font-bold text-slate-900">Quick Wins</h2>
        <span className="text-xs bg-amber-100 text-amber-600 font-semibold px-2 py-0.5 rounded-full ml-auto">
          Page 2 → Page 1
        </span>
      </div>
      <div className="divide-y divide-slate-50">
        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <div className="w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : quickWins.length === 0 ? (
          <p className="px-6 py-8 text-center text-slate-400 text-sm">Aucun quick win détecté</p>
        ) : (
          quickWins.map((item: any) => {
            const kw = item.keyword_data?.keyword ?? "—";
            const pos = item.ranked_serp_element?.serp_item?.rank_group ?? "—";
            const vol = item.keyword_data?.keyword_info?.search_volume ?? 0;
            const url = (item.ranked_serp_element?.serp_item?.url ?? "").replace("https://vanzonexplorer.com", "").replace("https://www.vanzonexplorer.com", "") || "/";

            return (
              <div key={kw} className="flex items-center gap-3 px-6 py-3.5 hover:bg-amber-50/40 transition-colors">
                <div className="w-8 h-6 rounded bg-amber-100 flex items-center justify-center">
                  <span className="text-xs font-bold text-amber-600">{pos}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800">{kw}</p>
                  <p className="text-xs text-slate-400 truncate">{url}</p>
                </div>
                <span className="text-xs text-slate-500 font-medium shrink-0">
                  {vol >= 1000 ? `${(vol / 1000).toFixed(1)}k` : vol} rech/mois
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
```

**Step 6: Create CompetitorsTable component**

Create `src/app/admin/seo/components/CompetitorsTable.tsx`:
```typescript
"use client";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then(r => r.json());

function TrafficBar({ value, max }: { value: number; max: number }) {
  const pct = Math.max(2, (value / max) * 100);
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full bg-blue-400 rounded-full" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-slate-600 font-medium w-12 text-right">
        {value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}
      </span>
    </div>
  );
}

export function CompetitorsTable() {
  const { data, isLoading } = useSWR("/api/admin/seo/competitors", fetcher, {
    refreshInterval: 1800000,
  });

  const items = (data?.items ?? []).slice(0, 10);
  const maxEtv = Math.max(...items.map((i: any) => i.competitor_metrics?.organic?.etv ?? 0), 1);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-50">
        <h2 className="font-bold text-slate-900">Concurrents SEO</h2>
        <p className="text-xs text-slate-400 mt-0.5">Domaines partageant vos mots-clés</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-10">
          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-50">
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Domaine</th>
                <th className="text-center px-3 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">KWs communs</th>
                <th className="text-center px-3 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Pos. moy.</th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Trafic estimé</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {/* Vanzon row first */}
              {items[0] && (
                <tr className="bg-blue-50/50">
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                      <span className="font-bold text-blue-700">vanzonexplorer.com</span>
                      <span className="text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded font-semibold">Vous</span>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-center font-semibold text-slate-700">{items[0].full_domain_metrics?.organic?.count ?? "—"}</td>
                  <td className="px-3 py-3 text-center text-slate-600">{Number(items[0].avg_position ?? 0).toFixed(1)}</td>
                  <td className="px-6 py-3"><TrafficBar value={Math.round(items[0].full_domain_metrics?.organic?.etv ?? 0)} max={maxEtv} /></td>
                </tr>
              )}
              {items.slice(1).map((item: any) => (
                <tr key={item.domain} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-slate-300" />
                      <span className="font-medium text-slate-700">{item.domain}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-center text-slate-600">{item.intersections ?? "—"}</td>
                  <td className="px-3 py-3 text-center text-slate-600">{Number(item.avg_position ?? 0).toFixed(1)}</td>
                  <td className="px-6 py-3"><TrafficBar value={Math.round(item.competitor_metrics?.organic?.etv ?? 0)} max={maxEtv} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
```

**Step 7: Create SerpChecker component**

Create `src/app/admin/seo/components/SerpChecker.tsx`:
```typescript
"use client";
import { useState } from "react";

interface SerpItem {
  rank_group: number;
  title: string;
  url: string;
  description: string;
  domain: string;
}

export function SerpChecker() {
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SerpItem[]>([]);
  const [searched, setSearched] = useState("");
  const [error, setError] = useState("");

  async function handleSearch() {
    if (!keyword.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/seo/serp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword: keyword.trim() }),
      });
      const data = await res.json();
      const items = (data?.items ?? []).filter((i: any) => i.type === "organic");
      setResults(items);
      setSearched(keyword.trim());
    } catch {
      setError("Erreur lors de la requête SERP");
    } finally {
      setLoading(false);
    }
  }

  const TARGET = "vanzonexplorer.com";

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-50">
        <h2 className="font-bold text-slate-900">Vérificateur SERP en direct</h2>
        <p className="text-xs text-slate-400 mt-0.5">Voir les 20 premiers résultats Google FR pour n&apos;importe quel mot-clé</p>
      </div>

      <div className="p-6">
        <div className="flex gap-3">
          <input
            type="text"
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSearch()}
            placeholder="ex: location van aménagé biarritz..."
            className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
          />
          <button
            onClick={handleSearch}
            disabled={loading || !keyword.trim()}
            className="px-5 py-2.5 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors flex items-center gap-2"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              "Analyser"
            )}
          </button>
        </div>

        {error && <p className="mt-3 text-sm text-red-500">{error}</p>}

        {results.length > 0 && (
          <div className="mt-5 space-y-3">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
              Résultats pour « {searched} »
            </p>
            {results.map((item: any) => {
              const isYou = item.domain === TARGET || item.url?.includes(TARGET);
              return (
                <div
                  key={item.rank_group}
                  className={`p-3 rounded-xl border transition-colors ${
                    isYou ? "border-blue-200 bg-blue-50" : "border-slate-100 bg-slate-50/50"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className={`w-7 h-6 rounded flex items-center justify-center text-xs font-bold shrink-0 ${
                      isYou ? "bg-blue-500 text-white" : "bg-white text-slate-500 border border-slate-200"
                    }`}>
                      {item.rank_group}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold truncate ${isYou ? "text-blue-700" : "text-slate-800"}`}>
                        {item.title}
                        {isYou && <span className="ml-2 text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded font-bold">VOUS</span>}
                      </p>
                      <p className="text-xs text-slate-400 truncate mt-0.5">{item.url}</p>
                      {item.description && (
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">{item.description}</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
```

**Step 8: Create KeywordIdeas component**

Create `src/app/admin/seo/components/KeywordIdeas.tsx`:
```typescript
"use client";
import { useState } from "react";

interface KwIdea {
  keyword: string;
  search_volume: number;
  competition: number;
  cpc: number;
  keyword_difficulty: number;
}

export function KeywordIdeas() {
  const [seed, setSeed] = useState("van aménagé");
  const [loading, setLoading] = useState(false);
  const [ideas, setIdeas] = useState<KwIdea[]>([]);
  const [searched, setSearched] = useState("");

  async function fetchIdeas() {
    if (!seed.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/admin/seo/ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword: seed.trim() }),
      });
      const data = await res.json();
      const items = (data?.items ?? []).map((i: any) => ({
        keyword: i.keyword,
        search_volume: i.keyword_info?.search_volume ?? 0,
        competition: i.keyword_info?.competition ?? 0,
        cpc: i.keyword_info?.cpc ?? 0,
        keyword_difficulty: i.keyword_properties?.keyword_difficulty ?? 0,
      }));
      setIdeas(items);
      setSearched(seed.trim());
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  function DiffBadge({ score }: { score: number }) {
    const color =
      score < 30 ? "bg-emerald-100 text-emerald-700" :
      score < 60 ? "bg-amber-100 text-amber-700" :
      "bg-red-100 text-red-600";
    const label = score < 30 ? "Facile" : score < 60 ? "Moyen" : "Difficile";
    return <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${color}`}>{label} {score}</span>;
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-50">
        <h2 className="font-bold text-slate-900">Explorateur de mots-clés</h2>
        <p className="text-xs text-slate-400 mt-0.5">Trouve des opportunités dans ton secteur</p>
      </div>

      <div className="p-6">
        <div className="flex gap-3">
          <input
            type="text"
            value={seed}
            onChange={e => setSeed(e.target.value)}
            onKeyDown={e => e.key === "Enter" && fetchIdeas()}
            placeholder="ex: van aménagé, location van pays basque..."
            className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-400"
          />
          <button
            onClick={fetchIdeas}
            disabled={loading || !seed.trim()}
            className="px-5 py-2.5 bg-purple-500 hover:bg-purple-600 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors flex items-center gap-2"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : "Explorer"}
          </button>
        </div>

        {ideas.length > 0 && (
          <div className="mt-5">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
              {ideas.length} idées pour « {searched} »
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left py-2 text-xs text-slate-400 font-semibold">Mot-clé</th>
                    <th className="text-right py-2 px-3 text-xs text-slate-400 font-semibold">Vol.</th>
                    <th className="text-right py-2 px-3 text-xs text-slate-400 font-semibold">CPC</th>
                    <th className="text-right py-2 text-xs text-slate-400 font-semibold">Difficulté</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {ideas.map(idea => (
                    <tr key={idea.keyword} className="hover:bg-slate-50/60">
                      <td className="py-2.5 font-medium text-slate-800">{idea.keyword}</td>
                      <td className="py-2.5 px-3 text-right text-slate-600 text-xs">
                        {idea.search_volume >= 1000 ? `${(idea.search_volume / 1000).toFixed(1)}k` : idea.search_volume}
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-500 text-xs">
                        {idea.cpc ? `${idea.cpc.toFixed(2)}€` : "—"}
                      </td>
                      <td className="py-2.5 text-right">
                        <DiffBadge score={idea.keyword_difficulty} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
```

**Step 9: Create main SeoClient dashboard**

Create `src/app/admin/seo/SeoClient.tsx`:
```typescript
"use client";
import useSWR from "swr";
import { KpiCard } from "./components/KpiCard";
import { PositionChart } from "./components/PositionChart";
import { KeywordsTable } from "./components/KeywordsTable";
import { QuickWins } from "./components/QuickWins";
import { CompetitorsTable } from "./components/CompetitorsTable";
import { SerpChecker } from "./components/SerpChecker";
import { KeywordIdeas } from "./components/KeywordIdeas";

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function SeoClient() {
  const { data: overview, isLoading, mutate } = useSWR("/api/admin/seo/overview", fetcher, {
    refreshInterval: 1800000, // 30 min
  });

  const metrics = overview?.metrics?.organic ?? {};
  const total = metrics.count ?? 0;
  const etv = Math.round(metrics.etv ?? 0);
  const isNew = metrics.is_new ?? 0;
  const isUp = metrics.is_up ?? 0;
  const isDown = metrics.is_down ?? 0;
  const isLost = metrics.is_lost ?? 0;
  const top10 = (metrics.pos_2_3 ?? 0) + (metrics.pos_4_10 ?? 0);

  const kpis = [
    {
      label: "Mots-clés positionnés",
      value: total,
      sub: `${isNew} nouveaux`,
      trend: isUp > isDown ? "up" : "down" as "up" | "down",
      trendValue: `${isUp}↑ ${isDown}↓`,
      icon: "📊",
      gradient: "from-blue-500 to-sky-400",
    },
    {
      label: "Top 10 Google",
      value: top10,
      sub: `${metrics.pos_2_3 ?? 0} en top 3`,
      icon: "🏆",
      gradient: "from-emerald-500 to-teal-400",
    },
    {
      label: "Trafic estimé/mois",
      value: etv,
      sub: "visites organiques",
      icon: "📈",
      gradient: "from-violet-500 to-purple-400",
    },
    {
      label: "KWs perdus",
      value: isLost,
      sub: "à récupérer",
      trend: isLost > 20 ? "down" : "neutral" as "down" | "neutral",
      icon: "⚠️",
      gradient: "from-amber-500 to-orange-400",
    },
  ];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <p className="text-slate-400 text-sm font-medium mb-1">SEO Analytics</p>
          <h1 className="text-3xl font-black text-slate-900">Tableau de bord SEO</h1>
          <p className="text-slate-500 mt-1">
            vanzonexplorer.com · France · Données en direct DataForSEO
          </p>
        </div>
        <button
          onClick={() => mutate()}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50"
        >
          <svg className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Actualiser
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.label} {...kpi} />
        ))}
      </div>

      {/* Row 2: Position chart + Quick Wins */}
      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <PositionChart metrics={metrics} total={total} />
        <QuickWins />
      </div>

      {/* Row 3: Keywords Table (full width) */}
      <div className="mb-6">
        <KeywordsTable />
      </div>

      {/* Row 4: Competitors + SERP Checker */}
      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <CompetitorsTable />
        <SerpChecker />
      </div>

      {/* Row 5: Keyword Ideas (full width) */}
      <div className="mb-6">
        <KeywordIdeas />
      </div>

      {/* Footer */}
      <p className="text-center text-xs text-slate-300 mt-8">
        Données fournies par DataForSEO · Rafraîchissement auto toutes les 30 min
      </p>
    </div>
  );
}
```

**Step 10: Commit all components**
```bash
git add src/app/admin/seo/
git commit -m "feat: add SEO dashboard page with all components"
```

---

## Task 9: Update Admin Sidebar + Email Restriction

**Files:**
- Modify: `src/app/admin/_components/AdminSidebar.tsx`
- Modify: `src/app/admin/layout.tsx`

**Step 1: Add SEO item to sidebar nav array**

In `src/app/admin/_components/AdminSidebar.tsx`, add this item to the `nav` array after "Dashboard":

```typescript
{
  label: "SEO Analytics",
  href: "/admin/seo",
  icon: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
},
```

**Step 2: Add email restriction to admin layout**

In `src/app/admin/layout.tsx`, modify the `AdminLayout` function to add email check:

```typescript
import { redirect } from "next/navigation";
import { auth, currentUser } from "@clerk/nextjs/server";
import AdminSidebar from "./_components/AdminSidebar";

const ALLOWED_EMAIL = "gavegliojules@gmail.com";

export const metadata = {
  title: "Admin — Vanzon Explorer",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await currentUser();
  const email = user?.emailAddresses?.[0]?.emailAddress;
  if (email !== ALLOWED_EMAIL) redirect("/");

  return (
    <div className="min-h-screen" style={{ background: "#F1F5F9" }}>
      <AdminSidebar />
      <div className="pl-[260px]">
        <main className="min-h-screen">{children}</main>
      </div>
    </div>
  );
}
```

**Step 3: Commit**
```bash
git add src/app/admin/_components/AdminSidebar.tsx src/app/admin/layout.tsx
git commit -m "feat: add SEO nav item and restrict admin to gavegliojules@gmail.com"
```

---

## Task 10: Verify & Test

**Step 1: Start dev server**
```bash
npm run dev
```

**Step 2: Check these URLs work**
- `http://localhost:3000/admin/seo` → SEO dashboard renders
- `http://localhost:3000/api/admin/seo/overview` → returns JSON with DataForSEO data
- `http://localhost:3000/api/admin/seo/keywords?limit=20` → returns keyword list
- `http://localhost:3000/api/admin/seo/competitors` → returns competitor list

**Step 3: Verify email restriction**
- Log in with a different account → should redirect to `/`
- Log in as `gavegliojules@gmail.com` → should access `/admin`

**Step 4: Run linter**
```bash
npm run lint
```
Fix any TypeScript errors (mostly replace `any` with proper types or add `eslint-disable` comments for DataForSEO response shapes).

**Step 5: Commit any fixes**
```bash
git add -A
git commit -m "fix: lint errors in SEO dashboard"
```

---

## Env vars summary

Add to `.env.local`:
```
DATAFORSEO_LOGIN=your_dataforseo_login
DATAFORSEO_PASSWORD=your_dataforseo_password
```

> **Note:** Backlinks API requires a separate DataForSEO subscription (`backlinks-subscription`). The dashboard skips this section; it can be added later when the subscription is active.

---

## DataForSEO REST API Reference

Base URL: `https://api.dataforseo.com/v3`
Auth: `Basic base64(login:password)`

Endpoints used:
- `POST /dataforseo_labs/google/domain_rank_overview/live`
- `POST /dataforseo_labs/google/ranked_keywords/live`
- `POST /dataforseo_labs/google/competitors_domain/live`
- `POST /serp/google/organic/live/advanced`
- `POST /dataforseo_labs/google/keyword_ideas/live`
