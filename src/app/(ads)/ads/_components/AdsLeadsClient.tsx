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
          <h1 className="text-2xl font-bold text-white">Leads</h1>
          <p className="text-sm text-slate-400 mt-1">{filtered.length} lead{filtered.length > 1 ? "s" : ""} sur la periode</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex bg-white/5 rounded-xl border border-white/10 p-0.5">
            {PERIODS.map((p) => (
              <button
                key={p.days}
                onClick={() => setPeriod(p.days)}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${
                  period === p.days
                    ? "bg-blue-500/20 text-blue-400 shadow-sm"
                    : "text-slate-400 hover:text-white"
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
            className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50 w-48"
          />
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <svg className="animate-spin h-6 w-6 text-blue-400" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" strokeDasharray="30 70" />
            </svg>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-slate-500 text-sm">Aucun lead trouve</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left text-xs text-slate-400 uppercase tracking-wider px-5 py-3 font-medium">Email</th>
                  <th className="text-left text-xs text-slate-400 uppercase tracking-wider px-5 py-3 font-medium">Prenom</th>
                  <th className="text-left text-xs text-slate-400 uppercase tracking-wider px-5 py-3 font-medium hidden md:table-cell">Source</th>
                  <th className="text-left text-xs text-slate-400 uppercase tracking-wider px-5 py-3 font-medium hidden lg:table-cell">Campagne</th>
                  <th className="text-left text-xs text-slate-400 uppercase tracking-wider px-5 py-3 font-medium hidden lg:table-cell">Contenu</th>
                  <th className="text-left text-xs text-slate-400 uppercase tracking-wider px-5 py-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((lead, i) => (
                  <tr key={i} className="border-b border-white/5 hover:bg-white/[0.03] transition-colors">
                    <td className="px-5 py-3 text-white font-medium">{lead.email}</td>
                    <td className="px-5 py-3 text-slate-300">{lead.firstname ?? "-"}</td>
                    <td className="px-5 py-3 hidden md:table-cell">
                      {lead.utm_source ? (
                        <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                          {lead.utm_source}
                        </span>
                      ) : (
                        <span className="text-slate-600">direct</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-slate-400 hidden lg:table-cell">{lead.utm_campaign ?? "-"}</td>
                    <td className="px-5 py-3 text-slate-400 hidden lg:table-cell">{lead.utm_content ?? "-"}</td>
                    <td className="px-5 py-3 text-slate-500">
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
