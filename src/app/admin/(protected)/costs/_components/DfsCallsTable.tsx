"use client";

import { useState } from "react";

export interface DfsLogRow {
  id: string;
  created_at: string;
  endpoint: string;
  label: string;
  cost_usd: number;
  cost_eur: number;
  status_code: number | null;
}

interface Props {
  logs: DfsLogRow[];
  totalEur: number;
  thisMonthEur: number;
  callCount: number;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatCost(value: number): string {
  if (value === 0) return "€0.00";
  if (value < 0.001) return `€${value.toFixed(6)}`;
  if (value < 0.01) return `€${value.toFixed(4)}`;
  return `€${value.toFixed(3)}`;
}

export default function DfsCallsTable({ logs, totalEur, thisMonthEur, callCount }: Props) {
  const [search, setSearch] = useState("");

  const filtered = search.trim()
    ? logs.filter((l) =>
        l.label.toLowerCase().includes(search.toLowerCase()) ||
        l.endpoint.toLowerCase().includes(search.toLowerCase())
      )
    : logs;

  return (
    <div className="space-y-4">
      {/* KPIs DataForSEO */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-5 py-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Total dépensé</p>
          <p className="text-2xl font-black text-slate-900">{formatCost(totalEur)}</p>
          <p className="text-xs text-slate-400 mt-0.5">all time en euros</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-5 py-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Ce mois</p>
          <p className="text-2xl font-black text-slate-900">{formatCost(thisMonthEur)}</p>
          <p className="text-xs text-slate-400 mt-0.5">mois en cours</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-5 py-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Appels tracés</p>
          <p className="text-2xl font-black text-slate-900">{callCount}</p>
          <p className="text-xs text-slate-400 mt-0.5">depuis l&apos;activation</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
          <input
            type="text"
            placeholder="Rechercher un appel…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 text-sm px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-indigo-300"
          />
          <span className="text-xs text-slate-400">{filtered.length} appel{filtered.length !== 1 ? "s" : ""}</span>
        </div>

        {filtered.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-slate-400 text-sm">
            {logs.length === 0
              ? "Aucun appel DataForSEO enregistré — le tracking démarre dès le prochain appel."
              : "Aucun résultat pour cette recherche."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Date</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Action</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider hidden lg:table-cell">Endpoint</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">Coût €</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider hidden sm:table-cell">Coût $</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((log) => (
                  <tr key={log.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3 text-slate-500 whitespace-nowrap text-xs">{formatDate(log.created_at)}</td>
                    <td className="px-5 py-3 text-slate-800 font-medium max-w-xs truncate">{log.label}</td>
                    <td className="px-5 py-3 text-slate-400 text-xs font-mono hidden lg:table-cell max-w-xs truncate">{log.endpoint}</td>
                    <td className="px-5 py-3 text-right font-semibold text-slate-900 whitespace-nowrap">{formatCost(log.cost_eur)}</td>
                    <td className="px-5 py-3 text-right text-slate-400 text-xs whitespace-nowrap hidden sm:table-cell">${log.cost_usd.toFixed(4)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-200 bg-slate-50">
                  <td className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider" colSpan={3}>
                    Total affiché ({filtered.length} appels)
                  </td>
                  <td className="px-5 py-3 text-right font-black text-slate-900">
                    {formatCost(filtered.reduce((sum, l) => sum + l.cost_eur, 0))}
                  </td>
                  <td className="px-5 py-3 text-right text-slate-400 text-xs hidden sm:table-cell">
                    ${filtered.reduce((sum, l) => sum + l.cost_usd, 0).toFixed(4)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
