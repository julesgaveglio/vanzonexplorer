# AI Cost Tracking — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Track and display in euros the cost of every paid API call (Anthropic, DataForSEO, Tavily, SerpAPI) made by Vanzon's agents, visible in `/admin/costs`.

**Architecture:** Add 4 cost columns to `agent_runs` in Supabase. A new `CostTracker` utility accumulates costs per-run and writes them via the existing `finishRun()` call. A Next.js API route aggregates the data; a new `/admin/costs` page displays KPIs, a stacked bar chart, and a runs table.

**Tech Stack:** Supabase Postgres, TypeScript, Next.js 14 App Router, Recharts (already in project), Anthropic SDK (response.usage), DataForSEO (`json.cost` field), Tavily flat rate, SerpAPI flat rate.

---

## Chunk 1: DB + Shared Library

### Task 1: SQL Migration

**Files:**
- Create: `supabase/migrations/20260330_agent_runs_cost.sql`

- [ ] **Step 1: Create the migration file**

```sql
-- supabase/migrations/20260330_agent_runs_cost.sql
ALTER TABLE agent_runs
  ADD COLUMN IF NOT EXISTS cost_eur       NUMERIC(10,6) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tokens_input   INTEGER       DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tokens_output  INTEGER       DEFAULT 0,
  ADD COLUMN IF NOT EXISTS api_costs_json JSONB         DEFAULT '{}';
```

- [ ] **Step 2: Run the migration in Supabase**

Go to your Supabase project → SQL Editor → paste and run the SQL above.
Expected: "Success. No rows returned."

- [ ] **Step 3: Verify**

In Supabase Table Editor, open `agent_runs`. Confirm the 4 new columns appear with defaults.

---

### Task 2: CostTracker utility

**Files:**
- Create: `scripts/lib/ai-costs.ts`

- [ ] **Step 1: Create the file**

```typescript
/**
 * scripts/lib/ai-costs.ts
 *
 * Shared pricing rates and CostTracker for all agents.
 * Call createCostTracker() at the top of main(), accumulate costs,
 * then spread toRunResult() into finishRun().
 *
 * USD → EUR conversion fixed at 0.92 (update quarterly if needed).
 */

const USD_TO_EUR = 0.92;

const RATES = {
  // Claude Sonnet 4.5
  sonnet_input:  (3.00  / 1_000_000) * USD_TO_EUR,
  sonnet_output: (15.00 / 1_000_000) * USD_TO_EUR,
  // Claude Haiku 4.5
  haiku_input:   (0.80  / 1_000_000) * USD_TO_EUR,
  haiku_output:  (4.00  / 1_000_000) * USD_TO_EUR,
  // Tavily
  tavily_search: 0.004 * USD_TO_EUR,
  // SerpAPI
  serpapi_call:  0.010 * USD_TO_EUR,
  // DataForSEO: cost returned directly by their API in USD
};

export interface ApiCostsJson {
  anthropic?: { input_tokens: number; output_tokens: number; cost_eur: number };
  dataforseo?: { calls: number; cost_eur: number };
  tavily?:     { searches: number; cost_eur: number };
  serpapi?:    { calls: number; cost_eur: number };
}

export interface CostRunResult {
  costEur:      number;
  tokensInput:  number;
  tokensOutput: number;
  apiCosts:     ApiCostsJson;
}

export class CostTracker {
  private anthropicInputTokens  = 0;
  private anthropicOutputTokens = 0;
  private anthropicCostEur      = 0;
  private dataForSeoCalls       = 0;
  private dataForSeoCostEur     = 0;
  private tavilySearches        = 0;
  private tavilyCostEur         = 0;
  private serpApiCalls          = 0;
  private serpApiCostEur        = 0;

  addAnthropic(model: "sonnet" | "haiku", inputTokens: number, outputTokens: number): void {
    this.anthropicInputTokens  += inputTokens;
    this.anthropicOutputTokens += outputTokens;
    this.anthropicCostEur +=
      model === "sonnet"
        ? inputTokens  * RATES.sonnet_input  + outputTokens * RATES.sonnet_output
        : inputTokens  * RATES.haiku_input   + outputTokens * RATES.haiku_output;
  }

  /** usdCost comes from DataForSEO response top-level `cost` field (already USD). */
  addDataForSeo(usdCost: number): void {
    this.dataForSeoCalls++;
    this.dataForSeoCostEur += usdCost * USD_TO_EUR;
  }

  addTavily(searches: number): void {
    this.tavilySearches += searches;
    this.tavilyCostEur  += searches * RATES.tavily_search;
  }

  addSerpApi(calls: number): void {
    this.serpApiCalls   += calls;
    this.serpApiCostEur += calls * RATES.serpapi_call;
  }

  toRunResult(): CostRunResult {
    const apiCosts: ApiCostsJson = {};
    if (this.anthropicInputTokens > 0 || this.anthropicOutputTokens > 0) {
      apiCosts.anthropic = {
        input_tokens:  this.anthropicInputTokens,
        output_tokens: this.anthropicOutputTokens,
        cost_eur:      this.anthropicCostEur,
      };
    }
    if (this.dataForSeoCalls > 0) {
      apiCosts.dataforseo = { calls: this.dataForSeoCalls, cost_eur: this.dataForSeoCostEur };
    }
    if (this.tavilySearches > 0) {
      apiCosts.tavily = { searches: this.tavilySearches, cost_eur: this.tavilyCostEur };
    }
    if (this.serpApiCalls > 0) {
      apiCosts.serpapi = { calls: this.serpApiCalls, cost_eur: this.serpApiCostEur };
    }
    return {
      costEur:      this.anthropicCostEur + this.dataForSeoCostEur + this.tavilyCostEur + this.serpApiCostEur,
      tokensInput:  this.anthropicInputTokens,
      tokensOutput: this.anthropicOutputTokens,
      apiCosts,
    };
  }
}

export function createCostTracker(): CostTracker {
  return new CostTracker();
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: no errors for the new file.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260330_agent_runs_cost.sql scripts/lib/ai-costs.ts
git commit -m "feat(costs): add SQL migration and CostTracker utility"
```

