"use client";

import { useState, useEffect } from "react";

interface Lead {
  email: string;
  firstname: string | null;
  utm_source: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  created_at: string;
}

const PERIODS = [
  { label: "7j", days: 7 },
  { label: "14j", days: 14 },
  { label: "30j", days: 30 },
  { label: "90j", days: 90 },
] as const;

export default function AdsLeadsClient() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [period, setPeriod] = useState(30);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/ads/leads?days=${period}`)
      .then((r) => r.json())
      .then((json) => setLeads(json.leads ?? []))
      .finally(() => setLoading(false));
  }, [period]);

  const filtered = leads.filter((l) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      l.email?.toLowerCase().includes(q) ||
      l.firstname?.toLowerCase().includes(q) ||
      l.utm_source?.toLowerCase().includes(q) ||
      l.utm_campaign?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Leads</h1>
          <p className="text-sm text-slate-500 mt-1">{filtered.length} lead{filtered.length > 1 ? "s" : ""} sur la période</p>
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
          <div className="text-center py-20 text-slate-400 text-sm">Aucun lead trouvé</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="text-left text-xs text-slate-500 uppercase tracking-wider px-5 py-3 font-medium">Email</th>
                  <th className="text-left text-xs text-slate-500 uppercase tracking-wider px-5 py-3 font-medium">Prénom</th>
                  <th className="text-left text-xs text-slate-500 uppercase tracking-wider px-5 py-3 font-medium hidden md:table-cell">Source</th>
                  <th className="text-left text-xs text-slate-500 uppercase tracking-wider px-5 py-3 font-medium hidden lg:table-cell">Campagne</th>
                  <th className="text-left text-xs text-slate-500 uppercase tracking-wider px-5 py-3 font-medium hidden lg:table-cell">Contenu</th>
                  <th className="text-left text-xs text-slate-500 uppercase tracking-wider px-5 py-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((lead, i) => (
                  <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="px-5 py-3 text-slate-900 font-medium">{lead.email}</td>
                    <td className="px-5 py-3 text-slate-600">{lead.firstname ?? "—"}</td>
                    <td className="px-5 py-3 hidden md:table-cell">
                      {lead.utm_source ? (
                        <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-blue-50 text-blue-600 border border-blue-100">
                          {lead.utm_source}
                        </span>
                      ) : (
                        <span className="text-slate-300">direct</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-slate-500 hidden lg:table-cell">{lead.utm_campaign ?? "—"}</td>
                    <td className="px-5 py-3 text-slate-500 hidden lg:table-cell">{lead.utm_content ?? "—"}</td>
                    <td className="px-5 py-3 text-slate-400">
                      {new Date(lead.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
