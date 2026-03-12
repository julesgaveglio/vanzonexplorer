"use client";
import { useState, useMemo } from "react";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import {
  KeywordData,
  Category,
  CATEGORY_COLORS,
  MONTH_KEYS,
} from "../data/keywords";

interface Props {
  keywords: KeywordData[];
}

type SortKey = "search_volume" | "keyword_difficulty" | "cpc" | "trend_yearly";
type SortDir = "asc" | "desc";

function KdBadge({ score }: { score: number | null }) {
  if (score === null)
    return <span className="text-xs text-slate-300">—</span>;
  const color =
    score < 30
      ? "bg-emerald-100 text-emerald-700"
      : score < 55
      ? "bg-amber-100 text-amber-700"
      : "bg-red-100 text-red-600";
  const label = score < 30 ? "Facile" : score < 55 ? "Moyen" : "Difficile";
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${color}`}>
      {label} {score}
    </span>
  );
}

function CompBadge({ level }: { level: string }) {
  const color =
    level === "LOW"
      ? "bg-emerald-100 text-emerald-700"
      : level === "MEDIUM"
      ? "bg-amber-100 text-amber-700"
      : "bg-red-100 text-red-600";
  const label =
    level === "LOW" ? "Faible" : level === "MEDIUM" ? "Moyen" : "Elevé";
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${color}`}>
      {label}
    </span>
  );
}

function IntentBadge({ intent }: { intent: string }) {
  const color =
    intent === "commercial"
      ? "bg-blue-50 text-blue-600"
      : intent === "informational"
      ? "bg-violet-50 text-violet-600"
      : "bg-slate-100 text-slate-500";
  const label =
    intent === "commercial"
      ? "Commercial"
      : intent === "informational"
      ? "Info"
      : "Nav";
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full ${color}`}>{label}</span>
  );
}

function Sparkline({ data }: { data: Array<{ v: number }> }) {
  return (
    <ResponsiveContainer width={60} height={28}>
      <LineChart data={data} margin={{ top: 2, bottom: 2, left: 0, right: 0 }}>
        <Line
          type="monotone"
          dataKey="v"
          stroke="#6366f1"
          strokeWidth={1.5}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

function TrendCell({ value }: { value: number | null }) {
  if (value === null)
    return <span className="text-xs text-slate-300">—</span>;
  const color = value > 0 ? "text-emerald-600" : "text-red-500";
  const arrow = value > 0 ? "↑" : "↓";
  return (
    <span className={`text-xs font-semibold ${color}`}>
      {arrow} {Math.abs(value)}%
    </span>
  );
}

const TABS: Array<{ key: "all" | Category; label: string }> = [
  { key: "all", label: "Tous" },
  { key: "quick-win", label: "Quick Wins" },
  { key: "main-target", label: "Cibles" },
  { key: "editorial", label: "Editorial" },
];

export function KeywordsTable({ keywords }: Props) {
  const [tab, setTab] = useState<"all" | Category>("all");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("search_volume");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const filtered = useMemo(() => {
    let list = keywords;
    if (tab !== "all") list = list.filter((k) => k.category === tab);
    if (search.trim())
      list = list.filter((k) =>
        k.keyword.includes(search.toLowerCase().trim())
      );
    return [...list].sort((a, b) => {
      const av =
        a[sortKey] ?? (sortDir === "desc" ? -Infinity : Infinity);
      const bv =
        b[sortKey] ?? (sortDir === "desc" ? -Infinity : Infinity);
      return sortDir === "desc"
        ? (bv as number) - (av as number)
        : (av as number) - (bv as number);
    });
  }, [keywords, tab, search, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  function SortBtn({ col }: { col: SortKey }) {
    const active = sortKey === col;
    return (
      <button
        onClick={() => toggleSort(col)}
        className={`ml-1 text-[10px] ${
          active ? "text-blue-500" : "text-slate-300"
        }`}
      >
        {active ? (sortDir === "desc" ? "↓" : "↑") : "↕"}
      </button>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                tab === t.key
                  ? "bg-slate-900 text-white"
                  : "text-slate-500 hover:bg-slate-100"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filtrer..."
          className="border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-400 w-48"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-50">
              <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">
                Mot-clé
              </th>
              <th className="text-center px-3 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">
                Vol. <SortBtn col="search_volume" />
              </th>
              <th className="text-center px-3 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">
                Tendance 12m
              </th>
              <th className="text-center px-3 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">
                KD <SortBtn col="keyword_difficulty" />
              </th>
              <th className="text-center px-3 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">
                Competition
              </th>
              <th className="text-center px-3 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">
                CPC <SortBtn col="cpc" />
              </th>
              <th className="text-center px-3 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">
                Evol. <SortBtn col="trend_yearly" />
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.map((kw) => {
              const sparkData = MONTH_KEYS.map((key) => ({
                v: kw.monthly_searches[key] ?? 0,
              }));
              const vol = kw.search_volume;
              const volFmt =
                vol >= 1000 ? `${(vol / 1000).toFixed(1)}k` : String(vol);
              return (
                <tr
                  key={kw.keyword}
                  className="hover:bg-slate-50/60 transition-colors"
                >
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ background: CATEGORY_COLORS[kw.category] }}
                      />
                      <span className="font-medium text-slate-800 text-sm">
                        {kw.keyword}
                      </span>
                      <IntentBadge intent={kw.intent} />
                    </div>
                  </td>
                  <td className="px-3 py-3 text-center">
                    <span className="text-sm font-bold text-slate-800">
                      {volFmt}
                    </span>
                    <span className="text-xs text-slate-400">/mois</span>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex justify-center">
                      <Sparkline data={sparkData} />
                    </div>
                  </td>
                  <td className="px-3 py-3 text-center">
                    <KdBadge score={kw.keyword_difficulty} />
                  </td>
                  <td className="px-3 py-3 text-center">
                    <CompBadge level={kw.competition_level} />
                  </td>
                  <td className="px-3 py-3 text-center text-xs font-semibold text-slate-700">
                    {kw.cpc ? `${kw.cpc.toFixed(2)}€` : "—"}
                  </td>
                  <td className="px-3 py-3 text-center">
                    <TrendCell value={kw.trend_yearly} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="px-6 py-3 border-t border-slate-50">
        <p className="text-xs text-slate-400">
          {filtered.length} mot(s)-clé(s) affiché(s)
        </p>
      </div>
    </div>
  );
}
