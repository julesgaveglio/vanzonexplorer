"use client";

import { useState, useEffect } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar,
} from "recharts";

interface VSLData {
  retention: { point: string; label: string; viewers: number; pct: number }[];
  daily: { date: string; views: number; completions: number }[];
  dropoffs: { zone: string; lost: number; rate: number }[];
  total_viewers: number;
  completion_rate: number;
}

const PERIODS = [
  { label: "7j", days: 7 },
  { label: "14j", days: 14 },
  { label: "30j", days: 30 },
  { label: "90j", days: 90 },
] as const;

export default function AdsVSLClient() {
  const [data, setData] = useState<VSLData | null>(null);
  const [period, setPeriod] = useState(30);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/ads/vsl?days=${period}`)
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [period]);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) return <p className="text-slate-400">Erreur de chargement.</p>;

  const worstDrop = data.dropoffs.reduce((max, d) => d.rate > max.rate ? d : max, data.dropoffs[0]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">VSL Analytics</h1>
          <p className="text-sm text-slate-500 mt-1">Analyse de rétention de la vidéo de vente</p>
        </div>
        <div className="flex bg-white rounded-xl border border-slate-200 p-0.5 shadow-sm">
          {PERIODS.map((p) => (
            <button
              key={p.days}
              onClick={() => setPeriod(p.days)}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${
                period === p.days ? "bg-violet-50 text-violet-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm ring-1 ring-violet-100">
          <p className="text-xs text-slate-500 uppercase tracking-wider font-medium mb-1">Vues VSL</p>
          <p className="text-3xl font-bold text-violet-600">{data.total_viewers}</p>
          <p className="text-xs text-slate-400 mt-1">spectateurs uniques</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm ring-1 ring-emerald-100">
          <p className="text-xs text-slate-500 uppercase tracking-wider font-medium mb-1">Taux complétion</p>
          <p className="text-3xl font-bold text-emerald-600">{data.completion_rate}%</p>
          <p className="text-xs text-slate-400 mt-1">ont regardé jusqu&apos;au bout</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm ring-1 ring-red-100">
          <p className="text-xs text-slate-500 uppercase tracking-wider font-medium mb-1">Zone critique</p>
          <p className="text-3xl font-bold text-red-600">{worstDrop?.zone ?? "—"}</p>
          <p className="text-xs text-slate-400 mt-1">{worstDrop?.rate ?? 0}% de perte</p>
        </div>
      </div>

      {/* Retention curve */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <h3 className="text-slate-900 font-semibold mb-1">Courbe de rétention</h3>
        <p className="text-xs text-slate-400 mb-4">Pourcentage de spectateurs restants à chaque étape de la vidéo</p>
        <div className="h-56 sm:h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.retention} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="gradRetention" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#EC4899" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="label" tick={{ fill: "#94A3B8", fontSize: 12 }} axisLine={{ stroke: "#E2E8F0" }} tickLine={false} />
              <YAxis tick={{ fill: "#94A3B8", fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} tickFormatter={(v: number) => `${v}%`} />
              <Tooltip
                contentStyle={{ backgroundColor: "#fff", border: "1px solid #E2E8F0", borderRadius: "12px", fontSize: 13, boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                formatter={((value: any, name: any) => {
                  if (name === "pct") return [`${value}%`, "Rétention"];
                  return [value, name];
                }) as never}
                labelFormatter={(label) => `Progression : ${label}`}
              />
              <Area type="monotone" dataKey="pct" name="pct" stroke="#8B5CF6" strokeWidth={3} fill="url(#gradRetention)" dot={{ r: 6, fill: "#8B5CF6", stroke: "#fff", strokeWidth: 2 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Two columns: Daily views + Drop-off analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Daily VSL views */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <h3 className="text-slate-900 font-semibold mb-4">Vues quotidiennes</h3>
          <div className="h-48 sm:h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.daily} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: "#94A3B8", fontSize: 10 }}
                  tickFormatter={(v: string) => { const d = new Date(v); return `${d.getDate()}/${d.getMonth()+1}`; }}
                  axisLine={{ stroke: "#E2E8F0" }}
                  tickLine={false}
                />
                <YAxis tick={{ fill: "#94A3B8", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#fff", border: "1px solid #E2E8F0", borderRadius: "12px", fontSize: 13, boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}
                  labelFormatter={(v) => new Date(String(v)).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                />
                <Bar dataKey="views" name="Vues" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="completions" name="Complétions" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Drop-off analysis */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <h3 className="text-slate-900 font-semibold mb-4">Analyse des abandons</h3>
          <div className="space-y-3">
            {data.dropoffs.map((d, i) => {
              const isWorst = d.zone === worstDrop?.zone;
              return (
                <div key={i} className={`rounded-xl p-4 border ${isWorst ? "bg-red-50 border-red-200" : "bg-slate-50 border-slate-200"}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-sm font-semibold ${isWorst ? "text-red-700" : "text-slate-700"}`}>{d.zone}</span>
                    <span className={`text-sm font-bold ${isWorst ? "text-red-600" : "text-slate-500"}`}>{d.rate}% perdus</span>
                  </div>
                  <div className="w-full h-2 bg-white rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${isWorst ? "bg-red-500" : "bg-slate-300"}`}
                      style={{ width: `${Math.min(d.rate, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-1.5">{d.lost} spectateur{d.lost > 1 ? "s" : ""} perdu{d.lost > 1 ? "s" : ""}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
