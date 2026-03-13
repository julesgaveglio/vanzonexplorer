# SEO Skill + Dashboard Extension Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Installer le skill claude-seo globalement et étendre le dashboard admin SEO avec 4 nouvelles sections (SEO Technique, Schema Markup, Visibilité IA, Optimisation Images).

**Architecture:** Deux parties indépendantes. (1) Installation bash du skill claude-seo dans `~/.claude/`. (2) Ajout de `dfsPostRaw` dans le helper DataForSEO existant, 4 nouvelles routes API sous `/api/admin/seo/`, 4 nouveaux composants React, et intégration dans `SeoClient.tsx`.

**Tech Stack:** Next.js 14 App Router, TypeScript, SWR, Tailwind CSS, Clerk (auth), DataForSEO REST API, Google PageSpeed Insights API.

**Spec:** `docs/superpowers/specs/2026-03-13-seo-skill-dashboard-design.md`

---

## Chunk 1: Foundations — Skill install + dataforseo helper + PSI guard

### Task 1: Installer le skill claude-seo

**Files:** aucun fichier projet modifié — installation globale dans `~/.claude/`

- [ ] **Step 1: Inspecter install.sh avant de lancer**

```bash
curl -s https://raw.githubusercontent.com/AgriciDaniel/claude-seo/main/install.sh | head -60
```

Vérifier : pas de `rm -rf /`, pas de commandes réseau vers des domaines suspects, pas d'accès aux clés SSH.

- [ ] **Step 2: Lancer l'installation**

```bash
git clone --depth 1 https://github.com/AgriciDaniel/claude-seo.git /tmp/claude-seo
bash /tmp/claude-seo/install.sh
```

Attendu : messages de succès, dossier `~/.claude/skills/seo/` créé.

- [ ] **Step 3: Vérifier l'installation**

```bash
ls ~/.claude/skills/seo/
ls ~/.claude/agents/ | grep seo
```

Attendu : les 12 sous-skills présents, les sous-agents SEO visibles.

- [ ] **Step 4: Nettoyer le clone temporaire**

```bash
rm -rf /tmp/claude-seo
```

---

### Task 2: Ajouter `dfsPostRaw` dans le helper DataForSEO

**Files:**
- Modify: `src/lib/dataforseo.ts`

**Contexte:** `dfsPost` existe déjà et retourne `tasks?.[0]?.result?.[0]` (unwrappé). `dfsPostRaw` est nécessaire uniquement pour `ai-visibility/route.ts` qui doit lire le `status_code` brut pour gérer l'erreur 40602 (domaine non enregistré dans AI Visibility). `dfsPostRaw` retourne le body JSON complet sans throw sur status_code applicatif.

- [ ] **Step 1: Lire le fichier existant**

Lire `src/lib/dataforseo.ts` pour vérifier la structure actuelle (environ 40 lignes).

- [ ] **Step 2: Ajouter `dfsPostRaw` à la fin du fichier**

Ajouter après la ligne `export const DFS_LANGUAGE_CODE = "fr";` :

```typescript
export async function dfsPostRaw<T = unknown>(
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
    next: { revalidate: 3600 },
  });
  if (!res.ok) {
    throw new Error(`DataForSEO HTTP error ${res.status}: ${await res.text()}`);
  }
  return res.json() as Promise<T>;
}
```

- [ ] **Step 3: Vérifier que TypeScript compile**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Attendu : aucune erreur liée à `dataforseo.ts`.

- [ ] **Step 4: Commit**

```bash
git add src/lib/dataforseo.ts
git commit -m "feat: add dfsPostRaw helper for raw DataForSEO response access"
```

---

### Task 3: Ajouter le guard Clerk sur la route PSI existante

**Files:**
- Modify: `src/app/api/admin/psi/route.ts`

**Contexte:** La route PSI existante n'a pas de guard Clerk. Elle sera utilisée par `TechnicalSeo` via la nouvelle route `technical/route.ts`. Ajouter le guard protège l'endpoint des appels non authentifiés.

- [ ] **Step 1: Lire la route existante**

Lire `src/app/api/admin/psi/route.ts` (environ 80 lignes).

- [ ] **Step 2: Ajouter l'import Clerk et le guard**

En haut du fichier, après `import { NextRequest, NextResponse } from "next/server";` :

```typescript
import { auth } from "@clerk/nextjs/server";
```

Au tout début de la fonction `GET`, **avant** `const url = ...` et `const strategy = ...` — comme première instruction du handler :

```typescript
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
```