---

### Task 3: Update agent-runs.ts

**Files:**
- Modify: `scripts/lib/agent-runs.ts`

The file is at `/Users/julesgaveglio/vanzon-website-claude-code/scripts/lib/agent-runs.ts`.
Current `RunResult` interface (lines 17–23) and `finishRun` (lines 46–61) need updating.

- [ ] **Step 1: Extend RunResult interface**

Add 4 optional fields after `metadata?`:

```typescript
export interface RunResult {
  status: "success" | "error";
  itemsProcessed?: number;
  itemsCreated?: number;
  error?: string;
  metadata?: Record<string, unknown>;
  // Cost tracking (optional — zero when not provided)
  costEur?:      number;
  tokensInput?:  number;
  tokensOutput?: number;
  apiCosts?:     Record<string, { calls?: number; input_tokens?: number; output_tokens?: number; cost_eur: number }>;
}
```

- [ ] **Step 2: Update finishRun to persist cost fields**

In `finishRun`, extend the `.update({...})` object with:

```typescript
await sb.from("agent_runs").update({
  finished_at:     new Date().toISOString(),
  status:          result.status,
  items_processed: result.itemsProcessed ?? 0,
  items_created:   result.itemsCreated ?? 0,
  error_message:   result.error ?? null,
  ...(result.metadata  !== undefined ? { metadata:        result.metadata }  : {}),
  // New cost fields:
  ...(result.costEur      !== undefined ? { cost_eur:        result.costEur }      : {}),
  ...(result.tokensInput  !== undefined ? { tokens_input:    result.tokensInput }  : {}),
  ...(result.tokensOutput !== undefined ? { tokens_output:   result.tokensOutput } : {}),
  ...(result.apiCosts     !== undefined ? { api_costs_json:  result.apiCosts }     : {}),
}).eq("id", runId);
```

- [ ] **Step 3: Verify TypeScript**

```bash
npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add scripts/lib/agent-runs.ts
git commit -m "feat(costs): extend RunResult and finishRun with cost fields"
```

---

## Chunk 2: Agent Instrumentation

### Task 4: Instrument blog-writer-agent.ts

**Files:**
- Modify: `scripts/agents/blog-writer-agent.ts`

This is the most complex agent: Anthropic Sonnet ×2, DataForSEO ×2 calls, Tavily ×1, SerpAPI ×2 (inline images + cover).

**Key locations in the file:**
- `callClaude` function: lines ~552–570 — returns `string`, must return `{ text, usage }`
- `dfsPost` function: lines ~118–138 — returns `T`, must return `{ result: T; cost: number }`
- `fetchExternalSources` (Tavily): lines ~172–194 — 1 search call
- SerpAPI inline images: lines ~946–975
- SerpAPI cover image: lines ~1059–1090
- `finishRun` call: line ~1308

- [ ] **Step 1: Update `callClaude` return type**

Find the function starting at line ~552:
```typescript
// BEFORE
async function callClaude(prompt: string, opts: { maxTokens?: number } = {}): Promise<string> {
  const client = new Anthropic({ apiKey });
  const response = await client.messages.create({ ... });
  const text = response.content.filter(...).map(...).join("");
  if (!text) throw new Error("Claude returned empty response");
  return text;
}
```

Replace with:
```typescript
// AFTER
async function callClaude(
  prompt: string,
  opts: { maxTokens?: number } = {}
): Promise<{ text: string; usage: { input_tokens: number; output_tokens: number } }> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is required");
  const client = new Anthropic({ apiKey });
  const response = await client.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: opts.maxTokens ?? 8000,
    messages: [{ role: "user", content: prompt }],
  });
  const text = response.content
    .filter((b) => b.type === "text")
    .map((b) => (b as { type: "text"; text: string }).text)
    .join("");
  if (!text) throw new Error("Claude returned empty response");
  return { text, usage: response.usage };
}
```

