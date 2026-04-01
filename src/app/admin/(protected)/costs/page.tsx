import { Metadata } from "next";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import CostKpiBar from "./_components/CostKpiBar";
import CostChart from "./_components/CostChart";
import UnifiedCostTable, { type UnifiedEntry, type ToolCost } from "./_components/UnifiedCostTable";
import DfsCallsTable, { type DfsLogRow } from "./_components/DfsCallsTable";

export const metadata: Metadata = {
  title: "Coûts — Vanzon Admin",
  robots: { index: false, follow: false },
};

// ── Coût Tavily par road trip (1 search) ──────────────────────────────────────
const TAVILY_EUR = 0.004 * 0.92; // $0.004 USD → EUR

// ── Tool colors for the breakdown bar (server-rendered) ──────────────────────
const TOOL_DOT: Record<string, string> = {
  Anthropic:  "#6366F1",
  Gemini:     "#F97316",
  Groq:       "#22C55E",
  DataForSEO: "#F59E0B",
  Tavily:     "#A855F7",
  SerpAPI:    "#F43F5E",
  Resend:     "#06B6D4",
};

interface ApiCostsJson {
  anthropic?:  { input_tokens: number; output_tokens: number; cost_eur: number };
  gemini?:     { input_tokens: number; output_tokens: number; images?: number; model: string; cost_eur: number };
  groq?:       { input_tokens: number; output_tokens: number; model: string; cost_eur: number; free_tier?: boolean };
  dataforseo?: { calls: number; cost_eur: number };
  tavily?:     { searches: number; cost_eur: number };
  serpapi?:    { calls: number; cost_eur: number };
  resend?:     { emails: number; cost_eur: number };
}

interface RunRow {
  id: string;
  agent_name: string;
  started_at: string;
  finished_at: string | null;
  cost_eur: number;
  api_costs_json: ApiCostsJson | null;
}

interface RoadTripRow {
  id: string;
  created_at: string;
  region: string;
  duree: number;
}

