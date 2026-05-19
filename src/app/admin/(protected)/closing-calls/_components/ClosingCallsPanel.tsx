"use client";

import { useState, useMemo, Fragment } from "react";
import type { ClosingCall } from "../page";

// ── Types ──────────────────────────────────────────────────────────────────────

type StatusFilter = "all" | "upcoming" | "completed" | "no_show" | "cancelled";

// ── Constantes ─────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  ClosingCall["status"],
  { label: string; bg: string; text: string; dot: string }
> = {
  upcoming: {
    label: "A venir",
    bg: "bg-blue-50 border-blue-200",
    text: "text-blue-700",
    dot: "bg-blue-500",
  },
  completed: {
    label: "Termine",
    bg: "bg-emerald-50 border-emerald-200",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
  },
  no_show: {
    label: "No show",
    bg: "bg-red-50 border-red-200",
    text: "text-red-700",
    dot: "bg-red-500",
  },
  cancelled: {
    label: "Annule",
    bg: "bg-slate-50 border-slate-200",
    text: "text-slate-500",
    dot: "bg-slate-400",
  },
};

const STATUS_TABS: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "Tous" },
  { key: "upcoming", label: "A venir" },
  { key: "completed", label: "Termines" },
  { key: "no_show", label: "No show" },
  { key: "cancelled", label: "Annules" },
];

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatDateTimeFR(dateStr: string): string {
  const d = new Date(dateStr);
  return (
    d.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" }) +
    " a " +
    d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
  );
}

function truncate(str: string, max: number): string {
  if (str.length <= max) return str;
  return str.slice(0, max) + "...";
}

// ── Composant principal ────────────────────────────────────────────────────────