- [ ] **Step 2: Update `dfsPost` to return cost**

Find `dfsPost` at line ~118. Replace the return type and return statement:
```typescript
// BEFORE
async function dfsPost<T = unknown>(endpoint: string, body: unknown): Promise<T> {
  ...
  return json.tasks?.[0]?.result?.[0] as T;
}

// AFTER
async function dfsPost<T = unknown>(endpoint: string, body: unknown): Promise<{ result: T; cost: number }> {
  const res = await fetch(`${DFS_BASE}${endpoint}`, {
    method: "POST",
    headers: {
      Authorization: getDfsAuthHeader(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`DataForSEO HTTP error ${res.status}: ${await res.text()}`);
  }
  const json = await res.json();
  if (json.status_code !== 20000) {
    throw new Error(`DataForSEO API error ${json.status_code}: ${json.status_message}`);
  }
  return { result: json.tasks?.[0]?.result?.[0] as T, cost: json.cost ?? 0 };
}
```

- [ ] **Step 3: Update wrapper functions to propagate dfsPost cost**

The 2 `dfsPost` call sites are inside `getKeywordData()` (line ~469) and `analyzeSERP()` (line ~500). These are standalone functions — `costs` from `main()` is not in scope. Fix: bubble the cost up through return values.

**`getKeywordData` — change return type to `{ data: KeywordData; dfsCost: number }`:**

```typescript
// BEFORE
async function getKeywordData(keyword: string): Promise<KeywordData> {
  try {
    const result = await dfsPost<KeywordData>(...);
    const data = (result as unknown as { items?: KeywordData[] })?.items?.[0] ?? {};
    ...
    return data;
  } catch (err) {
    ...
    return {};
  }
}

// AFTER
async function getKeywordData(keyword: string): Promise<{ data: KeywordData; dfsCost: number }> {
  try {
    const { result, cost: dfsCost } = await dfsPost<KeywordData>(...);
    const data = (result as unknown as { items?: KeywordData[] })?.items?.[0] ?? {};
    ...
    return { data, dfsCost };
  } catch (err) {
    ...
    return { data: {}, dfsCost: 0 };
  }
}
```

**`analyzeSERP` — change return type to `{ analysis: SerpAnalysis; dfsCost: number }`:**

```typescript
// BEFORE
async function analyzeSERP(keyword: string): Promise<SerpAnalysis> {
  try {
    const result = await dfsPost<unknown>(...);
    const items = (result as { items?: SerpItem[] })?.items ?? [];
    ...
    return { paaQuestions, topResults };
  } catch (err) {
    return { paaQuestions: [], topResults: [] };
  }
}

// AFTER
async function analyzeSERP(keyword: string): Promise<{ analysis: SerpAnalysis; dfsCost: number }> {
  try {
    const { result, cost: dfsCost } = await dfsPost<unknown>(...);
    const items = (result as { items?: SerpItem[] })?.items ?? [];
    ...
    return { analysis: { paaQuestions, topResults }, dfsCost };
  } catch (err) {
    return { analysis: { paaQuestions: [], topResults: [] }, dfsCost: 0 };
  }
}
```

**Update the 2 call sites in `main()` (lines ~1247 and ~1251):**

```typescript
// BEFORE
const keywordData = await getKeywordData(article.targetKeyword);
...
const serpAnalysis = await analyzeSERP(article.targetKeyword);

// AFTER
const { data: keywordData, dfsCost: kwCost } = await getKeywordData(article.targetKeyword);
costs.addDataForSeo(kwCost);
...
const { analysis: serpAnalysis, dfsCost: serpCost } = await analyzeSERP(article.targetKeyword);
costs.addDataForSeo(serpCost);
```

Any subsequent code that uses `keywordData` or `serpAnalysis` by name stays unchanged (only the destructuring at the call site changes).

- [ ] **Step 4: Update the 2 callClaude call sites to destructure `{ text }`**

Line ~794 (metadata call):
```typescript
// BEFORE
const metaText = await callClaude(metaPrompt, { maxTokens: 512 });

// AFTER
const { text: metaText, usage: metaUsage } = await callClaude(metaPrompt, { maxTokens: 512 });
costs.addAnthropic("sonnet", metaUsage.input_tokens, metaUsage.output_tokens);
```

Line ~895 (body call):
```typescript
// BEFORE
const rawBody = await callClaude(bodyPrompt, { maxTokens: maxTokensForBody });

// AFTER
const { text: rawBody, usage: bodyUsage } = await callClaude(bodyPrompt, { maxTokens: maxTokensForBody });
costs.addAnthropic("sonnet", bodyUsage.input_tokens, bodyUsage.output_tokens);
```

