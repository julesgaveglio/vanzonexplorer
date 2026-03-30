"use client";

import { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface TimeSeriesPoint {
  period: string;
  agentName: string;
  totalEur: number;
}

interface Props {
  timeSeriesWeekly: TimeSeriesPoint[];
  timeSeriesMonthly: TimeSeriesPoint[];
}

const AGENT_COLORS: Record<string, string> = {
  "blog-writer": "#6366F1",
  "queue-builder": "#10B981",
  "keyword-researcher": "#F59E0B",
  "article-optimizer": "#EF4444",
};

const DEFAULT_COLOR = "#94A3B8";

type PivotRow = Record<string, string | number>;

function pivotData(series: TimeSeriesPoint[]): { data: PivotRow[]; agents: string[] } {
  const periodMap: Record<string, PivotRow> = {};
  const agentSet = new Set<string>();

  for (const point of series) {
    if (!periodMap[point.period]) {
      periodMap[point.period] = { period: point.period };
    }
    periodMap[point.period][point.agentName] = (Number(periodMap[point.period][point.agentName]) || 0) + point.totalEur;
    agentSet.add(point.agentName);
  }

  const data = Object.values(periodMap).sort((a, b) =>
    String(a.period).localeCompare(String(b.period))
  );
  const agents = Array.from(agentSet).sort();

  return { data, agents };
}

export default function CostChart({ timeSeriesWeekly, timeSeriesMonthly }: Props) {
  const [view, setView] = useState<"weekly" | "monthly">("weekly");

  const series = view === "weekly" ? timeSeriesWeekly : timeSeriesMonthly;
  const { data, agents } = pivotData(series);

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={() => setView("weekly")}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              view === "weekly"
                ? "bg-indigo-50 text-indigo-700"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Semaines
          </button>
          <button
            onClick={() => setView("monthly")}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              view === "monthly"
                ? "bg-indigo-50 text-indigo-700"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Mois
          </button>
        </div>
        <div className="flex items-center justify-center h-40 text-slate-400 text-sm">
          Aucune donnée de coût disponible — lancer un agent avec cost tracking
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-6">
        <button
          onClick={() => setView("weekly")}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            view === "weekly"
              ? "bg-indigo-50 text-indigo-700"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Semaines
        </button>
        <button
          onClick={() => setView("monthly")}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            view === "monthly"
              ? "bg-indigo-50 text-indigo-700"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Mois
        </button>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 16, bottom: 4, left: 8 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis
              dataKey="period"
              tick={{ fontSize: 11, fill: "#94a3b8" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={(v) => `€${Number(v).toFixed(2)}`}
              tick={{ fontSize: 11, fill: "#94a3b8" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(value: any, name: any) => [`€${Number(value).toFixed(4)}`, name]}
              contentStyle={{
                borderRadius: "12px",
                border: "1px solid #e2e8f0",
                boxShadow: "0 4px 14px rgba(0,0,0,0.08)",
                fontSize: "12px",
              }}
            />
            <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "12px" }} />
            {agents.map((agent) => (
              <Bar
                key={agent}
                dataKey={agent}
                stackId="costs"
                fill={AGENT_COLORS[agent] ?? DEFAULT_COLOR}
                radius={agents[agents.length - 1] === agent ? [4, 4, 0, 0] : [0, 0, 0, 0]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
