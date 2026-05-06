"use client";

import { useState, useEffect } from "react";

interface Call {
  email: string;
  firstname: string | null;
  booking_started: string | null;
  booking_confirmed: string | null;
  source: string;
  utm_source: string | null;
  utm_campaign: string | null;
}

const PERIODS = [
  { label: "30j", days: 30 },
  { label: "90j", days: 90 },
] as const;

export default function AdsCallsClient() {
  const [calls, setCalls] = useState<Call[]>([]);
  const [period, setPeriod] = useState(90);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/ads/calls?days=${period}`)
      .then((r) => r.json())
      .then((json) => setCalls(json.calls ?? []))
      .finally(() => setLoading(false));
  }, [period]);

  const confirmed = calls.filter((c) => c.booking_confirmed);
  const pending = calls.filter((c) => !c.booking_confirmed);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Appels</h1>
          <p className="text-sm text-slate-500 mt-1">
            {confirmed.length} confirmé{confirmed.length > 1 ? "s" : ""} ·{" "}
            {pending.length} en attente
          </p>
        </div>
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

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <p className="text-xs text-slate-500 uppercase tracking-wider font-medium mb-1">
            Total appels
          </p>
          <p className="text-2xl font-bold text-slate-900">{calls.length}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <p className="text-xs text-slate-500 uppercase tracking-wider font-medium mb-1">
            Confirmés
          </p>
          <p className="text-2xl font-bold text-emerald-600">
            {confirmed.length}
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <p className="text-xs text-slate-500 uppercase tracking-wider font-medium mb-1">
            Taux confirmation
          </p>
          <p className="text-2xl font-bold text-blue-600">
            {calls.length > 0
              ? Math.round((confirmed.length / calls.length) * 100)
              : 0}
            %
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <svg
              className="animate-spin h-6 w-6 text-blue-500"
              viewBox="0 0 24 24"
            >
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="3"
                fill="none"
                strokeDasharray="30 70"
              />
            </svg>
          </div>
        ) : calls.length === 0 ? (
          <div className="text-center py-20 text-slate-400 text-sm">
            Aucun appel sur la période
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="text-left text-xs text-slate-500 uppercase tracking-wider px-4 py-3 font-medium">
                    Prénom
                  </th>
                  <th className="text-left text-xs text-slate-500 uppercase tracking-wider px-4 py-3 font-medium">
                    Email
                  </th>
                  <th className="text-left text-xs text-slate-500 uppercase tracking-wider px-4 py-3 font-medium">
                    Statut
                  </th>
                  <th className="text-left text-xs text-slate-500 uppercase tracking-wider px-4 py-3 font-medium">
                    Source
                  </th>
                  <th className="text-left text-xs text-slate-500 uppercase tracking-wider px-4 py-3 font-medium">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody>
                {calls.map((call, i) => {
                  const date = call.booking_confirmed ?? call.booking_started;
                  const isConfirmed = !!call.booking_confirmed;

                  return (
                    <tr
                      key={i}
                      className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="px-4 py-3 text-slate-900 font-medium">
                        {call.firstname ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-600 text-xs">
                        {call.email}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                            isConfirmed
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                              : "bg-amber-50 text-amber-700 border border-amber-100"
                          }`}
                        >
                          {isConfirmed ? "Confirmé" : "Calendly ouvert"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                            call.source.startsWith("email")
                              ? "bg-purple-50 text-purple-700 border border-purple-100"
                              : call.source.includes("facebook") || call.source.includes("fb")
                                ? "bg-blue-50 text-blue-700 border border-blue-100"
                                : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {call.source}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-xs">
                        {date
                          ? new Date(date).toLocaleDateString("fr-FR", {
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "—"}
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