- [ ] **Step 5: Track Tavily in `fetchExternalSources`**

`fetchExternalSources` is a standalone function — it cannot access `costs` directly. The simplest approach: make the function return `{ sources, callCount }` and let the caller track it. However, given the function is only called once from `main()`, it is simpler to track at the call site:

At the call site (line ~1254):
```typescript
// BEFORE
const externalSources = await fetchExternalSources(article.targetKeyword);

// AFTER
const externalSources = await fetchExternalSources(article.targetKeyword);
if (externalSources.length > 0) costs.addTavily(1);
```

- [ ] **Step 6: Track SerpAPI calls**

SerpAPI is called in two places: inline images (~line 955) and cover image (~line 1065).
At each call site, add `costs.addSerpApi(1)` immediately after the `fetch(...)` succeeds (inside the try block, after the response is parsed):

```typescript
// After serpapi fetch resolves successfully:
costs.addSerpApi(1);
```

Do this for both call sites.

- [ ] **Step 7: Initialize CostTracker and wire finishRun**

At the top of `main()` (after `const article = await claimPendingArticle()`), add:
```typescript
import { createCostTracker } from "../lib/ai-costs";
// (add to imports at top of file)

// Inside main():
const costs = createCostTracker();
```

At the `finishRun` success call (~line 1308):
```typescript
// BEFORE
await finishRun(runId, { status: "success", itemsProcessed: 1, metadata: { slug: article.slug, sanityId } });

// AFTER
await finishRun(runId, {
  status: "success",
  itemsProcessed: 1,
  metadata: { slug: article.slug, sanityId },
  ...costs.toRunResult(),
});
```

At the error `finishRun` (~line 1333), no cost tracking needed (run failed partway).

- [ ] **Step 8: Verify TypeScript**

```bash
npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 9: Commit**

```bash
git add scripts/agents/blog-writer-agent.ts
git commit -m "feat(costs): instrument blog-writer-agent with cost tracking"
```

---

### Task 5: Instrument queue-builder-monthly.ts

**Files:**
- Modify: `scripts/agents/queue-builder-monthly.ts`

**Key locations:**
- `callClaude`: line ~74 — local copy, returns `string`
- Only 1 call site: line ~125
- `finishRun`: line ~265

- [ ] **Step 1: Update `callClaude` return type** (same pattern as Task 4 Step 1, model is `claude-haiku-4-5-20251001`)

```typescript
async function callClaude(prompt: string): Promise<{ text: string; usage: { input_tokens: number; output_tokens: number } }> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  });
  const text = message.content
    .filter((b) => b.type === "text")
    .map((b) => (b as { type: "text"; text: string }).text)
    .join("");
  return { text, usage: message.usage };
}
```

- [ ] **Step 2: Update call site at line ~125**

```typescript
// BEFORE
const raw = await callClaude(prompt);

// AFTER
const { text: raw, usage: claudeUsage } = await callClaude(prompt);
costs.addAnthropic("haiku", claudeUsage.input_tokens, claudeUsage.output_tokens);
```

- [ ] **Step 3: Initialize CostTracker and wire finishRun**

Add import at top:
```typescript
import { createCostTracker } from "../lib/ai-costs";
```

In `main()`, before the Claude call:
```typescript
const costs = createCostTracker();
```

At `finishRun` (~line 265):
```typescript
await finishRun(runId, {
  status: "success",
  itemsCreated,
  itemsProcessed: newArticles.length,
  ...costs.toRunResult(),
});
```

Also update the error `finishRun` if present.

- [ ] **Step 4: Verify + Commit**

```bash
npx tsc --noEmit
git add scripts/agents/queue-builder-monthly.ts
git commit -m "feat(costs): instrument queue-builder-monthly with cost tracking"
```

---

### Task 6: Instrument keyword-researcher.ts

**Files:**
- Modify: `scripts/agents/keyword-researcher.ts`

**Key locations:**
- `callClaude`: line ~95 — local copy, model is `claude-haiku-4-5-20251001`
- `dfsPost`: line ~72 — local copy, same as blog-writer
- 1 Claude call site: line ~137
- 1 DataForSEO call site: line ~167
- `finishRun`: line ~400

- [ ] **Step 1: Update `callClaude`** (same pattern as Task 5 Step 1, Haiku model)

- [ ] **Step 2: Update `dfsPost`** (same pattern as Task 4 Step 2)

```typescript
async function dfsPost<T = unknown>(endpoint: string, body: unknown): Promise<{ result: T; cost: number }> {
  // ... same implementation as blog-writer Task 4 Step 2
}
```

- [ ] **Step 3: Update call sites**

**Claude call site (~line 137)** — inside `generateArticleMeta()`, a standalone function. Since it's called once from `main()` and has its own return value, update `generateArticleMeta` to return cost alongside its result:

```typescript
// BEFORE
async function generateArticleMeta(...): Promise<ArticleMetaResult> {
  ...
  const raw = await callClaude(prompt, { maxTokens: 1024 });
  ...
  return result;
}

