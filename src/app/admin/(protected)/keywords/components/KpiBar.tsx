import { KeywordData } from "../data/keywords";

interface Props {
  keywords: KeywordData[];
}

export function KpiBar({ keywords }: Props) {
  const totalVolume = keywords.reduce((sum, k) => sum + k.search_volume, 0);
  const quickWins = keywords.filter(
    (k) =>
      k.category === "quick-win" ||
      k.competition_level === "LOW" ||
      (k.keyword_difficulty !== null && k.keyword_difficulty < 40)
  ).length;

  const kpis = [
    {
      label: "Keywords trackés",
      value: keywords.length,
      sub: "Pays Basque · Van",
      icon: "🎯",
      gradient: "from-blue-500 to-sky-400",
    },
    {
      label: "Quick Wins",
      value: quickWins,
      sub: "Faible concurrence",
      icon: "⚡",
      gradient: "from-emerald-500 to-teal-400",
    },
    {
      label: "Volume cumulé",
      value:
        totalVolume >= 1000
          ? `${(totalVolume / 1000).toFixed(1)}k`
          : totalVolume,
      sub: "recherches / mois",
      icon: "📈",
      gradient: "from-violet-500 to-purple-400",
    },
    {
      label: "Pic saisonnier",
      value: "Juin — Août",
      sub: "×5 vs hiver",
      icon: "☀️",
      gradient: "from-amber-500 to-orange-400",
    },
  ];

  return (
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
      {kpis.map((kpi) => (
        <div
          key={kpi.label}
          className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 relative overflow-hidden"
        >
          <div
            className={`absolute top-0 right-0 w-24 h-24 rounded-full bg-gradient-to-br ${kpi.gradient} opacity-10 translate-x-8 -translate-y-8`}
          />
          <div className="text-2xl mb-2">{kpi.icon}</div>
          <div className="text-2xl font-black text-slate-900">{kpi.value}</div>
          <div className="text-sm font-semibold text-slate-700 mt-0.5">
            {kpi.label}
          </div>
          <div className="text-xs text-slate-400 mt-0.5">{kpi.sub}</div>
        </div>
      ))}
    </div>
  );
}
