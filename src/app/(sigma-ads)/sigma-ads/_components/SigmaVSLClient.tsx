"use client";

import { useState, useEffect } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar,
} from "recharts";
import { useSigmaCampaign } from "./SigmaCampaignContext";

interface RetentionPoint {
  time: number;
  label: string;
  pct: number;
}

interface VersionData {
  id: string;
  name: string;
  color: string;
  is_active: boolean;
  total_viewers: number;
  completion_rate: number;
  retention: RetentionPoint[];
}

interface VSLData {
  versions: VersionData[];
  daily: { date: string; views: number; completions: number }[];
}

export default function SigmaVSLClient() {
  const { buildQS, loading: campLoading } = useSigmaCampaign();
  const [data, setData] = useState<VSLData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (campLoading) return;
    setLoading(true);
    const qs = buildQS();
    fetch(`/api/sigma/vsl?${qs}`)
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [buildQS, campLoading]);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#B9945F]" />
      </div>
    );
  }

  if (!data || !data.versions) return <p className="text-slate-400">Erreur de chargement.</p>;

  const versions = data.versions;
  const mergedRetention = buildMergedRetention(versions);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">VSL Analytics</h1>
        <p className="text-sm text-slate-500 mt-1">
          {versions.length} version{versions.length > 1 ? "s" : ""} — courbes de retention superposees
        </p>
      </div>

      {/* KPI Cards per version */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {versions.map((v) => (
          <div
            key={v.id}
            className="bg-white border border-slate-200 rounded-2xl p-5"
            style={{ borderLeftWidth: 3, borderLeftColor: v.color }}
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-slate-500 font-medium truncate">{v.name}</p>
              {v.is_active && (
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                  Active
                </span>
              )}
            </div>
            <p className="text-2xl font-bold" style={{ color: v.color }}>
              {v.total_viewers}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              vues — {v.completion_rate}% completion
            </p>
          </div>
        ))}
      </div>

      {/* Retention curves */}
      {mergedRetention.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-1 gap-2">
            <h3 className="text-slate-900 font-semibold">Courbes de retention</h3>
            <div className="flex flex-wrap items-center gap-3">
              {versions.map((v) => (
                <div key={v.id} className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: v.color }} />
                  <span className="text-xs text-slate-500">{v.name}</span>
                </div>
              ))}
            </div>
          </div>
          <p className="text-xs text-slate-400 mb-4">Pourcentage de spectateurs restants</p>
          <div className="h-56 sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mergedRetention} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <defs>
                  {versions.map((v) => (
                    <linearGradient key={v.id} id={`sigmaGrad-${v.id}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={v.color} stopOpacity={0.15} />
                      <stop offset="95%" stopColor={v.color} stopOpacity={0.02} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis
                  dataKey="label"
                  tick={{ fill: "#94A3B8", fontSize: 10 }}
                  axisLine={{ stroke: "#E2E8F0" }}
                  tickLine={false}
                  interval={Math.max(Math.floor(mergedRetention.length / 10), 1)}
                />
                <YAxis
                  tick={{ fill: "#94A3B8", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  domain={[0, 100]}
                  tickFormatter={(v: number) => `${v}%`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #E2E8F0",
                    borderRadius: "12px",
                    fontSize: 13,
                    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                  }}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={((value: any, name: any) => [`${value}%`, name]) as never}
                />
                {versions.map((v) => (
                  <Area
                    key={v.id}
                    type="monotone"
                    dataKey={v.name}
                    stroke={v.color}
                    strokeWidth={2.5}
                    fill={`url(#sigmaGrad-${v.id})`}
                    dot={false}
                    connectNulls
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Daily views */}
      {data.daily && data.daily.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
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
                <Bar dataKey="views" name="Vues" fill="#B9945F" radius={[4, 4, 0, 0]} />
                <Bar dataKey="completions" name="Completions" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

function buildMergedRetention(versions: VersionData[]) {
  const allTimes = new Set<number>();
  for (const v of versions) {
    for (const r of v.retention) allTimes.add(r.time);
  }
  const sortedTimes = Array.from(allTimes).sort((a, b) => a - b);

  return sortedTimes.map((t) => {
    const minutes = Math.floor(t / 60);
    const secs = t % 60;
    const point: Record<string, unknown> = {
      label: `${minutes}:${secs.toString().padStart(2, "0")}`,
    };
    for (const v of versions) {
      const exact = v.retention.find((r) => r.time === t);
      if (exact) {
        point[v.name] = exact.pct;
      } else {
        const before = v.retention.filter((r) => r.time <= t).pop();
        const after = v.retention.find((r) => r.time > t);
        if (before && after) {
          const ratio = (t - before.time) / (after.time - before.time);
          point[v.name] = Math.round(before.pct + ratio * (after.pct - before.pct));
        } else if (before) {
          point[v.name] = before.pct;
        }
      }
    }
    return point;
  });
}
