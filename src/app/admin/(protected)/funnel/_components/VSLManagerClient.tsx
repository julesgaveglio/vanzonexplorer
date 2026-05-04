"use client";

import { useState, useEffect, useCallback } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { RefreshCw, Plus, Trash2, Zap, X } from "lucide-react";

/* ─── Constants ─────────────────────────────────────────── */

const COLOR_PRESETS = [
  { label: "Violet", value: "#8B5CF6" },
  { label: "Bleu", value: "#3B82F6" },
  { label: "Jaune", value: "#EAB308" },
  { label: "Vert", value: "#22C55E" },
  { label: "Rouge", value: "#EF4444" },
];

const PERIODS = [
  { label: "7j", value: 7 },
  { label: "14j", value: 14 },
  { label: "30j", value: 30 },
  { label: "90j", value: 90 },
];

/* ─── Types ─────────────────────────────────────────────── */

interface VSLVersion {
  id: string;
  name: string;
  bunny_video_id: string;
  bunny_library_id: string;
  color: string;
  is_active: boolean;
  activated_at: string | null;
  deactivated_at: string | null;
  notes: string | null;
  created_at: string;
  views: number;
  milestones: { "25": number; "50": number; "75": number; "100": number };
  retention_curve: { second: number; viewers: number }[] | null;
  booking_starts: number;
}

/* ─── Helpers ───────────────────────────────────────────── */

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function fmtPct(n: number) {
  return `${Math.round(n)}%`;
}

/** Build a synthetic retention curve from milestone data when no real curve exists */
function syntheticCurve(milestones: VSLVersion["milestones"]): { second: number; viewers: number }[] {
  // Assume ~20 min VSL (1200s) for a rough x-axis
  const estimatedDuration = 1200;
  return [
    { second: 0, viewers: 100 },
    { second: Math.round(estimatedDuration * 0.25), viewers: milestones["25"] },
    { second: Math.round(estimatedDuration * 0.5), viewers: milestones["50"] },
    { second: Math.round(estimatedDuration * 0.75), viewers: milestones["75"] },
    { second: estimatedDuration, viewers: milestones["100"] },
  ];
}

/* ─── Component ─────────────────────────────────────────── */

