# Keyword Research Dashboard — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Créer une page `/admin/keywords` avec visualisation intuitive des mots-clés Pays Basque (matrice opportunités, saisonnalité, tableau catégorisé) avec données hybrides statiques + refresh DataForSEO.

**Architecture:** Page Next.js `app router` avec un client component principal (`KeywordsClient.tsx`) qui lit d'abord le `localStorage` (TTL 24h), affiche les données statiques enrichies, et permet un refresh via API route. Les composants Recharts rendent scatter plot, bar chart et sparklines.

**Tech Stack:** Next.js 14 App Router, Recharts (à installer), SWR, Clerk auth, DataForSEO via `dfsPost`, Tailwind CSS.

---

## Task 1 : Installer Recharts + créer le fichier de données keywords

**Files:**
- Create: `src/app/admin/keywords/data/keywords.ts`

**Step 1 : Installer Recharts**

```bash
npm install recharts
npm install --save-dev @types/recharts
```

Vérifier que ça compile : `npm run build` — doit passer sans erreur.

**Step 2 : Créer `src/app/admin/keywords/data/keywords.ts`**

```ts
export type Category = "quick-win" | "main-target" | "editorial";
export type Intent = "commercial" | "informational" | "navigational";
export type CompLevel = "LOW" | "MEDIUM" | "HIGH";

export interface KeywordData {
  keyword: string;
  category: Category;
  intent: Intent;
  search_volume: number;
  monthly_searches: Record<string, number>;
  competition_level: CompLevel;
  keyword_difficulty: number | null;
  cpc: number;
  trend_yearly: number | null;
}

export const KEYWORDS: KeywordData[] = [
  // ─── QUICK WINS ───────────────────────────────────────────────
  {
    keyword: "location van aménagé landes",
    category: "quick-win",
    intent: "commercial",
    search_volume: 50,
    monthly_searches: { "2025-01": 20, "2025-02": 20, "2025-03": 40, "2025-04": 50, "2025-05": 70, "2025-06": 90, "2025-07": 110, "2025-08": 90, "2025-09": 50, "2025-10": 40, "2025-11": 20, "2025-12": 20 },
    competition_level: "MEDIUM",
    keyword_difficulty: 24,
    cpc: 0.67,
    trend_yearly: null,
  },
  {
    keyword: "location camping-car pays basque",
    category: "quick-win",
    intent: "commercial",
    search_volume: 50,
    monthly_searches: { "2025-01": 30, "2025-02": 40, "2025-03": 90, "2025-04": 90, "2025-05": 90, "2025-06": 70, "2025-07": 110, "2025-08": 70, "2025-09": 50, "2025-10": 40, "2025-11": 20, "2025-12": 20 },
    competition_level: "HIGH",
    keyword_difficulty: 33,
    cpc: 0.84,
    trend_yearly: -60,
  },
  {
    keyword: "location van anglet",
    category: "quick-win",
    intent: "commercial",
    search_volume: 50,
    monthly_searches: { "2025-01": 40, "2025-02": 50, "2025-03": 70, "2025-04": 70, "2025-05": 70, "2025-06": 70, "2025-07": 110, "2025-08": 70, "2025-09": 30, "2025-10": 20, "2025-11": 10, "2025-12": 20 },
    competition_level: "HIGH",
    keyword_difficulty: null,
    cpc: 0.47,
    trend_yearly: 100,
  },
  {
    keyword: "location van hossegor",
    category: "quick-win",
    intent: "commercial",
    search_volume: 20,
    monthly_searches: { "2025-01": 10, "2025-02": 10, "2025-03": 20, "2025-04": 20, "2025-05": 30, "2025-06": 30, "2025-07": 50, "2025-08": 30, "2025-09": 20, "2025-10": 10, "2025-11": 10, "2025-12": 10 },
    competition_level: "MEDIUM",
    keyword_difficulty: 46,
    cpc: 0.77,
    trend_yearly: null,
  },
  {
    keyword: "location van aménagé 64",
    category: "quick-win",
    intent: "commercial",
    search_volume: 20,
    monthly_searches: { "2025-01": 10, "2025-02": 10, "2025-03": 20, "2025-04": 20, "2025-05": 20, "2025-06": 30, "2025-07": 30, "2025-08": 20, "2025-09": 20, "2025-10": 10, "2025-11": 10, "2025-12": 10 },
    competition_level: "HIGH",
    keyword_difficulty: 6,
    cpc: 1.24,
    trend_yearly: null,
  },
  {
    keyword: "location van bidart",
    category: "quick-win",
    intent: "commercial",
    search_volume: 20,
    monthly_searches: { "2025-01": 10, "2025-02": 10, "2025-03": 30, "2025-04": 20, "2025-05": 20, "2025-06": 40, "2025-07": 40, "2025-08": 40, "2025-09": 30, "2025-10": 20, "2025-11": 10, "2025-12": 10 },
    competition_level: "MEDIUM",
    keyword_difficulty: 51,
    cpc: 1.05,
    trend_yearly: -50,
  },
  {
    keyword: "location van saint jean de luz",
    category: "quick-win",
    intent: "commercial",
    search_volume: 20,
    monthly_searches: { "2025-01": 10, "2025-02": 20, "2025-03": 20, "2025-04": 30, "2025-05": 20, "2025-06": 30, "2025-07": 30, "2025-08": 30, "2025-09": 20, "2025-10": 20, "2025-11": 10, "2025-12": 10 },
    competition_level: "HIGH",
    keyword_difficulty: null,
    cpc: 0.60,
    trend_yearly: -50,
  },

  // ─── CIBLES PRINCIPALES ───────────────────────────────────────
  {
    keyword: "location van biarritz",
    category: "main-target",
    intent: "commercial",
    search_volume: 390,
    monthly_searches: { "2025-01": 170, "2025-02": 170, "2025-03": 390, "2025-04": 390, "2025-05": 880, "2025-06": 880, "2025-07": 480, "2025-08": 320, "2025-09": 210, "2025-10": 110, "2025-11": 90, "2025-12": 70 },
    competition_level: "HIGH",
    keyword_difficulty: null,
    cpc: 1.08,
    trend_yearly: -50,
  },
  {
    keyword: "location van pays basque",
    category: "main-target",
    intent: "commercial",
    search_volume: 210,
    monthly_searches: { "2025-01": 140, "2025-02": 170, "2025-03": 260, "2025-04": 210, "2025-05": 260, "2025-06": 320, "2025-07": 320, "2025-08": 260, "2025-09": 210, "2025-10": 110, "2025-11": 50, "2025-12": 70 },
    competition_level: "HIGH",
    keyword_difficulty: null,
    cpc: 0.86,
    trend_yearly: -22,
  },
  {
    keyword: "location camping-car bayonne",
    category: "main-target",
    intent: "commercial",
    search_volume: 210,
    monthly_searches: { "2025-01": 50, "2025-02": 70, "2025-03": 90, "2025-04": 140, "2025-05": 170, "2025-06": 210, "2025-07": 260, "2025-08": 170, "2025-09": 110, "2025-10": 90, "2025-11": 50, "2025-12": 40 },
    competition_level: "MEDIUM",
    keyword_difficulty: null,
    cpc: 0.78,
    trend_yearly: null,
  },
  {
    keyword: "location van bayonne",
    category: "main-target",
    intent: "commercial",
    search_volume: 170,
    monthly_searches: { "2025-01": 140, "2025-02": 140, "2025-03": 210, "2025-04": 260, "2025-05": 210, "2025-06": 320, "2025-07": 320, "2025-08": 260, "2025-09": 140, "2025-10": 90, "2025-11": 70, "2025-12": 50 },
    competition_level: "HIGH",
    keyword_difficulty: null,
    cpc: 0.76,
    trend_yearly: -44,
  },
  {
    keyword: "location van aménagé pays basque",
    category: "main-target",
    intent: "commercial",
    search_volume: 90,
    monthly_searches: { "2025-01": 40, "2025-02": 70, "2025-03": 110, "2025-04": 90, "2025-05": 90, "2025-06": 90, "2025-07": 110, "2025-08": 110, "2025-09": 140, "2025-10": 70, "2025-11": 20, "2025-12": 30 },
    competition_level: "MEDIUM",
    keyword_difficulty: null,
    cpc: 0.64,
    trend_yearly: -25,
  },
  {
    keyword: "location van aménagé bayonne",
    category: "main-target",
    intent: "commercial",
    search_volume: 90,
    monthly_searches: { "2025-01": 30, "2025-02": 50, "2025-03": 70, "2025-04": 90, "2025-05": 110, "2025-06": 90, "2025-07": 110, "2025-08": 90, "2025-09": 70, "2025-10": 50, "2025-11": 30, "2025-12": 20 },
    competition_level: "MEDIUM",
    keyword_difficulty: null,
    cpc: 0.41,
    trend_yearly: null,
  },
  {
    keyword: "location camping-car biarritz",
    category: "main-target",
    intent: "commercial",
    search_volume: 90,
    monthly_searches: { "2025-01": 30, "2025-02": 40, "2025-03": 70, "2025-04": 90, "2025-05": 90, "2025-06": 110, "2025-07": 140, "2025-08": 110, "2025-09": 70, "2025-10": 50, "2025-11": 30, "2025-12": 20 },
    competition_level: "MEDIUM",
    keyword_difficulty: null,
    cpc: 0.82,
    trend_yearly: null,
  },
  {
    keyword: "location van landes",
    category: "main-target",
    intent: "commercial",
    search_volume: 90,
    monthly_searches: { "2025-01": 30, "2025-02": 40, "2025-03": 70, "2025-04": 90, "2025-05": 90, "2025-06": 110, "2025-07": 140, "2025-08": 110, "2025-09": 70, "2025-10": 50, "2025-11": 30, "2025-12": 20 },
    competition_level: "MEDIUM",
    keyword_difficulty: null,
    cpc: 0.72,
    trend_yearly: null,
  },
  {
    keyword: "location van bordeaux",
    category: "main-target",
    intent: "commercial",
    search_volume: 880,
    monthly_searches: { "2025-01": 390, "2025-02": 480, "2025-03": 590, "2025-04": 720, "2025-05": 880, "2025-06": 1000, "2025-07": 1300, "2025-08": 1000, "2025-09": 720, "2025-10": 480, "2025-11": 320, "2025-12": 260 },
    competition_level: "HIGH",
    keyword_difficulty: null,
    cpc: 1.63,
    trend_yearly: null,
  },
  {
    keyword: "location camping-car pau",
    category: "main-target",
    intent: "commercial",
    search_volume: 260,
    monthly_searches: { "2025-01": 90, "2025-02": 110, "2025-03": 140, "2025-04": 210, "2025-05": 210, "2025-06": 320, "2025-07": 390, "2025-08": 320, "2025-09": 210, "2025-10": 140, "2025-11": 90, "2025-12": 70 },
    competition_level: "HIGH",
    keyword_difficulty: null,
    cpc: 0.82,
    trend_yearly: null,
  },
  {
    keyword: "location van sud-ouest",
    category: "main-target",
    intent: "commercial",
    search_volume: 50,
    monthly_searches: { "2025-01": 20, "2025-02": 30, "2025-03": 40, "2025-04": 50, "2025-05": 70, "2025-06": 70, "2025-07": 90, "2025-08": 70, "2025-09": 50, "2025-10": 30, "2025-11": 20, "2025-12": 10 },
    competition_level: "HIGH",
    keyword_difficulty: 49,
    cpc: 0.98,
    trend_yearly: null,
  },
  {
    keyword: "location van aménagé dax",
    category: "main-target",
    intent: "commercial",
    search_volume: 20,
    monthly_searches: { "2025-01": 10, "2025-02": 10, "2025-03": 20, "2025-04": 20, "2025-05": 30, "2025-06": 30, "2025-07": 30, "2025-08": 20, "2025-09": 20, "2025-10": 10, "2025-11": 10, "2025-12": 10 },
    competition_level: "HIGH",
    keyword_difficulty: null,
    cpc: 0.72,
    trend_yearly: null,
  },

  // ─── ÉDITORIAL ────────────────────────────────────────────────
  {
    keyword: "road trip pays basque",
    category: "editorial",
    intent: "informational",
    search_volume: 390,
    monthly_searches: { "2025-01": 320, "2025-02": 390, "2025-03": 480, "2025-04": 480, "2025-05": 480, "2025-06": 480, "2025-07": 720, "2025-08": 480, "2025-09": 210, "2025-10": 210, "2025-11": 170, "2025-12": 170 },
    competition_level: "LOW",
    keyword_difficulty: null,
    cpc: 0.32,
    trend_yearly: 21,
  },
  {
    keyword: "location camping-car particulier",
    category: "editorial",
    intent: "commercial",
    search_volume: 5400,
    monthly_searches: { "2025-01": 2400, "2025-02": 2900, "2025-03": 3600, "2025-04": 4400, "2025-05": 5400, "2025-06": 6600, "2025-07": 8100, "2025-08": 6600, "2025-09": 4400, "2025-10": 3600, "2025-11": 2400, "2025-12": 1900 },
    competition_level: "HIGH",
    keyword_difficulty: 51,
    cpc: 0.77,
    trend_yearly: null,
  },
  {
    keyword: "road trip van pays basque",
    category: "editorial",
    intent: "informational",
    search_volume: 10,
    monthly_searches: { "2025-01": 10, "2025-02": 10, "2025-03": 20, "2025-04": 20, "2025-05": 10, "2025-06": 20, "2025-07": 10, "2025-08": 10, "2025-09": 10, "2025-10": 10, "2025-11": 10, "2025-12": 10 },
    competition_level: "LOW",
    keyword_difficulty: 44,
    cpc: 0,
    trend_yearly: null,
  },
  {
    keyword: "van life pays basque",
    category: "editorial",
    intent: "informational",
    search_volume: 10,
    monthly_searches: { "2025-01": 10, "2025-02": 10, "2025-03": 10, "2025-04": 10, "2025-05": 10, "2025-06": 10, "2025-07": 20, "2025-08": 10, "2025-09": 10, "2025-10": 10, "2025-11": 10, "2025-12": 10 },
    competition_level: "LOW",
    keyword_difficulty: null,
    cpc: 0,
    trend_yearly: null,
  },
  {
    keyword: "location combi vw pays basque",
    category: "editorial",
    intent: "navigational",
    search_volume: 10,
    monthly_searches: { "2025-01": 10, "2025-02": 10, "2025-03": 10, "2025-04": 10, "2025-05": 10, "2025-06": 10, "2025-07": 10, "2025-08": 10, "2025-09": 10, "2025-10": 10, "2025-11": 10, "2025-12": 10 },
    competition_level: "LOW",
    keyword_difficulty: null,
    cpc: 0,
    trend_yearly: null,
  },
  {
    keyword: "camping van pays basque",
    category: "editorial",
    intent: "informational",
    search_volume: 10,
    monthly_searches: { "2025-01": 10, "2025-02": 10, "2025-03": 10, "2025-04": 20, "2025-05": 10, "2025-06": 20, "2025-07": 20, "2025-08": 30, "2025-09": 10, "2025-10": 10, "2025-11": 10, "2025-12": 10 },
    competition_level: "LOW",
    keyword_difficulty: null,
    cpc: 0.26,
    trend_yearly: null,
  },
  {
    keyword: "pays basque en van aménagé",
    category: "editorial",
    intent: "informational",
    search_volume: 10,
    monthly_searches: { "2025-01": 10, "2025-02": 10, "2025-03": 10, "2025-04": 10, "2025-05": 10, "2025-06": 10, "2025-07": 20, "2025-08": 10, "2025-09": 10, "2025-10": 10, "2025-11": 10, "2025-12": 10 },
    competition_level: "LOW",
    keyword_difficulty: null,
    cpc: 0,
    trend_yearly: null,
  },
];

export const CATEGORY_LABELS: Record<Category, string> = {
  "quick-win": "Quick Win",
  "main-target": "Cible principale",
  "editorial": "Éditorial",
};

export const CATEGORY_COLORS: Record<Category, string> = {
  "quick-win": "#10b981",   // emerald-500
  "main-target": "#3b82f6", // blue-500
  "editorial": "#8b5cf6",   // violet-500
};

export const MONTHS_FR = ["Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"];
export const MONTH_KEYS = [
  "2025-01","2025-02","2025-03","2025-04","2025-05","2025-06",
  "2025-07","2025-08","2025-09","2025-10","2025-11","2025-12",
];
```

