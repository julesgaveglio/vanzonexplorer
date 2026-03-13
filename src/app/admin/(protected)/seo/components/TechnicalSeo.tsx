"use client";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface VitalMetric {
  value: string;
  score: number | null;
}

interface TechnicalData {
  scores?: {
    performance: number;
    seo: number;
    accessibility: number;
    bestPractices: number;
  };
  vitals?: {
    lcp: VitalMetric;
    cls: VitalMetric;
    tbt: VitalMetric;
    fcp: VitalMetric;
    si: VitalMetric;
    tti: VitalMetric;
  };
  opportunities?: Array<{ id: string; title: string; displayValue: string; savingsMs: number }>;
  diagnostics?: Array<{ id: string; title: string; score: number | null; displayValue: string }>;
  error?: string;
}

function scoreColor(score: number) {
  if (score >= 90) return "text-emerald-600 bg-emerald-50";
  if (score >= 50) return "text-amber-600 bg-amber-50";
  return "text-red-600 bg-red-50";
}

function vitalColor(score: number | null) {
  if (score === null) return "bg-slate-100 text-slate-500";
  if (score >= 0.9) return "bg-emerald-100 text-emerald-700";
  if (score >= 0.5) return "bg-amber-100 text-amber-700";
  return "bg-red-100 text-red-700";
}

export function TechnicalSeo() {
  const { data, isLoading } = useSWR<TechnicalData>(
    "/api/admin/seo/technical",
    fetcher,
    { refreshInterval: 3600000 }
  );

  const scoreItems = [
    { label: "Performance", key: "performance" as const, icon: "⚡" },
    { label: "SEO", key: "seo" as const, icon: "🔍" },
    { label: "Accessibilité", key: "accessibility" as const, icon: "♿" },
    { label: "Bonnes pratiques", key: "bestPractices" as const, icon: "✅" },
  ];

  const vitalItems = [
    { label: "LCP", key: "lcp" as const, desc: "Largest Contentful Paint" },
    { label: "CLS", key: "cls" as const, desc: "Cumulative Layout Shift" },
    { label: "TBT", key: "tbt" as const, desc: "Total Blocking Time" },
    { label: "FCP", key: "fcp" as const, desc: "First Contentful Paint" },
    { label: "SI", key: "si" as const, desc: "Speed Index" },
    { label: "TTI", key: "tti" as const, desc: "Time to Interactive" },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-50 flex items-center gap-2">
        <span>🔧</span>
        <h2 className="font-bold text-slate-900">SEO Technique</h2>
        <span className="text-xs bg-blue-100 text-blue-600 font-semibold px-2 py-0.5 rounded-full ml-auto">
          Lighthouse
        </span>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-10">
          <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : data?.error ? (
        <p className="px-6 py-8 text-center text-slate-400 text-sm">{data.error}</p>
      ) : (
        <div className="p-6 space-y-5">
          {/* Scores Lighthouse */}
          <div className="grid grid-cols-2 gap-3">
            {scoreItems.map(({ label, key, icon }) => {
              const val = data?.scores?.[key] ?? 0;
              return (
                <div key={key} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
                  <span className="text-lg">{icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-500 truncate">{label}</p>
                    <p className={`text-lg font-black rounded px-1 inline-block ${scoreColor(val)}`}>
                      {val}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Core Web Vitals */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
              Core Web Vitals
            </p>
            <div className="grid grid-cols-2 gap-2">
              {vitalItems.map(({ label, key, desc }) => {
                const vital = data?.vitals?.[key];
                return (
                  <div key={key} className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
                    <div>
                      <p className="text-xs font-bold text-slate-700">{label}</p>
                      <p className="text-xs text-slate-400">{desc}</p>
                    </div>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${vitalColor(vital?.score ?? null)}`}>
                      {vital?.value ?? "--"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top opportunités */}
          {data?.opportunities && data.opportunities.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                Opportunités
              </p>
              <div className="space-y-1">
                {data.opportunities.slice(0, 3).map((opp) => (
                  <div key={opp.id} className="flex items-center gap-2 text-xs text-slate-600">
                    <span className="text-amber-500">•</span>
                    <span className="flex-1 truncate">{opp.title}</span>
                    <span className="text-slate-400 shrink-0">{opp.displayValue}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
