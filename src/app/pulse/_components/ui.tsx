"use client";

export const PERIODS = [
  { key: "day", label: "Jour" },
  { key: "week", label: "Semaine" },
  { key: "month", label: "Mois" },
  { key: "year", label: "Année" },
];

export const BLUE_GRADIENT = "linear-gradient(135deg, #3B82F6 0%, #0EA5E9 100%)";

export const CHANNEL_COLORS: Record<string, string> = {
  organic: "#10B981",
  "google-ads": "#3B82F6",
  "meta-ads": "#8B5CF6",
  "meta-organic": "#A78BFA",
  referral: "#F59E0B",
  campaign: "#EC4899",
  direct: "#94A3B8",
};

export function PeriodSelector({ value, onChange }: { value: string; onChange: (p: string) => void }) {
  return (
    <div className="flex gap-1.5 bg-slate-100 rounded-full p-1">
      {PERIODS.map((p) => (
        <button
          key={p.key}
          onClick={() => onChange(p.key)}
          className="flex-1 py-1.5 rounded-full text-[13px] font-semibold transition-colors"
          style={value === p.key ? { background: "#fff", color: "#2563EB", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" } : { color: "#64748B" }}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-3xl border border-slate-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] p-5 ${className}`}>
      {children}
    </div>
  );
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">{children}</h2>;
}

export function pct(n: number) {
  return `${(n * 100).toFixed(1)}%`;
}

export function fmt(n: number) {
  return n.toLocaleString("fr-FR");
}

// Sparkline SVG minimaliste
export function Sparkline({ data, height = 44 }: { data: number[]; height?: number }) {
  if (data.length === 0) return null;
  const max = Math.max(...data, 1);
  const w = 100;
  const step = data.length > 1 ? w / (data.length - 1) : w;
  const points = data.map((v, i) => `${i * step},${height - (v / max) * (height - 6) - 3}`).join(" ");
  const area = `0,${height} ${points} ${w},${height}`;
  return (
    <svg viewBox={`0 0 ${w} ${height}`} preserveAspectRatio="none" className="w-full" style={{ height }}>
      <defs>
        <linearGradient id="spark" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill="url(#spark)" />
      <polyline points={points} fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

export function DeltaBadge({ delta }: { delta: number }) {
  const up = delta >= 0;
  return (
    <span
      className="inline-flex items-center gap-0.5 text-xs font-bold px-2 py-0.5 rounded-full"
      style={{ color: up ? "#059669" : "#DC2626", background: up ? "#ECFDF5" : "#FEF2F2" }}
    >
      {up ? "▲" : "▼"} {Math.abs(delta * 100).toFixed(0)}%
    </span>
  );
}