**Step 3 : Commit**

```bash
git add src/app/admin/keywords/data/keywords.ts
git commit -m "feat: add keyword research data constants"
```

---

## Task 2 : API route `/api/admin/seo/keywords-research`

**Files:**
- Create: `src/app/api/admin/seo/keywords-research/route.ts`

**Step 1 : Créer la route**

```ts
// src/app/api/admin/seo/keywords-research/route.ts
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { dfsPost, DFS_LOCATION, DFS_LANGUAGE_CODE } from "@/lib/dataforseo";
import { KEYWORDS } from "@/app/admin/keywords/data/keywords";

interface DFSKeywordItem {
  keyword?: string;
  keyword_info?: {
    search_volume?: number;
    cpc?: number;
    competition?: number;
    competition_level?: string;
    monthly_searches?: Record<string, number>;
    search_volume_trend?: { yearly?: number };
  };
  keyword_properties?: {
    keyword_difficulty?: number;
  };
}

export async function POST() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Non autorise" }, { status: 401 });

  try {
    const keywordList = KEYWORDS.map((k) => k.keyword);

    const data = await dfsPost<{ items?: DFSKeywordItem[] }>(
      "/dataforseo_labs/google/keyword_overview/live",
      [
        {
          keywords: keywordList,
          location_name: DFS_LOCATION,
          language_code: DFS_LANGUAGE_CODE,
        },
      ]
    );

    const itemsMap = new Map<string, DFSKeywordItem>();
    (data?.items ?? []).forEach((item) => {
      if (item.keyword) itemsMap.set(item.keyword, item);
    });

    const merged = KEYWORDS.map((kw) => {
      const live = itemsMap.get(kw.keyword);
      if (!live) return kw;
      return {
        ...kw,
        search_volume: live.keyword_info?.search_volume ?? kw.search_volume,
        cpc: live.keyword_info?.cpc ?? kw.cpc,
        competition_level: (live.keyword_info?.competition_level as "LOW" | "MEDIUM" | "HIGH") ?? kw.competition_level,
        keyword_difficulty: live.keyword_properties?.keyword_difficulty ?? kw.keyword_difficulty,
        monthly_searches: live.keyword_info?.monthly_searches ?? kw.monthly_searches,
        trend_yearly: live.keyword_info?.search_volume_trend?.yearly ?? kw.trend_yearly,
      };
    });

    return NextResponse.json({ items: merged, fetched_at: new Date().toISOString() });
  } catch (err) {
    console.error("[keywords-research]", err);
    return NextResponse.json({ error: "Erreur DataForSEO" }, { status: 500 });
  }
}
```

