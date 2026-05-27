"use client";

import { useState, useEffect } from "react";

interface EmailEntry {
  campaign_name: string;
  sent_at: string;
  color: string | null;
}

interface Lead {
  email: string;
  firstname: string | null;
  phone: string | null;
  q_objective: string | null;
  q_profile: string | null;
  q_budget: string | null;
  is_hot: boolean | null;
  utm_source: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  created_at: string;
  vsl_seconds: number | null;
  email_history: EmailEntry[];
  last_email: EmailEntry | null;
}

const PERIODS = [
  { label: "7j", days: 7 },
  { label: "14j", days: 14 },
  { label: "30j", days: 30 },
  { label: "90j", days: 90 },
] as const;

const CAMPAIGN_FILTERS = [
  { label: "Toutes", value: "all" },
  { label: "Campagne 1", value: "campagne1" },
  { label: "Campagne 2", value: "campagne2" },
] as const;

const COLD_OBJECTIVES = ["Gagner de l'argent rapidement avec un van"];
const COLD_PROFILES = ["Retraité"];
const COLD_BUDGETS = ["Moins de 10 000 €"];

function isColdAnswer(field: "objective" | "profile" | "budget", value: string | null): boolean {
  if (!value) return false;
  if (field === "objective") return COLD_OBJECTIVES.includes(value);
  if (field === "profile") return COLD_PROFILES.includes(value);
  if (field === "budget") return COLD_BUDGETS.includes(value);
  return false;
}

