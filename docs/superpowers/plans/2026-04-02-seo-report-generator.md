# SEO Report Generator — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Créer un module `/admin/seo-report` permettant de générer un rapport SEO complet pour n'importe quelle URL, avec export PDF professionnel et historique Supabase.

**Architecture:** Pipeline séquentiel côté client — 5 routes API POST indépendantes appelées l'une après l'autre, chaque étape affichant ses résultats immédiatement. Résilient : une étape qui échoue n'annule pas les autres.

**Tech Stack:** Next.js 14 App Router, TypeScript, Clerk (auth), Supabase (historique), Google PSI, DataForSEO, Groq llama-3.3-70b, @react-pdf/renderer, cheerio

---

## Chunk 1 : Setup — dépendances + table Supabase

### Task 1 : Installer les dépendances

**Files:**
- Modify: `package.json` (via npm)

- [ ] **Step 1 : Installer les packages**

```bash
npm install @react-pdf/renderer cheerio
```

Note : `cheerio` v1.0+ inclut ses propres types TypeScript — **ne pas** installer `@types/cheerio` (conflits avec l'API legacy).

- [ ] **Step 2 : Vérifier l'installation**

```bash
node -e "require('cheerio'); console.log('cheerio OK')"
node -e "require('@react-pdf/renderer'); console.log('react-pdf OK')"
```

Expected : deux lignes "OK"

- [ ] **Step 3 : Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: install @react-pdf/renderer + cheerio"
```

---

### Task 2 : Créer la table Supabase

**Files:**
- Create: `supabase/migrations/20260402_seo_reports.sql`

- [ ] **Step 1 : Créer le fichier migration**

```sql
-- supabase/migrations/20260402_seo_reports.sql
CREATE TABLE IF NOT EXISTS seo_reports (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  url          text NOT NULL,
  label        text,
  score_global numeric(5,2),
  report_data  jsonb NOT NULL,
  created_at   timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS seo_reports_created_at_idx ON seo_reports (created_at DESC);
CREATE INDEX IF NOT EXISTS seo_reports_url_idx ON seo_reports (url);
```

- [ ] **Step 2 : Exécuter le SQL dans Supabase**

Ouvrir le Supabase Dashboard → SQL Editor → coller et exécuter le contenu du fichier.

- [ ] **Step 3 : Vérifier la table**

Dans Supabase → Table Editor → confirmer que `seo_reports` existe avec les colonnes `id, url, label, score_global, report_data, created_at`.

- [ ] **Step 4 : Commit**

```bash
git add supabase/migrations/20260402_seo_reports.sql
git commit -m "feat(db): table seo_reports avec index"
```

---

## Chunk 2 : Types partagés

### Task 3 : Créer les types TypeScript

**Files:**
- Create: `src/types/seo-report.ts`

- [ ] **Step 1 : Créer le fichier de types**

```typescript
// src/types/seo-report.ts

export interface PsiVital {
  value: string;
  score: number | null;
}

export interface PsiOpportunity {
  id: string;
  title: string;
  displayValue: string;
  savingsMs: number;
}

export interface PsiResult {
  scores: {
    performance: number;
    seo: number;
    accessibility: number;
    bestPractices: number;
  };
  vitals: {
    lcp: PsiVital;
    cls: PsiVital;
    tbt: PsiVital;
    fcp: PsiVital;
    si: PsiVital;
    tti: PsiVital;
  };
  opportunities: PsiOpportunity[];
  diagnostics: { id: string; title: string; score: number | null; displayValue: string }[];
}

export interface PagespeedData {
  mobile: PsiResult;
  desktop: PsiResult;
}

export interface OnPageItem {
  key: string;
  label: string;
  pass: boolean;
  value?: string;
  detail?: string;
}

export interface OnPageData {
  score: number;
  items: OnPageItem[];
  imagesWithoutAlt: number;
  totalImages: number;
  h2s: string[];
  h3s: string[];
}

export interface AuthorityData {
  domainAuthority: number;
  backlinksCount: number;
  referringDomains: number;
  organicTraffic: number;
}

export interface CompetitorItem {
  domain: string;
  intersections: number;
  relevance: number;
}

export interface CompetitorsData {
  competitors: CompetitorItem[];
}

export interface AiAxis {
  titre: string;
  priorite: "Fort" | "Moyen" | "Faible";
  description: string;
  impact: string;
}

export interface AiInsightsData {
  secteur: string;
  axes: AiAxis[];
  conclusion: string;
}

export interface SeoReportData {
  url: string;
  label?: string;
  generatedAt: string;
  scoreGlobal: number;
  pagespeed?: PagespeedData;
  onpage?: OnPageData;
  authority?: AuthorityData;
  competitors?: CompetitorsData;
  aiInsights?: AiInsightsData;
}

export type PipelineStep = "pagespeed" | "onpage" | "authority" | "competitors" | "ai-insights";

export type StepStatus = "pending" | "loading" | "done" | "error";

export interface PipelineState {
  pagespeed: StepStatus;
  onpage: StepStatus;
  authority: StepStatus;
  competitors: StepStatus;
  "ai-insights": StepStatus;
}
```

- [ ] **Step 2 : Commit**

```bash
git add src/types/seo-report.ts
git commit -m "feat(seo-report): types TypeScript partagés"
```

---

## Chunk 3 : Routes API

### Task 4 : Route `/api/admin/seo-report/pagespeed`

**Files:**
- Create: `src/app/api/admin/seo-report/pagespeed/route.ts`

- [ ] **Step 1 : Créer la route**

```typescript
// src/app/api/admin/seo-report/pagespeed/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import type { PsiResult } from "@/types/seo-report";

async function runPsi(url: string, strategy: "mobile" | "desktop"): Promise<PsiResult> {
  const apiKey = process.env.GOOGLE_PSI_API_KEY ?? process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_PSI_API_KEY non configuré");

  const rawUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&key=${apiKey}&strategy=${strategy}&category=performance&category=seo&category=accessibility&category=best-practices`;

  const res = await fetch(rawUrl, { cache: "no-store" });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err?.error?.message ?? `PSI error ${res.status}`);
  }

  const data = await res.json();
  const lr = data.lighthouseResult;
  const audits = lr?.audits ?? {};
  const score = (cat: string) => Math.round((lr?.categories?.[cat]?.score ?? 0) * 100);

  const lcp = audits["largest-contentful-paint"];
  const cls = audits["cumulative-layout-shift"];
  const tbt = audits["total-blocking-time"];
  const fcp = audits["first-contentful-paint"];
  const si  = audits["speed-index"];
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

  return {
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
      si:  { value: si?.displayValue  ?? "--", score: si?.score  },
      tti: { value: tti?.displayValue ?? "--", score: tti?.score },
    },
    opportunities,
    diagnostics,
  };
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { url } = await req.json();
  if (!url) return NextResponse.json({ error: "url requis" }, { status: 400 });

  try {
    const [mobile, desktop] = await Promise.all([
      runPsi(url, "mobile"),
      runPsi(url, "desktop"),
    ]);
    return NextResponse.json({ mobile, desktop });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
```

- [ ] **Step 2 : Tester manuellement**

```bash
curl -X POST http://localhost:3000/api/admin/seo-report/pagespeed \
  -H "Content-Type: application/json" \
  -d '{"url":"https://www.diemconseiletpatrimoine.com/"}' \
  | jq '.mobile.scores'
```

Expected : objet avec `performance`, `seo`, `accessibility`, `bestPractices` entre 0 et 100.

- [ ] **Step 3 : Commit**

```bash
git add src/app/api/admin/seo-report/pagespeed/route.ts
git commit -m "feat(seo-report): route API pagespeed mobile+desktop"
```

---

### Task 5 : Route `/api/admin/seo-report/onpage`

**Files:**
- Create: `src/app/api/admin/seo-report/onpage/route.ts`

- [ ] **Step 1 : Créer la route**

```typescript
// src/app/api/admin/seo-report/onpage/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import * as cheerio from "cheerio";
import type { OnPageData, OnPageItem } from "@/types/seo-report";

function isPrivateHost(hostname: string): boolean {
  return (
    hostname === "localhost" ||
    /^127\./.test(hostname) ||
    /^10\./.test(hostname) ||
    /^192\.168\./.test(hostname) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(hostname) ||
    /^169\.254\./.test(hostname) ||
    /^::1$/.test(hostname)
  );
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { url } = await req.json();
  if (!url) return NextResponse.json({ error: "url requis" }, { status: 400 });

  // Validation SSRF
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return NextResponse.json({ error: "URL invalide" }, { status: 400 });
  }
  if (parsed.protocol !== "https:") {
    return NextResponse.json({ error: "URL doit être https://" }, { status: 400 });
  }
  if (isPrivateHost(parsed.hostname)) {
    return NextResponse.json({ error: "URL non autorisée" }, { status: 400 });
  }

  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(10000),
      headers: { "User-Agent": "Mozilla/5.0 (compatible; VanzonSEOBot/1.0)" },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();
    const $ = cheerio.load(html);

    // Extractions
    const title      = $("title").first().text().trim();
    const metaDesc   = $('meta[name="description"]').attr("content")?.trim() ?? "";
    const canonical  = $('link[rel="canonical"]').attr("href")?.trim() ?? "";
    const noindex    = $('meta[name="robots"]').attr("content")?.toLowerCase().includes("noindex") ?? false;
    const jsonLd     = $('script[type="application/ld+json"]').length > 0;
    const h1s        = $("h1").map((_, el) => $(el).text().trim()).get();
    const h2s        = $("h2").map((_, el) => $(el).text().trim()).get().slice(0, 10);
    const h3s        = $("h3").map((_, el) => $(el).text().trim()).get().slice(0, 10);

    const allImages  = $("img");
    const totalImages = allImages.length;
    const imagesWithoutAlt = allImages.filter((_, el) => !$(el).attr("alt")).length;

    // Score on-page
    const checks: OnPageItem[] = [
      { key: "title_present",  label: "Title tag présent",               pass: title.length > 0,              value: title },
      { key: "title_length",   label: "Title longueur (30-60 car.)",     pass: title.length >= 30 && title.length <= 60, detail: `${title.length} caractères` },
      { key: "meta_present",   label: "Meta description présente",       pass: metaDesc.length > 0,            value: metaDesc },
      { key: "meta_length",    label: "Meta description longueur (120-160)", pass: metaDesc.length >= 120 && metaDesc.length <= 160, detail: `${metaDesc.length} caractères` },
      { key: "h1_unique",      label: "H1 unique et présent",            pass: h1s.length === 1,               detail: `${h1s.length} H1 trouvé(s)` },
      { key: "no_noindex",     label: "Pas de balise noindex",           pass: !noindex },
      { key: "canonical",      label: "Canonical tag présent",           pass: canonical.length > 0,           value: canonical },
      { key: "json_ld",        label: "Schema JSON-LD présent",          pass: jsonLd },
    ];

    const passCount = checks.filter((c) => c.pass).length;
    // Bonus alt images
    const altBonus = totalImages === 0 ? 1 : imagesWithoutAlt === 0 ? 1 : 0;
    const score = Math.round(((passCount + altBonus) / (checks.length + 1)) * 100);

    const data: OnPageData = { score, items: checks, imagesWithoutAlt, totalImages, h2s, h3s };
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
```

- [ ] **Step 2 : Tester manuellement**

```bash
curl -X POST http://localhost:3000/api/admin/seo-report/onpage \
  -H "Content-Type: application/json" \
  -d '{"url":"https://www.diemconseiletpatrimoine.com/"}' \
  | jq '.score'
```

Expected : nombre entre 0 et 100.

- [ ] **Step 3 : Commit**

```bash
git add src/app/api/admin/seo-report/onpage/route.ts
git commit -m "feat(seo-report): route API on-page audit avec cheerio"
```

---

### Task 6 : Route `/api/admin/seo-report/authority`

**Files:**
- Create: `src/app/api/admin/seo-report/authority/route.ts`

- [ ] **Step 1 : Créer la route**

Note : on utilise `/backlinks/summary/live` (et non `domain_rank_overview`) car c'est le seul endpoint DataForSEO qui retourne un `rank` normalisé 0-100 ainsi que `backlinks` et `referring_domains`.

```typescript
// src/app/api/admin/seo-report/authority/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { dfsPost } from "@/lib/dataforseo";
import type { AuthorityData } from "@/types/seo-report";

interface DfsBacklinksSummary {
  rank?: number;                 // 0-100, score d'autorité du domaine
  backlinks?: number;
  referring_domains?: number;
  referring_ips?: number;
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await req.json();
  const { url } = body;
  if (!url) return NextResponse.json({ error: "url requis" }, { status: 400 });

  let domain: string;
  try {
    domain = new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return NextResponse.json({ error: "URL invalide" }, { status: 400 });
  }

  try {
    const result = await dfsPost<DfsBacklinksSummary>(
      "/backlinks/summary/live",
      [{ target: domain, target_type: "domain", include_subdomains: true }]
    );

    const data: AuthorityData = {
      domainAuthority: Math.round(result?.rank ?? 0),
      backlinksCount: result?.backlinks ?? 0,
      referringDomains: result?.referring_domains ?? 0,
      organicTraffic: 0, // non disponible dans backlinks/summary
    };

    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
```

- [ ] **Step 2 : Tester manuellement**

```bash
curl -X POST http://localhost:3000/api/admin/seo-report/authority \
  -H "Content-Type: application/json" \
  -d '{"url":"https://www.diemconseiletpatrimoine.com/"}' \
  | jq '.'
```

Expected : objet `{ domainAuthority, backlinksCount, referringDomains, organicTraffic }`.

- [ ] **Step 3 : Commit**

```bash
git add src/app/api/admin/seo-report/authority/route.ts
git commit -m "feat(seo-report): route API domain authority (DataForSEO)"
```

---

### Task 7 : Route `/api/admin/seo-report/competitors`

**Files:**
- Create: `src/app/api/admin/seo-report/competitors/route.ts`

- [ ] **Step 1 : Créer la route**

```typescript
// src/app/api/admin/seo-report/competitors/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { dfsPostRaw } from "@/lib/dataforseo";
import type { CompetitorsData } from "@/types/seo-report";

interface DfsCompetitorsRaw {
  tasks?: Array<{
    result?: Array<{
      domain: string;
      intersections: number;
      relevance: number;
    }>;
  }>;
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await req.json();
  const { url } = body;
  if (!url) return NextResponse.json({ error: "url requis" }, { status: 400 });

  let domain: string;
  try {
    domain = new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return NextResponse.json({ error: "URL invalide" }, { status: 400 });
  }

  try {
    const raw = await dfsPostRaw<DfsCompetitorsRaw>(
      "/dataforseo_labs/google/competitors_domain/live",
      [{ target: domain, language_name: "French", location_name: "France", limit: 5 }]
    );

    const items = raw?.tasks?.[0]?.result ?? [];
    const competitors = items.map((item) => ({
      domain: item.domain,
      intersections: item.intersections ?? 0,
      relevance: Math.round((item.relevance ?? 0) * 100),
    }));

    const data: CompetitorsData = { competitors };
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
```

- [ ] **Step 2 : Tester manuellement**

```bash
curl -X POST http://localhost:3000/api/admin/seo-report/competitors \
  -H "Content-Type: application/json" \
  -d '{"url":"https://www.diemconseiletpatrimoine.com/"}' \
  | jq '.competitors'
```

Expected : tableau de 5 domaines concurrents.

- [ ] **Step 3 : Commit**

```bash
git add src/app/api/admin/seo-report/competitors/route.ts
git commit -m "feat(seo-report): route API concurrents organiques (DataForSEO)"
```

---

### Task 8 : Route `/api/admin/seo-report/ai-insights`

**Files:**
- Create: `src/app/api/admin/seo-report/ai-insights/route.ts`

- [ ] **Step 1 : Créer la route**

```typescript
// src/app/api/admin/seo-report/ai-insights/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import Groq from "groq-sdk";
import type { AiInsightsData, SeoReportData } from "@/types/seo-report";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const reportData: Partial<SeoReportData> & { url: string } = await req.json();

  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

  const prompt = `Tu es un expert SEO. Analyse les données d'audit SEO suivantes et génère des recommandations concrètes.

URL analysée : ${reportData.url}

PERFORMANCE (PSI) :
- Mobile : performance ${reportData.pagespeed?.mobile.scores.performance ?? "N/A"}/100, SEO ${reportData.pagespeed?.mobile.scores.seo ?? "N/A"}/100
- Desktop : performance ${reportData.pagespeed?.desktop.scores.performance ?? "N/A"}/100, SEO ${reportData.pagespeed?.desktop.scores.seo ?? "N/A"}/100
- LCP mobile : ${reportData.pagespeed?.mobile.vitals.lcp.value ?? "N/A"}
- CLS mobile : ${reportData.pagespeed?.mobile.vitals.cls.value ?? "N/A"}

ON-PAGE :
- Score : ${reportData.onpage?.score ?? "N/A"}/100
- Problèmes : ${reportData.onpage?.items.filter((i) => !i.pass).map((i) => i.label).join(", ") || "aucun"}
- Images sans alt : ${reportData.onpage?.imagesWithoutAlt ?? 0}/${reportData.onpage?.totalImages ?? 0}

AUTORITÉ :
- Domain Authority : ${reportData.authority?.domainAuthority ?? "N/A"}/100
- Trafic organique estimé : ${reportData.authority?.organicTraffic ?? "N/A"} visites/mois

CONCURRENTS :
${reportData.competitors?.competitors.map((c) => `- ${c.domain} (${c.intersections} mots-clés en commun)`).join("\n") || "N/A"}

Réponds UNIQUEMENT avec un objet JSON valide correspondant exactement à ce schéma :
{
  "secteur": "string — secteur d'activité détecté depuis l'URL et les données",
  "axes": [
    {
      "titre": "string — titre court de l'action",
      "priorite": "Fort" | "Moyen" | "Faible",
      "description": "string — explication concrète en 1-2 phrases",
      "impact": "string — impact estimé ex. 'Peut améliorer le LCP de ~30%'"
    }
  ],
  "conclusion": "string — paragraphe de synthèse 3-5 phrases, adapté au secteur détecté"
}

Génère 5 à 7 axes. Priorise les axes à impact Fort. Sois concret et actionnable.`;

  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    const text = completion.choices[0]?.message?.content ?? "{}";
    const data = JSON.parse(text) as AiInsightsData;
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
```

- [ ] **Step 2 : Commit**

```bash
git add src/app/api/admin/seo-report/ai-insights/route.ts
git commit -m "feat(seo-report): route API recommandations IA (Groq)"
```

---

### Task 9 : Route `/api/admin/seo-report/save`

**Files:**
- Create: `src/app/api/admin/seo-report/save/route.ts`

- [ ] **Step 1 : Créer la route**

```typescript
// src/app/api/admin/seo-report/save/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import type { SeoReportData } from "@/types/seo-report";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const report: SeoReportData = await req.json();

  const sb = createSupabaseAdmin();
  const { data, error } = await sb
    .from("seo_reports")
    .insert({
      url: report.url,
      label: report.label ?? null,
      score_global: report.scoreGlobal,
      report_data: report,
    })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ id: data.id });
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const sb = createSupabaseAdmin();
  const { data, error } = await sb
    .from("seo_reports")
    .select("id, url, label, score_global, created_at")
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
```

- [ ] **Step 2 : Commit**

```bash
git add src/app/api/admin/seo-report/save/route.ts
git commit -m "feat(seo-report): route API save + GET historique Supabase"
```

---

## Chunk 4 : Composants UI

### Task 10 : Utilitaire de score + composants de base

**Files:**
- Create: `src/app/admin/(protected)/seo-report/_lib/score.ts`
- Create: `src/app/admin/(protected)/seo-report/_components/StatusBadge.tsx`

- [ ] **Step 1 : Créer l'utilitaire de score**

```typescript
// src/app/admin/(protected)/seo-report/_lib/score.ts
import type { PagespeedData, OnPageData, AuthorityData, SeoReportData } from "@/types/seo-report";

export function calcScoreGlobal(
  pagespeed?: PagespeedData,
  onpage?: OnPageData,
  authority?: AuthorityData
): number {
  let score = 0;
  let weight = 0;

  if (pagespeed) {
    score += pagespeed.mobile.scores.seo * 0.30;
    score += pagespeed.mobile.scores.performance * 0.25;
    weight += 0.55;
  }
  if (onpage) {
    score += onpage.score * 0.30;
    weight += 0.30;
  }
  if (authority) {
    score += authority.domainAuthority * 0.15;
    weight += 0.15;
  }

  if (weight === 0) return 0;
  // Diviser par le poids effectif pour normaliser sur 100 même si certaines étapes ont échoué
  return Math.round(score / weight);
}

export function getScoreColor(score: number): string {
  if (score >= 80) return "#10B981";
  if (score >= 50) return "#F59E0B";
  return "#EF4444";
}

export function getScoreLabel(score: number): string {
  if (score >= 80) return "Bon";
  if (score >= 50) return "À améliorer";
  return "Critique";
}
```

- [ ] **Step 2 : Créer le composant StatusBadge**

```tsx
// src/app/admin/(protected)/seo-report/_components/StatusBadge.tsx
interface StatusBadgeProps {
  score: number;
  size?: "sm" | "md";
}

export default function StatusBadge({ score, size = "md" }: StatusBadgeProps) {
  const color = score >= 80 ? "bg-emerald-100 text-emerald-700" : score >= 50 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700";
  const label = score >= 80 ? "Bon" : score >= 50 ? "À améliorer" : "Critique";
  const cls = size === "sm" ? "text-xs px-2 py-0.5" : "text-sm px-2.5 py-1";
  return (
    <span className={`inline-flex items-center rounded-full font-medium ${color} ${cls}`}>
      {label}
    </span>
  );
}
```

- [ ] **Step 3 : Commit**

```bash
git add src/app/admin/(protected)/seo-report/_lib/score.ts \
        src/app/admin/(protected)/seo-report/_components/StatusBadge.tsx
git commit -m "feat(seo-report): utilitaire score + StatusBadge"
```

---

### Task 11 : UrlInput + ProgressPipeline

**Files:**
- Create: `src/app/admin/(protected)/seo-report/_components/UrlInput.tsx`
- Create: `src/app/admin/(protected)/seo-report/_components/ProgressPipeline.tsx`

- [ ] **Step 1 : Créer UrlInput**

```tsx
// src/app/admin/(protected)/seo-report/_components/UrlInput.tsx
"use client";
import { useState } from "react";

interface UrlInputProps {
  onGenerate: (url: string, label: string) => void;
  loading: boolean;
}

export default function UrlInput({ onGenerate, loading }: UrlInputProps) {
  const [url, setUrl] = useState("");
  const [label, setLabel] = useState("");

  const isValid = (() => {
    try {
      const u = new URL(url);
      return u.protocol === "https:";
    } catch {
      return false;
    }
  })();

  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://exemple.com"
          disabled={loading}
          className="flex-1 px-4 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
          onKeyDown={(e) => e.key === "Enter" && isValid && !loading && onGenerate(url, label)}
        />
        <button
          onClick={() => onGenerate(url, label)}
          disabled={!isValid || loading}
          className="px-5 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Analyse en cours…" : "Générer le rapport"}
        </button>
      </div>
      <input
        type="text"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        placeholder="Nom du client (optionnel — ex: Diem Conseil)"
        disabled={loading}
        className="w-full px-4 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 text-slate-600"
      />
    </div>
  );
}
```

- [ ] **Step 2 : Créer ProgressPipeline**

```tsx
// src/app/admin/(protected)/seo-report/_components/ProgressPipeline.tsx
"use client";
import type { PipelineState, PipelineStep } from "@/types/seo-report";

const STEPS: { key: PipelineStep; label: string }[] = [
  { key: "pagespeed",    label: "Performance" },
  { key: "onpage",       label: "On-page" },
  { key: "authority",    label: "Autorité" },
  { key: "competitors",  label: "Concurrents" },
  { key: "ai-insights",  label: "Analyse IA" },
];

interface ProgressPipelineProps {
  state: PipelineState;
}

export default function ProgressPipeline({ state }: ProgressPipelineProps) {
  const doneCount = STEPS.filter((s) => state[s.key] === "done").length;
  const progress = Math.round((doneCount / STEPS.length) * 100);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-500 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-xs text-slate-500 w-10 text-right">{progress}%</span>
      </div>
      <div className="flex gap-2 flex-wrap">
        {STEPS.map((step) => {
          const status = state[step.key];
          return (
            <div
              key={step.key}
              className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border transition-colors ${
                status === "done"    ? "bg-emerald-50 border-emerald-200 text-emerald-700" :
                status === "loading" ? "bg-indigo-50 border-indigo-200 text-indigo-700" :
                status === "error"   ? "bg-red-50 border-red-200 text-red-600" :
                                       "bg-slate-50 border-slate-200 text-slate-400"
              }`}
            >
              {status === "done"    && <span>✓</span>}
              {status === "loading" && <span className="inline-block w-2.5 h-2.5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />}
              {status === "error"   && <span>✗</span>}
              {status === "pending" && <span className="inline-block w-1.5 h-1.5 rounded-full bg-slate-300" />}
              {step.label}
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 3 : Commit**

```bash
git add src/app/admin/(protected)/seo-report/_components/UrlInput.tsx \
        src/app/admin/(protected)/seo-report/_components/ProgressPipeline.tsx
git commit -m "feat(seo-report): UrlInput + ProgressPipeline"
```

---

### Task 12 : Sections du rapport

**Files:**
- Create: `src/app/admin/(protected)/seo-report/_components/sections/ScoreGlobal.tsx`
- Create: `src/app/admin/(protected)/seo-report/_components/sections/PerformanceSection.tsx`
- Create: `src/app/admin/(protected)/seo-report/_components/sections/OnPageSection.tsx`
- Create: `src/app/admin/(protected)/seo-report/_components/sections/AuthoritySection.tsx`
- Create: `src/app/admin/(protected)/seo-report/_components/sections/CompetitorsSection.tsx`
- Create: `src/app/admin/(protected)/seo-report/_components/sections/AiInsightsSection.tsx`

- [ ] **Step 1 : ScoreGlobal.tsx**

```tsx
// src/app/admin/(protected)/seo-report/_components/sections/ScoreGlobal.tsx
import { getScoreColor, getScoreLabel } from "../../_lib/score";
import type { SeoReportData } from "@/types/seo-report";

interface Props { report: Partial<SeoReportData> & { scoreGlobal: number; url: string } }

export default function ScoreGlobal({ report }: Props) {
  const color = getScoreColor(report.scoreGlobal);
  const label = getScoreLabel(report.scoreGlobal);
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Score SEO Global</h2>
          <p className="text-sm text-slate-500">{report.url}</p>
        </div>
        <div className="text-right">
          <div className="text-5xl font-bold" style={{ color }}>{report.scoreGlobal}</div>
          <div className="text-sm text-slate-500">/ 100</div>
          <div className="text-sm font-medium mt-1" style={{ color }}>{label}</div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {report.pagespeed && (
          <div className="bg-slate-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-slate-800">{report.pagespeed.mobile.scores.performance}</div>
            <div className="text-xs text-slate-500 mt-1">Performance mobile</div>
          </div>
        )}
        {report.onpage && (
          <div className="bg-slate-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-slate-800">{report.onpage.score}</div>
            <div className="text-xs text-slate-500 mt-1">On-page</div>
          </div>
        )}
        {report.authority && (
          <div className="bg-slate-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-slate-800">{report.authority.domainAuthority}</div>
            <div className="text-xs text-slate-500 mt-1">Autorité domaine</div>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2 : PerformanceSection.tsx**

```tsx
// src/app/admin/(protected)/seo-report/_components/sections/PerformanceSection.tsx
import type { PagespeedData, PsiVital } from "@/types/seo-report";

function VitalBadge({ vital, label }: { vital: PsiVital; label: string }) {
  const color =
    vital.score === null ? "text-slate-400" :
    vital.score >= 0.9   ? "text-emerald-600" :
    vital.score >= 0.5   ? "text-amber-600"   :
                            "text-red-600";
  const bg =
    vital.score === null ? "bg-slate-50" :
    vital.score >= 0.9   ? "bg-emerald-50" :
    vital.score >= 0.5   ? "bg-amber-50"   :
                            "bg-red-50";
  return (
    <div className={`${bg} rounded-lg p-3`}>
      <div className={`text-lg font-bold ${color}`}>{vital.value}</div>
      <div className="text-xs text-slate-500">{label}</div>
    </div>
  );
}

function ScoreBar({ score, label }: { score: number; label: string }) {
  const color = score >= 80 ? "bg-emerald-500" : score >= 50 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-slate-600 w-32">{label}</span>
      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-sm font-medium text-slate-700 w-8 text-right">{score}</span>
    </div>
  );
}

export default function PerformanceSection({ data }: { data: PagespeedData }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <h3 className="text-base font-semibold text-slate-800 mb-4">Performance technique</h3>
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div>
          <p className="text-sm font-medium text-slate-500 mb-3">Mobile</p>
          <div className="space-y-2">
            <ScoreBar score={data.mobile.scores.performance} label="Performance" />
            <ScoreBar score={data.mobile.scores.seo} label="SEO" />
            <ScoreBar score={data.mobile.scores.accessibility} label="Accessibilité" />
          </div>
        </div>
        <div>
          <p className="text-sm font-medium text-slate-500 mb-3">Desktop</p>
          <div className="space-y-2">
            <ScoreBar score={data.desktop.scores.performance} label="Performance" />
            <ScoreBar score={data.desktop.scores.seo} label="SEO" />
            <ScoreBar score={data.desktop.scores.accessibility} label="Accessibilité" />
          </div>
        </div>
      </div>
      <p className="text-sm font-medium text-slate-500 mb-3">Core Web Vitals (mobile)</p>
      <div className="grid grid-cols-3 gap-3">
        <VitalBadge vital={data.mobile.vitals.lcp} label="LCP" />
        <VitalBadge vital={data.mobile.vitals.cls} label="CLS" />
        <VitalBadge vital={data.mobile.vitals.tbt} label="TBT" />
        <VitalBadge vital={data.mobile.vitals.fcp} label="FCP" />
        <VitalBadge vital={data.mobile.vitals.si}  label="Speed Index" />
        <VitalBadge vital={data.mobile.vitals.tti} label="TTI" />
      </div>
      {data.mobile.opportunities.length > 0 && (
        <div className="mt-4">
          <p className="text-sm font-medium text-slate-500 mb-2">Opportunités d'amélioration</p>
          <ul className="space-y-1.5">
            {data.mobile.opportunities.map((opp) => (
              <li key={opp.id} className="flex items-center justify-between text-sm">
                <span className="text-slate-700">{opp.title}</span>
                <span className="text-amber-600 font-medium">−{Math.round(opp.savingsMs)}ms</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3 : OnPageSection.tsx**

```tsx
// src/app/admin/(protected)/seo-report/_components/sections/OnPageSection.tsx
import type { OnPageData } from "@/types/seo-report";

export default function OnPageSection({ data }: { data: OnPageData }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-slate-800">Audit on-page</h3>
        <span className={`text-lg font-bold ${data.score >= 80 ? "text-emerald-600" : data.score >= 50 ? "text-amber-600" : "text-red-600"}`}>
          {data.score}/100
        </span>
      </div>
      <div className="space-y-2">
        {data.items.map((item) => (
          <div key={item.key} className="flex items-start gap-3 py-2 border-b border-slate-50 last:border-0">
            <span className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${item.pass ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
              {item.pass ? "✓" : "✗"}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-slate-700">{item.label}</p>
              {item.detail && <p className="text-xs text-slate-400 mt-0.5">{item.detail}</p>}
              {item.value && !item.pass && (
                <p className="text-xs text-slate-400 mt-0.5 truncate">{item.value}</p>
              )}
            </div>
          </div>
        ))}
      </div>
      {data.totalImages > 0 && (
        <div className={`mt-4 p-3 rounded-lg text-sm ${data.imagesWithoutAlt === 0 ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
          {data.imagesWithoutAlt === 0
            ? `✓ Toutes les ${data.totalImages} images ont un attribut alt`
            : `⚠ ${data.imagesWithoutAlt} image(s) sans alt sur ${data.totalImages}`}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4 : AuthoritySection.tsx**

```tsx
// src/app/admin/(protected)/seo-report/_components/sections/AuthoritySection.tsx
import type { AuthorityData } from "@/types/seo-report";

export default function AuthoritySection({ data }: { data: AuthorityData }) {
  const daColor = data.domainAuthority >= 50 ? "text-emerald-600" : data.domainAuthority >= 25 ? "text-amber-600" : "text-red-600";
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <h3 className="text-base font-semibold text-slate-800 mb-4">Autorité du domaine</h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-50 rounded-lg p-4">
          <div className={`text-3xl font-bold ${daColor}`}>{data.domainAuthority}</div>
          <div className="text-xs text-slate-500 mt-1">Domain Authority / 100</div>
          <div className="mt-2 h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${data.domainAuthority}%` }} />
          </div>
        </div>
        <div className="space-y-3">
          <div className="bg-slate-50 rounded-lg p-3">
            <div className="text-xl font-bold text-slate-800">{data.organicTraffic.toLocaleString("fr-FR")}</div>
            <div className="text-xs text-slate-500">Trafic organique estimé/mois</div>
          </div>
          <div className="bg-slate-50 rounded-lg p-3">
            <div className="text-xl font-bold text-slate-800">{data.backlinksCount.toLocaleString("fr-FR")}</div>
            <div className="text-xs text-slate-500">Backlinks</div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 5 : CompetitorsSection.tsx**

```tsx
// src/app/admin/(protected)/seo-report/_components/sections/CompetitorsSection.tsx
import type { CompetitorsData } from "@/types/seo-report";

export default function CompetitorsSection({ data }: { data: CompetitorsData }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <h3 className="text-base font-semibold text-slate-800 mb-4">Concurrents organiques</h3>
      <div className="space-y-2">
        {data.competitors.length === 0 ? (
          <p className="text-sm text-slate-400">Aucun concurrent détecté.</p>
        ) : (
          data.competitors.map((c, i) => (
            <div key={c.domain} className="flex items-center gap-4 py-2 border-b border-slate-50 last:border-0">
              <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
                {i + 1}
              </span>
              <span className="flex-1 text-sm font-medium text-slate-700">{c.domain}</span>
              <div className="text-right">
                <div className="text-xs text-slate-500">{c.intersections} mots-clés communs</div>
                <div className="text-xs text-indigo-600 font-medium">Pertinence {c.relevance}%</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 6 : AiInsightsSection.tsx**

```tsx
// src/app/admin/(protected)/seo-report/_components/sections/AiInsightsSection.tsx
import type { AiInsightsData } from "@/types/seo-report";

const PRIORITY_STYLES = {
  Fort:   "bg-red-100 text-red-700",
  Moyen:  "bg-amber-100 text-amber-700",
  Faible: "bg-slate-100 text-slate-600",
};

export default function AiInsightsSection({ data }: { data: AiInsightsData }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-slate-800">Recommandations IA</h3>
        <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">
          Secteur : {data.secteur}
        </span>
      </div>
      <div className="space-y-3 mb-6">
        {data.axes.map((axe, i) => (
          <div key={i} className="flex gap-3 p-3 rounded-lg bg-slate-50">
            <span className={`flex-shrink-0 text-xs font-bold px-2 py-0.5 rounded-full h-fit mt-0.5 ${PRIORITY_STYLES[axe.priorite]}`}>
              {axe.priorite}
            </span>
            <div>
              <p className="text-sm font-medium text-slate-800">{axe.titre}</p>
              <p className="text-xs text-slate-600 mt-0.5">{axe.description}</p>
              <p className="text-xs text-indigo-600 mt-1">{axe.impact}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="bg-indigo-50 rounded-lg p-4">
        <p className="text-xs font-semibold text-indigo-700 mb-2 uppercase tracking-wide">Conclusion</p>
        <p className="text-sm text-slate-700 leading-relaxed">{data.conclusion}</p>
      </div>
    </div>
  );
}
```

- [ ] **Step 7 : Commit**

```bash
git add src/app/admin/(protected)/seo-report/_components/sections/
git commit -m "feat(seo-report): sections rapport (Score, Performance, OnPage, Authority, Competitors, AI)"
```

---

### Task 13 : ReportHistory

**Files:**
- Create: `src/app/admin/(protected)/seo-report/_components/ReportHistory.tsx`

- [ ] **Step 1 : Créer ReportHistory**

```tsx
// src/app/admin/(protected)/seo-report/_components/ReportHistory.tsx
"use client";
import { useEffect, useState } from "react";
import { getScoreColor } from "../_lib/score";

interface HistoryItem {
  id: string;
  url: string;
  label: string | null;
  score_global: number | null;
  created_at: string;
}

// Composant display-only — affiche l'historique, pas de rechargement de rapport
export default function ReportHistory() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/seo-report/save")
      .then((r) => r.json())
      .then((data) => { setHistory(data ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-sm text-slate-400">Chargement de l'historique…</div>;
  if (history.length === 0) return <div className="text-sm text-slate-400">Aucun rapport sauvegardé.</div>;

  return (
    <div>
      <h3 className="text-sm font-semibold text-slate-600 mb-3">Rapports précédents</h3>
      <div className="space-y-2">
        {history.map((item) => (
          <div key={item.id} className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 hover:border-slate-200 bg-white transition-colors">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-700 truncate">{item.label ?? item.url}</p>
              <p className="text-xs text-slate-400 truncate">{item.label ? item.url : ""}</p>
              <p className="text-xs text-slate-400">
                {new Date(item.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}
              </p>
            </div>
            {item.score_global !== null && (
              <div className="text-xl font-bold" style={{ color: getScoreColor(item.score_global) }}>
                {item.score_global}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2 : Commit**

```bash
git add src/app/admin/(protected)/seo-report/_components/ReportHistory.tsx
git commit -m "feat(seo-report): historique rapports depuis Supabase"
```

---

## Chunk 5 : Orchestrateur + Page

### Task 14 : SeoReportClient — orchestrateur principal

**Files:**
- Create: `src/app/admin/(protected)/seo-report/SeoReportClient.tsx`

- [ ] **Step 1 : Créer l'orchestrateur**

```tsx
// src/app/admin/(protected)/seo-report/SeoReportClient.tsx
"use client";
import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import UrlInput from "./_components/UrlInput";
import ProgressPipeline from "./_components/ProgressPipeline";
import ReportHistory from "./_components/ReportHistory";
import ScoreGlobal from "./_components/sections/ScoreGlobal";
import PerformanceSection from "./_components/sections/PerformanceSection";
import OnPageSection from "./_components/sections/OnPageSection";
import AuthoritySection from "./_components/sections/AuthoritySection";
import CompetitorsSection from "./_components/sections/CompetitorsSection";
import AiInsightsSection from "./_components/sections/AiInsightsSection";
import { calcScoreGlobal } from "./_lib/score";
import type {
  PipelineState, SeoReportData,
  PagespeedData, OnPageData, AuthorityData, CompetitorsData, AiInsightsData
} from "@/types/seo-report";

// PDF côté client uniquement (react-pdf utilise des APIs canvas non SSR-compatibles)
const PdfDownloadButton = dynamic(() => import("./_pdf/PdfDownloadButton"), { ssr: false });

const INITIAL_PIPELINE: PipelineState = {
  pagespeed:    "pending",
  onpage:       "pending",
  authority:    "pending",
  competitors:  "pending",
  "ai-insights": "pending",
};

async function callStep<T>(url: string, body: unknown): Promise<T | null> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) return null;
    return await res.json() as T;
  } catch {
    return null;
  }
}

export default function SeoReportClient() {
  const [pipeline, setPipeline] = useState<PipelineState>(INITIAL_PIPELINE);
  const [report, setReport] = useState<Partial<SeoReportData> | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [historyKey, setHistoryKey] = useState(0);

  const setStep = (step: keyof PipelineState, status: PipelineState[keyof PipelineState]) =>
    setPipeline((prev) => ({ ...prev, [step]: status }));

  const generate = useCallback(async (url: string, label: string) => {
    setIsGenerating(true);
    setSavedId(null);
    setPipeline(INITIAL_PIPELINE);
    setReport({ url, label: label || undefined, generatedAt: new Date().toISOString(), scoreGlobal: 0 });

    // Étape 1 — PageSpeed
    setStep("pagespeed", "loading");
    const pagespeed = await callStep<PagespeedData>("/api/admin/seo-report/pagespeed", { url });
    setStep("pagespeed", pagespeed ? "done" : "error");
    if (pagespeed) setReport((r) => ({ ...r, pagespeed }));

    // Étape 2 — On-page
    setStep("onpage", "loading");
    const onpage = await callStep<OnPageData>("/api/admin/seo-report/onpage", { url });
    setStep("onpage", onpage ? "done" : "error");
    if (onpage) setReport((r) => ({ ...r, onpage }));

    // Étape 3 — Authority
    setStep("authority", "loading");
    const authority = await callStep<AuthorityData>("/api/admin/seo-report/authority", { url });
    setStep("authority", authority ? "done" : "error");
    if (authority) setReport((r) => ({ ...r, authority }));

    // Calcul score global intermédiaire
    setReport((r) => {
      const scoreGlobal = calcScoreGlobal(
        r?.pagespeed ?? pagespeed ?? undefined,
        r?.onpage ?? onpage ?? undefined,
        r?.authority ?? authority ?? undefined,
      );
      return { ...r, scoreGlobal };
    });

    // Étape 4 — Concurrents
    setStep("competitors", "loading");
    const competitors = await callStep<CompetitorsData>("/api/admin/seo-report/competitors", { url });
    setStep("competitors", competitors ? "done" : "error");
    if (competitors) setReport((r) => ({ ...r, competitors }));

    // Étape 5 — IA (envoyer toutes les données collectées)
    setStep("ai-insights", "loading");
    const aiPayload = { url, pagespeed, onpage, authority, competitors };
    const aiInsights = await callStep<AiInsightsData>("/api/admin/seo-report/ai-insights", aiPayload);
    setStep("ai-insights", aiInsights ? "done" : "error");
    if (aiInsights) setReport((r) => ({ ...r, aiInsights }));

    setIsGenerating(false);
  }, []);

  const saveReport = async () => {
    if (!report) return;
    setIsSaving(true);
    try {
      const res = await fetch("/api/admin/seo-report/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(report),
      });
      const data = await res.json();
      setSavedId(data.id);
      setHistoryKey((k) => k + 1);
    } finally {
      setIsSaving(false);
    }
  };

  const isComplete = Object.values(pipeline).every((s) => s === "done" || s === "error");
  const hasReport = report && (report.pagespeed || report.onpage || report.authority);

  return (
    <div className="space-y-6">
      {/* Input URL */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-base font-semibold text-slate-800 mb-4">Analyser un site</h2>
        <UrlInput onGenerate={generate} loading={isGenerating} />
      </div>

      {/* Pipeline progress */}
      {isGenerating || isComplete ? (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <ProgressPipeline state={pipeline} />
        </div>
      ) : null}

      {/* Rapport */}
      {hasReport && report.scoreGlobal !== undefined && (
        <div className="space-y-4">
          <ScoreGlobal report={report as SeoReportData & { scoreGlobal: number; url: string }} />
          {report.pagespeed  && <PerformanceSection data={report.pagespeed} />}
          {report.onpage     && <OnPageSection data={report.onpage} />}
          {report.authority  && <AuthoritySection data={report.authority} />}
          {report.competitors && <CompetitorsSection data={report.competitors} />}
          {report.aiInsights  && <AiInsightsSection data={report.aiInsights} />}

          {/* Actions */}
          {isComplete && (
            <div className="flex gap-3">
              <PdfDownloadButton report={report as SeoReportData} />
              <button
                onClick={saveReport}
                disabled={isSaving || !!savedId}
                className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition-colors"
              >
                {savedId ? "✓ Sauvegardé" : isSaving ? "Sauvegarde…" : "Sauvegarder"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Historique */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <ReportHistory key={historyKey} />
      </div>
    </div>
  );
}
```

- [ ] **Step 2 : Commit**

```bash
git add src/app/admin/(protected)/seo-report/SeoReportClient.tsx
git commit -m "feat(seo-report): orchestrateur client pipeline"
```

---

### Task 15 : Page + entrée sidebar

**Files:**
- Create: `src/app/admin/(protected)/seo-report/page.tsx`
- Modify: `src/app/admin/_components/AdminSidebar.tsx`

- [ ] **Step 1 : Créer la page**

```tsx
// src/app/admin/(protected)/seo-report/page.tsx
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import SeoReportClient from "./SeoReportClient";

export const metadata = { title: "Rapport SEO — Vanzon Admin" };

export default async function SeoReportPage() {
  const { userId } = await auth();
  if (!userId) redirect("/admin/login");

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Générateur de Rapport SEO</h1>
        <p className="text-sm text-slate-500 mt-1">
          Analyse complète d'un site — performance, on-page, autorité, concurrents et recommandations IA.
        </p>
      </div>
      <SeoReportClient />
    </div>
  );
}
```

- [ ] **Step 2 : Ajouter l'entrée dans la sidebar**

Dans `src/app/admin/_components/AdminSidebar.tsx`, dans le groupe `"SEO / GEO"`, après l'item `"Performance"`, ajouter :

```tsx
{
  label: "Rapport SEO",
  href: "/admin/seo-report",
  icon: (
    <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
},
```

- [ ] **Step 3 : Commit**

```bash
git add src/app/admin/(protected)/seo-report/page.tsx \
        src/app/admin/_components/AdminSidebar.tsx
git commit -m "feat(seo-report): page admin + entrée sidebar"
```

---

## Chunk 6 : PDF

### Task 16 : Template PDF + bouton de téléchargement

**Files:**
- Create: `src/app/admin/(protected)/seo-report/_pdf/SeoReportPDF.tsx`
- Create: `src/app/admin/(protected)/seo-report/_pdf/PdfDownloadButton.tsx`

- [ ] **Step 1 : Créer le template PDF**

```tsx
// src/app/admin/(protected)/seo-report/_pdf/SeoReportPDF.tsx
import {
  Document, Page, Text, View, StyleSheet, Font
} from "@react-pdf/renderer";
import type { SeoReportData } from "@/types/seo-report";

const C = {
  accent:  "#4F46E5",
  success: "#10B981",
  warning: "#F59E0B",
  danger:  "#EF4444",
  text:    "#1E293B",
  muted:   "#64748B",
  bg:      "#F8FAFC",
  white:   "#FFFFFF",
};

function scoreColor(score: number) {
  return score >= 80 ? C.success : score >= 50 ? C.warning : C.danger;
}

const s = StyleSheet.create({
  page:       { padding: 40, fontFamily: "Helvetica", backgroundColor: C.white },
  coverPage:  { padding: 40, fontFamily: "Helvetica", backgroundColor: C.accent, justifyContent: "center", alignItems: "center" },
  // Cover
  coverTitle: { fontSize: 14, color: "rgba(255,255,255,0.7)", marginBottom: 8 },
  coverUrl:   { fontSize: 20, color: C.white, fontFamily: "Helvetica-Bold", marginBottom: 40, textAlign: "center" },
  coverScore: { fontSize: 72, fontFamily: "Helvetica-Bold", textAlign: "center", marginBottom: 4 },
  coverLabel: { fontSize: 16, color: "rgba(255,255,255,0.8)", textAlign: "center", marginBottom: 40 },
  coverDate:  { fontSize: 11, color: "rgba(255,255,255,0.6)" },
  coverFooter:{ position: "absolute", bottom: 30, fontSize: 10, color: "rgba(255,255,255,0.5)" },
  // Section
  sectionTitle: { fontSize: 14, fontFamily: "Helvetica-Bold", color: C.text, marginBottom: 12, borderBottomWidth: 2, borderBottomColor: C.accent, paddingBottom: 6 },
  // Cards
  row:        { flexDirection: "row", gap: 10, marginBottom: 10 },
  card:       { flex: 1, backgroundColor: C.bg, borderRadius: 6, padding: 10 },
  cardValue:  { fontSize: 22, fontFamily: "Helvetica-Bold", color: C.text, marginBottom: 2 },
  cardLabel:  { fontSize: 9, color: C.muted },
  // Tables
  tableRow:   { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#E2E8F0", paddingVertical: 6 },
  tableCell:  { flex: 1, fontSize: 9, color: C.text },
  tableCellBold: { flex: 1, fontSize: 9, fontFamily: "Helvetica-Bold", color: C.text },
  // Badges
  badgeGreen:  { backgroundColor: "#D1FAE5", color: "#065F46", fontSize: 8, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10 },
  badgeOrange: { backgroundColor: "#FEF3C7", color: "#92400E", fontSize: 8, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10 },
  badgeRed:    { backgroundColor: "#FEE2E2", color: "#991B1B", fontSize: 8, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10 },
  badgeIndigo: { backgroundColor: "#E0E7FF", color: "#3730A3", fontSize: 8, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10 },
  // Text
  body:       { fontSize: 10, color: C.text, lineHeight: 1.5, marginBottom: 6 },
  muted:      { fontSize: 9, color: C.muted, marginBottom: 4 },
  // Footer
  footer:     { position: "absolute", bottom: 20, left: 40, right: 40, flexDirection: "row", justifyContent: "space-between" },
  footerText: { fontSize: 8, color: C.muted },
});

function Footer({ url }: { url: string }) {
  return (
    <View style={s.footer} fixed>
      <Text style={s.footerText}>Rapport SEO — {url}</Text>
      <Text style={s.footerText}>Rapport généré par Vanzon Explorer</Text>
    </View>
  );
}

export default function SeoReportPDF({ report }: { report: SeoReportData }) {
  const date = new Date(report.generatedAt).toLocaleDateString("fr-FR", {
    day: "2-digit", month: "long", year: "numeric"
  });
  const sc = scoreColor(report.scoreGlobal);

  return (
    <Document title={`Rapport SEO — ${report.url}`} author="Vanzon Explorer">

      {/* PAGE 1 — Couverture */}
      <Page size="A4" style={s.coverPage}>
        <Text style={s.coverTitle}>Rapport SEO</Text>
        <Text style={s.coverUrl}>{report.url}</Text>
        <Text style={[s.coverScore, { color: sc }]}>{report.scoreGlobal}</Text>
        <Text style={[s.coverLabel, { color: sc }]}>
          {report.scoreGlobal >= 80 ? "Bon" : report.scoreGlobal >= 50 ? "À améliorer" : "Critique"} / 100
        </Text>
        <Text style={s.coverDate}>{date}</Text>
        <Text style={s.coverFooter}>Rapport généré par Vanzon Explorer</Text>
      </Page>

      {/* PAGE 2 — Performance */}
      {report.pagespeed && (
        <Page size="A4" style={s.page}>
          <Text style={s.sectionTitle}>Performance technique</Text>
          <View style={s.row}>
            {(["performance","seo","accessibility","bestPractices"] as const).map((k) => (
              <View key={k} style={s.card}>
                <Text style={[s.cardValue, { color: scoreColor(report.pagespeed!.mobile.scores[k]) }]}>
                  {report.pagespeed!.mobile.scores[k]}
                </Text>
                <Text style={s.cardLabel}>
                  {k === "performance" ? "Performance" : k === "seo" ? "SEO" : k === "accessibility" ? "Accessibilité" : "Bonnes pratiques"} (mobile)
                </Text>
              </View>
            ))}
          </View>
          <Text style={[s.muted, { marginTop: 10, marginBottom: 6 }]}>Core Web Vitals (mobile)</Text>
          <View style={s.row}>
            {(["lcp","cls","tbt","fcp"] as const).map((k) => {
              const vital = report.pagespeed!.mobile.vitals[k];
              return (
                <View key={k} style={s.card}>
                  <Text style={[s.cardValue, { fontSize: 14, color: vital.score === null ? C.muted : scoreColor(Math.round((vital.score ?? 0) * 100)) }]}>
                    {vital.value}
                  </Text>
                  <Text style={s.cardLabel}>{k.toUpperCase()}</Text>
                </View>
              );
            })}
          </View>
          {report.pagespeed.mobile.opportunities.length > 0 && (
            <>
              <Text style={[s.muted, { marginTop: 10, marginBottom: 6 }]}>Opportunités d'amélioration</Text>
              {report.pagespeed.mobile.opportunities.map((opp) => (
                <View key={opp.id} style={[s.tableRow, { alignItems: "center" }]}>
                  <Text style={[s.tableCell, { flex: 3 }]}>{opp.title}</Text>
                  <Text style={[s.tableCell, { color: C.warning, textAlign: "right" }]}>−{Math.round(opp.savingsMs)}ms</Text>
                </View>
              ))}
            </>
          )}
          <Footer url={report.url} />
        </Page>
      )}

      {/* PAGE 3 — On-page */}
      {report.onpage && (
        <Page size="A4" style={s.page}>
          <Text style={s.sectionTitle}>Audit on-page — Score : {report.onpage.score}/100</Text>
          {report.onpage.items.map((item) => (
            <View key={item.key} style={[s.tableRow, { alignItems: "center" }]}>
              <Text style={[s.tableCell, { flex: 0.3, color: item.pass ? C.success : C.danger }]}>
                {item.pass ? "✓" : "✗"}
              </Text>
              <Text style={[s.tableCell, { flex: 3 }]}>{item.label}</Text>
              <Text style={[s.tableCell, { flex: 2, color: C.muted }]}>{item.detail ?? item.value ?? ""}</Text>
            </View>
          ))}
          {report.onpage.totalImages > 0 && (
            <Text style={[s.body, { marginTop: 12, color: report.onpage.imagesWithoutAlt === 0 ? C.success : C.warning }]}>
              {report.onpage.imagesWithoutAlt === 0
                ? `✓ Toutes les ${report.onpage.totalImages} images ont un attribut alt`
                : `⚠ ${report.onpage.imagesWithoutAlt} image(s) sans alt sur ${report.onpage.totalImages}`}
            </Text>
          )}
          <Footer url={report.url} />
        </Page>
      )}

      {/* PAGE 4 — Autorité + Concurrents */}
      {(report.authority || report.competitors) && (
        <Page size="A4" style={s.page}>
          {report.authority && (
            <>
              <Text style={s.sectionTitle}>Autorité du domaine</Text>
              <View style={s.row}>
                <View style={s.card}>
                  <Text style={[s.cardValue, { color: scoreColor(report.authority.domainAuthority) }]}>
                    {report.authority.domainAuthority}
                  </Text>
                  <Text style={s.cardLabel}>Domain Authority / 100</Text>
                </View>
                <View style={s.card}>
                  <Text style={s.cardValue}>{report.authority.organicTraffic.toLocaleString("fr-FR")}</Text>
                  <Text style={s.cardLabel}>Trafic organique estimé/mois</Text>
                </View>
              </View>
            </>
          )}
          {report.competitors && report.competitors.competitors.length > 0 && (
            <>
              <Text style={[s.sectionTitle, { marginTop: 16 }]}>Concurrents organiques</Text>
              {report.competitors.competitors.map((c, i) => (
                <View key={c.domain} style={[s.tableRow, { alignItems: "center" }]}>
                  <Text style={[s.tableCell, { flex: 0.3, color: C.accent }]}>{i + 1}</Text>
                  <Text style={[s.tableCellBold, { flex: 3 }]}>{c.domain}</Text>
                  <Text style={[s.tableCell, { color: C.muted }]}>{c.intersections} mots-clés communs</Text>
                  <Text style={[s.tableCell, { color: C.accent, textAlign: "right" }]}>Pertinence {c.relevance}%</Text>
                </View>
              ))}
            </>
          )}
          <Footer url={report.url} />
        </Page>
      )}

      {/* PAGE 5 — Recommandations IA */}
      {report.aiInsights && (
        <Page size="A4" style={s.page}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <Text style={[s.sectionTitle, { marginBottom: 0, borderBottomWidth: 0 }]}>Recommandations IA</Text>
            <View style={s.badgeIndigo}>
              <Text>Secteur : {report.aiInsights.secteur}</Text>
            </View>
          </View>
          {report.aiInsights.axes.map((axe, i) => {
            const badge = axe.priorite === "Fort" ? s.badgeRed : axe.priorite === "Moyen" ? s.badgeOrange : s.badgeIndigo;
            return (
              <View key={i} style={{ backgroundColor: C.bg, borderRadius: 6, padding: 10, marginBottom: 8 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <View style={badge}><Text>{axe.priorite}</Text></View>
                  <Text style={{ fontSize: 10, fontFamily: "Helvetica-Bold", color: C.text }}>{axe.titre}</Text>
                </View>
                <Text style={[s.body, { marginBottom: 2 }]}>{axe.description}</Text>
                <Text style={[s.muted, { color: C.accent }]}>{axe.impact}</Text>
              </View>
            );
          })}
          <View style={{ backgroundColor: "#EEF2FF", borderRadius: 6, padding: 12, marginTop: 8 }}>
            <Text style={{ fontSize: 8, fontFamily: "Helvetica-Bold", color: C.accent, marginBottom: 6, textTransform: "uppercase" }}>
              Conclusion
            </Text>
            <Text style={s.body}>{report.aiInsights.conclusion}</Text>
          </View>
          <Footer url={report.url} />
        </Page>
      )}
    </Document>
  );
}
```

- [ ] **Step 2 : Créer PdfDownloadButton**

```tsx
// src/app/admin/(protected)/seo-report/_pdf/PdfDownloadButton.tsx
"use client";
import { PDFDownloadLink } from "@react-pdf/renderer";
import SeoReportPDF from "./SeoReportPDF";
import type { SeoReportData } from "@/types/seo-report";

interface Props { report: SeoReportData }

export default function PdfDownloadButton({ report }: Props) {
  const filename = `rapport-seo-${new URL(report.url).hostname}-${new Date().toISOString().slice(0, 10)}.pdf`;

  return (
    <PDFDownloadLink
      document={<SeoReportPDF report={report} />}
      fileName={filename}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
    >
      {({ loading }) => loading ? "Préparation PDF…" : "Télécharger PDF"}
    </PDFDownloadLink>
  );
}
```

- [ ] **Step 3 : Commit**

```bash
git add src/app/admin/(protected)/seo-report/_pdf/
git commit -m "feat(seo-report): template PDF react-pdf + bouton téléchargement"
```

---

## Chunk 7 : Build + test final

### Task 17 : Vérification build et test complet

- [ ] **Step 1 : Lancer le build**

```bash
npm run build
```

Expected : aucune erreur TypeScript, aucune erreur ESLint. Si des erreurs apparaissent, les corriger avant de continuer.

- [ ] **Step 2 : Démarrer le dev server et tester**

```bash
npm run dev
```

Ouvrir `http://localhost:3000/admin/seo-report` et vérifier :
- La page se charge sans erreur
- L'entrée "Rapport SEO" apparaît dans la sidebar groupe "SEO / GEO"
- L'historique (vide) s'affiche

- [ ] **Step 3 : Test end-to-end avec l'URL cible**

Dans l'input, saisir `https://www.diemconseiletpatrimoine.com/` et cliquer "Générer le rapport".

Vérifier que :
1. La progress bar avance étape par étape
2. Chaque section apparaît au fur et à mesure
3. Le score global s'affiche
4. Le bouton "Télécharger PDF" est visible
5. Le PDF se télécharge et s'ouvre correctement

- [ ] **Step 4 : Sauvegarder et vérifier l'historique**

Cliquer "Sauvegarder" et vérifier que le rapport apparaît dans l'historique.

- [ ] **Step 5 : Commit final + push**

```bash
git add -A
git commit -m "feat(seo-report): module Générateur de Rapport SEO complet"
git push
```

Vercel déploie automatiquement sur push main.