**Step 2 : Vérifier que le build passe**

```bash
npm run build
```

**Step 3 : Commit**

```bash
git add src/app/api/admin/seo/keywords-research/route.ts
git commit -m "feat: add keywords-research API route"
```

---

## Task 3 : Ajouter l'entrée sidebar + page shell

**Files:**
- Modify: `src/app/admin/_components/AdminSidebar.tsx`
- Create: `src/app/admin/keywords/page.tsx`
- Create: `src/app/admin/keywords/KeywordsClient.tsx`

**Step 1 : Ajouter dans la sidebar**

Dans `AdminSidebar.tsx`, dans le tableau `nav`, ajouter après l'entrée "SEO Analytics" :

```tsx
{
  label: "Mots-Clés",
  href: "/admin/keywords",
  icon: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
    </svg>
  ),
},
```

**Step 2 : Créer `src/app/admin/keywords/page.tsx`**

```tsx
import { Metadata } from "next";
import KeywordsClient from "./KeywordsClient";

export const metadata: Metadata = {
  title: "Mots-Clés — Vanzon Admin",
  robots: { index: false, follow: false },
};

export default function KeywordsPage() {
  return <KeywordsClient />;
}
```

**Step 3 : Créer `src/app/admin/keywords/KeywordsClient.tsx` (shell)**

