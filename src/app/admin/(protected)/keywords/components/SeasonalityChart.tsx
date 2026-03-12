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
import { KeywordData, MONTHS_FR, MONTH_KEYS } from "../data/keywords";

interface Props {
  keywords: KeywordData[];
}

export function SeasonalityChart({ keywords }: Props) {
  const data = MONTH_KEYS.map((key, i) => ({
    month: MONTHS_FR[i],
    volume: keywords.reduce((sum, k) => sum + (k.monthly_searches[key] ?? 0), 0),
    isPeak: i >= 5 && i <= 7, // Jun, Jul, Août
  }));

  const currentMonth = new Date().getMonth(); // 0-indexed
  const beforePeak = currentMonth < 5;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-6">
      <div className="px-6 py-4 border-b border-slate-50 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-bold text-slate-900">Saisonnalité</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Volume de recherche agrégé · 12 mois
          </p>
        </div>
        {beforePeak && (
          <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-100 rounded-xl px-3 py-1.5">
            <span className="text-amber-500 text-xs">⏰</span>
            <span className="text-xs font-semibold text-amber-700">
              Publiez maintenant pour ranker en été
            </span>
          </div>
        )}
      </div>
      <div className="p-6">
        <div className="flex items-center gap-5 mb-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-amber-400 inline-block" />
            <span className="text-xs text-slate-500">Pic estival (×5)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-slate-200 inline-block" />
            <span className="text-xs text-slate-500">Hors saison</span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} margin={{ top: 5, right: 10, bottom: 5, left: 10 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#f1f5f9"
              vertical={false}
            />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 11, fill: "#94a3b8" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "#94a3b8" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) =>
                v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)
              }
            />
            <Tooltip
              formatter={(v: number | undefined) => [
                `${(v ?? 0).toLocaleString("fr-FR")} recherches`,
                "Volume",
              ]}
              contentStyle={{
                borderRadius: 12,
                border: "1px solid #f1f5f9",
                fontSize: 12,
              }}
            />
            <Bar dataKey="volume" radius={[6, 6, 0, 0]}>
              {data.map((entry, index) => (
                <Cell
                  key={index}
                  fill={entry.isPeak ? "#f59e0b" : "#e2e8f0"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
