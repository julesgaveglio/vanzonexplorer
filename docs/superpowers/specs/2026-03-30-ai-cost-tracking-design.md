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

`finishRun()` maps these to the new DB columns.

---

## Section 3 — Agent Instrumentation

### Agents to instrument

| Agent | APIs tracked |
|---|---|
| `blog-writer-agent.ts` | Anthropic Sonnet (×2), DataForSEO, Tavily, SerpAPI |
| `queue-builder-monthly.ts` | Anthropic Haiku |
| `keyword-researcher.ts` | DataForSEO |
| `keyword-research-quarterly.ts` | DataForSEO |
| `cmo-weekly-agent.ts` | Anthropic Sonnet, DataForSEO |
| `cmo-monthly-agent.ts` | Anthropic Sonnet, DataForSEO |
| `article-optimizer-quarterly.ts` | Anthropic Sonnet, DataForSEO |

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

```ts
// Before
async function callClaude(prompt, opts): Promise<string>

// After
async function callClaude(prompt, opts): Promise<{ text: string; usage: { input_tokens: number; output_tokens: number } }>
```

All 2 call sites (metadata + body) are updated to destructure `{ text }`.

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
  }>;
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
| Modify | `scripts/agents/keyword-research-quarterly.ts` |
| Modify | `scripts/agents/cmo-weekly-agent.ts` |
| Modify | `scripts/agents/cmo-monthly-agent.ts` |
| Modify | `scripts/agents/article-optimizer-quarterly.ts` |
| Create | `src/app/admin/(protected)/costs/page.tsx` |
| Create | `src/app/admin/(protected)/costs/_components/CostKpiBar.tsx` |
| Create | `src/app/admin/(protected)/costs/_components/CostChart.tsx` |
| Create | `src/app/admin/(protected)/costs/_components/CostRunsTable.tsx` |
| Create | `src/app/api/admin/costs/route.ts` |
| Modify | `src/app/admin/_components/AdminSidebar.tsx` |

No new Supabase table — only 4 columns added to `agent_runs`.
Migration run once manually via Supabase SQL editor or migration script.
