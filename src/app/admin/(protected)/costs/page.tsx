import { Metadata } from "next";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import CostKpiBar from "./_components/CostKpiBar";
import CostChart from "./_components/CostChart";
import CostRunsTable from "./_components/CostRunsTable";
import DfsCallsTable, { type DfsLogRow } from "./_components/DfsCallsTable";

export const metadata: Metadata = {
  title: "Coûts IA — Vanzon Admin",
  robots: { index: false, follow: false },
};

interface ApiCostsJson {
  anthropic?: { input_tokens: number; output_tokens: number; cost_eur: number };
  dataforseo?: { calls: number; cost_eur: number };
  tavily?: { searches: number; cost_eur: number };
  serpapi?: { calls: number; cost_eur: number };
}

interface RunRow {
  id: string;
  agent_name: string;
  started_at: string;
  finished_at: string | null;
  cost_eur: number;
  api_costs_json: ApiCostsJson | null;
}

function getISOWeek(d: Date): string {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
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

    let allTime = 0;
    let thisMonth = 0;
    let thisWeek = 0;
    let blogCount = 0;
    let blogTotal = 0;

    const weeklyMap: Record<string, Record<string, number>> = {};
    const monthlyMap: Record<string, Record<string, number>> = {};

    for (const row of rows) {
      const cost = Number(row.cost_eur) || 0;
      const startDate = new Date(row.started_at);

      allTime += cost;
      if (startDate >= monthStart) thisMonth += cost;
      if (getISOWeek(startDate) === currentWeek) thisWeek += cost;

      if (row.agent_name === "blog-writer") {
        blogCount++;
        blogTotal += cost;
      }

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

    const recentRuns = rows.slice(0, 100).map((row) => {
      const started = new Date(row.started_at);
      const finished = row.finished_at ? new Date(row.finished_at) : null;
      const durationSec = finished ? Math.round((finished.getTime() - started.getTime()) / 1000) : 0;
      return {
        id: row.id,
        agentName: row.agent_name,
        startedAt: row.started_at,
        durationSec,
        costEur: Number(row.cost_eur) || 0,
        apiCosts: (row.api_costs_json ?? {}) as Record<string, { calls?: number; searches?: number; input_tokens?: number; output_tokens?: number; cost_eur: number }>,
      };
    });

    return { kpis, timeSeriesWeekly, timeSeriesMonthly, recentRuns };
  } catch {
    return null;
  }
}

async function getDfsLogs() {
  try {
    const sb = createSupabaseAdmin();
    const { data, error } = await sb
      .from("dataforseo_logs")
      .select("id, created_at, endpoint, label, cost_usd, cost_eur, status_code")
      .order("created_at", { ascending: false })
      .limit(500);

    if (error) throw error;
    const logs = (data ?? []) as DfsLogRow[];

    const now = new Date();
    const monthStart = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));
    const totalEur = logs.reduce((s, l) => s + Number(l.cost_eur), 0);
    const thisMonthEur = logs
      .filter((l) => new Date(l.created_at) >= monthStart)
      .reduce((s, l) => s + Number(l.cost_eur), 0);

    return { logs, totalEur, thisMonthEur, callCount: logs.length };
  } catch {
    return { logs: [], totalEur: 0, thisMonthEur: 0, callCount: 0 };
  }
}

export default async function AdminCostsPage() {
  const [data, dfsData] = await Promise.all([getCostData(), getDfsLogs()]);

  const kpis = data?.kpis ?? { allTime: 0, thisMonth: 0, thisWeek: 0, avgPerBlogArticle: 0 };
  const timeSeriesWeekly = data?.timeSeriesWeekly ?? [];
  const timeSeriesMonthly = data?.timeSeriesMonthly ?? [];
  const recentRuns = data?.recentRuns ?? [];

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <p className="text-slate-400 text-sm font-medium mb-1">Administration</p>
        <h1 className="text-2xl md:text-3xl font-black text-slate-900">Coûts IA</h1>
        <p className="text-slate-500 mt-1">Suivi des dépenses API par agent</p>
      </div>

      {/* KPIs */}
      <CostKpiBar kpis={kpis} />

      {/* Chart */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <span className="w-8 h-px bg-slate-200" />
          <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">Évolution des coûts</span>
        </div>
        <CostChart timeSeriesWeekly={timeSeriesWeekly} timeSeriesMonthly={timeSeriesMonthly} />
      </div>

      {/* Runs table */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <span className="w-8 h-px bg-slate-200" />
          <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">Détail des runs agents</span>
        </div>
        <CostRunsTable runs={recentRuns} />
      </div>

      {/* DataForSEO logs */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <span className="w-8 h-px bg-slate-200" />
          <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">DataForSEO — appels & coûts</span>
        </div>
        <DfsCallsTable
          logs={dfsData.logs}
          totalEur={dfsData.totalEur}
          thisMonthEur={dfsData.thisMonthEur}
          callCount={dfsData.callCount}
        />
      </div>
    </div>
  );
}
