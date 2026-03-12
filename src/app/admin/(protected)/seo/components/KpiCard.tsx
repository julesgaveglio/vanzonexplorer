"use client";

type Trend = "up" | "down" | "neutral";

interface KpiCardProps {
  label: string;
  value: string | number;
  sub?: string;
  trend?: Trend;
  trendValue?: string;
  icon?: string;
  gradient?: string;
}

export function KpiCard({
  label,
  value,
  sub,
  trend,
  trendValue,
  icon,
  gradient = "from-blue-500 to-sky-400",
}: KpiCardProps) {
  const trendColor =
    trend === "up"
      ? "text-emerald-500"
      : trend === "down"
      ? "text-red-400"
      : "text-slate-400";
  const trendIcon = trend === "up" ? "↑" : trend === "down" ? "↓" : "—";

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
      <div
        className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-xl mb-4 shadow-sm`}
      >
        {icon}
      </div>
      <p className="text-3xl font-black text-slate-900">{value}</p>
      <p className="text-sm font-semibold text-slate-700 mt-1">{label}</p>
      <div className="flex items-center gap-2 mt-1">
        {sub && <p className="text-xs text-slate-400">{sub}</p>}
        {trendValue && (
          <span className={`text-xs font-bold ${trendColor}`}>
            {trendIcon} {trendValue}
          </span>
        )}
      </div>
    </div>
  );
}
