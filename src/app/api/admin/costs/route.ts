import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/server";

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

export async function GET() {
  const check = await requireAdmin();
  if (check instanceof NextResponse) return check;

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

    // KPIs
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

      // Time series — weekly
      const week = getISOWeek(startDate);
      if (!weeklyMap[week]) weeklyMap[week] = {};
      weeklyMap[week][row.agent_name] = (weeklyMap[week][row.agent_name] || 0) + cost;

      // Time series — monthly
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

    // Flatten time series
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

    // Recent runs (limited)
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
        apiCosts: row.api_costs_json ?? {},
      };
    });

    return NextResponse.json({ kpis, timeSeriesWeekly, timeSeriesMonthly, recentRuns });
  } catch (err) {
    console.error("[/api/admin/costs]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