function formatWatch(seconds: number | null): string {
  if (!seconds) return "—";
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function AdsLeadsClient() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [period, setPeriod] = useState(30);
  const [campaign, setCampaign] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [expandedLead, setExpandedLead] = useState<string | null>(null);

  const fetchLeads = () => {
    setLoading(true);
    fetch(`/api/ads/leads?days=${period}`)
      .then((r) => r.json())
      .then((json) => setLeads(json.leads ?? []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchLeads();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period]);

  const handleDelete = async (email: string) => {
    if (!confirm(`Supprimer le lead ${email} et tous ses événements ?`)) return;
    setDeleting(email);
    await fetch("/api/ads/leads", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setDeleting(null);
    fetchLeads();
  };

  const filtered = leads.filter((l) => {
    // Campaign filter
    if (campaign === "campagne1" && !l.utm_campaign?.includes("1")) return false;
    if (campaign === "campagne2" && !l.utm_campaign?.includes("2")) return false;

    // Search
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      l.email?.toLowerCase().includes(q) ||
      l.firstname?.toLowerCase().includes(q) ||
      l.phone?.toLowerCase().includes(q) ||
      l.utm_source?.toLowerCase().includes(q)
    );
  });

  const hotCount = filtered.filter((l) => l.is_hot === true).length;
  const coldCount = filtered.filter((l) => l.is_hot === false).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Leads</h1>
          <p className="text-sm text-slate-500 mt-1">
            {filtered.length} lead{filtered.length > 1 ? "s" : ""} —{" "}
            <span className="text-emerald-600 font-medium">{hotCount} chauds</span>{" · "}
            <span className="text-red-500 font-medium">{coldCount} froids</span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex bg-white rounded-xl border border-slate-200 p-0.5 shadow-sm">
            {PERIODS.map((p) => (
              <button
                key={p.days}
                onClick={() => setPeriod(p.days)}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${
                  period === p.days
                    ? "bg-blue-50 text-blue-600 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <select
            value={campaign}
            onChange={(e) => setCampaign(e.target.value)}
            className="bg-white border border-slate-200 text-sm text-slate-700 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/30 shadow-sm"
          >
            {CAMPAIGN_FILTERS.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Rechercher..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 w-48 shadow-sm"
          />
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <svg className="animate-spin h-6 w-6 text-blue-500" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" strokeDasharray="30 70" />
            </svg>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-slate-400 text-sm">
            Aucun lead trouvé
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="text-center text-xs text-slate-500 uppercase tracking-wider px-3 py-3 font-medium w-10">#</th>
                  <th className="text-center text-xs text-slate-500 uppercase tracking-wider px-2 py-3 font-medium w-8"></th>
                  <th className="text-left text-xs text-slate-500 uppercase tracking-wider px-4 py-3 font-medium">Prénom</th>
                  <th className="text-left text-xs text-slate-500 uppercase tracking-wider px-4 py-3 font-medium">Email</th>
                  <th className="text-left text-xs text-slate-500 uppercase tracking-wider px-4 py-3 font-medium hidden lg:table-cell">Tél</th>
                  <th className="text-left text-xs text-slate-500 uppercase tracking-wider px-4 py-3 font-medium">Qualification</th>
                  <th className="text-left text-xs text-slate-500 uppercase tracking-wider px-4 py-3 font-medium">VSL</th>
                  <th className="text-left text-xs text-slate-500 uppercase tracking-wider px-4 py-3 font-medium hidden lg:table-cell">Source</th>
                  <th className="text-left text-xs text-slate-500 uppercase tracking-wider px-4 py-3 font-medium">Date</th>
                  <th className="px-3 py-3 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((lead, i) => {
                  const isExpanded = expandedLead === lead.email;
                  const hasQual = lead.q_objective || lead.q_profile || lead.q_budget;
                  return (
                    <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/30">
                      <td className="px-3 py-3 text-center text-slate-400 text-xs font-mono align-top">
                        {filtered.length - i}
                      </td>
                      {/* Hot/Cold dot */}
                      <td className="px-2 py-3 text-center align-top">
                        {lead.is_hot === true && (
                          <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500" title="Lead chaud" />
                        )}
                        {lead.is_hot === false && (
                          <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-500" title="Lead froid" />
                        )}
                        {lead.is_hot === null && (
                          <span className="inline-block w-2.5 h-2.5 rounded-full bg-slate-200" title="Non qualifié" />
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-900 font-medium align-top">
                        {lead.firstname ?? "—"}
                      </td>
                      <td className="px-4 py-3 align-top">
                        <button
                          onClick={() => setExpandedLead(isExpanded ? null : lead.email)}
                          className="text-slate-600 text-xs hover:text-blue-600 transition-colors text-left"
                        >
                          {lead.email}
                          {lead.email_history.length > 0 && (
                            <span className="ml-1.5 text-[10px] text-slate-400">
                              ({lead.email_history.length} email{lead.email_history.length > 1 ? "s" : ""})
                            </span>
                          )}
                        </button>
                        {isExpanded && lead.email_history.length > 0 && (
                          <div className="mt-2 bg-slate-50 rounded-lg p-3 space-y-1.5">
                            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Historique emails</p>
                            {lead.email_history.map((eh, j) => (
                              <div key={j} className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: eh.color || "#94A3B8" }} />
                                <span className="text-xs text-slate-700 flex-1">{eh.campaign_name}</span>
                                <span className="text-[10px] text-slate-400">
                                  {new Date(eh.sent_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell align-top">
                        <span className="text-xs text-slate-500">{lead.phone || "—"}</span>
                      </td>
                      {/* Qualification badges */}
                      <td className="px-4 py-3 align-top">
                        {hasQual ? (
                          <div className="flex flex-wrap gap-1">
                            {lead.q_objective && (
                              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${isColdAnswer("objective", lead.q_objective) ? "bg-red-50 text-red-600" : "bg-slate-100 text-slate-600"}`}>
                                {lead.q_objective.length > 25 ? lead.q_objective.slice(0, 25) + "…" : lead.q_objective}
                              </span>
                            )}
                            {lead.q_profile && (
                              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${isColdAnswer("profile", lead.q_profile) ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600"}`}>
                                {lead.q_profile}
                              </span>
                            )}
                            {lead.q_budget && (
                              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${isColdAnswer("budget", lead.q_budget) ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600"}`}>
                                {lead.q_budget}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-300">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 align-top">
                        {lead.vsl_seconds ? (
                          <span className={`inline-flex px-2 py-0.5 text-xs font-mono rounded-full ${
                            lead.vsl_seconds >= 600 ? "bg-emerald-50 text-emerald-700"
                              : lead.vsl_seconds >= 180 ? "bg-amber-50 text-amber-700"
                              : "bg-slate-100 text-slate-500"
                          }`}>
                            {formatWatch(lead.vsl_seconds)}
                          </span>
                        ) : (
                          <span className="text-slate-300 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell align-top">
                        {lead.utm_source ? (
                          <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-blue-50 text-blue-600 border border-blue-100">
                            {lead.utm_source}
                          </span>
                        ) : (
                          <span className="text-slate-300">direct</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-xs align-top">
                        {new Date(lead.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </td>
                      <td className="px-3 py-3 align-top">
                        <button
                          onClick={() => lead.email && handleDelete(lead.email)}
                          disabled={deleting === lead.email}
                          className="text-slate-300 hover:text-red-500 transition-colors disabled:opacity-50"
                          title="Supprimer ce lead"
                        >
                          {deleting === lead.email ? (
                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" strokeDasharray="30 70" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M3 6h18M8 6V4a1 1 0 011-1h6a1 1 0 011 1v2m2 0v14a2 2 0 01-2 2H8a2 2 0 01-2-2V6h12z" />
                            </svg>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
