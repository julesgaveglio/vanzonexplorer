"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface KeywordOpportunity {
  keyword: string;
  recommended_priority: number;
  competition_level: "low" | "medium" | "high";
  pin_count: number;
}

interface PinterestChartsProps {
  keywords: KeywordOpportunity[];
}

const COMPETITION_COLORS: Record<string, string> = {
  low: "#10b981",
  medium: "#f59e0b",
  high: "#ef4444",
};

export default function PinterestCharts({ keywords }: PinterestChartsProps) {
  if (keywords.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-slate-400 text-sm">
        Aucune donnée keyword disponible — lancer d&apos;abord la recherche
      </div>
    );
  }

  const sorted = [...keywords].sort((a, b) => b.recommended_priority - a.recommended_priority);

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={sorted}
          layout="vertical"
          margin={{ top: 4, right: 20, bottom: 4, left: 8 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
          <XAxis
            type="number"
            domain={[0, 10]}
            tickCount={6}
            tick={{ fontSize: 11, fill: "#94a3b8" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="keyword"
            width={160}
            tick={{ fontSize: 11, fill: "#64748b" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            formatter={(value, name) => [value, name === "recommended_priority" ? "Priorité" : String(name)]}
            labelStyle={{ fontWeight: 600, color: "#1e293b" }}
            contentStyle={{ border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 12 }}
          />
          <Bar dataKey="recommended_priority" name="Priorité" radius={[0, 4, 4, 0]}>
            {sorted.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COMPETITION_COLORS[entry.competition_level] ?? "#6366f1"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
        {Object.entries(COMPETITION_COLORS).map(([level, color]) => (
          <div key={level} className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm inline-block" style={{ backgroundColor: color }} />
            Compétition {level === "low" ? "faible" : level === "medium" ? "moyenne" : "élevée"}
          </div>
        ))}
      </div>
    </div>
  );
}
