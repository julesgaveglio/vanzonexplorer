"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { RefreshCw } from "lucide-react";

interface StepCounts {
  [key: string]: number;
}

interface ConversionRate {
  from: string;
  to: string;
  rate: number;
}

interface UTMEntry {
  source: string;
  campaign: string;
  count: number;
}

interface RecentEvent {
  event: string;
  email: string | null;
  created_at: string;
  utm_source: string | null;
}

interface FunnelData {
  period_days: number;
  step_counts: StepCounts;
  conversion_rates: ConversionRate[];
  utm_breakdown: UTMEntry[];
  recent_events: RecentEvent[];
  overall_conversion: number;
  total_events: number;
}

const STEP_LABELS: Record<string, string> = {
  optin: "Opt-in (Lead)",
  vsl_view: "VSL vue",
  vsl_25: "VSL 25%",
  vsl_50: "VSL 50%",
  vsl_75: "VSL 75%",
  vsl_100: "VSL 100%",
  booking_start: "Booking ouvert",
  booking_confirmed: "Call confirmé",
  checkout: "Checkout",
  purchase: "Achat",
};

const STEP_COLORS: Record<string, string> = {
  optin: "bg-blue-500",
  vsl_view: "bg-cyan-500",
  vsl_25: "bg-cyan-400",
  vsl_50: "bg-cyan-300",
  vsl_75: "bg-teal-400",
  vsl_100: "bg-teal-500",
  booking_start: "bg-amber-400",
  booking_confirmed: "bg-amber-500",
  checkout: "bg-orange-500",
  purchase: "bg-emerald-500",
};

const EVENT_ICONS: Record<string, string> = {
  optin: "📧",
  vsl_view: "🎥",
  vsl_25: "⏱",
  vsl_50: "⏱",
  vsl_75: "⏱",
  vsl_100: "✅",
  booking_start: "📅",
  booking_confirmed: "📞",
  checkout: "💳",
  purchase: "🎉",
};

export default function FunnelDashboardClient() {
  const [data, setData] = useState<FunnelData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [days, setDays] = useState(30);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = useCallback((silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    fetch(`/api/admin/funnel?days=${days}`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLastRefresh(new Date()); })
      .finally(() => { setLoading(false); setRefreshing(false); });
  }, [days]);

  useEffect(() => {
    fetchData();
    intervalRef.current = setInterval(() => fetchData(true), 30000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [fetchData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) return <p className="text-slate-500">Erreur de chargement.</p>;

  const maxCount = Math.max(...Object.values(data.step_counts), 1);

  return (
    <div className="space-y-6">
      {/* Period selector + summary */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {[7, 14, 30, 90].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                days === d
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {d}j
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
            {refreshing ? "" : "Actualiser"}
          </button>
          <div className="text-right">
            <p className="text-sm text-slate-400">{data.total_events} événements</p>
            {lastRefresh && (
              <p className="text-xs text-slate-300">
                MAJ {lastRefresh.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Leads
          </p>
          <p className="text-3xl font-black text-slate-900 mt-1">
            {data.step_counts.optin ?? 0}
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Calls bookés
          </p>
          <p className="text-3xl font-black text-slate-900 mt-1">
            {data.step_counts.booking_confirmed ?? 0}
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Achats
          </p>
          <p className="text-3xl font-black text-emerald-600 mt-1">
            {data.step_counts.purchase ?? 0}
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Taux global
          </p>
          <p className="text-3xl font-black text-slate-900 mt-1">
            {data.overall_conversion}%
          </p>
          <p className="text-xs text-slate-400">lead → achat</p>
        </div>
      </div>

      {/* Funnel visualization */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-6">
          Tunnel de conversion
        </h2>
        <div className="space-y-3">
          {Object.entries(STEP_LABELS).map(([step, label]) => {
            const count = data.step_counts[step] ?? 0;
            const width = maxCount > 0 ? (count / maxCount) * 100 : 0;
            const convRate = data.conversion_rates.find(
              (c) => c.to === step
            );

            return (
              <div key={step} className="flex items-center gap-3">
                <span className="text-lg w-6 text-center flex-shrink-0">
                  {EVENT_ICONS[step] ?? "•"}
                </span>
                <span className="text-sm text-slate-600 w-32 flex-shrink-0 truncate">
                  {label}
                </span>
                <div className="flex-1 bg-slate-100 rounded-full h-6 relative overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      STEP_COLORS[step] ?? "bg-slate-400"
                    }`}
                    style={{ width: `${Math.max(width, count > 0 ? 2 : 0)}%` }}
                  />
                  {count > 0 && (
                    <span className="absolute inset-y-0 left-2 flex items-center text-xs font-bold text-white drop-shadow">
                      {count}
                    </span>
                  )}
                </div>
                {convRate && (
                  <span
                    className={`text-xs font-semibold w-12 text-right flex-shrink-0 ${
                      convRate.rate >= 50
                        ? "text-emerald-600"
                        : convRate.rate >= 20
                          ? "text-amber-600"
                          : "text-red-500"
                    }`}
                  >
                    {convRate.rate}%
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* UTM Attribution */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">
            Attribution (sources)
          </h2>
          {data.utm_breakdown.length === 0 ? (
            <p className="text-sm text-slate-400">Aucune donnée UTM encore.</p>
          ) : (
            <div className="space-y-2">
              {data.utm_breakdown.map((u, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0"
                >
                  <div>
                    <span className="text-sm font-medium text-slate-700">
                      {u.source}
                    </span>
                    <span className="text-xs text-slate-400 ml-2">
                      {u.campaign}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-slate-900">
                    {u.count} leads
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent events */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">
            Événements récents
          </h2>
          {data.recent_events.length === 0 ? (
            <p className="text-sm text-slate-400">Aucun événement encore.</p>
          ) : (
            <div className="space-y-1.5 max-h-96 overflow-y-auto">
              {data.recent_events.map((e, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 py-1.5 text-sm"
                >
                  <span className="text-base flex-shrink-0">
                    {EVENT_ICONS[e.event] ?? "•"}
                  </span>
                  <span className="text-slate-600 flex-1 truncate">
                    {STEP_LABELS[e.event] ?? e.event}
                    {e.email && (
                      <span className="text-slate-400 ml-1">
                        — {e.email}
                      </span>
                    )}
                  </span>
                  <span className="text-xs text-slate-400 flex-shrink-0">
                    {new Date(e.created_at).toLocaleString("fr-FR", {
                      day: "2-digit",
                      month: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