```tsx
"use client";
import { useState, useEffect } from "react";
import { KEYWORDS, KeywordData } from "./data/keywords";

const CACHE_KEY = "vanzon_keywords_research";
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24h

interface CacheEntry {
  items: KeywordData[];
  fetched_at: string;
}

export default function KeywordsClient() {
  const [keywords, setKeywords] = useState<KeywordData[]>(KEYWORDS);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (raw) {
        const cache: CacheEntry = JSON.parse(raw);
        const age = Date.now() - new Date(cache.fetched_at).getTime();
        if (age < CACHE_TTL) {
          setKeywords(cache.items);
          setLastUpdated(cache.fetched_at);
        }
      }
    } catch {}
  }, []);

  async function handleRefresh() {
    setRefreshing(true);
    try {
      const res = await fetch("/api/admin/seo/keywords-research", { method: "POST" });
      const data: CacheEntry = await res.json();
      if (data.items) {
        setKeywords(data.items);
        setLastUpdated(data.fetched_at);
        localStorage.setItem(CACHE_KEY, JSON.stringify(data));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <p className="text-slate-400 text-sm font-medium mb-1">Stratégie SEO</p>
          <h1 className="text-3xl font-black text-slate-900">Recherche de Mots-Clés</h1>
          <p className="text-slate-500 mt-1">Pays Basque · Location Van · France</p>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-xs text-slate-400">
              MAJ : {new Date(lastUpdated).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            <svg className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Actualiser
          </button>
        </div>
      </div>

      {/* Placeholder — composants à venir */}
      <div className="text-slate-400 text-sm">{keywords.length} keywords chargés.</div>
    </div>
  );
}
```

