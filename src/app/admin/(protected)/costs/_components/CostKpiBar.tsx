import type { ReactNode } from "react";

interface KpiBarProps {
  kpis: {
    allTime: number;
    thisMonth: number;
    thisWeek: number;
    avgPerBlogArticle: number;
  };
}

interface KpiCardProps {
  label: string;
  value: string;
  sub?: string;
  accent: string;
  icon: ReactNode;
}

function KpiCard({ label, value, sub, accent, icon }: KpiCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-5 py-4 flex items-start gap-4">
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: `${accent}15` }}
      >
        <span style={{ color: accent }}>{icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-0.5">{label}</p>
        <p className="text-2xl font-black text-slate-900">{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function formatCost(value: number): string {
  if (value === 0) return "€0.00";
  if (value < 0.01) return `€${value.toFixed(4)}`;
  return `€${value.toFixed(2)}`;
}

export default function CostKpiBar({ kpis }: KpiBarProps) {
  const now = new Date();
  const monthName = now.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <KpiCard
        label="Total all time"
        value={formatCost(kpis.allTime)}
        sub="depuis le début"
        accent="#6366F1"
        icon={
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        }
      />
      <KpiCard
        label="Ce mois"
        value={formatCost(kpis.thisMonth)}
        sub={monthName}
        accent="#10B981"
        icon={
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        }
      />
      <KpiCard
        label="Cette semaine"
        value={formatCost(kpis.thisWeek)}
        sub="7 derniers jours"
        accent="#F59E0B"
        icon={
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        }
      />
      <KpiCard
        label="Coût moyen / article blog"
        value={formatCost(kpis.avgPerBlogArticle)}
        sub="blog-writer agent"
        accent="#EF4444"
        icon={
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        }
      />
    </div>
  );
}