export default function VSLManagerClient() {
  const [versions, setVersions] = useState<VSLVersion[]>([]);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // New VSL form
  const [showForm, setShowForm] = useState(false);
  const [formName, setFormName] = useState("");
  const [formBunnyId, setFormBunnyId] = useState("");
  const [formColor, setFormColor] = useState(COLOR_PRESETS[0].value);
  const [formNotes, setFormNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  /* ─── Data fetching ─── */

  const fetchVersions = useCallback(
    (silent = false) => {
      if (!silent) setLoading(true);
      else setRefreshing(true);

      fetch(`/api/admin/funnel/vsl?days=${days}`)
        .then((r) => r.json())
        .then((d) => {
          setVersions(d.versions ?? []);
          setLastRefresh(new Date());
        })
        .catch(() => {})
        .finally(() => {
          setLoading(false);
          setRefreshing(false);
        });
    },
    [days]
  );

  useEffect(() => {
    fetchVersions();
  }, [fetchVersions]);

  /* ─── Actions ─── */

  async function createVersion(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/funnel/vsl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName,
          bunny_video_id: formBunnyId,
          color: formColor,
          notes: formNotes || null,
        }),
      });
      if (res.ok) {
        setShowForm(false);
        setFormName("");
        setFormBunnyId("");
        setFormColor(COLOR_PRESETS[0].value);
        setFormNotes("");
        fetchVersions();
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function activateVersion(id: string) {
    if (!confirm("Activer cette VSL ? La version active actuelle sera desactivee.")) return;
    await fetch(`/api/admin/funnel/vsl/${id}/activate`, { method: "PATCH" });
    fetchVersions();
  }

  async function deleteVersion(id: string) {
    if (!confirm("Supprimer cette VSL ? Cette action est irreversible.")) return;
    await fetch(`/api/admin/funnel/vsl/${id}`, { method: "DELETE" });
    fetchVersions();
  }

  /* ─── Build retention chart data ─── */

  const chartData = (() => {
    const curvesMap = new Map<number, Record<string, number>>();

    versions.forEach((v) => {
      const curve = v.retention_curve ?? syntheticCurve(v.milestones);
      curve.forEach(({ second, viewers }) => {
        if (!curvesMap.has(second)) curvesMap.set(second, {});
        curvesMap.get(second)![v.id] = viewers;
      });
    });

    return Array.from(curvesMap.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([second, vals]) => ({ second, ...vals }));
  })();

  /* ─── Loading state ─── */

  if (loading && versions.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  /* ─── Render ─── */

  return (
    <div className="space-y-6">
      {/* ─── Header ─── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-slate-900">Gestion des VSL</h2>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Period buttons */}
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => setDays(p.value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                days === p.value
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {p.label}
            </button>
          ))}

          <span className="text-slate-300 mx-1">|</span>

          {/* Refresh */}
          <button
            onClick={() => fetchVersions(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
          </button>
          {lastRefresh && (
            <span className="text-xs text-slate-400">
              {lastRefresh.toLocaleTimeString("fr-FR", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
            </span>
          )}
        </div>
      </div>

      {/* ─── Add VSL button ─── */}
      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Ajouter une VSL
        </button>
      )}

      {/* ─── New VSL form ─── */}
      {showForm && (
        <form
          onSubmit={createVersion}
          className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-700">Nouvelle VSL</h3>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="text-xs font-medium text-slate-500 block mb-1">Nom</label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="VSL v3 — hook depart"
                required
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400/30"
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="text-xs font-medium text-slate-500 block mb-1">
                Bunny Video ID <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={formBunnyId}
                onChange={(e) => setFormBunnyId(e.target.value)}
                placeholder="abc123-def456-..."
                required
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400/30"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-500 block mb-2">Couleur</label>
            <div className="flex gap-2">
              {COLOR_PRESETS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setFormColor(c.value)}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    formColor === c.value
                      ? "border-slate-900 scale-110 shadow-md"
                      : "border-transparent hover:border-slate-300"
                  }`}
                  style={{ backgroundColor: c.value }}
                  title={c.label}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-500 block mb-1">Notes</label>
            <textarea
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              placeholder="Changements par rapport a la version precedente..."
              rows={2}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400/30 resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="px-5 py-2 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {submitting ? "Enregistrement..." : "Enregistrer"}
          </button>
        </form>
      )}

      {/* ─── VSL Cards ─── */}
      {versions.length === 0 && !loading ? (
        <div className="text-center py-12 text-slate-400 text-sm">
          Aucune VSL enregistree. Ajoutez votre premiere version ci-dessus.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {versions.map((v) => (
            <div
              key={v.id}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden flex"
            >
              {/* Color stripe */}
              <div className="w-1.5 shrink-0" style={{ backgroundColor: v.color }} />

              <div className="flex-1 p-4 space-y-3">
                {/* Top row: name + status */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">{v.name}</p>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">
                      {v.bunny_video_id}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      v.is_active
                        ? "bg-emerald-50 text-emerald-600"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {v.is_active ? "Active" : "Inactive"}
                  </span>
                </div>

                {/* Dates */}
                <div className="text-xs text-slate-500 space-y-0.5">
                  <p>
                    Creee le {fmtDate(v.created_at)}
                    {v.activated_at && <> &middot; Activee le {fmtDate(v.activated_at)}</>}
                    {v.deactivated_at && <> &middot; Desactivee le {fmtDate(v.deactivated_at)}</>}
                  </p>
                  {v.notes && <p className="text-slate-400 italic">{v.notes}</p>}
                </div>

                {/* Quick stats */}
                <div className="flex gap-4 text-xs">
                  <span className="text-slate-600">
                    <strong className="text-slate-900">{v.views}</strong> vues
                  </span>
                  <span className="text-slate-600">
                    <strong className="text-slate-900">{v.booking_starts}</strong> bookings
                  </span>
                  {v.views > 0 && (
                    <span className="text-slate-600">
                      <strong className="text-slate-900">
                        {fmtPct(v.milestones["100"])}
                      </strong>{" "}
                      completion
                    </span>
                  )}
                </div>

                {/* Actions */}
                {!v.is_active && (
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => activateVersion(v.id)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors"
                    >
                      <Zap className="w-3 h-3" />
                      Activer
                    </button>
                    <button
                      onClick={() => deleteVersion(v.id)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                      Supprimer
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── Retention Chart ─── */}
      {versions.length > 0 && (
        <div className="bg-slate-900 rounded-2xl p-6">
          <h3 className="text-white text-sm font-semibold mb-4">Courbes de retention</h3>

          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={chartData}>
                <XAxis
                  dataKey="second"
                  stroke="#64748b"
                  tick={{ fill: "#94a3b8", fontSize: 11 }}
                  label={{
                    value: "Secondes",
                    position: "insideBottomRight",
                    offset: -5,
                    fill: "#94a3b8",
                    fontSize: 11,
                  }}
                />
                <YAxis
                  stroke="#64748b"
                  tick={{ fill: "#94a3b8", fontSize: 11 }}
                  domain={[0, 100]}
                  label={{
                    value: "% viewers",
                    angle: -90,
                    position: "insideLeft",
                    offset: 10,
                    fill: "#94a3b8",
                    fontSize: 11,
                  }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    border: "1px solid #334155",
                    borderRadius: "8px",
                    fontSize: 12,
                  }}
                  labelStyle={{ color: "#94a3b8" }}
                  itemStyle={{ color: "#e2e8f0" }}
                  labelFormatter={(val) => `${val}s`}
                  formatter={(val: number | undefined) => [`${Math.round(val ?? 0)}%`]}
                />
                <Legend
                  wrapperStyle={{ fontSize: 12, color: "#cbd5e1" }}
                  formatter={(value) => {
                    const v = versions.find((ver) => ver.id === value);
                    return v?.name ?? value;
                  }}
                />
                {versions.map((v) => (
                  <Line
                    key={v.id}
                    dataKey={v.id}
                    name={v.id}
                    stroke={v.color}
                    strokeWidth={2}
                    dot={false}
                    connectNulls
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-slate-500 text-sm text-center py-8">
              Aucune donnee de retention disponible.
            </p>
          )}
        </div>
      )}

      {/* ─── KPI Comparison Table ─── */}
      {versions.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    VSL
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Vues
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    25%
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    50%
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    75%
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    100%
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Bookings
                  </th>
                </tr>
              </thead>
              <tbody>
                {versions.map((v, i) => (
                  <tr
                    key={v.id}
                    className={i < versions.length - 1 ? "border-b border-slate-50" : ""}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: v.color }}
                        />
                        <span className="font-medium text-slate-900">{v.name}</span>
                        {v.is_active && (
                          <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                            ACTIVE
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="text-right px-4 py-3 font-mono text-slate-700">{v.views}</td>
                    <td className="text-right px-4 py-3 font-mono text-slate-700">
                      {fmtPct(v.milestones["25"])}
                    </td>
                    <td className="text-right px-4 py-3 font-mono text-slate-700">
                      {fmtPct(v.milestones["50"])}
                    </td>
                    <td className="text-right px-4 py-3 font-mono text-slate-700">
                      {fmtPct(v.milestones["75"])}
                    </td>
                    <td className="text-right px-4 py-3 font-mono text-slate-700">
                      {fmtPct(v.milestones["100"])}
                    </td>
                    <td className="text-right px-4 py-3 font-mono text-slate-700">
                      {v.booking_starts}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
