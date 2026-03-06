"use client";

interface Bucket {
  label: string;
  count: number;
  color: string;
  bg: string;
}

interface PositionMetrics {
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

interface PositionChartProps {
  metrics: PositionMetrics;
  total: number;
}

export function PositionChart({ metrics, total }: PositionChartProps) {
  const buckets: Bucket[] = [
    { label: "Top 3", count: metrics.pos_2_3 ?? 0, color: "#10B981", bg: "#D1FAE5" },
    { label: "4–10", count: metrics.pos_4_10 ?? 0, color: "#3B82F6", bg: "#DBEAFE" },
    { label: "11–20", count: metrics.pos_11_20 ?? 0, color: "#8B5CF6", bg: "#EDE9FE" },
    { label: "21–30", count: metrics.pos_21_30 ?? 0, color: "#F59E0B", bg: "#FEF3C7" },
    {
      label: "31–50",
      count: (metrics.pos_31_40 ?? 0) + (metrics.pos_41_50 ?? 0),
      color: "#F97316",
      bg: "#FED7AA",
    },
    {
      label: "50+",
      count:
        (metrics.pos_51_60 ?? 0) +
        (metrics.pos_61_70 ?? 0) +
        (metrics.pos_71_80 ?? 0) +
        (metrics.pos_81_90 ?? 0) +
        (metrics.pos_91_100 ?? 0),
      color: "#94A3B8",
      bg: "#F1F5F9",
    },
  ];

  const maxCount = Math.max(...buckets.map((b) => b.count), 1);

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
      <h2 className="font-bold text-slate-900 mb-5">Distribution des positions</h2>
      <div className="space-y-3">
        {buckets.map((bucket) => (
          <div key={bucket.label} className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-500 w-14 text-right shrink-0">
              {bucket.label}
            </span>
            <div
              className="flex-1 h-7 rounded-lg overflow-hidden"
              style={{ background: bucket.bg }}
            >
              <div
                className="h-full rounded-lg transition-all duration-700"
                style={{
                  width: `${(bucket.count / maxCount) * 100}%`,
                  background: bucket.color,
                  minWidth: bucket.count > 0 ? "4px" : "0",
                }}
              />
            </div>
            <span className="text-sm font-bold text-slate-700 w-8 shrink-0">
              {bucket.count}
            </span>
          </div>
        ))}
      </div>
      <p className="text-xs text-slate-400 mt-4 text-center">{total} mots-clés total</p>
    </div>
  );
}