// AFTER
async function generateArticleMeta(...): Promise<{ meta: ArticleMetaResult; claudeCost: number; tokensIn: number; tokensOut: number }> {
  ...
  const { text: raw, usage } = await callClaude(prompt, { maxTokens: 1024 });
  ...
  return { meta: result, claudeCost: 0, tokensIn: usage.input_tokens, tokensOut: usage.output_tokens };
  // claudeCost is 0 here — caller computes it via costs.addAnthropic()
}
```

Then in the caller in `main()`:
```typescript
const { meta: articleMeta, tokensIn, tokensOut } = await generateArticleMeta(...);
costs.addAnthropic("haiku", tokensIn, tokensOut);
```

**DataForSEO call site (~line 167)** — inside `processCategory()`. Same pattern: `processCategory` returns `{ rows: SummaryRow[], dfsCost: number }`:

```typescript
// BEFORE
async function processCategory(category: string): Promise<SummaryRow[]> {
  try {
    const result = await dfsPost<DfsKeywordIdeasResult>(...);
    items = result?.items ?? [];
    ...
    return rows;
  } catch (err) { return []; }
}

// AFTER
async function processCategory(category: string): Promise<{ rows: SummaryRow[]; dfsCost: number }> {
  try {
    const { result, cost: dfsCost } = await dfsPost<DfsKeywordIdeasResult>(...);
    items = result?.items ?? [];
    ...
    return { rows, dfsCost };
  } catch (err) { return { rows: [], dfsCost: 0 }; }
}
```

In `main()` where `processCategory` is called in a loop (~line 370+):
```typescript
const { rows, dfsCost } = await processCategory(category);
costs.addDataForSeo(dfsCost);
// use rows as before
```

- [ ] **Step 4: Initialize CostTracker and wire finishRun**

Add import, `const costs = createCostTracker()` before the loop in `main()`, spread into `finishRun` at line ~400.

- [ ] **Step 5: Verify + Commit**

```bash
npx tsc --noEmit
git add scripts/agents/keyword-researcher.ts
git commit -m "feat(costs): instrument keyword-researcher with cost tracking"
```

---

### Task 7: Instrument article-optimizer-quarterly.ts

**Files:**
- Modify: `scripts/agents/article-optimizer-quarterly.ts`

**Key locations:**
- `callClaude`: line ~159 — local copy, model `claude-haiku-4-5-20251001`
- 1 call site: line ~216
- `finishRun`: line ~328

- [ ] **Step 1: Update `callClaude`** (Haiku, same pattern)

- [ ] **Step 2: Update call site**

```typescript
const { text: raw, usage: claudeUsage } = await callClaude(prompt);
costs.addAnthropic("haiku", claudeUsage.input_tokens, claudeUsage.output_tokens);
```

- [ ] **Step 3: Initialize CostTracker and wire finishRun**

Note: this agent calls `callClaude` inside a loop (one call per article). Initialize `costs` before the loop; each iteration accumulates.

- [ ] **Step 4: Verify + Commit**

```bash
npx tsc --noEmit
git add scripts/agents/article-optimizer-quarterly.ts
git commit -m "feat(costs): instrument article-optimizer with cost tracking"
```

---

## Chunk 3: Admin UI

### Task 8: API Route `/api/admin/costs`

**Files:**
- Create: `src/app/api/admin/costs/route.ts`

- [ ] **Step 1: Create the route**

```typescript
// src/app/api/admin/costs/route.ts
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function formatMonth(d: Date) {
  return d.toISOString().slice(0, 7); // "2026-03"
}

