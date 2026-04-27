"use client";

import { useState, useEffect, useCallback } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

/* ---------- types ---------- */
interface FunnelData {
  step_counts: Record<string, number>;
  conversion_rates: { from: string; to: string; rate: number }[];
  utm_breakdown: { source: string; campaign: string; count: number }[];
  recent_events: { event: string; email: string; created_at: string; utm_source: string }[];
  overall_conversion: number;
  view_to_optin: number;
  total_events: number;
  estimated_revenue: number;
  daily_breakdown: { date: string; page_view: number; optin: number; booking_confirmed: number; purchase: number }[];
}

interface Campaign {
  id: string;
  name: string;
  start_date: string;
  end_date: string | null;
  budget_euros: number | null;
  platform: string | null;
  notes: string | null;
}

const PERIODS = [
  { label: "7j", days: 7 },
  { label: "14j", days: 14 },
  { label: "30j", days: 30 },
  { label: "90j", days: 90 },
] as const;

const STEP_LABELS: Record<string, string> = {
  page_view: "Page vue",
  optin: "Opt-in",
  vsl_25: "VSL 25%",
  vsl_50: "VSL 50%",
  vsl_75: "VSL 75%",
  vsl_100: "VSL 100%",
  booking_start: "Booking start",
  booking_confirmed: "Call booke",
  checkout: "Checkout",
  purchase: "Achat",
};

const EVENT_COLORS: Record<string, string> = {
  page_view: "text-slate-400",
  optin: "text-blue-400",
  vsl_25: "text-indigo-400",
  vsl_50: "text-indigo-400",
  vsl_75: "text-violet-400",
  vsl_100: "text-violet-400",
  booking_start: "text-amber-400",
  booking_confirmed: "text-emerald-400",
  checkout: "text-emerald-400",
  purchase: "text-green-300",
};

