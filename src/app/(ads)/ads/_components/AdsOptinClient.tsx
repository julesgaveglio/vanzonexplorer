"use client";

import { useState, useEffect, useCallback } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface Campaign {
  id: string;
  name: string;
  start_date: string;
  end_date: string | null;
  budget_euros: number | null;
  platform: string | null;
}

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
  const [period, setPeriod] = useState(30);
  const [data, setData] = useState<OptinData | null>(null);
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<string>("all");

  useEffect(() => {
    fetch("/api/ads/campaigns")
      .then((r) => r.json())
      .then((json) => setCampaigns(json.campaigns ?? []));
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const camp = campaigns.find((c) => c.id === selectedCampaign);
      const qs = camp
        ? `start=${camp.start_date}${camp.end_date ? `&end=${camp.end_date}` : ""}`
        : `days=${period}`;
      const res = await fetch(`/api/ads/optin?${qs}`);
      const json = await res.json();
      setData(json);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [period, selectedCampaign, campaigns]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const daily = (data?.daily ?? []).map((d: Record<string, unknown>) => {
    const date = d.date as string;
    const v1 = d.v1 as { views: number; optins: number } | undefined;
    const v2 = d.v2 as { views: number; optins: number } | undefined;
    return {
      date: date?.slice(5),
      "V1 vues": v1?.views ?? 0,
      "V1 leads": v1?.optins ?? 0,
      "V2 vues": v2?.views ?? 0,
      "V2 leads": v2?.optins ?? 0,
    };
  });

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
                onClick={() => { setSelectedCampaign("all"); setPeriod(p.days); }}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${
                  selectedCampaign === "all" && period === p.days
                    ? "bg-slate-900 text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <select
            value={selectedCampaign}
            onChange={(e) => setSelectedCampaign(e.target.value)}
            className="bg-white border border-slate-200 text-sm text-slate-700 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/30 shadow-sm"
          >
            <option value="all">Toutes les campagnes</option>
            {campaigns.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
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

          {/* Chart quotidien */}
          {daily.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <h2 className="text-base font-semibold text-slate-900 mb-4">
                Opt-in vues & leads par jour
              </h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={daily}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11, fill: "#94a3b8" }}
                    />
                    <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 12,
                        border: "1px solid #e2e8f0",
                        fontSize: 12,
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar
                      dataKey="V1 vues"
                      fill="#bae6fd"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="V1 leads"
                      fill="#0284c7"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="V2 vues"
                      fill="#fde68a"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="V2 leads"
                      fill="#b9945f"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
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