/** Returns ISO 8601 week string, e.g. "2026-W13". Correct near year boundaries. */
function formatWeek(d: Date): string {
  const dt = new Date(d);
  dt.setHours(0, 0, 0, 0);
  // Move to Thursday of current week (ISO weeks start Monday, Thursday determines year)
  dt.setDate(dt.getDate() + 3 - ((dt.getDay() + 6) % 7));
  const year = dt.getFullYear();
  const week1 = new Date(year, 0, 4); // Jan 4 is always in week 1
  const week = 1 + Math.round(
    ((dt.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7
  );
  return `${year}-W${String(week).padStart(2, "0")}`;
}

export async function GET() {
  // Auth guard — /api/admin/* is not covered by the page-level Clerk middleware
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const sb = createSupabaseAdmin();
    const now = new Date();

    // Week boundaries (Monday–Sunday)
    const dayOfWeek = (now.getDay() + 6) % 7; // 0=Mon
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - dayOfWeek);
    weekStart.setHours(0, 0, 0, 0);

    // Month boundaries
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Fetch runs for chart (last 12 months) + all-time aggregate in parallel
    const twelveMonthsAgo = new Date(now);
    twelveMonthsAgo.setMonth(now.getMonth() - 12);

    const [{ data: runs, error }, { data: allTimeRow }] = await Promise.all([
      sb
        .from("agent_runs")
        .select("id, agent_name, started_at, finished_at, cost_eur, tokens_input, tokens_output, api_costs_json")
        .gte("started_at", twelveMonthsAgo.toISOString())
        .order("started_at", { ascending: false })
        .limit(500),
      // Separate aggregate for true all-time total
      sb.from("agent_runs").select("cost_eur").gt("cost_eur", 0),
    ]);

    if (error) throw error;

    const allRuns = (runs ?? []) as {
      id: string;
      agent_name: string;
      started_at: string;
      finished_at: string | null;
      cost_eur: number;
      tokens_input: number;
      tokens_output: number;
      api_costs_json: Record<string, unknown> | null;
    }[];

    // KPIs
    const allTime = (allTimeRow ?? []).reduce((s: number, r: { cost_eur: number }) => s + (r.cost_eur ?? 0), 0);
    const thisMonth = allRuns
      .filter((r) => new Date(r.started_at) >= monthStart)
      .reduce((s, r) => s + (r.cost_eur ?? 0), 0);
    const thisWeek = allRuns
      .filter((r) => new Date(r.started_at) >= weekStart)
      .reduce((s, r) => s + (r.cost_eur ?? 0), 0);
    const blogRuns = allRuns.filter((r) => r.agent_name === "blog-writer" && (r.cost_eur ?? 0) > 0);
    const avgPerBlogArticle = blogRuns.length > 0
      ? blogRuns.reduce((s, r) => s + (r.cost_eur ?? 0), 0) / blogRuns.length
      : 0;

    // Time series: group by week and agent
    const weekMap = new Map<string, number>();
    for (const r of allRuns) {
      if ((r.cost_eur ?? 0) <= 0) continue;
      const key = `${formatWeek(new Date(r.started_at))}||${r.agent_name}`;
      weekMap.set(key, (weekMap.get(key) ?? 0) + (r.cost_eur ?? 0));
    }
    const monthMap = new Map<string, number>();
    for (const r of allRuns) {
      if ((r.cost_eur ?? 0) <= 0) continue;
      const key = `${formatMonth(new Date(r.started_at))}||${r.agent_name}`;
      monthMap.set(key, (monthMap.get(key) ?? 0) + (r.cost_eur ?? 0));
    }

    const timeSeriesWeekly = [...weekMap.entries()].map(([k, v]) => {
      const [period, agentName] = k.split("||");
      return { period, agentName, totalEur: Math.round(v * 100000) / 100000 };
    }).sort((a, b) => a.period.localeCompare(b.period));

    const timeSeriesMonthly = [...monthMap.entries()].map(([k, v]) => {
      const [period, agentName] = k.split("||");
      return { period, agentName, totalEur: Math.round(v * 100000) / 100000 };
    }).sort((a, b) => a.period.localeCompare(b.period));

    // Recent runs table (last 100 with cost)
    const recentRuns = allRuns
      .filter((r) => (r.cost_eur ?? 0) > 0)
      .slice(0, 100)
      .map((r) => ({
        id: r.id,
        agentName: r.agent_name,
        startedAt: r.started_at,
        durationSec: r.finished_at
          ? Math.round((new Date(r.finished_at).getTime() - new Date(r.started_at).getTime()) / 1000)
          : null,
        costEur: r.cost_eur ?? 0,
        apiCosts: r.api_costs_json ?? {},
      }));

    return NextResponse.json({
      kpis: {
        allTime:           Math.round(allTime * 100000) / 100000,
        thisMonth:         Math.round(thisMonth * 100000) / 100000,
        thisWeek:          Math.round(thisWeek * 100000) / 100000,
        avgPerBlogArticle: Math.round(avgPerBlogArticle * 100000) / 100000,
      },
      timeSeriesWeekly,
      timeSeriesMonthly,
      recentRuns,
    });
  } catch (err) {
    console.error("[/api/admin/costs]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
```

- [ ] **Step 2: Test the route locally**

```bash
npm run dev
# In another terminal:
curl http://localhost:3000/api/admin/costs | python3 -m json.tool | head -40
```
Expected: JSON with `kpis`, `timeSeriesWeekly`, `timeSeriesMonthly`, `recentRuns`.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/admin/costs/route.ts
git commit -m "feat(costs): add /api/admin/costs API route"
```

---

### Task 9: Admin UI Components

**Files:**
- Create: `src/app/admin/(protected)/costs/_components/CostKpiBar.tsx`
- Create: `src/app/admin/(protected)/costs/_components/CostChart.tsx`
- Create: `src/app/admin/(protected)/costs/_components/CostRunsTable.tsx`
- Create: `src/app/admin/(protected)/costs/page.tsx`

- [ ] **Step 1: Create `CostKpiBar.tsx`**

```tsx
// src/app/admin/(protected)/costs/_components/CostKpiBar.tsx
interface KpiBarProps {
  allTime: number;
  thisMonth: number;
  thisWeek: number;
  avgPerBlogArticle: number;
}

function fmt(n: number) {
  return n === 0 ? "0,000 €" : `${n.toFixed(4).replace(".", ",")} €`;
}

function KpiCard({ label, value, sub, accent }: { label: string; value: string; sub: string; accent: string }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-5 py-4 flex items-start gap-4">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${accent}15` }}>
        <svg className="w-5 h-5" style={{ color: accent }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-0.5">{label}</p>
        <p className="text-2xl font-black text-slate-900">{value}</p>
        <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
      </div>
    </div>
  );
}