/* ---------- component ---------- */
export default function AdsDashboardClient() {
  const [period, setPeriod] = useState(30);
  const [data, setData] = useState<FunnelData | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [showNewCampaign, setShowNewCampaign] = useState(false);
  const [newCampaign, setNewCampaign] = useState({ name: "", start_date: "", end_date: "", budget_euros: "", platform: "meta", notes: "" });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const camp = campaigns.find((c) => c.id === selectedCampaign);
      const qs = camp
        ? `start=${camp.start_date}${camp.end_date ? `&end=${camp.end_date}` : ""}`
        : `days=${period}`;

      const [funnelRes, campRes] = await Promise.all([
        fetch(`/api/ads/funnel?${qs}`),
        fetch("/api/ads/campaigns"),
      ]);
      const funnelJson = await funnelRes.json();
      const campJson = await campRes.json();
      setData(funnelJson);
      setCampaigns(campJson.campaigns ?? []);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [period, selectedCampaign, campaigns]);

  useEffect(() => {
    // Initial load of campaigns first
    fetch("/api/ads/campaigns")
      .then((r) => r.json())
      .then((json) => setCampaigns(json.campaigns ?? []));
  }, []);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, selectedCampaign]);

  const handleCreateCampaign = async () => {
    if (!newCampaign.name || !newCampaign.start_date) return;
    await fetch("/api/ads/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...newCampaign,
        budget_euros: newCampaign.budget_euros ? parseFloat(newCampaign.budget_euros) : null,
        end_date: newCampaign.end_date || null,
      }),
    });
    setShowNewCampaign(false);
    setNewCampaign({ name: "", start_date: "", end_date: "", budget_euros: "", platform: "meta", notes: "" });
    fetchData();
  };

  const sc = data?.step_counts ?? {};
  const optinRate = data?.view_to_optin ?? 0;
  const revenue = data?.estimated_revenue ?? 0;

  // Funnel bar data
  const FUNNEL_ORDER = ["page_view", "optin", "vsl_25", "vsl_50", "vsl_75", "vsl_100", "booking_start", "booking_confirmed", "checkout", "purchase"];
  const maxStep = Math.max(...FUNNEL_ORDER.map((s) => sc[s] ?? 0), 1);

  return (
    <div className="space-y-6">
      {/* --- Top bar --- */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-white">Dashboard Ads</h1>
        <div className="flex flex-wrap items-center gap-2">
          {/* Period selector */}
          <div className="flex bg-white/5 rounded-xl border border-white/10 p-0.5">
            {PERIODS.map((p) => (
              <button
                key={p.days}
                onClick={() => { setSelectedCampaign("all"); setPeriod(p.days); }}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${
                  selectedCampaign === "all" && period === p.days
                    ? "bg-blue-500/20 text-blue-400 shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Campaign dropdown */}
          <select
            value={selectedCampaign}
            onChange={(e) => setSelectedCampaign(e.target.value)}
            className="bg-white/5 border border-white/10 text-sm text-slate-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
          >
            <option value="all">Toutes les campagnes</option>
            {campaigns.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <button
            onClick={() => setShowNewCampaign(!showNewCampaign)}
            className="px-3 py-2 text-sm font-medium bg-blue-500/20 text-blue-400 rounded-xl border border-blue-500/30 hover:bg-blue-500/30 transition-colors"
          >
            + Campagne
          </button>

          <button
            onClick={fetchData}
            disabled={loading}
            className="px-3 py-2 text-sm text-slate-400 hover:text-white bg-white/5 border border-white/10 rounded-xl transition-colors disabled:opacity-50"
          >
            {loading ? (
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" strokeDasharray="30 70" /></svg>
            ) : (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            )}
          </button>
        </div>
      </div>

      {/* --- New campaign form --- */}
      {showNewCampaign && (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
          <h3 className="text-white font-semibold">Nouvelle campagne</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input placeholder="Nom" value={newCampaign.name} onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })} className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50" />
            <input type="date" value={newCampaign.start_date} onChange={(e) => setNewCampaign({ ...newCampaign, start_date: e.target.value })} className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500/50" />
            <input type="date" value={newCampaign.end_date} onChange={(e) => setNewCampaign({ ...newCampaign, end_date: e.target.value })} className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500/50" />
            <input placeholder="Budget (EUR)" value={newCampaign.budget_euros} onChange={(e) => setNewCampaign({ ...newCampaign, budget_euros: e.target.value })} className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50" />
            <select value={newCampaign.platform} onChange={(e) => setNewCampaign({ ...newCampaign, platform: e.target.value })} className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500/50">
              <option value="meta">Meta</option>
              <option value="google">Google</option>
              <option value="tiktok">TikTok</option>
              <option value="other">Autre</option>
            </select>
            <input placeholder="Notes" value={newCampaign.notes} onChange={(e) => setNewCampaign({ ...newCampaign, notes: e.target.value })} className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50" />
          </div>
          <div className="flex gap-2">
            <button onClick={handleCreateCampaign} className="px-4 py-2 text-sm font-medium bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors">Creer</button>
            <button onClick={() => setShowNewCampaign(false)} className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors">Annuler</button>
          </div>
        </div>
      )}

      {/* --- KPI cards --- */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard label="Vues opt-in" value={sc.page_view ?? 0} subtitle={`${data?.total_events ?? 0} events totaux`} color="blue" />
        <KPICard label="Leads" value={sc.optin ?? 0} subtitle={`${optinRate}% taux conversion`} color="blue" />
        <KPICard label="Calls bookes" value={sc.booking_confirmed ?? 0} subtitle={`${data?.conversion_rates?.find((r) => r.from === "optin" && r.to === "booking_start")?.rate ?? 0}% opt-in -> call`} color="emerald" />
        <KPICard label="CA estime" value={`${revenue.toLocaleString("fr-FR")} EUR`} subtitle={`${sc.purchase ?? 0} vente${(sc.purchase ?? 0) > 1 ? "s" : ""} x 997 EUR`} color="emerald" />
      </div>

      {/* --- Chart --- */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
        <h3 className="text-white font-semibold mb-4">Tendances quotidiennes</h3>
        <div className="h-72">
          {data?.daily_breakdown && data.daily_breakdown.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.daily_breakdown} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="gradBlue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradEmerald" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: "#64748B", fontSize: 11 }}
                  tickFormatter={(v: string) => { const d = new Date(v); return `${d.getDate()}/${d.getMonth() + 1}`; }}
                  axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
                  tickLine={false}
                />
                <YAxis tick={{ fill: "#64748B", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#1E293B", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", color: "#fff", fontSize: 13 }}
                  labelFormatter={(v) => new Date(String(v)).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                />
                <Area type="monotone" dataKey="optin" name="Opt-ins" stroke="#3B82F6" strokeWidth={2} fill="url(#gradBlue)" />
                <Area type="monotone" dataKey="booking_confirmed" name="Calls bookes" stroke="#10B981" strokeWidth={2} fill="url(#gradEmerald)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-500 text-sm">Aucune donnee sur la periode</div>
          )}
        </div>
      </div>

      {/* --- Funnel --- */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
        <h3 className="text-white font-semibold mb-4">Funnel de conversion</h3>
        <div className="space-y-2">
          {FUNNEL_ORDER.map((step, i) => {
            const count = sc[step] ?? 0;
            const pct = maxStep > 0 ? (count / maxStep) * 100 : 0;
            const convRate = i > 0 ? (sc[FUNNEL_ORDER[i - 1]] > 0 ? Math.round((count / sc[FUNNEL_ORDER[i - 1]]) * 100) : 0) : 100;
            return (
              <div key={step} className="flex items-center gap-3">
                <span className="text-xs text-slate-400 w-28 shrink-0 text-right">{STEP_LABELS[step] ?? step}</span>
                <div className="flex-1 h-7 bg-white/5 rounded-lg overflow-hidden relative">
                  <div
                    className="h-full rounded-lg transition-all duration-700"
                    style={{
                      width: `${Math.max(pct, 2)}%`,
                      background: step === "purchase"
                        ? "linear-gradient(90deg, #10B981, #34D399)"
                        : step.startsWith("booking") || step === "checkout"
                        ? "linear-gradient(90deg, #10B981, #6EE7B7)"
                        : "linear-gradient(90deg, #3B82F6, #60A5FA)",
                    }}
                  />
                  <div className="absolute inset-0 flex items-center px-3 justify-between">
                    <span className="text-xs font-medium text-white">{count}</span>
                    {i > 0 && <span className="text-[10px] text-white/60">{convRate}%</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* --- Two columns: UTM + Recent Events --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* UTM Attribution */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
          <h3 className="text-white font-semibold mb-4">Attribution UTM</h3>
          {(data?.utm_breakdown ?? []).length === 0 ? (
            <p className="text-sm text-slate-500">Aucune attribution</p>
          ) : (
            <div className="space-y-2">
              {data!.utm_breakdown.map((u, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                  <div>
                    <span className="text-sm text-white font-medium">{u.source}</span>
                    <span className="text-xs text-slate-500 ml-2">{u.campaign}</span>
                  </div>
                  <span className="text-sm font-mono text-blue-400">{u.count} leads</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent events */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
          <h3 className="text-white font-semibold mb-4">Evenements recents</h3>
          <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
            {(data?.recent_events ?? []).length === 0 ? (
              <p className="text-sm text-slate-500">Aucun evenement</p>
            ) : (
              data!.recent_events.map((e, i) => (
                <div key={i} className="flex items-center justify-between py-1.5 text-sm">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`font-medium ${EVENT_COLORS[e.event] ?? "text-slate-400"}`}>
                      {STEP_LABELS[e.event] ?? e.event}
                    </span>
                    <span className="text-slate-500 truncate">{e.email ?? "anon"}</span>
                  </div>
                  <span className="text-xs text-slate-600 shrink-0 ml-2">
                    {timeAgo(e.created_at)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- sub-components ---------- */

function KPICard({ label, value, subtitle, color }: { label: string; value: string | number; subtitle: string; color: "blue" | "emerald" }) {
  const ring = color === "blue" ? "ring-blue-500/20" : "ring-emerald-500/20";
  const valColor = color === "blue" ? "text-blue-400" : "text-emerald-400";
  return (
    <div className={`bg-white/5 border border-white/10 rounded-2xl p-5 ring-1 ${ring} backdrop-blur`}>
      <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-2xl sm:text-3xl font-bold ${valColor}`}>{typeof value === "number" ? value.toLocaleString("fr-FR") : value}</p>
      <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
    </div>
  );
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}j`;
}