**Step 4 : Vérifier que la page s'affiche**

```bash
npm run dev
```
Ouvrir `http://localhost:3000/admin/keywords` — doit afficher le shell avec header et "X keywords chargés."

**Step 5 : Commit**

```bash
git add src/app/admin/_components/AdminSidebar.tsx src/app/admin/keywords/
git commit -m "feat: add keywords page shell and sidebar entry"
```

---

## Task 4 : KPI Bar

**Files:**
- Create: `src/app/admin/keywords/components/KpiBar.tsx`

**Step 1 : Créer `KpiBar.tsx`**

```tsx
// src/app/admin/keywords/components/KpiBar.tsx
import { KeywordData } from "../data/keywords";

interface Props {
  keywords: KeywordData[];
}

export function KpiBar({ keywords }: Props) {
  const totalVolume = keywords.reduce((sum, k) => sum + k.search_volume, 0);
  const quickWins = keywords.filter(
    (k) => k.category === "quick-win" || k.competition_level === "LOW" || (k.keyword_difficulty !== null && k.keyword_difficulty < 40)
  ).length;
  const peakMonths = "Juin — Août";

  const kpis = [
    {
      label: "Keywords trackés",
      value: keywords.length,
      sub: "Pays Basque · Van",
      icon: "🎯",
      gradient: "from-blue-500 to-sky-400",
    },
    {
      label: "Quick Wins",
      value: quickWins,
      sub: "Faible concurrence",
      icon: "⚡",
      gradient: "from-emerald-500 to-teal-400",
    },
    {
      label: "Volume cumulé",
      value: totalVolume >= 1000 ? `${(totalVolume / 1000).toFixed(1)}k` : totalVolume,
      sub: "recherches / mois",
      icon: "📈",
      gradient: "from-violet-500 to-purple-400",
    },
    {
      label: "Pic saisonnier",
      value: peakMonths,
      sub: "×5 vs hiver",
      icon: "☀️",
      gradient: "from-amber-500 to-orange-400",
    },
  ];

  return (
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
      {kpis.map((kpi) => (
        <div key={kpi.label} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 relative overflow-hidden">
          <div className={`absolute top-0 right-0 w-24 h-24 rounded-full bg-gradient-to-br ${kpi.gradient} opacity-10 translate-x-8 -translate-y-8`} />
          <div className="text-2xl mb-2">{kpi.icon}</div>
          <div className="text-2xl font-black text-slate-900">{kpi.value}</div>
          <div className="text-sm font-semibold text-slate-700 mt-0.5">{kpi.label}</div>
          <div className="text-xs text-slate-400 mt-0.5">{kpi.sub}</div>
        </div>
      ))}
    </div>
  );
}
```

**Step 2 : Intégrer dans `KeywordsClient.tsx`**

Ajouter l'import et insérer `<KpiBar keywords={keywords} />` après le header, à la place du placeholder.

```tsx
import { KpiBar } from "./components/KpiBar";
// ...
// Dans le return, remplacer le placeholder par :
<KpiBar keywords={keywords} />
```

**Step 3 : Commit**

```bash
git add src/app/admin/keywords/components/KpiBar.tsx src/app/admin/keywords/KeywordsClient.tsx
git commit -m "feat: add keyword research KPI bar"
```

---

## Task 5 : Matrice d'Opportunités (Scatter Plot)

**Files:**
- Create: `src/app/admin/keywords/components/OpportunityMatrix.tsx`

**Step 1 : Créer `OpportunityMatrix.tsx`**