export default function CostKpiBar({ allTime, thisMonth, thisWeek, avgPerBlogArticle }: KpiBarProps) {
  const now = new Date();
  const monthName = now.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <KpiCard label="Total all time"        value={fmt(allTime)}           sub="depuis le début"      accent="#6366F1" />
      <KpiCard label={`Ce mois`}             value={fmt(thisMonth)}         sub={monthName}            accent="#22C55E" />
      <KpiCard label="Cette semaine"         value={fmt(thisWeek)}          sub="lundi → dimanche"     accent="#3B82F6" />
      <KpiCard label="Moy. par article blog" value={fmt(avgPerBlogArticle)} sub="blog-writer uniquement" accent="#F59E0B" />
    </div>
  );
}
```

- [ ] **Step 2: Create `CostChart.tsx`**

```tsx
// src/app/admin/(protected)/costs/_components/CostChart.tsx
"use client";

import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface TimeSeriesEntry { period: string; agentName: string; totalEur: number; }

interface Props {
  weekly:  TimeSeriesEntry[];
  monthly: TimeSeriesEntry[];
}

const AGENT_COLORS: Record<string, string> = {
  "blog-writer":                "#6366F1",
  "queue-builder-monthly":      "#22C55E",
  "keyword-researcher":         "#F59E0B",
  "article-optimizer-quarterly": "#3B82F6",
};
const DEFAULT_COLOR = "#94A3B8";

function pivotData(series: TimeSeriesEntry[]) {
  const periodMap = new Map<string, Record<string, number>>();
  for (const { period, agentName, totalEur } of series) {
    if (!periodMap.has(period)) periodMap.set(period, { period } as Record<string, number>);
    periodMap.get(period)![agentName] = (periodMap.get(period)![agentName] ?? 0) + totalEur;
  }
  return [...periodMap.values()].sort((a, b) => String(a.period).localeCompare(String(b.period)));
}

