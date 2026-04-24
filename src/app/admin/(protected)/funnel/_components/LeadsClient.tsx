"use client";

import { useState, useEffect, useCallback } from "react";
import { RefreshCw, Download } from "lucide-react";

interface Lead {
  id: string;
  firstname: string;
  email: string;
  step_reached: string;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  created_at: string;
  call_booked_at: string | null;
}

const STEP_BADGES: Record<string, { label: string; color: string }> = {
  optin: { label: "Lead", color: "bg-blue-50 text-blue-700 border-blue-100" },
  vsl: { label: "VSL vue", color: "bg-cyan-50 text-cyan-700 border-cyan-100" },
  booking: { label: "Booking", color: "bg-amber-50 text-amber-700 border-amber-100" },
  confirmed: { label: "Call booké", color: "bg-orange-50 text-orange-700 border-orange-100" },
  purchased: { label: "Acheteur", color: "bg-emerald-50 text-emerald-700 border-emerald-100" },
};

export default function LeadsClient() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLeads = useCallback(() => {
    setLoading(true);
    fetch("/api/admin/funnel/leads")
      .then((r) => r.json())
      .then((d) => setLeads(d.leads ?? []))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  function exportCSV() {
    const header = "Prénom,Email,Étape,Source,Campagne,Date,Call booké\n";
    const rows = leads.map((l) =>
      `${l.firstname},${l.email},${l.step_reached},${l.utm_source || ""},${l.utm_campaign || ""},${l.created_at},${l.call_booked_at || ""}`
    ).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vba-leads-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{leads.length} leads au total</p>
        <div className="flex items-center gap-2">
          <button onClick={exportCSV} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200">
            <Download className="w-3.5 h-3.5" /> CSV
          </button>
          <button onClick={fetchLeads} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Table */}
      {leads.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center">
          <p className="text-slate-500">Aucun lead. La campagne vient de démarrer !</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr className="border-b border-slate-100 text-left">
                <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Prénom</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Email</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Étape</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Source</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {leads.map((lead) => {
                const badge = STEP_BADGES[lead.step_reached] ?? { label: lead.step_reached, color: "bg-slate-50 text-slate-500" };
                return (
                  <tr key={lead.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-900">{lead.firstname}</td>
                    <td className="px-4 py-3 text-slate-600">{lead.email}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${badge.color}`}>
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">
                      {lead.utm_source || "direct"}
                      {lead.utm_campaign && <span className="text-slate-400 ml-1">/ {lead.utm_campaign}</span>}
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs">
                      {new Date(lead.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "2-digit" })}
                      {" "}
                      {new Date(lead.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
