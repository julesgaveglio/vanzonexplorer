"use client";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import {
  KeywordData,
  CATEGORY_COLORS,
  CATEGORY_LABELS,
  Category,
} from "../data/keywords";

interface Props {
  keywords: KeywordData[];
}

interface ScatterPoint {
  x: number;
  y: number;
  z: number;
  keyword: string;
  category: Category;
  competition_level: string;
  cpc: number;
  search_volume: number;
  keyword_difficulty: number | null;
}

interface TooltipProps {
  active?: boolean;
  payload?: Array<{ payload: ScatterPoint }>;
}

function CustomTooltip({ active, payload }: TooltipProps) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const kdText = d.keyword_difficulty !== null ? d.keyword_difficulty : "?";
  const compColor =
    d.competition_level === "LOW"
      ? "text-emerald-600"
      : d.competition_level === "MEDIUM"
      ? "text-amber-600"
      : "text-red-500";
  return (
    <div className="bg-white border border-slate-100 rounded-xl shadow-lg p-3 text-sm max-w-[220px]">
      <p className="font-bold text-slate-800 mb-1 leading-tight">{d.keyword}</p>
      <p className="text-slate-500">
        Volume :{" "}
        <span className="font-semibold text-slate-800">
          {d.search_volume}/mois
        </span>
      </p>
      <p className="text-slate-500">
        Difficulte :{" "}
        <span className="font-semibold text-slate-800">{kdText}</span>
      </p>
      <p className="text-slate-500">
        CPC :{" "}
        <span className="font-semibold text-slate-800">
          {d.cpc ? `${d.cpc.toFixed(2)}€` : "—"}
        </span>
      </p>
      <p className={`text-xs font-semibold mt-1 ${compColor}`}>
        {d.competition_level}
      </p>
    </div>
  );
}

export function OpportunityMatrix({ keywords }: Props) {
  const categories: Category[] = ["quick-win", "main-target", "editorial"];
  const kdMedian = 45;

  const byCategory = categories.map((cat) => ({
    cat,
    data: keywords
      .filter((k) => k.category === cat && k.search_volume > 0)
      .map(
        (k): ScatterPoint => ({
          x: Math.log10(k.search_volume + 1) * 100,
          y: k.keyword_difficulty ?? kdMedian,
          z: Math.max(40, (k.cpc + 0.1) * 80),
          keyword: k.keyword,
          category: k.category,
          competition_level: k.competition_level,
          cpc: k.cpc,
          search_volume: k.search_volume,
          keyword_difficulty: k.keyword_difficulty,
        })
      ),
  }));

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-6">
      <div className="px-6 py-4 border-b border-slate-50">
        <h2 className="font-bold text-slate-900">Matrice d&apos;Opportunites</h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Volume (X) vs Difficulte (Y) · bas droite = ideal
        </p>
      </div>
      <div className="p-6">
        {/* Legend */}
        <div className="flex items-center gap-5 mb-4">
          {categories.map((cat) => (
            <div key={cat} className="flex items-center gap-1.5">
              <span
                className="w-3 h-3 rounded-full inline-block"
                style={{ background: CATEGORY_COLORS[cat] }}
              />
              <span className="text-xs font-medium text-slate-600">
                {CATEGORY_LABELS[cat]}
              </span>
            </div>
          ))}
        </div>

        {/* Quadrant labels overlay */}
        <div className="relative">
          <div
            className="absolute inset-0 pointer-events-none z-10 grid grid-cols-2 grid-rows-2"
            style={{ left: 64, top: 10, right: 20, bottom: 50 }}
          >
            <div className="flex items-start justify-start p-2">
              <span className="text-[10px] font-semibold text-slate-300 uppercase tracking-wide">
                A eviter
              </span>
            </div>
            <div className="flex items-start justify-end p-2">
              <span className="text-[10px] font-semibold text-slate-300 uppercase tracking-wide">
                Long terme
              </span>
            </div>
            <div className="flex items-end justify-start p-2">
              <span className="text-[10px] font-semibold text-violet-400 uppercase tracking-wide">
                Contenu facile
              </span>
            </div>
            <div className="flex items-end justify-end p-2">
              <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wide">
                Jackpot
              </span>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={380}>
            <ScatterChart margin={{ top: 10, right: 20, bottom: 50, left: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                type="number"
                dataKey="x"
                domain={[150, 400]}
                tick={{ fontSize: 10, fill: "#94a3b8" }}
                label={{
                  value: "Volume de recherche →",
                  position: "insideBottom",
                  offset: -10,
                  fontSize: 11,
                  fill: "#94a3b8",
                }}
                tickFormatter={(v: number) => {
                  const vol = Math.round(Math.pow(10, v / 100) - 1);
                  return vol >= 1000 ? `${(vol / 1000).toFixed(0)}k` : String(vol);
                }}
              />
              <YAxis
                type="number"
                dataKey="y"
                domain={[0, 80]}
                reversed
                tick={{ fontSize: 10, fill: "#94a3b8" }}
                label={{
                  value: "Difficulte",
                  angle: -90,
                  position: "insideLeft",
                  offset: 15,
                  fontSize: 11,
                  fill: "#94a3b8",
                }}
              />
              <ReferenceLine x={230} stroke="#e2e8f0" strokeDasharray="4 4" />
              <ReferenceLine y={45} stroke="#e2e8f0" strokeDasharray="4 4" />
              <Tooltip content={<CustomTooltip />} />
              {byCategory.map(({ cat, data }) => (
                <Scatter
                  key={cat}
                  data={data}
                  fill={CATEGORY_COLORS[cat]}
                  fillOpacity={0.75}
                  name={CATEGORY_LABELS[cat]}
                />
              ))}
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
