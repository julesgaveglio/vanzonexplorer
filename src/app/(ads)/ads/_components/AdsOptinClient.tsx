"use client";

import { useState, useEffect, useCallback } from "react";
import AdsTitlesClient from "./AdsTitlesClient";
import { useCampaign } from "./CampaignContext";

interface PageData {
  slug: string;
  label: string;
  views: number;
  optins: number;
  rate: number;
}

interface OptinData {
  pages: PageData[];
  total: { views: number; optins: number; rate: number };
  daily: Record<string, unknown>[];
}

const PERIODS = [
  { label: "7j", days: 7 },
  { label: "14j", days: 14 },
  { label: "30j", days: 30 },
  { label: "90j", days: 90 },
] as const;

export default function AdsOptinClient() {
  const { activeCampaign, activeCampaignId, campaigns } = useCampaign();
  const [period, setPeriod] = useState(30);
  const [data, setData] = useState<OptinData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const qs = activeCampaign
        ? `start=${activeCampaign.start_date}${activeCampaign.end_date ? `&end=${activeCampaign.end_date}` : ""}`
        : `days=${period}`;
      const res = await fetch(`/api/ads/optin?${qs}`);
      const json = await res.json();
      setData(json);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [period, activeCampaign]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="space-y-6">
      {/* Top bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-900">Opt-in</h1>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex bg-white rounded-xl border border-slate-200 p-0.5 shadow-sm">
            {PERIODS.map((p) => (
              <button
                key={p.days}
                onClick={() => setPeriod(p.days)}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${
                  period === p.days
                    ? "bg-slate-900 text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading && !data ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900" />
        </div>
      ) : (
        <>
          {/* KPIs globaux */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <KPICard
              label="Opt-in vues"
              value={data?.total.views ?? 0}
              color="sky"
            />
            <KPICard
              label="Leads"
              value={data?.total.optins ?? 0}
              color="blue"
            />
            <KPICard
              label="Taux conversion"
              value={`${data?.total.rate ?? 0}%`}
              color="emerald"
            />
          </div>

          {/* Comparaison par version */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <h2 className="text-base font-semibold text-slate-900">
                Comparaison par version
              </h2>
            </div>
            <div className="divide-y divide-slate-100">
              {(data?.pages ?? []).map((p) => (
                <div
                  key={p.slug}
                  className="flex flex-col sm:flex-row sm:items-center justify-between px-5 py-4 gap-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {p.label}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      /van-business-academy/inscription
                    </p>
                  </div>
                  <div className="flex items-center gap-6 text-right">
                    <div>
                      <p className="text-xs text-slate-400">Opt-in vues</p>
                      <p className="text-lg font-bold text-slate-900">
                        {p.views}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Leads</p>
                      <p className="text-lg font-bold text-blue-600">
                        {p.optins}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Taux</p>
                      <p
                        className={`text-lg font-bold ${
                          p.rate >= 20
                            ? "text-emerald-600"
                            : p.rate >= 10
                              ? "text-amber-600"
                              : "text-slate-600"
                        }`}
                      >
                        {p.rate}%
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* A/B Test Titres — intégré dans la page Opt-in */}
          <AdsTitlesClient />
        </>
      )}
    </div>
  );
}

function KPICard({
  label,
  value,
  color,
}: {
  label: string;
  value: string | number;
  color: string;
}) {
  const colors: Record<string, string> = {
    sky: "from-sky-50 to-sky-100/50 border-sky-200",
    blue: "from-blue-50 to-blue-100/50 border-blue-200",
    emerald: "from-emerald-50 to-emerald-100/50 border-emerald-200",
  };

  const textColors: Record<string, string> = {
    sky: "text-sky-700",
    blue: "text-blue-700",
    emerald: "text-emerald-700",
  };

  return (
    <div
      className={`bg-gradient-to-br ${colors[color] ?? colors.sky} border rounded-2xl p-4 sm:p-5`}
    >
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className={`text-2xl sm:text-3xl font-bold ${textColors[color] ?? textColors.sky}`}>
        {value}
      </p>
    </div>
  );
}
