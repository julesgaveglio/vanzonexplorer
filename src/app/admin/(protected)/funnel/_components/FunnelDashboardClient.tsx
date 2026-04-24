"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { RefreshCw, Plus, Calendar, TrendingUp, Users, Phone, CreditCard, Eye } from "lucide-react";

/* ─── Types ─────────────────────────────────────────────── */

interface ConversionRate { from: string; to: string; rate: number; }
interface UTMEntry { source: string; campaign: string; count: number; }
interface RecentEvent { event: string; email: string | null; created_at: string; utm_source: string | null; }
interface Campaign { id: string; name: string; start_date: string; end_date: string | null; budget_euros: number | null; platform: string | null; is_active: boolean; }
interface FunnelData {
  step_counts: Record<string, number>;
  conversion_rates: ConversionRate[];
  utm_breakdown: UTMEntry[];
  recent_events: RecentEvent[];
  overall_conversion: number;
  view_to_optin: number;
  total_events: number;
  estimated_revenue: number;
}

/* ─── Constants ─────────────────────────────────────────── */

const STEP_CONFIG: { key: string; label: string; icon: string; color: string }[] = [
  { key: "page_view", label: "Vues opt-in", icon: "👁", color: "bg-slate-400" },
  { key: "optin", label: "Leads (email)", icon: "📧", color: "bg-blue-500" },
  { key: "vsl_view", label: "VSL ouverte", icon: "🎥", color: "bg-cyan-500" },
  { key: "vsl_50", label: "VSL 50%+", icon: "⏱", color: "bg-cyan-400" },
  { key: "vsl_100", label: "VSL complète", icon: "✅", color: "bg-teal-500" },
  { key: "booking_start", label: "Calendly ouvert", icon: "📅", color: "bg-amber-400" },
  { key: "booking_confirmed", label: "Call booké", icon: "📞", color: "bg-amber-500" },
  { key: "checkout", label: "Checkout", icon: "💳", color: "bg-orange-500" },
  { key: "purchase", label: "Achat", icon: "🎉", color: "bg-emerald-500" },
];

/* ─── Component ─────────────────────────────────────────── */

