"use client";

import { useState } from "react";

interface Competitor {
  id: string;
  domain: string;
  name: string;
  description: string | null;
  strengths: string | null;
  weaknesses: string | null;
  pricing: string | null;
  offerings: string | null;
  traffic_estimate: number;
  domain_authority: number;
  last_analyzed: string | null;
}

export default function CompetitorTable({ competitors }: { competitors: Competitor[] }) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Nom</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Offres</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Tarifs</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Trafic</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Autorité</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {competitors.map((c) => (
              <>
                <tr
                  key={c.id}
                  className="border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer"
                  onClick={() => toggle(c.id)}
                >
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-900">{c.name}</div>
                    <div className="text-xs text-slate-400">{c.domain}</div>
                  </td>
                  <td className="px-4 py-3 max-w-[200px]">
                    <span className="text-slate-600 line-clamp-2 text-xs">{c.offerings ?? "—"}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-slate-600 text-xs">{c.pricing ?? "—"}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="font-mono text-slate-700">{c.traffic_estimate?.toLocaleString("fr-FR") ?? "0"}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold ${
                      (c.domain_authority ?? 0) >= 50 ? "bg-red-100 text-red-700" :
                      (c.domain_authority ?? 0) >= 30 ? "bg-orange-100 text-orange-700" :
                      "bg-green-100 text-green-700"
                    }`}>
                      {c.domain_authority ?? 0}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <svg
                      className={`w-4 h-4 text-slate-400 transition-transform ${expanded.has(c.id) ? "rotate-180" : ""}`}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </td>
                </tr>
                {expanded.has(c.id) && (
                  <tr key={`${c.id}-expanded`} className="bg-slate-50">
                    <td colSpan={6} className="px-4 py-4">
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 text-sm">
                        {c.description && (
                          <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Description</p>
                            <p className="text-slate-700">{c.description}</p>
                          </div>
                        )}
                        {c.strengths && (
                          <div>
                            <p className="text-xs font-semibold text-emerald-600 uppercase mb-1">Forces</p>
                            <ul className="space-y-0.5">
                              {c.strengths.split(",").map((s, i) => (
                                <li key={i} className="text-slate-700 flex items-start gap-1">
                                  <span className="text-emerald-500 mt-0.5">+</span> {s.trim()}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {c.weaknesses && (
                          <div>
                            <p className="text-xs font-semibold text-red-500 uppercase mb-1">Faiblesses</p>
                            <ul className="space-y-0.5">
                              {c.weaknesses.split(",").map((s, i) => (
                                <li key={i} className="text-slate-700 flex items-start gap-1">
                                  <span className="text-red-400 mt-0.5">−</span> {s.trim()}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                      {c.last_analyzed && (
                        <p className="text-xs text-slate-400 mt-3">
                          Analysé le {new Date(c.last_analyzed).toLocaleDateString("fr-FR")}
                        </p>
                      )}
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