```tsx
// src/app/admin/keywords/components/OpportunityMatrix.tsx
"use client";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { KeywordData, CATEGORY_COLORS, CATEGORY_LABELS, Category } from "../data/keywords";

interface Props {
  keywords: KeywordData[];
}

interface ScatterPoint {
  x: number;
  y: number;
  z: number;
  keyword: string;
  category: Category;
  competition_level: string;
  cpc: number;
  search_volume: number;
  keyword_difficulty: number | null;
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: { payload: ScatterPoint }[] }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const kdText = d.keyword_difficulty !== null ? d.keyword_difficulty : "?";
  const compColor = d.competition_level === "LOW" ? "text-emerald-600" : d.competition_level === "MEDIUM" ? "text-amber-600" : "text-red-500";
  return (
    <div className="bg-white border border-slate-100 rounded-xl shadow-lg p-3 text-sm max-w-[220px]">
      <p className="font-bold text-slate-800 mb-1 leading-tight">{d.keyword}</p>
      <p className="text-slate-500">Volume : <span className="font-semibold text-slate-800">{d.search_volume}/mois</span></p>
      <p className="text-slate-500">Difficulté : <span className="font-semibold text-slate-800">{kdText}</span></p>
      <p className="text-slate-500">CPC : <span className="font-semibold text-slate-800">{d.cpc ? `${d.cpc.toFixed(2)}€` : "—"}</span></p>
      <p className={`text-xs font-semibold mt-1 ${compColor}`}>{d.competition_level}</p>
    </div>
  );
}

export function OpportunityMatrix({ keywords }: Props) {
  const categories: Category[] = ["quick-win", "main-target", "editorial"];

  // Volume médian pour le point de partage des quadrants
  const volMedian = 90;
  const kdMedian = 45;

  const byCategory = categories.map((cat) => ({
    cat,
    data: keywords
      .filter((k) => k.category === cat && k.search_volume > 0)
      .map((k): ScatterPoint => ({
        x: Math.log10(k.search_volume + 1) * 100, // log scale pour mieux voir
        y: k.keyword_difficulty ?? kdMedian,
        z: Math.max(40, (k.cpc + 0.1) * 80),
        keyword: k.keyword,
        category: k.category,
        competition_level: k.competition_level,
        cpc: k.cpc,
        search_volume: k.search_volume,
        keyword_difficulty: k.keyword_difficulty,
      })),
  }));

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-6">
      <div className="px-6 py-4 border-b border-slate-50">
        <h2 className="font-bold text-slate-900">Matrice d'Opportunités</h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Volume (X) vs Difficulté (Y) — taille = valeur CPC · Bas droite = idéal
        </p>
      </div>
      <div className="p-6">
        {/* Légende */}
        <div className="flex items-center gap-5 mb-4">
          {categories.map((cat) => (
            <div key={cat} className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full inline-block" style={{ background: CATEGORY_COLORS[cat] }} />
              <span className="text-xs font-medium text-slate-600">{CATEGORY_LABELS[cat]}</span>
            </div>
          ))}
        </div>

        <div className="relative">
          {/* Quadrant labels */}
          <div className="absolute inset-0 pointer-events-none z-10 flex" style={{ left: 60, top: 10, right: 20, bottom: 50 }}>
            <div className="flex flex-col w-1/2 h-full">
              <div className="flex-1 flex items-start justify-start p-3">
                <span className="text-[10px] font-semibold text-slate-300 uppercase tracking-wide">À éviter</span>
              </div>
              <div className="flex-1 flex items-end justify-start p-3">
                <span className="text-[10px] font-semibold text-violet-300 uppercase tracking-wide">Contenu facile</span>
              </div>
            </div>
            <div className="flex flex-col w-1/2 h-full">
              <div className="flex-1 flex items-start justify-end p-3">
                <span className="text-[10px] font-semibold text-slate-300 uppercase tracking-wide">Long terme</span>
              </div>
              <div className="flex-1 flex items-end justify-end p-3">
                <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wide">🎯 Jackpot</span>
              </div>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={380}>
            <ScatterChart margin={{ top: 10, right: 20, bottom: 50, left: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                type="number"
                dataKey="x"
                name="Volume (log)"
                domain={[150, 350]}
                tick={{ fontSize: 10, fill: "#94a3b8" }}
                label={{ value: "Volume de recherche →", position: "insideBottom", offset: -10, fontSize: 11, fill: "#94a3b8" }}
                tickFormatter={(v) => {
                  const vol = Math.round(Math.pow(10, v / 100) - 1);
                  return vol >= 1000 ? `${(vol / 1000).toFixed(0)}k` : String(vol);
                }}
              />
              <YAxis
                type="number"
                dataKey="y"
                name="Difficulté"
                domain={[0, 80]}
                reversed
                tick={{ fontSize: 10, fill: "#94a3b8" }}
                label={{ value: "← Facile    Difficile →", angle: -90, position: "insideLeft", offset: 20, fontSize: 11, fill: "#94a3b8" }}
              />
              <ReferenceLine x={230} stroke="#e2e8f0" strokeDasharray="4 4" />
              <ReferenceLine y={45} stroke="#e2e8f0" strokeDasharray="4 4" />
              <Tooltip content={<CustomTooltip />} />
              {byCategory.map(({ cat, data }) => (
                <Scatter
                  key={cat}
                  data={data}
                  fill={CATEGORY_COLORS[cat]}
                  fillOpacity={0.75}
                  name={CATEGORY_LABELS[cat]}
                />
              ))}
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
```

**Step 2 : Intégrer dans `KeywordsClient.tsx`**

```tsx
import { OpportunityMatrix } from "./components/OpportunityMatrix";
// Dans le return, après <KpiBar> :
<OpportunityMatrix keywords={keywords} />
```

**Step 3 : Vérifier visuellement** — le scatter plot doit afficher les points par couleur de catégorie avec tooltip.

**Step 4 : Commit**

```bash
git add src/app/admin/keywords/components/OpportunityMatrix.tsx src/app/admin/keywords/KeywordsClient.tsx
git commit -m "feat: add opportunity matrix scatter plot"
```

---

## Task 6 : Graphique Saisonnalité

**Files:**
- Create: `src/app/admin/keywords/components/SeasonalityChart.tsx`

**Step 1 : Créer `SeasonalityChart.tsx`**

