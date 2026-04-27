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
  source_breakdown: { source: string; count: number }[];
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
  booking_confirmed: "Call booké",
  checkout: "Checkout",
  purchase: "Achat",
};

const EVENT_DOT: Record<string, string> = {
  page_view: "bg-slate-300",
  optin: "bg-blue-500",
  vsl_25: "bg-indigo-400",
  vsl_50: "bg-indigo-500",
  vsl_75: "bg-violet-400",
  vsl_100: "bg-violet-500",
  booking_start: "bg-amber-400",
  booking_confirmed: "bg-emerald-500",
  checkout: "bg-orange-500",
  purchase: "bg-green-500",
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

  const FUNNEL_ORDER = ["page_view", "optin", "vsl_25", "vsl_50", "vsl_75", "vsl_100", "booking_start", "booking_confirmed", "checkout", "purchase"];
  const maxStep = Math.max(...FUNNEL_ORDER.map((s) => sc[s] ?? 0), 1);

  const inputCls = "bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400";

  return (
    <div className="space-y-6">
      {/* --- Top bar --- */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex bg-white rounded-xl border border-slate-200 p-0.5 shadow-sm">
            {PERIODS.map((p) => (
              <button
                key={p.days}
                onClick={() => { setSelectedCampaign("all"); setPeriod(p.days); }}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${
                  selectedCampaign === "all" && period === p.days
                    ? "bg-blue-50 text-blue-600 shadow-sm"
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

          {selectedCampaign !== "all" && (
            <button
              onClick={async () => {
                if (!confirm("Clôturer cette campagne ? Les données seront conservées.")) return;
                await fetch("/api/ads/campaigns", {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    id: selectedCampaign,
                    is_active: false,
                    end_date: new Date().toISOString().slice(0, 10),
                  }),
                });
                setSelectedCampaign("all");
                fetchData();
              }}
              className="px-3 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-xl border border-red-200 hover:bg-red-100 transition-colors"
            >
              Clôturer
            </button>
          )}

          <button
            onClick={() => setShowNewCampaign(!showNewCampaign)}
            className="px-3 py-2 text-sm font-medium bg-blue-50 text-blue-600 rounded-xl border border-blue-200 hover:bg-blue-100 transition-colors"
          >
            + Campagne
          </button>

          <button
            onClick={fetchData}
            disabled={loading}
            className="px-3 py-2 text-sm text-slate-500 hover:text-slate-700 bg-white border border-slate-200 rounded-xl transition-colors disabled:opacity-50 shadow-sm"
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
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="text-slate-900 font-semibold">Nouvelle campagne</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input placeholder="Nom" value={newCampaign.name} onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })} className={inputCls} />
            <input type="date" value={newCampaign.start_date} onChange={(e) => setNewCampaign({ ...newCampaign, start_date: e.target.value })} className={inputCls} />
            <input type="date" value={newCampaign.end_date} onChange={(e) => setNewCampaign({ ...newCampaign, end_date: e.target.value })} className={inputCls} />
            <input placeholder="Budget (€)" value={newCampaign.budget_euros} onChange={(e) => setNewCampaign({ ...newCampaign, budget_euros: e.target.value })} className={inputCls} />
            <select value={newCampaign.platform} onChange={(e) => setNewCampaign({ ...newCampaign, platform: e.target.value })} className={inputCls}>
              <option value="meta">Meta</option>
              <option value="google">Google</option>
              <option value="tiktok">TikTok</option>
              <option value="other">Autre</option>
            </select>
            <input placeholder="Notes" value={newCampaign.notes} onChange={(e) => setNewCampaign({ ...newCampaign, notes: e.target.value })} className={inputCls} />
          </div>
          <div className="flex gap-2">
            <button onClick={handleCreateCampaign} className="px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors">Créer</button>
            <button onClick={() => setShowNewCampaign(false)} className="px-3 py-2 text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors">Annuler</button>
          </div>
        </div>
      )}

      {/* --- KPI cards --- */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard label="Vues opt-in" value={sc.page_view ?? 0} subtitle={`${data?.total_events ?? 0} events totaux`} color="slate" />
        <KPICard label="Leads" value={sc.optin ?? 0} subtitle={`${optinRate}% taux conversion`} color="blue" />
        <KPICard label="Calls bookés" value={sc.booking_confirmed ?? 0} subtitle={`${data?.conversion_rates?.find((r) => r.from === "optin" && r.to === "booking_start")?.rate ?? 0}% opt-in → call`} color="amber" />
        <KPICard label="CA estimé" value={`${revenue.toLocaleString("fr-FR")} €`} subtitle={`${sc.purchase ?? 0} vente${(sc.purchase ?? 0) > 1 ? "s" : ""} × 997 €`} color="emerald" />
      </div>

      {/* --- Chart --- */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <h3 className="text-slate-900 font-semibold mb-4">Tendances quotidiennes</h3>
        <div className="h-56 sm:h-72">
          {data?.daily_breakdown && data.daily_breakdown.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.daily_breakdown} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="gradBlue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradEmerald" x1="0" y1="0" x2="0" y2="1">
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
                <Area type="monotone" dataKey="optin" name="Opt-ins" stroke="#3B82F6" strokeWidth={2} fill="url(#gradBlue)" />
                <Area type="monotone" dataKey="booking_confirmed" name="Calls bookés" stroke="#10B981" strokeWidth={2} fill="url(#gradEmerald)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-400 text-sm">Aucune donnée sur la période</div>
          )}
        </div>
      </div>

      {/* --- Source breakdown --- */}
      {(data?.source_breakdown ?? []).length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <h3 className="text-slate-900 font-semibold mb-4">Sources des leads</h3>
          <div className="space-y-3">
            {data!.source_breakdown.map((s, i) => {
              const total = data!.source_breakdown.reduce((sum, x) => sum + x.count, 0);
              const pct = total > 0 ? Math.round((s.count / total) * 100) : 0;
              const colors: Record<string, string> = {
                Facebook: "bg-blue-500",
                Instagram: "bg-gradient-to-r from-purple-500 to-pink-500",
                direct: "bg-slate-400",
              };
              const barColor = colors[s.source] ?? "bg-slate-400";
              const isInsta = s.source === "Instagram";
              return (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-sm font-medium text-slate-700 w-24 shrink-0">{s.source}</span>
                  <div className="flex-1 h-8 bg-slate-100 rounded-lg overflow-hidden relative">
                    <div
                      className={`h-full rounded-lg transition-all duration-500 ${isInsta ? "" : barColor}`}
                      style={{
                        width: `${Math.max(pct, 4)}%`,
                        ...(isInsta ? { background: "linear-gradient(90deg, #8B5CF6, #EC4899)" } : {}),
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

      {/* --- Funnel --- */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <h3 className="text-slate-900 font-semibold mb-4">Funnel de conversion</h3>
        <div className="space-y-2">
          {FUNNEL_ORDER.map((step, i) => {
            const count = sc[step] ?? 0;
            const pct = maxStep > 0 ? (count / maxStep) * 100 : 0;
            const convRate = i > 0 ? (sc[FUNNEL_ORDER[i - 1]] > 0 ? Math.round((count / sc[FUNNEL_ORDER[i - 1]]) * 100) : 0) : 100;
            return (
              <div key={step} className="flex items-center gap-3">
                <span className="text-xs text-slate-500 w-28 shrink-0 text-right font-medium">{STEP_LABELS[step] ?? step}</span>
                <div className="flex-1 h-8 bg-slate-100 rounded-lg overflow-hidden relative">
                  <div
                    className="h-full rounded-lg transition-all duration-700"
                    style={{
                      width: `${Math.max(pct, count > 0 ? 2 : 0)}%`,
                      background: step === "purchase"
                        ? "linear-gradient(90deg, #10B981, #34D399)"
                        : step.startsWith("booking") || step === "checkout"
                        ? "linear-gradient(90deg, #10B981, #6EE7B7)"
                        : "linear-gradient(90deg, #3B82F6, #60A5FA)",
                    }}
                  />
                  <div className="absolute inset-0 flex items-center px-3 justify-between">
                    <span className="text-xs font-bold text-white drop-shadow">{count}</span>
                    {i > 0 && <span className={`text-[10px] font-semibold ${convRate >= 50 ? "text-emerald-600" : convRate >= 20 ? "text-amber-600" : "text-red-500"}`}>{convRate}%</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* --- Two columns --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <h3 className="text-slate-900 font-semibold mb-4">Attribution UTM</h3>
          {(data?.utm_breakdown ?? []).length === 0 ? (
            <p className="text-sm text-slate-400">Aucune attribution</p>
          ) : (
            <div className="space-y-2">
              {data!.utm_breakdown.map((u, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                  <div>
                    <span className="text-sm text-slate-900 font-medium">{u.source}</span>
                    <span className="text-xs text-slate-400 ml-2">{u.campaign}</span>
                  </div>
                  <span className="text-sm font-mono font-semibold text-blue-600">{u.count} leads</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <h3 className="text-slate-900 font-semibold mb-4">Événements récents</h3>
          <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
            {(data?.recent_events ?? []).length === 0 ? (
              <p className="text-sm text-slate-400">Aucun événement</p>
            ) : (
              data!.recent_events.map((e, i) => (
                <div key={i} className="flex items-center justify-between py-1.5 text-sm">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${EVENT_DOT[e.event] ?? "bg-slate-300"}`} />
                    <span className="text-slate-700 font-medium">
                      {STEP_LABELS[e.event] ?? e.event}
                    </span>
                    <span className="text-slate-400 truncate">{e.email ?? "anon"}</span>
                  </div>
                  <span className="text-xs text-slate-400 shrink-0 ml-2">
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

function KPICard({ label, value, subtitle, color }: { label: string; value: string | number; subtitle: string; color: "slate" | "blue" | "amber" | "emerald" }) {
  const accents = {
    slate: { text: "text-slate-700", ring: "ring-slate-100", bg: "bg-slate-50" },
    blue: { text: "text-blue-600", ring: "ring-blue-100", bg: "bg-blue-50" },
    amber: { text: "text-amber-600", ring: "ring-amber-100", bg: "bg-amber-50" },
    emerald: { text: "text-emerald-600", ring: "ring-emerald-100", bg: "bg-emerald-50" },
  };
  const a = accents[color];
  return (
    <div className={`bg-white border border-slate-200 rounded-2xl p-5 shadow-sm ring-1 ${a.ring}`}>
      <p className="text-xs text-slate-500 uppercase tracking-wider font-medium mb-1">{label}</p>
      <p className={`text-2xl sm:text-3xl font-bold ${a.text}`}>{typeof value === "number" ? value.toLocaleString("fr-FR") : value}</p>
      <p className="text-xs text-slate-400 mt-1">{subtitle}</p>
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
