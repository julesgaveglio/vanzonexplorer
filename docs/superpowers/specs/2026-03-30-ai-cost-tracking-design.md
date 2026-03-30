# AI Cost Tracking — Design Spec

## Goal

Track and display the real-time cost (in euros) of every paid API call made by Vanzon's autonomous agents, with breakdowns by agent, service, week, month and year, visible in a dedicated admin page.

## Architecture

Add 4 cost columns to the existing `agent_runs` Supabase table. Each agent accumulates costs during its run using a shared `CostTracker` utility, then persists the totals via the existing `finishRun()` call. A new `/admin/costs` page reads and aggregates these columns via an API route.

## Tech Stack

- Supabase (Postgres) — storage + SQL aggregation
- `scripts/lib/ai-costs.ts` — new shared utility (pricing rates + CostTracker)
- Next.js App Router — `/admin/costs` server page + `/api/admin/costs` route
- Recharts — bar chart (already used elsewhere in admin)

---

## Section 1 — Database

### Migration on `agent_runs`

```sql
ALTER TABLE agent_runs
  ADD COLUMN cost_eur       NUMERIC(10,6) DEFAULT 0,
  ADD COLUMN tokens_input   INTEGER       DEFAULT 0,
  ADD COLUMN tokens_output  INTEGER       DEFAULT 0,
  ADD COLUMN api_costs_json JSONB         DEFAULT '{}';
```

### `api_costs_json` shape

```json
{
  "anthropic": { "input_tokens": 4200, "output_tokens": 3100, "cost_eur": 0.067 },
  "dataforseo": { "calls": 2, "cost_eur": 0.003 },
  "tavily":     { "searches": 3, "cost_eur": 0.011 },
  "serpapi":    { "calls": 1, "cost_eur": 0.010 }
}
```

Runs that predate this migration keep `cost_eur = 0` and `api_costs_json = {}`.

---

## Section 2 — Shared Library (`scripts/lib/ai-costs.ts`)

### Pricing rates (USD → EUR at 0.92)

| Service | Unit | USD | EUR |
|---|---|---|---|
| Claude Sonnet 4.5 input | 1M tokens | $3.00 | €0.00000276/token |
| Claude Sonnet 4.5 output | 1M tokens | $15.00 | €0.0000138/token |
| Claude Haiku 4.5 input | 1M tokens | $0.80 | €0.000000736/token |
| Claude Haiku 4.5 output | 1M tokens | $4.00 | €0.00000368/token |
| Tavily | per search | $0.004 | €0.00368 |
| SerpAPI | per call | $0.010 | €0.0092 |
| DataForSEO | variable | direct from API `cost` field (USD) × 0.92 |

### `CostTracker` class

```ts
export class CostTracker {
  addAnthropic(model: "sonnet" | "haiku", inputTokens: number, outputTokens: number): void
  addDataForSeo(usdCost: number): void   // cost field from their API response
  addTavily(searches: number): void
  addSerpApi(calls: number): void
  toRunResult(): { costEur: number; tokensInput: number; tokensOutput: number; apiCosts: ApiCostsJson }
}

export function createCostTracker(): CostTracker
```

### Updated `RunResult` interface (`scripts/lib/agent-runs.ts`)

```ts
interface RunResult {
  status: "success" | "error";
  itemsProcessed?: number;
  itemsCreated?: number;
  error?: string;
  metadata?: Record<string, unknown>;
  // New:
  costEur?: number;
  tokensInput?: number;
  tokensOutput?: number;
  apiCosts?: Record<string, { calls?: number; input_tokens?: number; output_tokens?: number; cost_eur: number }>;
}
```

`finishRun()` maps these to the new DB columns:

```ts
// Inside finishRun(), added to the existing update object:
...(result.costEur      !== undefined ? { cost_eur:        result.costEur }      : {}),
...(result.tokensInput  !== undefined ? { tokens_input:    result.tokensInput }  : {}),
...(result.tokensOutput !== undefined ? { tokens_output:   result.tokensOutput } : {}),
...(result.apiCosts     !== undefined ? { api_costs_json:  result.apiCosts }     : {}),
```

---

## Section 3 — Agent Instrumentation

### Scope — v1 agents (all use `startRun`/`finishRun`)

| Agent | APIs tracked | Notes |
|---|---|---|
| `blog-writer-agent.ts` | Anthropic Sonnet (×2), DataForSEO, Tavily, SerpAPI | Main cost driver |
| `queue-builder-monthly.ts` | Anthropic Haiku | Uses local `callClaude` with Haiku |
| `keyword-researcher.ts` | DataForSEO + Anthropic Haiku | Both confirmed in source |
| `article-optimizer-quarterly.ts` | Anthropic Haiku | Anthropic only — no DataForSEO calls |

**Out of scope for v1 (no `startRun`/`finishRun`):**
- `cmo-weekly-agent.ts`, `cmo-monthly-agent.ts` — use Groq (not Anthropic), no run lifecycle hooks
- `keyword-research-quarterly.ts` — DataForSEO only, no `agent_runs` integration