```tsx
// src/app/admin/keywords/components/SeasonalityChart.tsx
"use client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { KeywordData, MONTHS_FR, MONTH_KEYS } from "../data/keywords";

interface Props {
  keywords: KeywordData[];
}

export function SeasonalityChart({ keywords }: Props) {
  const data = MONTH_KEYS.map((key, i) => ({
    month: MONTHS_FR[i],
    volume: keywords.reduce((sum, k) => sum + (k.monthly_searches[key] ?? 0), 0),
    isPeak: i >= 5 && i <= 7, // Jun, Jul, Aug
  }));

  const currentMonth = new Date().getMonth(); // 0-indexed
  const beforePeak = currentMonth < 5;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-6">
      <div className="px-6 py-4 border-b border-slate-50 flex items-start justify-between">
        <div>
          <h2 className="font-bold text-slate-900">Saisonnalité</h2>
          <p className="text-xs text-slate-400 mt-0.5">Volume de recherche agrégé sur 12 mois</p>
        </div>
        {beforePeak && (
          <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-100 rounded-xl px-3 py-1.5">
            <span className="text-amber-500 text-xs">⏰</span>
            <span className="text-xs font-semibold text-amber-700">Publiez maintenant pour ranker en été</span>
          </div>
        )}
      </div>
      <div className="p-6">
        <div className="flex items-center gap-5 mb-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-amber-400 inline-block" />
            <span className="text-xs text-slate-500">Pic estival (×5)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-slate-200 inline-block" />
            <span className="text-xs text-slate-500">Hors saison</span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} margin={{ top: 5, right: 10, bottom: 5, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
            <Tooltip
              formatter={(v: number) => [`${v.toLocaleString("fr-FR")} recherches`, "Volume"]}
              contentStyle={{ borderRadius: 12, border: "1px solid #f1f5f9", fontSize: 12 }}
            />
            <Bar dataKey="volume" radius={[6, 6, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={index} fill={entry.isPeak ? "#f59e0b" : "#e2e8f0"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
```

**Step 2 : Intégrer dans `KeywordsClient.tsx`**

```tsx
import { SeasonalityChart } from "./components/SeasonalityChart";
// Après <OpportunityMatrix> :
<SeasonalityChart keywords={keywords} />
```

**Step 3 : Commit**

```bash
git add src/app/admin/keywords/components/SeasonalityChart.tsx src/app/admin/keywords/KeywordsClient.tsx
git commit -m "feat: add seasonality bar chart"
```

---

## Task 7 : Tableau Keywords avec Sparklines et Tabs

**Files:**
- Create: `src/app/admin/keywords/components/KeywordsTable.tsx`

**Step 1 : Créer `KeywordsTable.tsx`**

```tsx
// src/app/admin/keywords/components/KeywordsTable.tsx
"use client";
import { useState, useMemo } from "react";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import {
  KeywordData,
  Category,
  CATEGORY_LABELS,
  CATEGORY_COLORS,
  MONTH_KEYS,
} from "../data/keywords";

interface Props {
  keywords: KeywordData[];
}

type SortKey = "search_volume" | "keyword_difficulty" | "cpc" | "trend_yearly";
type SortDir = "asc" | "desc";

function KdBadge({ score }: { score: number | null }) {
  if (score === null) return <span className="text-xs text-slate-300">—</span>;
  const color = score < 30 ? "bg-emerald-100 text-emerald-700" : score < 55 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-600";
  const label = score < 30 ? "Facile" : score < 55 ? "Moyen" : "Difficile";
  return <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${color}`}>{label} {score}</span>;
}