export default function ClosingCallsPanel({
  initialCalls,
}: {
  initialCalls: ClosingCall[];
}) {
  const [calls] = useState<ClosingCall[]>(initialCalls);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // ── Filtered data ──
  const filtered = useMemo(() => {
    if (statusFilter === "all") return calls;
    return calls.filter((c) => c.status === statusFilter);
  }, [calls, statusFilter]);

  // ── Stats ──
  const stats = useMemo(() => {
    const upcoming = calls.filter((c) => c.status === "upcoming").length;
    const completed = calls.filter((c) => c.status === "completed").length;
    const noShow = calls.filter((c) => c.status === "no_show").length;
    const whatsappSent = calls.filter((c) => c.whatsapp_sent_at !== null).length;
    const showRate =
      completed + noShow > 0
        ? Math.round((completed / (completed + noShow)) * 100)
        : 0;
    return { total: calls.length, upcoming, whatsappSent, showRate };
  }, [calls]);

  // ── Sync Calendar ──
  async function handleSync() {
    setSyncing(true);
    setSyncMessage(null);
    try {
      const res = await fetch("/api/admin/closing-calls/sync", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setSyncMessage({
          text: data.message ?? `Sync terminee : ${data.synced ?? 0} appel(s) synchronise(s)`,
          type: "success",
        });
        setTimeout(() => window.location.reload(), 1500);
      } else {
        setSyncMessage({ text: data.error ?? "Erreur lors de la synchronisation", type: "error" });
      }
    } catch {
      setSyncMessage({ text: "Erreur reseau", type: "error" });
    } finally {
      setSyncing(false);
    }
  }

  return (
    <>
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl md:text-2xl lg:text-3xl font-black text-slate-900">
            Closing Calls
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {stats.total} appel{stats.total > 1 ? "s" : ""} au total
          </p>
        </div>
        <div className="flex items-center gap-3">
          {syncMessage && (
            <span
              className={`text-sm font-medium px-3 py-1.5 rounded-lg ${
                syncMessage.type === "success"
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-red-50 text-red-700"
              }`}
            >
              {syncMessage.text}
            </span>
          )}
          <button
            onClick={handleSync}
            disabled={syncing}
            className="inline-flex items-center gap-2 font-semibold text-white text-sm px-5 py-2.5 rounded-xl transition-all disabled:opacity-50"
            style={{
              background: "linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)",
              boxShadow: "0 4px 14px rgba(99,102,241,0.35)",
            }}
          >
            {syncing ? (
              <svg
                className="w-4 h-4 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
            ) : (
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            )}
            {syncing ? "Sync en cours..." : "Sync Calendar"}
          </button>
        </div>
      </div>

      {/* ── Stats cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="glass-card p-5 rounded-2xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-1">
            Total appels
          </p>
          <p className="text-3xl font-black text-slate-900">{stats.total}</p>
        </div>
        <div className="glass-card p-5 rounded-2xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-1">
            A venir
          </p>
          <p className="text-3xl font-black text-blue-600">{stats.upcoming}</p>
        </div>
        <div className="glass-card p-5 rounded-2xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-1">
            WhatsApp envoyes
          </p>
          <p className="text-3xl font-black text-emerald-600">{stats.whatsappSent}</p>
        </div>
        <div className="glass-card p-5 rounded-2xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-1">
            Taux de show
          </p>
          <p className="text-3xl font-black text-slate-900">{stats.showRate}%</p>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
          {STATUS_TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setStatusFilter(t.key)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                statusFilter === t.key
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {filtered.length !== calls.length && (
          <span className="text-sm text-slate-400">
            {filtered.length} resultat{filtered.length > 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* ── Table ── */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/60">
                <th className="text-left px-4 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">
                  Statut
                </th>
                <th className="text-left px-4 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">
                  Prenom
                </th>
                <th className="text-left px-4 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">
                  Telephone
                </th>
                <th className="text-left px-4 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">
                  Email
                </th>
                <th className="text-left px-4 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">
                  Date & Heure
                </th>
                <th className="text-left px-4 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">
                  Notes
                </th>
                <th className="text-left px-4 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">
                  WhatsApp
                </th>
                <th className="text-left px-4 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-16 text-slate-400 text-sm">
                    <div className="flex flex-col items-center gap-2">
                      <svg
                        className="w-10 h-10 text-slate-300"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"
                        />
                      </svg>
                      <p>Aucun appel trouve</p>
                      <p className="text-xs text-slate-300">
                        Cliquez sur &quot;Sync Calendar&quot; pour importer les appels
                      </p>
                    </div>
                  </td>
                </tr>
              )}
              {filtered.map((c) => {
                const sc = STATUS_CONFIG[c.status];
                const isExpanded = expandedId === c.id;

                return (
                  <Fragment key={c.id}>
                    <tr
                      className={`border-b border-slate-100 hover:bg-slate-50/50 transition-colors cursor-pointer ${
                        isExpanded ? "bg-slate-50/80" : ""
                      }`}
                      onClick={() => setExpandedId(isExpanded ? null : c.id)}
                    >
                      {/* Status */}
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${sc.bg} ${sc.text}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                          {sc.label}
                        </span>
                      </td>

                      {/* Name */}
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {c.name || <span className="text-slate-300">--</span>}
                      </td>

                      {/* Phone */}
                      <td className="px-4 py-3">
                        {c.phone ? (
                          <a
                            href={`tel:${c.phone}`}
                            className="text-indigo-600 hover:text-indigo-800 text-xs font-mono underline underline-offset-2 decoration-dashed"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {c.phone}
                          </a>
                        ) : (
                          <span className="text-slate-300 text-xs">--</span>
                        )}
                      </td>

                      {/* Email */}
                      <td className="px-4 py-3">
                        {c.email ? (
                          <a
                            href={`mailto:${c.email}`}
                            className="text-indigo-600 hover:text-indigo-800 text-xs underline underline-offset-2 decoration-dashed"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {c.email}
                          </a>
                        ) : (
                          <span className="text-slate-300 text-xs">--</span>
                        )}
                      </td>

                      {/* Date & Heure */}
                      <td className="px-4 py-3 text-slate-700 whitespace-nowrap text-xs">
                        {c.scheduled_at ? formatDateTimeFR(c.scheduled_at) : "--"}
                      </td>

                      {/* Notes (truncated) */}
                      <td className="px-4 py-3 text-slate-600 text-xs max-w-[200px]">
                        {c.notes ? (
                          <span title={c.notes}>{truncate(c.notes, 60)}</span>
                        ) : (
                          <span className="text-slate-300">--</span>
                        )}
                      </td>

                      {/* WhatsApp */}
                      <td className="px-4 py-3">
                        {c.whatsapp_sent_at ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600" title={`Envoye le ${formatDateTimeFR(c.whatsapp_sent_at)}`}>
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.121.553 4.113 1.519 5.845L.052 23.576a.5.5 0 00.607.607l5.731-1.467A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22a9.94 9.94 0 01-5.38-1.574l-.386-.229-3.4.87.888-3.248-.25-.398A9.94 9.94 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
                            </svg>
                          </span>
                        ) : (
                          <span className="text-slate-300 text-xs">--</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <button
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-400 text-xs font-medium cursor-not-allowed"
                          disabled
                          title="Bientot disponible"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                            <path d="M12 0C5.373 0 0 5.373 0 12c0 2.121.553 4.113 1.519 5.845L.052 23.576a.5.5 0 00.607.607l5.731-1.467A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22a9.94 9.94 0 01-5.38-1.574l-.386-.229-3.4.87.888-3.248-.25-.398A9.94 9.94 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
                          </svg>
                          Bientot
                        </button>
                      </td>
                    </tr>

                    {/* Expanded details row */}
                    {isExpanded && (
                      <tr className="bg-slate-50/60">
                        <td colSpan={8} className="px-6 py-4">
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                                Email
                              </p>
                              <p className="text-slate-700">
                                {c.email ? (
                                  <a
                                    href={`mailto:${c.email}`}
                                    className="text-indigo-600 hover:text-indigo-800 underline underline-offset-2 decoration-dashed"
                                  >
                                    {c.email}
                                  </a>
                                ) : (
                                  "--"
                                )}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                                Telephone
                              </p>
                              <p className="text-slate-700">
                                {c.phone ? (
                                  <a
                                    href={`tel:${c.phone}`}
                                    className="text-indigo-600 hover:text-indigo-800 underline underline-offset-2 decoration-dashed"
                                  >
                                    {c.phone}
                                  </a>
                                ) : (
                                  "--"
                                )}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                                WhatsApp envoye
                              </p>
                              <p className="text-slate-700">
                                {c.whatsapp_sent_at ? formatDateTimeFR(c.whatsapp_sent_at) : "Non envoye"}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                                Importe le
                              </p>
                              <p className="text-slate-700">
                                {formatDateTimeFR(c.created_at)}
                              </p>
                            </div>
                            {c.notes && (
                              <div className="col-span-2 sm:col-span-4">
                                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                                  Notes
                                </p>
                                <p className="text-slate-700 bg-white rounded-lg px-3 py-2 border border-slate-200 text-sm whitespace-pre-wrap">
                                  {c.notes}
                                </p>
                              </div>
                            )}
                            {c.whatsapp_message && (
                              <div className="col-span-2 sm:col-span-4">
                                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                                  Message WhatsApp
                                </p>
                                <p className="text-slate-700 bg-white rounded-lg px-3 py-2 border border-slate-200 text-sm whitespace-pre-wrap">
                                  {c.whatsapp_message}
                                </p>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