**Free agents (no paid APIs, not instrumented):**
- `link-optimizer-monthly.ts` — uses only Sanity API (no cost), has `startRun`/`finishRun` but cost_eur stays 0

**Gemini exclusion:** `blog-writer-agent.ts` defines `callGemini()` but both generation call sites (metadata + body) use `callClaude()`. Gemini is not called at runtime and requires no tracking.

**SerpAPI env var:** `SERPAPI_KEY` (confirmed in `blog-writer-agent.ts` source).

### Pattern per agent

```ts
const costs = createCostTracker();

// Claude call — callClaude() now returns { text, usage }
const { text, usage } = await callClaude(prompt, opts);
costs.addAnthropic("sonnet", usage.input_tokens, usage.output_tokens);

// DataForSEO — their response includes `cost` in USD
costs.addDataForSeo(response.cost ?? 0);

// Tavily
costs.addTavily(queriesCount);

// SerpAPI
costs.addSerpApi(1);

// finishRun
await finishRun(runId, { status: "success", itemsProcessed: 1, ...costs.toRunResult() });
```

### `callClaude` return type change (`blog-writer-agent.ts`)

The existing implementation calls `client.messages.create()` from the Anthropic SDK. The SDK response includes a `usage` field with `input_tokens` and `output_tokens`. The function is updated to expose it:

```ts
// Before
async function callClaude(prompt: string, opts: { maxTokens?: number } = {}): Promise<string> {
  const response = await client.messages.create({ ... });
  const text = response.content.filter(...).map(...).join("");
  return text;
}

// After
async function callClaude(
  prompt: string,
  opts: { maxTokens?: number } = {}
): Promise<{ text: string; usage: { input_tokens: number; output_tokens: number } }> {
  const response = await client.messages.create({ ... });
  const text = response.content.filter(...).map(...).join("");
  return { text, usage: response.usage };
}
```

The same pattern applies to `callClaude` in `queue-builder-monthly.ts` and `article-optimizer-quarterly.ts` (each file has its own local copy).

All call sites are updated to destructure `{ text }` instead of using the return value directly.

---

## Section 4 — Admin UI

### New page: `/admin/costs`

Server Component. Fetches data from `/api/admin/costs`.

**KPI bar (4 cards):**
- 💸 Total all time
- 📅 Ce mois (current month name + year)
- 📊 Cette semaine
- 📝 Coût moyen par article blog-writer

**Chart (client component `CostChart.tsx`):**
- Stacked bar chart (Recharts)
- X axis: weeks or months (toggle button)
- Y axis: euros
- One color per agent name
- Only agents with cost_eur > 0 appear

**Runs table (`CostRunsTable.tsx`):**
- Columns: Date, Agent, Durée, Total, Anthropic, DataForSEO, Tavily, SerpAPI
- Sorted by date desc
- Filterable by agent (dropdown)
- Shows `—` for services not used in that run

### API route: `GET /api/admin/costs`

Returns two payloads:

```ts
{
  kpis: {
    allTime: number;
    thisMonth: number;
    thisWeek: number;
    avgPerBlogArticle: number;
  };
  timeSeries: Array<{
    period: string;       // "2026-W13" or "2026-03"
    agentName: string;
    totalEur: number;
  }>;
  recentRuns: Array<{
    id: string;
    agentName: string;
    startedAt: string;
    durationSec: number;
    costEur: number;
    apiCosts: ApiCostsJson;
  }>;  // LIMIT 100, ordered by started_at DESC
}
```

SQL for KPIs uses `DATE_TRUNC('week', started_at)` and `DATE_TRUNC('month', started_at)`.

### Sidebar

Add entry in `AdminSidebar.tsx` under "Agents":
- Label: "Coûts IA"
- Icon: coin/currency SVG
- href: `/admin/costs`

---

## Files Created / Modified

| Action | Path |
|---|---|
| Create | `scripts/lib/ai-costs.ts` |
| Modify | `scripts/lib/agent-runs.ts` |
| Modify | `scripts/agents/blog-writer-agent.ts` |
| Modify | `scripts/agents/queue-builder-monthly.ts` |
| Modify | `scripts/agents/keyword-researcher.ts` |
| Modify | `scripts/agents/article-optimizer-quarterly.ts` |
| Create | `supabase/migrations/20260330_agent_runs_cost.sql` |
| Create | `src/app/admin/(protected)/costs/page.tsx` |
| Create | `src/app/admin/(protected)/costs/_components/CostKpiBar.tsx` |
| Create | `src/app/admin/(protected)/costs/_components/CostChart.tsx` |
| Create | `src/app/admin/(protected)/costs/_components/CostRunsTable.tsx` |
| Create | `src/app/api/admin/costs/route.ts` |
| Modify | `src/app/admin/_components/AdminSidebar.tsx` |

No new Supabase table — only 4 columns added to `agent_runs`.

**Migration:** Create `supabase/migrations/20260330_agent_runs_cost.sql` with the ALTER TABLE statement. Run once via Supabase SQL editor before deploying.
