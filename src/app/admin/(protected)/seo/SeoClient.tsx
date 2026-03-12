"use client";
import useSWR from "swr";
import { KpiCard } from "./components/KpiCard";
import { PositionChart } from "./components/PositionChart";
import { KeywordsTable } from "./components/KeywordsTable";
import { QuickWins } from "./components/QuickWins";
import { CompetitorsTable } from "./components/CompetitorsTable";
import { SerpChecker } from "./components/SerpChecker";
import { KeywordIdeas } from "./components/KeywordIdeas";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface OrganicMetrics {
  count?: number;
  etv?: number;
  is_new?: number;
  is_up?: number;
  is_down?: number;
  is_lost?: number;
  pos_2_3?: number;
  pos_4_10?: number;
  pos_11_20?: number;
  pos_21_30?: number;
  pos_31_40?: number;
  pos_41_50?: number;
  pos_51_60?: number;
  pos_61_70?: number;
  pos_71_80?: number;
  pos_81_90?: number;
  pos_91_100?: number;
}

export default function SeoClient() {
  const { data: overview, isLoading, mutate } = useSWR(
    "/api/admin/seo/overview",
    fetcher,
    { refreshInterval: 1800000 }
  );

  const metrics: OrganicMetrics = overview?.metrics?.organic ?? {};
  const total = metrics.count ?? 0;
  const etv = Math.round(metrics.etv ?? 0);
  const isNew = metrics.is_new ?? 0;
  const isUp = metrics.is_up ?? 0;
  const isDown = metrics.is_down ?? 0;
  const isLost = metrics.is_lost ?? 0;
  const top10 = (metrics.pos_2_3 ?? 0) + (metrics.pos_4_10 ?? 0);

  const kpis = [
    {
      label: "Mots-clés positionnés",
      value: total,
      sub: `${isNew} nouveaux`,
      trend: (isUp > isDown ? "up" : "down") as "up" | "down",
      trendValue: `${isUp}↑ ${isDown}↓`,
      icon: "📊",
      gradient: "from-blue-500 to-sky-400",
    },
    {
      label: "Top 10 Google",
      value: top10,
      sub: `${metrics.pos_2_3 ?? 0} en top 3`,
      icon: "🏆",
      gradient: "from-emerald-500 to-teal-400",
    },
    {
      label: "Trafic estimé/mois",
      value: etv,
      sub: "visites organiques",
      icon: "📈",
      gradient: "from-violet-500 to-purple-400",
    },
    {
      label: "KWs perdus",
      value: isLost,
      sub: "à récupérer",
      trend: (isLost > 20 ? "down" : "neutral") as "down" | "neutral",
      icon: "⚠️",
      gradient: "from-amber-500 to-orange-400",
    },
  ];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <p className="text-slate-400 text-sm font-medium mb-1">SEO Analytics</p>
          <h1 className="text-3xl font-black text-slate-900">
            Tableau de bord SEO
          </h1>
          <p className="text-slate-500 mt-1">
            vanzonexplorer.com · France · Données en direct DataForSEO
          </p>
        </div>
        <button
          onClick={() => mutate()}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50"
        >
          <svg
            className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Actualiser
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.label} {...kpi} />
        ))}
      </div>

      {/* Row 2: Position chart + Quick Wins */}
      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <PositionChart metrics={metrics} total={total} />
        <QuickWins />
      </div>

      {/* Row 3: Keywords Table */}
      <div className="mb-6">
        <KeywordsTable />
      </div>

      {/* Row 4: Competitors + SERP Checker */}
      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <CompetitorsTable />
        <SerpChecker />
      </div>

      {/* Row 5: Keyword Ideas */}
      <div className="mb-6">
        <KeywordIdeas />
      </div>

      <p className="text-center text-xs text-slate-300 mt-8">
        Données fournies par DataForSEO · Rafraîchissement auto toutes les 30 min
      </p>
    </div>
  );
}
