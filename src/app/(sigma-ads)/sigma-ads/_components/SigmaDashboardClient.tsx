"use client";

import { useState, useEffect, useCallback } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { useSigmaCampaign } from "./SigmaCampaignContext";

interface FunnelData {
  funnel: Record<string, number>;
  daily: { date: string; page_view: number; optin: number; booking_confirmed: number }[];
  sources: { source: string; count: number }[];
}

const FUNNEL_ORDER = [
  "page_view", "optin", "vsl_view", "vsl_25", "vsl_50", "vsl_75", "vsl_100",
  "booking_start", "booking_confirmed",
];

const STEP_LABELS: Record<string, string> = {
  page_view: "Pages vues",
  optin: "Opt-ins",
  vsl_view: "VSL vues",
  vsl_25: "VSL 25%",
  vsl_50: "VSL 50%",
  vsl_75: "VSL 75%",
  vsl_100: "VSL 100%",
  booking_start: "Calendly ouvert",
  booking_confirmed: "RDV confirme",
};

const FUNNEL_SHADES: Record<string, string> = {
  page_view: "#E2D5C3",
  optin: "#D4C4A8",
  vsl_view: "#C6B38E",
  vsl_25: "#B9945F",
  vsl_50: "#A8844F",
  vsl_75: "#97743F",
  vsl_100: "#866430",
  booking_start: "#755420",
  booking_confirmed: "#644410",
};