function getISOWeek(d: Date): string {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

function formatCost(v: number): string {
  if (v === 0) return "€0.00";
  if (v < 0.01) return `€${v.toFixed(4)}`;
  return `€${v.toFixed(2)}`;
}

async function getCostData() {
  try {
    const sb = createSupabaseAdmin();
    const { data: runs, error } = await sb
      .from("agent_runs")
      .select("id, agent_name, started_at, finished_at, cost_eur, api_costs_json")
      .gt("cost_eur", 0)
      .order("started_at", { ascending: false })
      .limit(500);

    if (error) throw error;
    const rows = (runs ?? []) as RunRow[];

    const now = new Date();
    const monthStart = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));
    const currentWeek = getISOWeek(now);

    let allTime = 0, thisMonth = 0, thisWeek = 0, blogCount = 0, blogTotal = 0;
    const weeklyMap: Record<string, Record<string, number>> = {};
    const monthlyMap: Record<string, Record<string, number>> = {};

    for (const row of rows) {
      const cost = Number(row.cost_eur) || 0;
      const startDate = new Date(row.started_at);

      allTime += cost;
      if (startDate >= monthStart) thisMonth += cost;
      if (getISOWeek(startDate) === currentWeek) thisWeek += cost;

      if (row.agent_name === "blog-writer") { blogCount++; blogTotal += cost; }

      const week = getISOWeek(startDate);
      if (!weeklyMap[week]) weeklyMap[week] = {};
      weeklyMap[week][row.agent_name] = (weeklyMap[week][row.agent_name] || 0) + cost;

      const month = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, "0")}`;
      if (!monthlyMap[month]) monthlyMap[month] = {};
      monthlyMap[month][row.agent_name] = (monthlyMap[month][row.agent_name] || 0) + cost;
    }

    const kpis = {
      allTime,
      thisMonth,
      thisWeek,
      avgPerBlogArticle: blogCount > 0 ? blogTotal / blogCount : 0,
    };

    const timeSeriesWeekly = Object.entries(weeklyMap)
      .flatMap(([period, agents]) =>
        Object.entries(agents).map(([agentName, totalEur]) => ({ period, agentName, totalEur }))
      )
      .sort((a, b) => a.period.localeCompare(b.period));

    const timeSeriesMonthly = Object.entries(monthlyMap)
      .flatMap(([period, agents]) =>
        Object.entries(agents).map(([agentName, totalEur]) => ({ period, agentName, totalEur }))
      )
      .sort((a, b) => a.period.localeCompare(b.period));

    // Build unified agent entries
    const agentEntries: UnifiedEntry[] = rows.slice(0, 200).map((row) => {
      const ac = row.api_costs_json ?? {};
      const tools: ToolCost[] = [];
      if (ac.anthropic?.cost_eur) {
        const tokens = (ac.anthropic.input_tokens ?? 0) + (ac.anthropic.output_tokens ?? 0);
        tools.push({ name: "Anthropic", costEur: ac.anthropic.cost_eur, detail: `${Math.round(tokens / 100) / 10}k tokens` });
      }
      if (ac.gemini) {
        const tokens = (ac.gemini.input_tokens ?? 0) + (ac.gemini.output_tokens ?? 0);
        const imgs = ac.gemini.images ? ` · ${ac.gemini.images} images` : "";
        tools.push({ name: "Gemini", costEur: ac.gemini.cost_eur ?? 0, detail: `${Math.round(tokens / 100) / 10}k tokens${imgs} — ${ac.gemini.model}` });
      }
      if (ac.groq) {
        const tokens = (ac.groq.input_tokens ?? 0) + (ac.groq.output_tokens ?? 0);
        const tier = ac.groq.free_tier ? " (gratuit)" : "";
        tools.push({ name: "Groq", costEur: ac.groq.cost_eur ?? 0, detail: `${Math.round(tokens / 100) / 10}k tokens — ${ac.groq.model}${tier}` });
      }
      if (ac.dataforseo?.cost_eur) {
        tools.push({ name: "DataForSEO", costEur: ac.dataforseo.cost_eur, detail: `${ac.dataforseo.calls} appels` });
      }
      if (ac.tavily?.cost_eur) {
        tools.push({ name: "Tavily", costEur: ac.tavily.cost_eur, detail: `${ac.tavily.searches} recherches` });
      }
      if (ac.serpapi?.cost_eur) {
        tools.push({ name: "SerpAPI", costEur: ac.serpapi.cost_eur, detail: `${ac.serpapi.calls} appels` });
      }
      if (ac.resend?.emails) {
        tools.push({ name: "Resend", costEur: ac.resend.cost_eur ?? 0, detail: `${ac.resend.emails} email${ac.resend.emails > 1 ? "s" : ""}` });
      }

      const started = new Date(row.started_at);
      const finished = row.finished_at ? new Date(row.finished_at) : null;
      const durationSec = finished ? Math.round((finished.getTime() - started.getTime()) / 1000) : 0;

      return {
        id: row.id,
        date: row.started_at,
        type: "agent" as const,
        label: row.agent_name,
        costEur: Number(row.cost_eur) || 0,
        durationSec,
        tools,
      };
    });

    return { kpis, timeSeriesWeekly, timeSeriesMonthly, agentEntries };
  } catch {
    return null;
  }
}

async function getRoadTrips(): Promise<RoadTripRow[]> {
  try {
    const sb = createSupabaseAdmin();
    const { data } = await sb
      .from("road_trip_requests")
      .select("id, created_at, region, duree")
      .eq("status", "sent")
      .order("created_at", { ascending: false })
      .limit(500);
    return (data ?? []) as RoadTripRow[];
  } catch {
    return [];
  }
}

async function getDfsLogs(): Promise<DfsLogRow[]> {
  try {
    const sb = createSupabaseAdmin();
    const { data } = await sb
      .from("dfs_logs")
      .select("id, created_at, endpoint, label, cost_usd, cost_eur, status_code")
      .order("created_at", { ascending: false })
      .limit(500);
    return (data ?? []) as DfsLogRow[];
  } catch {
    return [];
  }
}

export default async function AdminCostsPage() {
  const [data, roadTrips, dfsLogs] = await Promise.all([getCostData(), getRoadTrips(), getDfsLogs()]);

  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));
  const currentWeek = getISOWeek(now);

  // Road trip entries
  const roadTripEntries: UnifiedEntry[] = roadTrips.map((rt) => ({
    id: rt.id,
    date: rt.created_at,
    type: "road_trip" as const,
    label: `Road Trip ${rt.region} — ${rt.duree}j`,
    costEur: TAVILY_EUR,
    durationSec: 0,
    tools: [{ name: "Tavily", costEur: TAVILY_EUR, detail: "1 recherche" }],
  }));

  const roadTripTotal = roadTripEntries.reduce((s, e) => s + e.costEur, 0);
  const roadTripThisMonth = roadTripEntries
    .filter((e) => new Date(e.date) >= monthStart)
    .reduce((s, e) => s + e.costEur, 0);
  const roadTripThisWeek = roadTripEntries
    .filter((e) => getISOWeek(new Date(e.date)) === currentWeek)
    .reduce((s, e) => s + e.costEur, 0);

  // DataForSEO entries
  const dfsEntries: UnifiedEntry[] = dfsLogs.map((log) => ({
    id: log.id,
    date: log.created_at,
    type: "dataforseo" as const,
    label: log.label || log.endpoint,
    costEur: Number(log.cost_eur) || 0,
    durationSec: 0,
    tools: [{ name: "DataForSEO", costEur: Number(log.cost_eur) || 0, detail: log.endpoint }],
  }));

  const dfsTotal = dfsEntries.reduce((s, e) => s + e.costEur, 0);
  const dfsThisMonth = dfsEntries
    .filter((e) => new Date(e.date) >= monthStart)
    .reduce((s, e) => s + e.costEur, 0);
  const dfsThisWeek = dfsEntries
    .filter((e) => getISOWeek(new Date(e.date)) === currentWeek)
    .reduce((s, e) => s + e.costEur, 0);

  const agentEntries = data?.agentEntries ?? [];
  const kpisBase = data?.kpis ?? { allTime: 0, thisMonth: 0, thisWeek: 0, avgPerBlogArticle: 0 };

  const kpis = {
    allTime: kpisBase.allTime + roadTripTotal + dfsTotal,
    thisMonth: kpisBase.thisMonth + roadTripThisMonth + dfsThisMonth,
    thisWeek: kpisBase.thisWeek + roadTripThisWeek + dfsThisWeek,
    avgPerBlogArticle: kpisBase.avgPerBlogArticle,
  };

  // Merge and sort by date
  const allEntries: UnifiedEntry[] = [...agentEntries, ...roadTripEntries, ...dfsEntries].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  // Tool breakdown totals
  const toolTotals: Record<string, number> = {};
  for (const entry of allEntries) {
    for (const tool of entry.tools) {
      toolTotals[tool.name] = (toolTotals[tool.name] ?? 0) + tool.costEur;
    }
  }
  const toolBreakdown = Object.entries(toolTotals)
    .sort((a, b) => b[1] - a[1])
    .filter(([, v]) => v > 0);

  const timeSeriesWeekly = data?.timeSeriesWeekly ?? [];
  const timeSeriesMonthly = data?.timeSeriesMonthly ?? [];

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <p className="text-slate-400 text-sm font-medium mb-1">Administration</p>
        <h1 className="text-2xl md:text-3xl font-black text-slate-900">Coûts</h1>
        <p className="text-slate-500 mt-1">Suivi des dépenses par outil — agents, road trips, APIs</p>
      </div>

      {/* KPIs */}
      <CostKpiBar kpis={kpis} />

      {/* Tool breakdown */}
      {toolBreakdown.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-8 h-px bg-slate-200" />
            <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">
              Répartition par outil
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {toolBreakdown.map(([tool, total]) => {
              const dot = TOOL_DOT[tool] ?? "#94A3B8";
              return (
                <div
                  key={tool}
                  className="bg-white rounded-xl border border-slate-100 shadow-sm px-4 py-3"
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ background: dot }}
                    />
                    <span className="text-xs font-semibold text-slate-500 truncate">{tool}</span>
                  </div>
                  <p className="text-lg font-black text-slate-900">{formatCost(total)}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Chart */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <span className="w-8 h-px bg-slate-200" />
          <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">
            Évolution des coûts
          </span>
        </div>
        <CostChart timeSeriesWeekly={timeSeriesWeekly} timeSeriesMonthly={timeSeriesMonthly} />
      </div>

      {/* Unified table */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <span className="w-8 h-px bg-slate-200" />
          <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">
            Toutes les dépenses
          </span>
        </div>
        <UnifiedCostTable entries={allEntries} />
      </div>

      {/* DataForSEO detail */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <span className="w-8 h-px bg-slate-200" />
          <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">
            DataForSEO — Détail des appels
          </span>
        </div>
        <DfsCallsTable
          logs={dfsLogs}
          totalEur={dfsTotal}
          thisMonthEur={dfsThisMonth}
          callCount={dfsLogs.length}
        />
      </div>
    </div>
  );
}
