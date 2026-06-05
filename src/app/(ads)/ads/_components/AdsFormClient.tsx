"use client";

import { useState, useEffect } from "react";
import { useCampaign } from "./CampaignContext";

interface Lead {
  firstname: string | null;
  email: string;
  phone: string | null;
  q_objective: string | null;
  q_frein: string | null;
  q_frein_autre: string | null;
  q_budget: string | null;
  is_hot: boolean | null;
  utm_campaign: string | null;
  created_at: string;
}

const PERIODS = [
  { label: "7j", days: 7 },
  { label: "14j", days: 14 },
  { label: "30j", days: 30 },
  { label: "90j", days: 90 },
] as const;

const COLD_OBJECTIVE = "Gagner de l'argent rapidement avec un van";
const COLD_BUDGET = "Moins de 10 000 \u20AC";

function isColdIndicator(key: "q_objective" | "q_budget", value: string | null): boolean {
  if (!value) return false;
  if (key === "q_objective" && value === COLD_OBJECTIVE) return true;
  if (key === "q_budget" && value === COLD_BUDGET) return true;
  return false;
}

export default function AdsFormClient() {
  const { buildQS, loading: campLoading } = useCampaign();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [period, setPeriod] = useState(30);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (campLoading) return;
    setLoading(true);
    const qs = buildQS();
    fetch(`/api/ads/qualification?${qs}`)
      .then((r) => r.json())
      .then((json) => {
        setLeads(json.leads ?? []);
      })
      .finally(() => setLoading(false));
  }, [period, buildQS, campLoading]);

  const hotCount = leads.filter((l) => l.is_hot === true).length;
  const coldCount = leads.filter((l) => l.is_hot === false).length;
  const unknownCount = leads.filter((l) => l.is_hot === null).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Formulaire</h1>
          <p className="text-sm text-slate-500 mt-1">
            {leads.length} lead{leads.length > 1 ? "s" : ""} qualifi&eacute;{leads.length > 1 ? "s" : ""}
            {" "}&middot;{" "}
            <span className="text-emerald-600 font-medium">{hotCount} hot</span>
            {" "}&middot;{" "}
            <span className="text-red-500 font-medium">{coldCount} cold</span>
            {unknownCount > 0 && (
              <>
                {" "}&middot;{" "}
                <span className="text-slate-400">{unknownCount} inconnu</span>
              </>
            )}
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
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <svg className="animate-spin h-6 w-6 text-blue-500" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" strokeDasharray="30 70" />
            </svg>
          </div>
        ) : leads.length === 0 ? (
          <div className="text-center py-20 text-slate-400 text-sm">
            Aucun lead qualifi&eacute; trouv&eacute;
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="text-center text-xs text-slate-500 uppercase tracking-wider px-3 py-3 font-medium w-10">#</th>
                  <th className="text-center text-xs text-slate-500 uppercase tracking-wider px-2 py-3 font-medium w-10"></th>
                  <th className="text-left text-xs text-slate-500 uppercase tracking-wider px-4 py-3 font-medium">Pr&eacute;nom</th>
                  <th className="text-left text-xs text-slate-500 uppercase tracking-wider px-4 py-3 font-medium">Email</th>
                  <th className="text-left text-xs text-slate-500 uppercase tracking-wider px-4 py-3 font-medium hidden lg:table-cell">T&eacute;l</th>
                  <th className="text-left text-xs text-slate-500 uppercase tracking-wider px-4 py-3 font-medium">Objectif</th>
                  <th className="text-left text-xs text-slate-500 uppercase tracking-wider px-4 py-3 font-medium hidden sm:table-cell">Frein</th>
                  <th className="text-left text-xs text-slate-500 uppercase tracking-wider px-4 py-3 font-medium hidden sm:table-cell">Budget</th>
                  <th className="text-left text-xs text-slate-500 uppercase tracking-wider px-4 py-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead, i) => (
                  <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/50">
                    <td className="px-3 py-3 text-center text-slate-400 text-xs font-mono">
                      {leads.length - i}
                    </td>
                    <td className="px-2 py-3 text-center">
                      <span
                        className="inline-block w-2.5 h-2.5 rounded-full"
                        style={{
                          backgroundColor:
                            lead.is_hot === true
                              ? "#10B981"
                              : lead.is_hot === false
                                ? "#EF4444"
                                : "#CBD5E1",
                        }}
                        title={
                          lead.is_hot === true
                            ? "Hot"
                            : lead.is_hot === false
                              ? "Cold"
                              : "Inconnu"
                        }
                      />
                    </td>
                    <td className="px-4 py-3 text-slate-900 font-medium">
                      {lead.firstname ?? "\u2014"}
                    </td>
                    <td className="px-4 py-3 text-slate-600 text-xs">
                      {lead.email}
                    </td>
                    <td className="px-4 py-3 text-slate-600 text-xs hidden lg:table-cell">
                      {lead.phone ?? "\u2014"}
                    </td>
                    <td className="px-4 py-3">
                      {lead.q_objective ? (
                        <span
                          className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                            isColdIndicator("q_objective", lead.q_objective)
                              ? "bg-red-50 text-red-600 border border-red-100"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {lead.q_objective.length > 30
                            ? lead.q_objective.slice(0, 30) + "\u2026"
                            : lead.q_objective}
                        </span>
                      ) : (
                        <span className="text-slate-300 text-xs">\u2014</span>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      {lead.q_frein ? (
                        <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-amber-50 text-amber-700 border border-amber-100">
                          {lead.q_frein === "Autre" && lead.q_frein_autre
                            ? `Autre : ${lead.q_frein_autre.length > 25 ? lead.q_frein_autre.slice(0, 25) + "\u2026" : lead.q_frein_autre}`
                            : lead.q_frein}
                        </span>
                      ) : (
                        <span className="text-slate-300 text-xs">\u2014</span>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      {lead.q_budget ? (
                        <span
                          className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                            isColdIndicator("q_budget", lead.q_budget)
                              ? "bg-red-50 text-red-600 border border-red-100"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {lead.q_budget}
                        </span>
                      ) : (
                        <span className="text-slate-300 text-xs">\u2014</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">
                      {new Date(lead.created_at).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
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