export default function SigmaDashboardClient() {
  const { activeCampaignId, buildQS, loading: campLoading } = useSigmaCampaign();
  const [data, setData] = useState<FunnelData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const qs = buildQS();
      const res = await fetch(`/api/sigma/funnel?${qs}`);
      const json = await res.json();
      setData(json);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [buildQS]);

  useEffect(() => {
    if (!campLoading) fetchData();
  }, [activeCampaignId, campLoading, fetchData]);

  const funnel = data?.funnel ?? {};
  const maxStep = Math.max(...FUNNEL_ORDER.map((s) => funnel[s] ?? 0), 1);

  // Conversion rates between consecutive steps
  const conversionRates = FUNNEL_ORDER.slice(1).map((step, i) => {
    const prev = FUNNEL_ORDER[i];
    const prevCount = funnel[prev] ?? 0;
    const count = funnel[step] ?? 0;
    const rate = prevCount > 0 ? Math.round((count / prevCount) * 100 * 10) / 10 : 0;
    return { from: STEP_LABELS[prev], to: STEP_LABELS[step], rate };
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <button
          onClick={fetchData}
          disabled={loading}
          className="px-3 py-2 text-sm text-slate-500 hover:text-slate-700 bg-white border border-slate-200 rounded-xl transition-colors disabled:opacity-50"
        >
          {loading ? (
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" strokeDasharray="30 70" /></svg>
          ) : (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          )}
        </button>
      </div>

      {loading && !data ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#B9945F]" />
        </div>
      ) : (
        <>
          {/* KPI cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KPICard label="Pages vues" value={funnel.page_view ?? 0} color="slate" />
            <KPICard label="Opt-ins" value={funnel.optin ?? 0} color="gold" />
            <KPICard label="VSL vues" value={funnel.vsl_view ?? 0} color="slate" />
            <KPICard label="RDV confirmes" value={funnel.booking_confirmed ?? 0} color="emerald" />
          </div>

          {/* Conversion rates */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5">
            <h3 className="text-slate-900 font-semibold mb-4">Taux de conversion</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {conversionRates.filter((c) => c.rate > 0 || (funnel[FUNNEL_ORDER[0]] ?? 0) > 0).slice(0, 8).map((c, i) => (
                <div key={i} className="bg-slate-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-slate-500 mb-1 truncate">{c.from} → {c.to}</p>
                  <p className="text-lg font-bold text-slate-900">{c.rate}%</p>
                </div>
              ))}
            </div>
          </div>

          {/* Chart */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5">
            <h3 className="text-slate-900 font-semibold mb-4">Tendances quotidiennes</h3>
            <div className="h-56 sm:h-72">
              {data?.daily && data.daily.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.daily} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <defs>
                      <linearGradient id="sigmaGradGold" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#B9945F" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#B9945F" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="sigmaGradEmerald" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis
                      dataKey="date"
                      tick={{ fill: "#94A3B8", fontSize: 11 }}
                      tickFormatter={(v: string) => { const d = new Date(v); return `${d.getDate()}/${d.getMonth() + 1}`; }}
                      axisLine={{ stroke: "#E2E8F0" }}
                      tickLine={false}
                    />
                    <YAxis tick={{ fill: "#94A3B8", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#fff", border: "1px solid #E2E8F0", borderRadius: "12px", color: "#1E293B", fontSize: 13, boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
                      labelFormatter={(v) => new Date(String(v)).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                    />
                    <Area type="monotone" dataKey="optin" name="Opt-ins" stroke="#B9945F" strokeWidth={2} fill="url(#sigmaGradGold)" />
                    <Area type="monotone" dataKey="booking_confirmed" name="RDV" stroke="#10B981" strokeWidth={2} fill="url(#sigmaGradEmerald)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-slate-400 text-sm">Aucune donnee sur la periode</div>
              )}
            </div>
          </div>

          {/* Source breakdown */}
          {(data?.sources ?? []).length > 0 && (
            <div className="bg-white border border-slate-200 rounded-2xl p-5">
              <h3 className="text-slate-900 font-semibold mb-4">Sources des leads</h3>
              <div className="space-y-3">
                {data!.sources.map((s, i) => {
                  const total = data!.sources.reduce((sum, x) => sum + x.count, 0);
                  const pct = total > 0 ? Math.round((s.count / total) * 100) : 0;
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-sm font-medium text-slate-700 w-24 shrink-0">{s.source}</span>
                      <div className="flex-1 h-8 bg-slate-100 rounded-lg overflow-hidden relative">
                        <div
                          className="h-full rounded-lg transition-all duration-500"
                          style={{
                            width: `${Math.max(pct, 4)}%`,
                            backgroundColor: "#B9945F",
                          }}
                        />
                        <div className="absolute inset-0 flex items-center px-3 justify-between">
                          <span className="text-xs font-bold text-white drop-shadow">{s.count}</span>
                          <span className="text-xs font-semibold text-slate-600">{pct}%</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Funnel */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5">
            <h3 className="text-slate-900 font-semibold mb-4">Funnel de conversion</h3>
            <div className="space-y-2">
              {FUNNEL_ORDER.map((step) => {
                const count = funnel[step] ?? 0;
                const pct = maxStep > 0 ? (count / maxStep) * 100 : 0;
                return (
                  <div key={step} className="flex items-center gap-3">
                    <span className="text-[10px] sm:text-xs text-slate-500 w-20 sm:w-28 shrink-0 text-right font-medium">{STEP_LABELS[step] ?? step}</span>
                    <div className="flex-1 h-8 bg-slate-100 rounded-lg overflow-hidden relative">
                      <div
                        className="h-full rounded-lg transition-all duration-700"
                        style={{
                          width: `${Math.max(pct, count > 0 ? 2 : 0)}%`,
                          backgroundColor: FUNNEL_SHADES[step] ?? "#94A3B8",
                        }}
                      />
                      <div className="absolute inset-0 flex items-center px-3 justify-between">
                        <span className="text-xs font-bold text-white drop-shadow">{count}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function KPICard({ label, value, color }: { label: string; value: string | number; color: "slate" | "gold" | "emerald" }) {
  const accents = {
    slate: { text: "text-slate-700", ring: "ring-slate-100" },
    gold: { text: "text-[#B9945F]", ring: "ring-[#B9945F]/10" },
    emerald: { text: "text-emerald-600", ring: "ring-emerald-100" },
  };
  const a = accents[color];
  return (
    <div className={`bg-white border border-slate-200 rounded-2xl p-5 ring-1 ${a.ring}`}>
      <p className="text-xs text-slate-500 uppercase tracking-wider font-medium mb-1">{label}</p>
      <p className={`text-2xl sm:text-3xl font-bold ${a.text}`}>{typeof value === "number" ? value.toLocaleString("fr-FR") : value}</p>
    </div>
  );
}