export default function CostChart({ weekly, monthly }: Props) {
  const [mode, setMode] = useState<"weekly" | "monthly">("monthly");
  const series = mode === "weekly" ? weekly : monthly;
  const data = pivotData(series);
  const agents = [...new Set(series.map((s) => s.agentName))];

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold text-slate-700">Dépenses par période</h2>
        <div className="flex gap-1.5">
          {(["monthly", "weekly"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                mode === m ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
              }`}
            >
              {m === "monthly" ? "Mois" : "Semaines"}
            </button>
          ))}
        </div>
      </div>
      {data.length === 0 ? (
        <p className="text-slate-400 text-sm text-center py-12">Aucune donnée — lancez un agent instrumenté pour voir les coûts.</p>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
            <XAxis dataKey="period" tick={{ fontSize: 11, fill: "#94A3B8" }} />
            <YAxis tickFormatter={(v: number) => `${v.toFixed(3)}€`} tick={{ fontSize: 11, fill: "#94A3B8" }} width={70} />
            <Tooltip formatter={(v: number) => [`${v.toFixed(5)} €`, ""]} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            {agents.map((agent) => (
              <Bar key={agent} dataKey={agent} stackId="a" fill={AGENT_COLORS[agent] ?? DEFAULT_COLOR} radius={agents.indexOf(agent) === agents.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Create `CostRunsTable.tsx`**

```tsx
// src/app/admin/(protected)/costs/_components/CostRunsTable.tsx
"use client";

import { useState } from "react";

interface ApiCosts {
  anthropic?:  { input_tokens: number; output_tokens: number; cost_eur: number };
  dataforseo?: { calls: number; cost_eur: number };
  tavily?:     { searches: number; cost_eur: number };
  serpapi?:    { calls: number; cost_eur: number };
}
interface Run {
  id: string;
  agentName: string;
  startedAt: string;
  durationSec: number | null;
  costEur: number;
  apiCosts: ApiCosts;
}

function Cell({ value }: { value: number | undefined }) {
  if (!value) return <span className="text-slate-300">—</span>;
  return <span className="font-mono text-slate-700">{value.toFixed(5)} €</span>;
}

function formatDuration(sec: number | null) {
  if (!sec) return "—";
  if (sec < 60) return `${sec}s`;
  return `${Math.floor(sec / 60)}m ${sec % 60}s`;
}

export default function CostRunsTable({ runs }: { runs: Run[] }) {
  const agents = [...new Set(runs.map((r) => r.agentName))].sort();
  const [filter, setFilter] = useState("all");
  const visible = filter === "all" ? runs : runs.filter((r) => r.agentName === filter);

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
        <h2 className="text-sm font-bold text-slate-700">Runs récents</h2>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-600 bg-white"
        >
          <option value="all">Tous les agents</option>
          {agents.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              {["Date", "Agent", "Durée", "Total", "Anthropic", "DataForSEO", "Tavily", "SerpAPI"].map((h) => (
                <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-slate-400 text-sm">Aucun run avec coût enregistré.</td></tr>
            )}
            {visible.map((run) => (
              <tr key={run.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                <td className="px-4 py-2.5 text-slate-500 whitespace-nowrap text-xs">
                  {new Date(run.startedAt).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}
                </td>
                <td className="px-4 py-2.5">
                  <span className="inline-block px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-xs font-medium">{run.agentName}</span>
                </td>
                <td className="px-4 py-2.5 text-slate-500 text-xs">{formatDuration(run.durationSec)}</td>
                <td className="px-4 py-2.5 font-semibold font-mono text-slate-900">{run.costEur.toFixed(5)} €</td>
                <td className="px-4 py-2.5"><Cell value={run.apiCosts.anthropic?.cost_eur} /></td>
                <td className="px-4 py-2.5"><Cell value={run.apiCosts.dataforseo?.cost_eur} /></td>
                <td className="px-4 py-2.5"><Cell value={run.apiCosts.tavily?.cost_eur} /></td>
                <td className="px-4 py-2.5"><Cell value={run.apiCosts.serpapi?.cost_eur} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create `page.tsx`**

```tsx
// src/app/admin/(protected)/costs/page.tsx
import { Metadata } from "next";
import CostKpiBar from "./_components/CostKpiBar";
import CostChart from "./_components/CostChart";
import CostRunsTable from "./_components/CostRunsTable";

export const metadata: Metadata = {
  title: "Coûts IA — Vanzon Admin",
  robots: { index: false, follow: false },
};

async function getCostData() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/admin/costs`, { cache: "no-store" });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function AdminCostsPage() {
  const data = await getCostData();

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6 md:mb-8">
        <p className="text-slate-400 text-sm font-medium mb-1">Administration</p>
        <h1 className="text-2xl md:text-3xl font-black text-slate-900">Coûts IA</h1>
        <p className="text-slate-500 mt-1">Dépenses API en euros par agent et par période</p>
      </div>

      {!data ? (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-amber-700 text-sm">
          Impossible de charger les données de coûts.
        </div>
      ) : (
        <>
          <CostKpiBar
            allTime={data.kpis.allTime}
            thisMonth={data.kpis.thisMonth}
            thisWeek={data.kpis.thisWeek}
            avgPerBlogArticle={data.kpis.avgPerBlogArticle}
          />
          <CostChart weekly={data.timeSeriesWeekly} monthly={data.timeSeriesMonthly} />
          <CostRunsTable runs={data.recentRuns} />
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 5: Verify build**

```bash
npm run build 2>&1 | tail -20
```
Expected: no TypeScript or build errors for the new files.

- [ ] **Step 6: Commit**

```bash
git add src/app/admin/(protected)/costs/
git commit -m "feat(costs): add /admin/costs page with KPIs, chart, and runs table"
```

---

### Task 10: Add sidebar entry

**Files:**
- Modify: `src/app/admin/_components/AdminSidebar.tsx`

- [ ] **Step 1: Add "Coûts IA" entry to the Système group**

In `AdminSidebar.tsx`, find the `"Système"` group (the last `navGroups` entry). Add the "Coûts IA" item between "Agents IA" and "Facebook Outreach":

```typescript
{
  label: "Coûts IA",
  href: "/admin/costs",
  icon: (
    <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
},
```

- [ ] **Step 2: Verify build + Commit**

```bash
npm run build 2>&1 | tail -10
git add src/app/admin/_components/AdminSidebar.tsx
git commit -m "feat(costs): add Coûts IA entry to admin sidebar"
```

---

## Final verification

- [ ] Run `npm run build` — must pass with 0 TypeScript errors
- [ ] Start dev server (`npm run dev`) and navigate to `http://localhost:3000/admin/costs`
- [ ] Confirm page loads with KPI cards (all showing 0,0000 € until an instrumented agent runs)
- [ ] Run one agent locally to generate a real cost entry:
  ```bash
  npx tsx --env-file=.env.local scripts/agents/queue-builder-monthly.ts --dry-run
  ```
  Then check `/admin/costs` — the run should appear in the table.
- [ ] Push to main (Vercel auto-deploys):
  ```bash
  git push
  ```