- [ ] **Step 3: Vérifier que TypeScript compile**

```bash
npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 4: Commit**

```bash
git add src/app/api/admin/psi/route.ts
git commit -m "fix: add Clerk auth guard to PSI route"
```

---

## Chunk 2: API Routes — technical, schema, ai-visibility, images

### Task 4: Route `/api/admin/seo/technical`

**Files:**
- Create: `src/app/api/admin/seo/technical/route.ts`

**Contexte:** Cette route appelle directement l'API Google PageSpeed Insights pour `https://vanzonexplorer.com/vanzon` avec stratégie mobile. Elle retourne le même shape que `/api/admin/psi` (`{ scores, vitals, opportunities, diagnostics }`). URL fixe → `export const revalidate = 3600`.

- [ ] **Step 1: Créer la route**

Créer `src/app/api/admin/seo/technical/route.ts` :

```typescript
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export const revalidate = 3600;

const VANZON_URL = "https://vanzonexplorer.com/vanzon";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const apiKey = process.env.GOOGLE_PSI_API_KEY ?? process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "GOOGLE_PSI_API_KEY non configuré" }, { status: 500 });

  const rawUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(VANZON_URL)}&key=${apiKey}&strategy=mobile&category=performance&category=seo&category=accessibility&category=best-practices`;

  try {
    const res = await fetch(rawUrl, { next: { revalidate: 3600 } });
    if (!res.ok) {
      const err = await res.json();
      return NextResponse.json({ error: err?.error?.message ?? "Erreur PSI" }, { status: res.status });
    }
    const data = await res.json();
    const lr = data.lighthouseResult;
    const audits = lr?.audits ?? {};
    const score = (cat: string) => Math.round((lr?.categories?.[cat]?.score ?? 0) * 100);

    const lcp = audits["largest-contentful-paint"];
    const cls = audits["cumulative-layout-shift"];
    const tbt = audits["total-blocking-time"];
    const fcp = audits["first-contentful-paint"];
    const si = audits["speed-index"];
    const tti = audits["interactive"];

    const opportunities = Object.values(
      audits as Record<string, { id: string; title: string; score: number | null; displayValue?: string; details?: { overallSavingsMs?: number } }>
    )
      .filter((a) => a.score !== null && a.score < 0.9 && a.details?.overallSavingsMs)
      .sort((a, b) => (b.details?.overallSavingsMs ?? 0) - (a.details?.overallSavingsMs ?? 0))
      .slice(0, 5)
      .map((a) => ({ id: a.id, title: a.title, displayValue: a.displayValue ?? "", savingsMs: a.details?.overallSavingsMs ?? 0 }));

    const diagnostics = Object.values(
      audits as Record<string, { id: string; title: string; score: number | null; displayValue?: string }>
    )
      .filter((a) => a.score !== null && a.score < 0.9)
      .sort((a, b) => (a.score ?? 1) - (b.score ?? 1))
      .slice(0, 5)
      .map((a) => ({ id: a.id, title: a.title, score: a.score, displayValue: a.displayValue ?? "" }));

    return NextResponse.json({
      scores: {
        performance: score("performance"),
        seo: score("seo"),
        accessibility: score("accessibility"),
        bestPractices: score("best-practices"),
      },
      vitals: {
        lcp: { value: lcp?.displayValue ?? "--", score: lcp?.score },
        cls: { value: cls?.displayValue ?? "--", score: cls?.score },
        tbt: { value: tbt?.displayValue ?? "--", score: tbt?.score },
        fcp: { value: fcp?.displayValue ?? "--", score: fcp?.score },
        si: { value: si?.displayValue ?? "--", score: si?.score },
        tti: { value: tti?.displayValue ?? "--", score: tti?.score },
      },
      opportunities,
      diagnostics,
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
```

- [ ] **Step 2: Vérifier TypeScript**

```bash
npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 3: Tester manuellement avec le serveur dev**

Lancer `npm run dev` dans un terminal séparé, puis :

```bash
curl -s "http://localhost:3000/vanzon/api/admin/seo/technical" | jq '.scores'
```

Attendu : objet `{ performance: <0-100>, seo: <0-100>, accessibility: <0-100>, bestPractices: <0-100> }` ou `{ error: "Non autorisé" }` (normal sans cookie Clerk en curl).

- [ ] **Step 4: Commit**

```bash
git add src/app/api/admin/seo/technical/route.ts
git commit -m "feat: add /api/admin/seo/technical route (PSI Lighthouse scores)"
```

---

### Task 5: Route `/api/admin/seo/schema`

**Files:**
- Create: `src/app/api/admin/seo/schema/route.ts`

**Contexte:** Route dynamique (`?url=`). Appelle DataForSEO `on_page/instant_pages` pour crawler une URL et retourner les structured data détectées. Le composant front appellera cette route 5 fois en parallèle (une par page clé). Utilise `dfsPost` — le résultat retourné est `tasks[0].result[0]` (objet page directement), donc mapper en `result.items?.[0]?.meta?.structured_data`.

**Note sur le cache :** Route dynamique → `export const revalidate` n'a pas d'effet. `dfsPost` utilise `next: { revalidate: 300 }` en interne (5 min). Choix délibéré : utiliser `dfsPost` directement pour simplifier — le cache 5 min est acceptable pour du schema markup (données stables).

- [ ] **Step 1: Créer la route**

Créer `src/app/api/admin/seo/schema/route.ts` :

```typescript
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { dfsPost } from "@/lib/dataforseo";

const SCHEMA_TYPES = ["LocalBusiness", "Product", "FAQPage", "BreadcrumbList", "Article"];

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

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
```

- [ ] **Step 2: Vérifier TypeScript**

```bash
npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 3: Tester manuellement**

```bash
curl -s "http://localhost:3000/vanzon/api/admin/seo/schema?url=https%3A%2F%2Fvanzonexplorer.com%2Fvanzon" | jq '.detected'
```

Attendu : tableau de 5 objets `{ type: "LocalBusiness", present: true/false }`.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/admin/seo/schema/route.ts
git commit -m "feat: add /api/admin/seo/schema route (structured data detection)"
```

---

### Task 6: Route `/api/admin/seo/ai-visibility`

**Files:**
- Create: `src/app/api/admin/seo/ai-visibility/route.ts`

**Contexte:** Appelle DataForSEO AI Optimization LLM Mentions. Utilise `dfsPostRaw` (pas `dfsPost`) pour lire le `status_code` brut et retourner `{ available: false }` si l'erreur 40602 est reçue (domaine non enregistré). URL fixe → `export const revalidate = 3600`.

**⚠️ Endpoints à vérifier :** Les chemins REST exact de l'API AI Optimization DataForSEO ne sont pas confirmés dans la documentation publique. Basé sur la convention des MCP tools (`ai_opt_llm_ment_agg_metrics` → `aggregate_metrics`), les chemins probables sont :
- `/ai_optimization/llm_mentions/aggregate_metrics/live`
- `/ai_optimization/llm_mentions/top_pages/live`

Si ces chemins retournent une erreur 40400 (endpoint introuvable), chercher dans les [DataForSEO API Docs](https://docs.dataforseo.com/v3/ai_optimization/) le chemin correct.

- [ ] **Step 1: Créer la route**

Créer `src/app/api/admin/seo/ai-visibility/route.ts` :

```typescript
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { dfsPostRaw, DFS_TARGET } from "@/lib/dataforseo";

export const revalidate = 3600;

// ⚠️ Vérifier ces chemins contre les DataForSEO API docs si erreur 40400
const ENDPOINT_METRICS = "/ai_optimization/llm_mentions/aggregate_metrics/live";
const ENDPOINT_TOP_PAGES = "/ai_optimization/llm_mentions/top_pages/live";

interface DfsRawResponse {
  status_code: number;
  status_message: string;
  tasks?: Array<{
    status_code: number;
    status_message: string;
    result?: Array<Record<string, unknown>>;
  }>;
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  try {
    const metricsRaw = await dfsPostRaw<DfsRawResponse>(
      ENDPOINT_METRICS,
      [{ target: DFS_TARGET }]
    );

    const taskStatusCode = metricsRaw?.tasks?.[0]?.status_code;

    if (taskStatusCode === 40602) {
      return NextResponse.json({ available: false, reason: "domain_not_registered" });
    }

    if (taskStatusCode !== 20000) {
      const msg = metricsRaw?.tasks?.[0]?.status_message ?? "Erreur inconnue";
      return NextResponse.json({ error: `DataForSEO: ${taskStatusCode} — ${msg}` }, { status: 500 });
    }

    const metrics = metricsRaw?.tasks?.[0]?.result?.[0] ?? {};

    const topPagesRaw = await dfsPostRaw<DfsRawResponse>(
      ENDPOINT_TOP_PAGES,
      [{ target: DFS_TARGET, limit: 3 }]
    );
    const topPages = topPagesRaw?.tasks?.[0]?.result ?? [];

    return NextResponse.json({ available: true, metrics, topPages });
  } catch (err) {
    console.error("[seo/ai-visibility]", err);
    return NextResponse.json({ error: "Erreur DataForSEO" }, { status: 500 });
  }
}
```

- [ ] **Step 2: Vérifier TypeScript**

```bash
npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 3: Tester manuellement**

```bash
curl -s "http://localhost:3000/vanzon/api/admin/seo/ai-visibility" | jq '.'
```

Attendu : `{ available: false, reason: "domain_not_registered" }` si domaine non enregistré, ou `{ available: true, metrics: {...}, topPages: [...] }` si disponible.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/admin/seo/ai-visibility/route.ts
git commit -m "feat: add /api/admin/seo/ai-visibility route (LLM mentions)"
```

---

### Task 7: Route `/api/admin/seo/images`

**Files:**
- Create: `src/app/api/admin/seo/images/route.ts`

**Contexte:** Appelle DataForSEO `on_page/instant_pages` pour la homepage uniquement. Analyse les ressources images retournées pour détecter : alt manquant, format non-WebP/AVIF, taille > 200KB. `dfsPost` retourne `result[0]` directement → mapper en `result.items?.[0]?.resources`. URL fixe → `export const revalidate = 3600`.

- [ ] **Step 1: Créer la route**

Créer `src/app/api/admin/seo/images/route.ts` :

```typescript
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { dfsPost } from "@/lib/dataforseo";

export const revalidate = 3600;

const HOMEPAGE_URL = "https://vanzonexplorer.com/vanzon";

interface Resource {
  resource_type?: string;
  url?: string;
  size?: number;
  attributes?: { alt?: string };
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  try {
    const result = await dfsPost<{
      items?: Array<{
        resources?: Resource[];
      }>;
    }>("/on_page/instant_pages", [
      { url: HOMEPAGE_URL, load_resources: true, enable_javascript: false },
    ]);

    const resources: Resource[] = result?.items?.[0]?.resources ?? [];
    const images = resources.filter((r) => r.resource_type === "image");

    const noAlt = images.filter((r) => !r.attributes?.alt || r.attributes.alt === "");
    const nonOptimized = images.filter((r) => !r.url?.match(/\.(webp|avif)(\?.*)?$/i));
    const tooHeavy = images.filter((r) => (r.size ?? 0) > 204800);

    return NextResponse.json({
      total: images.length,
      noAlt: noAlt.map((r) => r.url),
      nonOptimized: nonOptimized.map((r) => r.url),
      tooHeavy: tooHeavy.map((r) => ({ url: r.url, sizeKb: Math.round((r.size ?? 0) / 1024) })),
    });
  } catch (err) {
    console.error("[seo/images]", err);
    return NextResponse.json({ error: "Erreur DataForSEO" }, { status: 500 });
  }
}
```

- [ ] **Step 2: Vérifier TypeScript**

```bash
npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 3: Tester manuellement**

```bash
curl -s "http://localhost:3000/vanzon/api/admin/seo/images" | jq '{ total, noAltCount: (.noAlt | length), nonOptimizedCount: (.nonOptimized | length) }'
```

- [ ] **Step 4: Commit**

```bash
git add src/app/api/admin/seo/images/route.ts
git commit -m "feat: add /api/admin/seo/images route (image optimization audit)"
```

---

## Chunk 3: Composants React — 4 nouvelles sections

### Task 8: Composant `TechnicalSeo`

**Files:**
- Create: `src/app/admin/(protected)/seo/components/TechnicalSeo.tsx`

**Contexte:** Affiche les scores Lighthouse (Performance, SEO, Accessibility, Best Practices) + Core Web Vitals. Design cohérent avec `QuickWins.tsx` : carte blanche, `border border-slate-100 rounded-2xl shadow-sm`. Score coloré : vert ≥ 90, orange 50-89, rouge < 50.

- [ ] **Step 1: Créer le composant**

Créer `src/app/admin/(protected)/seo/components/TechnicalSeo.tsx` :

```typescript
"use client";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface VitalMetric {
  value: string;
  score: number | null;
}

interface TechnicalData {
  scores?: {
    performance: number;
    seo: number;
    accessibility: number;
    bestPractices: number;
  };
  vitals?: {
    lcp: VitalMetric;
    cls: VitalMetric;
    tbt: VitalMetric;
    fcp: VitalMetric;
    si: VitalMetric;
    tti: VitalMetric;
  };
  opportunities?: Array<{ id: string; title: string; displayValue: string; savingsMs: number }>;
  diagnostics?: Array<{ id: string; title: string; score: number | null; displayValue: string }>;
  error?: string;
}

function scoreColor(score: number) {
  if (score >= 90) return "text-emerald-600 bg-emerald-50";
  if (score >= 50) return "text-amber-600 bg-amber-50";
  return "text-red-600 bg-red-50";
}

function vitalColor(score: number | null) {
  if (score === null) return "bg-slate-100 text-slate-500";
  if (score >= 0.9) return "bg-emerald-100 text-emerald-700";
  if (score >= 0.5) return "bg-amber-100 text-amber-700";
  return "bg-red-100 text-red-700";
}

export function TechnicalSeo() {
  const { data, isLoading } = useSWR<TechnicalData>(
    "/api/admin/seo/technical",
    fetcher,
    { refreshInterval: 3600000 }
  );

  const scoreItems = [
    { label: "Performance", key: "performance" as const, icon: "⚡" },
    { label: "SEO", key: "seo" as const, icon: "🔍" },
    { label: "Accessibilité", key: "accessibility" as const, icon: "♿" },
    { label: "Bonnes pratiques", key: "bestPractices" as const, icon: "✅" },
  ];

  const vitalItems = [
    { label: "LCP", key: "lcp" as const, desc: "Largest Contentful Paint" },
    { label: "CLS", key: "cls" as const, desc: "Cumulative Layout Shift" },
    { label: "TBT", key: "tbt" as const, desc: "Total Blocking Time" },
    { label: "FCP", key: "fcp" as const, desc: "First Contentful Paint" },
    { label: "SI", key: "si" as const, desc: "Speed Index" },
    { label: "TTI", key: "tti" as const, desc: "Time to Interactive" },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-50 flex items-center gap-2">
        <span>🔧</span>
        <h2 className="font-bold text-slate-900">SEO Technique</h2>
        <span className="text-xs bg-blue-100 text-blue-600 font-semibold px-2 py-0.5 rounded-full ml-auto">
          Lighthouse
        </span>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-10">
          <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : data?.error ? (
        <p className="px-6 py-8 text-center text-slate-400 text-sm">{data.error}</p>
      ) : (
        <div className="p-6 space-y-5">
          {/* Scores Lighthouse */}
          <div className="grid grid-cols-2 gap-3">
            {scoreItems.map(({ label, key, icon }) => {
              const val = data?.scores?.[key] ?? 0;
              return (
                <div key={key} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
                  <span className="text-lg">{icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-500 truncate">{label}</p>
                    <p className={`text-lg font-black rounded px-1 inline-block ${scoreColor(val)}`}>
                      {val}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Core Web Vitals */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
              Core Web Vitals
            </p>
            <div className="grid grid-cols-2 gap-2">
              {vitalItems.map(({ label, key, desc }) => {
                const vital = data?.vitals?.[key];
                return (
                  <div key={key} className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
                    <div>
                      <p className="text-xs font-bold text-slate-700">{label}</p>
                      <p className="text-xs text-slate-400">{desc}</p>
                    </div>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${vitalColor(vital?.score ?? null)}`}>
                      {vital?.value ?? "--"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top opportunités */}
          {data?.opportunities && data.opportunities.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                Opportunités
              </p>
              <div className="space-y-1">
                {data.opportunities.slice(0, 3).map((opp) => (
                  <div key={opp.id} className="flex items-center gap-2 text-xs text-slate-600">
                    <span className="text-amber-500">•</span>
                    <span className="flex-1 truncate">{opp.title}</span>
                    <span className="text-slate-400 shrink-0">{opp.displayValue}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Vérifier TypeScript**

```bash
npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 3: Commit**

```bash
git add src/app/admin/(protected)/seo/components/TechnicalSeo.tsx
git commit -m "feat: add TechnicalSeo component (Lighthouse scores + Core Web Vitals)"
```

---

### Task 9: Composant `SchemaMarkup`

**Files:**
- Create: `src/app/admin/(protected)/seo/components/SchemaMarkup.tsx`

**Contexte:** 5 appels `useSWR` en parallèle, un par page clé. Chaque appel appelle `/api/admin/seo/schema?url=<encoded>`. Affiche une table avec une ligne par page : page path + schemas détectés (badges verts) + schemas manquants (badges gris).

- [ ] **Step 1: Créer le composant**

Créer `src/app/admin/(protected)/seo/components/SchemaMarkup.tsx` :

```typescript
"use client";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface SchemaResult {
  url: string;
  detected: Array<{ type: string; present: boolean }>;
  error?: string;
}

const KEY_PAGES = [
  { label: "Homepage", url: "https://vanzonexplorer.com/vanzon" },
  { label: "Location", url: "https://vanzonexplorer.com/vanzon/location" },
  { label: "Achat", url: "https://vanzonexplorer.com/vanzon/achat" },
  { label: "Formation", url: "https://vanzonexplorer.com/vanzon/formation" },
  { label: "Pays Basque", url: "https://vanzonexplorer.com/vanzon/pays-basque" },
];

function PageRow({ label, url }: { label: string; url: string }) {
  const { data, isLoading } = useSWR<SchemaResult>(
    `/api/admin/seo/schema?url=${encodeURIComponent(url)}`,
    fetcher,
    { refreshInterval: 3600000 }
  );

  return (
    <tr className="border-t border-slate-50">
      <td className="px-4 py-3 text-sm font-semibold text-slate-700 w-32">{label}</td>
      <td className="px-4 py-3">
        {isLoading ? (
          <div className="flex gap-1">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="w-20 h-5 bg-slate-100 rounded-full animate-pulse" />
            ))}
          </div>
        ) : data?.error ? (
          <span className="text-xs text-red-400">Erreur</span>
        ) : (
          <div className="flex flex-wrap gap-1">
            {(data?.detected ?? []).map(({ type, present }) => (
              <span
                key={type}
                className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  present
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-slate-100 text-slate-400"
                }`}
              >
                {present ? "✓" : "○"} {type}
              </span>
            ))}
          </div>
        )}
      </td>
    </tr>
  );
}

export function SchemaMarkup() {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-50 flex items-center gap-2">
        <span>🏷️</span>
        <h2 className="font-bold text-slate-900">Schema Markup</h2>
        <span className="text-xs bg-emerald-100 text-emerald-600 font-semibold px-2 py-0.5 rounded-full ml-auto">
          Structured Data
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50">
              <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Page
              </th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Schemas
              </th>
            </tr>
          </thead>
          <tbody>
            {KEY_PAGES.map((page) => (
              <PageRow key={page.url} {...page} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Vérifier TypeScript**

```bash
npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 3: Commit**

```bash
git add src/app/admin/(protected)/seo/components/SchemaMarkup.tsx
git commit -m "feat: add SchemaMarkup component (structured data detection by page)"
```

---

### Task 10: Composant `AiVisibility`

**Files:**
- Create: `src/app/admin/(protected)/seo/components/AiVisibility.tsx`

**Contexte:** Affiche le score de visibilité IA et les mentions par LLM. Si la route retourne `{ available: false }`, afficher un état vide explicatif. Si disponible, afficher les métriques et le top des pages mentionnées.

- [ ] **Step 1: Créer le composant**

Créer `src/app/admin/(protected)/seo/components/AiVisibility.tsx` :

```typescript
"use client";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface AiData {
  available: boolean;
  reason?: string;
  metrics?: {
    visibility_score?: number;
    mentions_count?: number;
    impressions_count?: number;
    llm_mentions?: Record<string, number>;
  };
  topPages?: Array<{ url?: string; mentions_count?: number }>;
  error?: string;
}

const LLM_LABELS: Record<string, string> = {
  chatgpt: "ChatGPT",
  gemini: "Gemini",
  perplexity: "Perplexity",
  claude: "Claude",
};

export function AiVisibility() {
  const { data, isLoading } = useSWR<AiData>(
    "/api/admin/seo/ai-visibility",
    fetcher,
    { refreshInterval: 3600000 }
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-50 flex items-center gap-2">
        <span>🤖</span>
        <h2 className="font-bold text-slate-900">Visibilité IA</h2>
        <span className="text-xs bg-violet-100 text-violet-600 font-semibold px-2 py-0.5 rounded-full ml-auto">
          LLM Mentions
        </span>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-10">
          <div className="w-5 h-5 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : data?.error ? (
        <p className="px-6 py-8 text-center text-slate-400 text-sm">{data.error}</p>
      ) : !data?.available ? (
        <div className="px-6 py-8 text-center">
          <p className="text-slate-400 text-sm mb-2">Données non disponibles</p>
          <p className="text-slate-300 text-xs">
            Le domaine vanzonexplorer.com n&apos;est pas encore suivi dans DataForSEO AI Visibility.
          </p>
        </div>
      ) : (
        <div className="p-6 space-y-5">
          {/* Score global */}
          <div className="flex items-center gap-4 p-4 rounded-xl bg-violet-50">
            <div className="text-3xl font-black text-violet-600">
              {data.metrics?.visibility_score ?? 0}
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-700">Score de visibilité IA</p>
              <p className="text-xs text-slate-500">
                {data.metrics?.mentions_count ?? 0} mentions · {data.metrics?.impressions_count ?? 0} impressions
              </p>
            </div>
          </div>

          {/* Par LLM */}
          {data.metrics?.llm_mentions && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                Mentions par LLM
              </p>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(data.metrics.llm_mentions).map(([llm, count]) => (
                  <div key={llm} className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
                    <span className="text-sm font-medium text-slate-700">
                      {LLM_LABELS[llm] ?? llm}
                    </span>
                    <span className="text-sm font-bold text-violet-600">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top pages */}
          {data.topPages && data.topPages.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                Pages les plus mentionnées
              </p>
              <div className="space-y-1">
                {data.topPages.slice(0, 3).map((page, i) => (
                  <div key={page.url ?? String(i)} className="flex items-center gap-2 text-xs">
                    <span className="text-violet-400 font-bold">{i + 1}.</span>
                    <span className="flex-1 text-slate-600 truncate">
                      {(page.url ?? "").replace("https://vanzonexplorer.com", "") || "/"}
                    </span>
                    <span className="text-slate-400 shrink-0">{page.mentions_count} mentions</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Vérifier TypeScript**

```bash
npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 3: Commit**

```bash
git add src/app/admin/(protected)/seo/components/AiVisibility.tsx
git commit -m "feat: add AiVisibility component (LLM mentions + AI visibility score)"
```

---

### Task 11: Composant `ImageOptimization`

**Files:**
- Create: `src/app/admin/(protected)/seo/components/ImageOptimization.tsx`

**Contexte:** Affiche 3 KPI cards (sans alt, format non-optimisé, trop lourdes) et une liste des images problématiques avec badge par type de problème.

- [ ] **Step 1: Créer le composant**

Créer `src/app/admin/(protected)/seo/components/ImageOptimization.tsx` :

```typescript
"use client";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface ImageData {
  total?: number;
  noAlt?: string[];
  nonOptimized?: string[];
  tooHeavy?: Array<{ url: string; sizeKb: number }>;
  error?: string;
}

export function ImageOptimization() {
  const { data, isLoading } = useSWR<ImageData>(
    "/api/admin/seo/images",
    fetcher,
    { refreshInterval: 3600000 }
  );

  const kpis = [
    {
      label: "Sans alt",
      count: data?.noAlt?.length ?? 0,
      color: "from-red-500 to-rose-400",
      icon: "🖼️",
      tip: "Manquent d'attribut alt",
    },
    {
      label: "Format non-optimisé",
      count: data?.nonOptimized?.length ?? 0,
      color: "from-amber-500 to-orange-400",
      icon: "📦",
      tip: "Pas en WebP/AVIF",
    },
    {
      label: "Trop lourdes",
      count: data?.tooHeavy?.length ?? 0,
      color: "from-violet-500 to-purple-400",
      icon: "⚖️",
      tip: "> 200 KB",
    },
  ];

  const problems: Array<{ url: string; type: string; detail?: string }> = [
    ...(data?.noAlt ?? []).map((url) => ({ url, type: "Sans alt" })),
    ...(data?.tooHeavy ?? []).map(({ url, sizeKb }) => ({ url, type: "Trop lourde", detail: `${sizeKb} KB` })),
  ].slice(0, 8);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-50 flex items-center gap-2">
        <span>🖼️</span>
        <h2 className="font-bold text-slate-900">Optimisation Images</h2>
        <span className="text-xs bg-rose-100 text-rose-600 font-semibold px-2 py-0.5 rounded-full ml-auto">
          {data?.total ?? 0} images
        </span>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-10">
          <div className="w-5 h-5 border-2 border-rose-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : data?.error ? (
        <p className="px-6 py-8 text-center text-slate-400 text-sm">{data.error}</p>
      ) : (
        <div className="p-6 space-y-5">
          {/* KPI Cards */}
          <div className="grid grid-cols-3 gap-3">
            {kpis.map(({ label, count, color, icon, tip }) => (
              <div key={label} className="rounded-xl bg-slate-50 p-3 text-center">
                <p className="text-lg">{icon}</p>
                <p className={`text-2xl font-black bg-gradient-to-r ${color} bg-clip-text text-transparent`}>
                  {count}
                </p>
                <p className="text-xs font-semibold text-slate-600">{label}</p>
                <p className="text-xs text-slate-400">{tip}</p>
              </div>
            ))}
          </div>

          {/* Liste des problèmes */}
          {problems.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                Images à corriger
              </p>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {problems.map((p) => (
                  <div key={`${p.url}-${p.type}`} className="flex items-center gap-2 text-xs">
                    <span
                      className={`shrink-0 px-2 py-0.5 rounded-full font-medium ${
                        p.type === "Sans alt"
                          ? "bg-red-100 text-red-600"
                          : "bg-violet-100 text-violet-600"
                      }`}
                    >
                      {p.type}
                      {p.detail ? ` · ${p.detail}` : ""}
                    </span>
                    <span className="text-slate-500 truncate">{p.url}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {problems.length === 0 && (
            <p className="text-center text-sm text-emerald-600 font-medium">
              ✓ Aucun problème détecté
            </p>
          )}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Vérifier TypeScript**

```bash
npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 3: Commit**

```bash
git add src/app/admin/(protected)/seo/components/ImageOptimization.tsx
git commit -m "feat: add ImageOptimization component (alt, format, size audit)"
```

---

## Chunk 4: Intégration dans SeoClient

### Task 12: Mettre à jour `SeoClient.tsx`

**Files:**
- Modify: `src/app/admin/(protected)/seo/SeoClient.tsx`

**Contexte:** Ajouter les 4 imports des nouveaux composants, ajouter le commentaire `{/* Row 5: Keyword Ideas */}` sur le bloc existant (ligne ~132), puis insérer Row 6 et Row 7 après la fermeture de ce bloc.

- [ ] **Step 1: Lire le fichier actuel**

Lire `src/app/admin/(protected)/seo/SeoClient.tsx` pour identifier les lignes exactes à modifier.

- [ ] **Step 2: Ajouter les imports**

Après la ligne `import { KeywordIdeas } from "./components/KeywordIdeas";`, ajouter :

```typescript
import { TechnicalSeo } from "./components/TechnicalSeo";
import { SchemaMarkup } from "./components/SchemaMarkup";
import { AiVisibility } from "./components/AiVisibility";
import { ImageOptimization } from "./components/ImageOptimization";
```

- [ ] **Step 3: Ajouter les nouvelles sections**

Le bloc KeywordIdeas dans `SeoClient.tsx` a déjà un commentaire `{/* Row 5: Keyword Ideas */}` (ligne ~132). Insérer les nouvelles sections **après** la fermeture `</div>` du bloc Row 5 et **avant** la balise `<p className="text-center text-xs text-slate-300 mt-8">` du footer. Utiliser cet ancre exact pour l'insertion :

Remplacer la chaîne exacte :
```
      <p className="text-center text-xs text-slate-300 mt-8">
```
par :
```tsx
      {/* Row 6: Technical SEO + Schema Markup */}
      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <TechnicalSeo />
        <SchemaMarkup />
      </div>

      {/* Row 7: AI Visibility + Image Optimization */}
      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <AiVisibility />
        <ImageOptimization />
      </div>

      <p className="text-center text-xs text-slate-300 mt-8">
```

- [ ] **Step 4: Vérifier TypeScript et lint**

```bash
npx tsc --noEmit 2>&1 | head -20
npm run lint 2>&1 | tail -20
```

- [ ] **Step 5: Vérifier visuellement dans le navigateur**

Avec `npm run dev` actif, aller sur `http://localhost:3000/vanzon/admin/seo` (connecté en tant qu'admin). Vérifier :
- Row 6 s'affiche avec TechnicalSeo (skeleton ou données) et SchemaMarkup (table avec 5 pages)
- Row 7 s'affiche avec AiVisibility (état disponible ou "non suivi") et ImageOptimization (KPIs)
- Pas d'erreurs console

- [ ] **Step 6: Commit final**

```bash
git add src/app/admin/(protected)/seo/SeoClient.tsx
git commit -m "feat: integrate 4 new SEO sections in dashboard (Technical, Schema, AI Visibility, Images)"
```

---

## Vérification finale

- [ ] `npx tsc --noEmit` → 0 erreurs
- [ ] `npm run lint` → 0 warnings liés aux nouveaux fichiers
- [ ] `npm run build` → build réussi
- [ ] Dashboard SEO admin affiche les 4 nouvelles sections
- [ ] Le skill `/seo audit` est disponible dans une nouvelle session Claude Code
