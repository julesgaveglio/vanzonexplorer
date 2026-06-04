"use client";

import { useState, useEffect } from "react";
import { useSigmaCampaign } from "./SigmaCampaignContext";

interface Lead {
  email: string;
  firstname: string | null;
  phone: string | null;
  utm_source: string | null;
  created_at: string;
  vsl_seconds: number | null;
}

function formatWatch(seconds: number | null): string {
  if (!seconds) return "—";
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function SigmaLeadsClient() {
  const { buildQS, activeCampaignId, loading: campLoading } = useSigmaCampaign();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchLeads = () => {
    setLoading(true);
    const qs = buildQS();
    fetch(`/api/sigma/leads?${qs}`)
      .then((r) => r.json())
      .then((json) => setLeads(json.leads ?? []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!campLoading) fetchLeads();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buildQS, campLoading, activeCampaignId]);

  const handleDelete = async (email: string) => {
    if (!confirm(`Supprimer le lead ${email} et tous ses evenements ?`)) return;
    setDeleting(email);
    await fetch("/api/sigma/leads", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setDeleting(null);
    fetchLeads();
  };

  const filtered = leads.filter((l) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      l.email?.toLowerCase().includes(q) ||
      l.firstname?.toLowerCase().includes(q) ||
      l.phone?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Leads</h1>
          <p className="text-sm text-slate-500 mt-1">
            {filtered.length} lead{filtered.length > 1 ? "s" : ""}
          </p>
        </div>
        <input
          type="text"
          placeholder="Rechercher..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#B9945F]/30 w-48"
        />
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#B9945F]" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-slate-400 text-sm">
            Aucun lead trouve
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-center text-xs text-slate-500 uppercase tracking-wider px-3 py-3 font-medium w-10">#</th>
                  <th className="text-left text-xs text-slate-500 uppercase tracking-wider px-4 py-3 font-medium">Prenom</th>
                  <th className="text-left text-xs text-slate-500 uppercase tracking-wider px-4 py-3 font-medium">Email</th>
                  <th className="text-left text-xs text-slate-500 uppercase tracking-wider px-4 py-3 font-medium hidden lg:table-cell">Tel</th>
                  <th className="text-left text-xs text-slate-500 uppercase tracking-wider px-4 py-3 font-medium">VSL</th>
                  <th className="text-left text-xs text-slate-500 uppercase tracking-wider px-4 py-3 font-medium hidden lg:table-cell">Source</th>
                  <th className="text-left text-xs text-slate-500 uppercase tracking-wider px-4 py-3 font-medium">Date</th>
                  <th className="px-3 py-3 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((lead, i) => (
                  <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/50">
                    <td className="px-3 py-3 text-center text-slate-400 text-xs font-mono">
                      {filtered.length - i}
                    </td>
                    <td className="px-4 py-3 text-slate-900 font-medium">
                      {lead.firstname ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-600 text-xs">
                      {lead.email}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-xs text-slate-500">{lead.phone || "—"}</span>
                    </td>
                    <td className="px-4 py-3">
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
                    <td className="px-4 py-3 hidden lg:table-cell">
                      {lead.utm_source ? (
                        <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-[#B9945F]/10 text-[#B9945F] border border-[#B9945F]/20">
                          {lead.utm_source}
                        </span>
                      ) : (
                        <span className="text-slate-300">direct</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs">
                      {new Date(lead.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="px-3 py-3">
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
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