function CompBadge({ level }: { level: string }) {
  const color = level === "LOW" ? "bg-emerald-100 text-emerald-700" : level === "MEDIUM" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-600";
  const label = level === "LOW" ? "Faible" : level === "MEDIUM" ? "Moyen" : "Élevé";
  return <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${color}`}>{label}</span>;
}

function IntentBadge({ intent }: { intent: string }) {
  const color = intent === "commercial" ? "bg-blue-50 text-blue-600" : intent === "informational" ? "bg-violet-50 text-violet-600" : "bg-slate-100 text-slate-500";
  const label = intent === "commercial" ? "Commercial" : intent === "informational" ? "Info" : "Nav";
  return <span className={`text-xs px-2 py-0.5 rounded-full ${color}`}>{label}</span>;
}

function Sparkline({ data }: { data: { v: number }[] }) {
  return (
    <ResponsiveContainer width={60} height={28}>
      <LineChart data={data} margin={{ top: 2, bottom: 2, left: 0, right: 0 }}>
        <Line type="monotone" dataKey="v" stroke="#6366f1" strokeWidth={1.5} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

function TrendCell({ value }: { value: number | null }) {
  if (value === null) return <span className="text-xs text-slate-300">—</span>;
  const color = value > 0 ? "text-emerald-600" : "text-red-500";
  const arrow = value > 0 ? "↑" : "↓";
  return <span className={`text-xs font-semibold ${color}`}>{arrow} {Math.abs(value)}%</span>;
}

const TABS: { key: "all" | Category; label: string }[] = [
  { key: "all", label: "Tous" },
  { key: "quick-win", label: "Quick Wins ⚡" },
  { key: "main-target", label: "Cibles 🎯" },
  { key: "editorial", label: "Éditorial ✍️" },
];

export function KeywordsTable({ keywords }: Props) {
  const [tab, setTab] = useState<"all" | Category>("all");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("search_volume");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const filtered = useMemo(() => {
    let list = keywords;
    if (tab !== "all") list = list.filter((k) => k.category === tab);
    if (search.trim()) list = list.filter((k) => k.keyword.includes(search.toLowerCase().trim()));
    return [...list].sort((a, b) => {
      let av = a[sortKey] ?? (sortDir === "desc" ? -Infinity : Infinity);
      let bv = b[sortKey] ?? (sortDir === "desc" ? -Infinity : Infinity);
      return sortDir === "desc" ? (bv as number) - (av as number) : (av as number) - (bv as number);
    });
  }, [keywords, tab, search, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    else { setSortKey(key); setSortDir("desc"); }
  }

  function SortBtn({ col }: { col: SortKey }) {
    const active = sortKey === col;
    return (
      <button onClick={() => toggleSort(col)} className={`ml-1 text-[10px] ${active ? "text-blue-500" : "text-slate-300"}`}>
        {active ? (sortDir === "desc" ? "↓" : "↑") : "↕"}
      </button>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                tab === t.key
                  ? "bg-slate-900 text-white"
                  : "text-slate-500 hover:bg-slate-100"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filtrer..."
          className="border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-400 w-48"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-50">
              <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Mot-clé</th>
              <th className="text-center px-3 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Catégorie</th>
              <th className="text-center px-3 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">
                Vol. <SortBtn col="search_volume" />
              </th>
              <th className="text-center px-3 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Tendance</th>
              <th className="text-center px-3 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">
                KD <SortBtn col="keyword_difficulty" />
              </th>
              <th className="text-center px-3 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Compétition</th>
              <th className="text-center px-3 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">
                CPC <SortBtn col="cpc" />
              </th>
              <th className="text-center px-3 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">
                Évol. annuelle <SortBtn col="trend_yearly" />
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.map((kw) => {
              const sparkData = MONTH_KEYS.map((key) => ({ v: kw.monthly_searches[key] ?? 0 }));
              const vol = kw.search_volume;
              const volFmt = vol >= 1000 ? `${(vol / 1000).toFixed(1)}k` : String(vol);
              return (
                <tr key={kw.keyword} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ background: CATEGORY_COLORS[kw.category] }}
                      />
                      <span className="font-medium text-slate-800 text-sm">{kw.keyword}</span>
                      <IntentBadge intent={kw.intent} />
                    </div>
                  </td>
                  <td className="px-3 py-3 text-center">
                    <span className="text-xs font-medium text-slate-500">{CATEGORY_LABELS[kw.category]}</span>
                  </td>
                  <td className="px-3 py-3 text-center">
                    <span className="text-sm font-bold text-slate-800">{volFmt}</span>
                    <span className="text-xs text-slate-400">/mois</span>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex justify-center">
                      <Sparkline data={sparkData} />
                    </div>
                  </td>
                  <td className="px-3 py-3 text-center">
                    <KdBadge score={kw.keyword_difficulty} />
                  </td>
                  <td className="px-3 py-3 text-center">
                    <CompBadge level={kw.competition_level} />
                  </td>
                  <td className="px-3 py-3 text-center text-xs font-semibold text-slate-700">
                    {kw.cpc ? `${kw.cpc.toFixed(2)}€` : "—"}
                  </td>
                  <td className="px-3 py-3 text-center">
                    <TrendCell value={kw.trend_yearly} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="px-6 py-3 border-t border-slate-50">
        <p className="text-xs text-slate-400">{filtered.length} mot(s)-clé(s) affiché(s)</p>
      </div>
    </div>
  );
}
```

**Step 2 : Intégrer dans `KeywordsClient.tsx`**

```tsx
import { KeywordsTable } from "./components/KeywordsTable";
// Après <SeasonalityChart> :
<KeywordsTable keywords={keywords} />
```

**Step 3 : Vérifier dans le navigateur** — tabs fonctionnels, tri par colonne, sparklines visibles.

**Step 4 : Commit**

```bash
git add src/app/admin/keywords/components/KeywordsTable.tsx src/app/admin/keywords/KeywordsClient.tsx
git commit -m "feat: add keyword table with sparklines, tabs and sorting"
```

---

## Task 8 : Vérification finale + build

**Step 1 : Run lint**

```bash
npm run lint
```

Corriger tous les warnings/erreurs TypeScript.

**Step 2 : Run build**

```bash
npm run build
```

Doit passer sans erreur.

**Step 3 : Vérification visuelle dans le browser**

Checklist :
- [ ] Entrée "Mots-Clés" visible dans la sidebar
- [ ] Header avec bouton Actualiser
- [ ] 4 KPI cards s'affichent correctement
- [ ] Scatter plot affiche les points par couleur, tooltip au hover
- [ ] Bar chart saisonnalité avec barres orange en Jun-Jul-Aoû
- [ ] Banner "Publiez maintenant" visible (on est en mars)
- [ ] Tableau : tabs All/Quick Wins/Cibles/Éditorial fonctionnent
- [ ] Filtrage texte fonctionne
- [ ] Tri par colonne fonctionne (clic sur Vol., KD, CPC, Évol.)
- [ ] Sparklines visibles pour chaque keyword
- [ ] Bouton Actualiser → appelle l'API → met à jour les données + timestamp

**Step 4 : Commit final**

```bash
git add -A
git commit -m "feat: keyword research dashboard - scatter plot, seasonality, keyword table"
```