export default function FunnelDashboardClient() {
  const [data, setData] = useState<FunnelData | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<string>("30");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [showNewCampaign, setShowNewCampaign] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // New campaign form
  const [newName, setNewName] = useState("");
  const [newStart, setNewStart] = useState("");
  const [newEnd, setNewEnd] = useState("");
  const [newBudget, setNewBudget] = useState("");
  const [newPlatform, setNewPlatform] = useState("meta");

  const fetchData = useCallback(
    (silent = false) => {
      if (!silent) setLoading(true);
      else setRefreshing(true);

      // Build query params based on selection
      let params = "";
      if (selectedCampaign === "7" || selectedCampaign === "14" || selectedCampaign === "30" || selectedCampaign === "90") {
        params = `?days=${selectedCampaign}`;
      } else {
        // Campaign ID — find the campaign dates
        const camp = campaigns.find((c) => c.id === selectedCampaign);
        if (camp) {
          params = `?start=${camp.start_date}${camp.end_date ? `&end=${camp.end_date}` : ""}`;
        }
      }

      fetch(`/api/admin/funnel${params}`)
        .then((r) => r.json())
        .then((d) => { setData(d); setLastRefresh(new Date()); })
        .finally(() => { setLoading(false); setRefreshing(false); });
    },
    [selectedCampaign, campaigns]
  );

  // Load campaigns on mount
  useEffect(() => {
    fetch("/api/admin/funnel/campaigns")
      .then((r) => r.json())
      .then((d) => setCampaigns(d.campaigns ?? []))
      .catch(() => {});
  }, []);

  // Fetch data + auto-refresh
  useEffect(() => {
    fetchData();
    intervalRef.current = setInterval(() => fetchData(true), 30000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [fetchData]);

  async function createCampaign(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/admin/funnel/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newName,
        start_date: newStart,
        end_date: newEnd || null,
        budget_euros: newBudget ? parseInt(newBudget) : null,
        platform: newPlatform,
      }),
    });
    const d = await res.json();
    if (res.ok) {
      setCampaigns((prev) => [d.campaign, ...prev]);
      setSelectedCampaign(d.campaign.id);
      setShowNewCampaign(false);
      setNewName(""); setNewStart(""); setNewEnd(""); setNewBudget("");
    }
  }

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) return <p className="text-slate-500">Erreur de chargement.</p>;

  const sc = data.step_counts;
  const maxCount = Math.max(...Object.values(sc), 1);

  return (
    <div className="space-y-6">
      {/* ─── Top bar: campaign selector + refresh ─── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Quick period buttons */}
          {["7", "14", "30", "90"].map((d) => (
            <button
              key={d}
              onClick={() => setSelectedCampaign(d)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                selectedCampaign === d
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {d}j
            </button>
          ))}

          {/* Campaign selector */}
          {campaigns.length > 0 && (
            <>
              <span className="text-slate-300 mx-1">|</span>
              <select
                value={["7","14","30","90"].includes(selectedCampaign) ? "" : selectedCampaign}
                onChange={(e) => { if (e.target.value) setSelectedCampaign(e.target.value); }}
                className="px-3 py-1.5 rounded-lg text-sm font-medium bg-slate-100 text-slate-600 border-0 outline-none"
              >
                <option value="" disabled>Campagne...</option>
                {campaigns.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.start_date})
                  </option>
                ))}
              </select>
            </>
          )}

          {/* New campaign */}
          <button
            onClick={() => setShowNewCampaign(!showNewCampaign)}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Campagne
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
          </button>
          {lastRefresh && (
            <span className="text-xs text-slate-400">
              {lastRefresh.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </span>
          )}
        </div>
      </div>

      {/* ─── New campaign form ─── */}
      {showNewCampaign && (
        <form onSubmit={createCampaign} className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-wrap gap-3 items-end">
          <div>
            <label className="text-xs font-medium text-slate-500 block mb-1">Nom</label>
            <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Campagne Meta Avril" required className="px-3 py-2 text-sm border border-slate-200 rounded-lg w-52" />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 block mb-1">Début</label>
            <input type="date" value={newStart} onChange={(e) => setNewStart(e.target.value)} required className="px-3 py-2 text-sm border border-slate-200 rounded-lg" />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 block mb-1">Fin</label>
            <input type="date" value={newEnd} onChange={(e) => setNewEnd(e.target.value)} className="px-3 py-2 text-sm border border-slate-200 rounded-lg" />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 block mb-1">Budget</label>
            <input type="number" value={newBudget} onChange={(e) => setNewBudget(e.target.value)} placeholder="600" className="px-3 py-2 text-sm border border-slate-200 rounded-lg w-24" />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 block mb-1">Plateforme</label>
            <select value={newPlatform} onChange={(e) => setNewPlatform(e.target.value)} className="px-3 py-2 text-sm border border-slate-200 rounded-lg">
              <option value="meta">Meta</option>
              <option value="google">Google</option>
              <option value="organic">Organique</option>
              <option value="other">Autre</option>
            </select>
          </div>
          <button type="submit" className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-slate-900 hover:bg-slate-700 transition-colors">Créer</button>
          <button type="button" onClick={() => setShowNewCampaign(false)} className="px-3 py-2 text-sm text-slate-400 hover:text-slate-600">Annuler</button>
        </form>
      )}

      {/* ─── KPI cards ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <KPICard icon={<Eye className="w-4 h-4" />} label="Vues" value={sc.page_view ?? 0} />
        <KPICard icon={<Users className="w-4 h-4" />} label="Leads" value={sc.optin ?? 0} sub={`${data.view_to_optin}% conv.`} />
        <KPICard icon={<TrendingUp className="w-4 h-4" />} label="VSL vues" value={sc.vsl_view ?? 0} />
        <KPICard icon={<Phone className="w-4 h-4" />} label="Calls bookés" value={sc.booking_confirmed ?? 0} />
        <KPICard icon={<CreditCard className="w-4 h-4" />} label="Achats" value={sc.purchase ?? 0} accent />
        <KPICard icon={<Calendar className="w-4 h-4" />} label="CA estimé" value={`${data.estimated_revenue}€`} accent />
      </div>

      {/* ─── Funnel visualization ─── */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-6">
          Tunnel de conversion
        </h2>
        <div className="space-y-2.5">
          {STEP_CONFIG.map((step, idx) => {
            const count = sc[step.key] ?? 0;
            const width = maxCount > 0 ? (count / maxCount) * 100 : 0;
            const prevStep = idx > 0 ? STEP_CONFIG[idx - 1] : null;
            const prevCount = prevStep ? (sc[prevStep.key] ?? 0) : 0;
            const dropRate = prevCount > 0 ? Math.round((count / prevCount) * 100) : null;

            return (
              <div key={step.key} className="flex items-center gap-3">
                <span className="text-base w-6 text-center flex-shrink-0">{step.icon}</span>
                <span className="text-sm text-slate-600 w-28 flex-shrink-0 truncate">{step.label}</span>
                <div className="flex-1 bg-slate-100 rounded-full h-7 relative overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${step.color}`}
                    style={{ width: `${Math.max(width, count > 0 ? 2 : 0)}%` }}
                  />
                  {count > 0 && (
                    <span className="absolute inset-y-0 left-3 flex items-center text-xs font-bold text-white drop-shadow">
                      {count}
                    </span>
                  )}
                </div>
                <div className="w-16 text-right flex-shrink-0">
                  {dropRate !== null && (
                    <span className={`text-xs font-bold ${
                      dropRate >= 50 ? "text-emerald-600" : dropRate >= 20 ? "text-amber-600" : "text-red-500"
                    }`}>
                      {dropRate}%
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Overall */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
          <span className="text-sm text-slate-500">Lead → Achat (global)</span>
          <span className={`text-sm font-bold ${data.overall_conversion > 0 ? "text-emerald-600" : "text-slate-400"}`}>
            {data.overall_conversion}%
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ─── UTM Attribution ─── */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">
            Attribution (sources)
          </h2>
          {data.utm_breakdown.length === 0 ? (
            <p className="text-sm text-slate-400">Aucune donnée UTM encore.</p>
          ) : (
            <div className="space-y-2">
              {data.utm_breakdown.map((u, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                  <div>
                    <span className="text-sm font-medium text-slate-700">{u.source}</span>
                    <span className="text-xs text-slate-400 ml-2">{u.campaign}</span>
                  </div>
                  <span className="text-sm font-bold text-slate-900">{u.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ─── Recent events ─── */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">
            Événements récents
          </h2>
          {data.recent_events.length === 0 ? (
            <p className="text-sm text-slate-400">Aucun événement encore.</p>
          ) : (
            <div className="space-y-1 max-h-80 overflow-y-auto">
              {data.recent_events.map((e, i) => {
                const cfg = STEP_CONFIG.find((s) => s.key === e.event);
                return (
                  <div key={i} className="flex items-center gap-2 py-1.5 text-sm">
                    <span className="text-base flex-shrink-0">{cfg?.icon ?? "•"}</span>
                    <span className="text-slate-600 flex-1 truncate">
                      {cfg?.label ?? e.event}
                      {e.email && <span className="text-slate-400 ml-1">— {e.email}</span>}
                    </span>
                    <span className="text-xs text-slate-400 flex-shrink-0">
                      {new Date(e.created_at).toLocaleString("fr-FR", {
                        day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
                      })}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── KPI Card ─── */
function KPICard({
  icon, label, value, sub, accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-4">
      <div className="flex items-center gap-1.5 mb-2">
        <span className={accent ? "text-emerald-500" : "text-slate-400"}>{icon}</span>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</p>
      </div>
      <p className={`text-2xl font-black ${accent ? "text-emerald-600" : "text-slate-900"}`}>
        {value}
      </p>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
}
