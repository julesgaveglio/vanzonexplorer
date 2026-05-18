"use client";

import { useState, useMemo, Fragment } from "react";
import type { Reservation } from "../page";

// ── Types ──────────────────────────────────────────────────────────────────────

type StatusFilter = "all" | "confirmed" | "in_progress" | "completed" | "cancelled";
type PlatformFilter = "all" | "yescapa" | "wikicampers";

// ── Constantes ─────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  Reservation["status"],
  { label: string; bg: string; text: string; dot: string }
> = {
  confirmed: {
    label: "Confirmee",
    bg: "bg-blue-50 border-blue-200",
    text: "text-blue-700",
    dot: "bg-blue-500",
  },
  in_progress: {
    label: "En cours",
    bg: "bg-amber-50 border-amber-200",
    text: "text-amber-700",
    dot: "bg-amber-500",
  },
  completed: {
    label: "Terminee",
    bg: "bg-emerald-50 border-emerald-200",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
  },
  cancelled: {
    label: "Annulee",
    bg: "bg-red-50 border-red-200",
    text: "text-red-700",
    dot: "bg-red-500",
  },
};

const PLATFORM_CONFIG: Record<
  Reservation["platform"],
  { label: string; bg: string; text: string }
> = {
  yescapa: { label: "Yescapa", bg: "bg-teal-50 border-teal-200", text: "text-teal-700" },
  wikicampers: { label: "Wikicampers", bg: "bg-purple-50 border-purple-200", text: "text-purple-700" },
};

const STATUS_TABS: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "Toutes" },
  { key: "confirmed", label: "A venir" },
  { key: "in_progress", label: "En cours" },
  { key: "completed", label: "Terminees" },
  { key: "cancelled", label: "Annulees" },
];

const PLATFORM_TABS: { key: PlatformFilter; label: string }[] = [
  { key: "all", label: "Toutes" },
  { key: "yescapa", label: "Yescapa" },
  { key: "wikicampers", label: "Wikicampers" },
];

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatDateFR(dateStr: string | null): string {
  if (!dateStr) return "--";
  const d = new Date(dateStr);
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

function computeDuration(start: string | null, end: string | null): string {
  if (!start || !end) return "--";
  const ms = new Date(end).getTime() - new Date(start).getTime();
  const days = Math.round(ms / (1000 * 60 * 60 * 24));
  if (days <= 0) return "1j";
  return `${days}j`;
}

function formatRevenue(amount: number | null): string {
  if (amount === null || amount === undefined) return "--";
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// ── Composant principal ────────────────────────────────────────────────────────

export default function ReservationsPanel({
  initialReservations,
}: {
  initialReservations: Reservation[];
}) {
  const [reservations] = useState<Reservation[]>(initialReservations);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [platformFilter, setPlatformFilter] = useState<PlatformFilter>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // ── Filtered data ──
  const filtered = useMemo(() => {
    let list = reservations;
    if (statusFilter !== "all") {
      list = list.filter((r) => r.status === statusFilter);
    }
    if (platformFilter !== "all") {
      list = list.filter((r) => r.platform === platformFilter);
    }
    return list;
  }, [reservations, statusFilter, platformFilter]);

  // ── Stats ──
  const stats = useMemo(() => {
    const now = new Date();
    const totalRevenue = reservations.reduce((sum, r) => sum + (r.revenue ?? 0), 0);
    const upcoming = reservations.filter(
      (r) => r.status === "confirmed" && r.start_date && new Date(r.start_date) > now
    ).length;
    const whatsappSent = reservations.filter((r) => r.whatsapp_pre_sent_at !== null).length;
    return { total: reservations.length, totalRevenue, upcoming, whatsappSent };
  }, [reservations]);

  // ── Sync Gmail ──
  async function handleSync() {
    setSyncing(true);
    setSyncMessage(null);
    try {
      const res = await fetch("/api/admin/reservations/sync-gmail", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setSyncMessage({
          text: data.message ?? `Sync terminee : ${data.imported ?? 0} nouvelle(s) reservation(s)`,
          type: "success",
        });
        // Reload page to get fresh data
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
            Reservations
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {stats.total} reservation{stats.total > 1 ? "s" : ""} au total
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
            {syncing ? "Sync en cours..." : "Sync Gmail"}
          </button>
        </div>
      </div>

      {/* ── Stats cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="glass-card p-5 rounded-2xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-1">
            Total reservations
          </p>
          <p className="text-3xl font-black text-slate-900">{stats.total}</p>
        </div>
        <div className="glass-card p-5 rounded-2xl">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-1">
            Revenus total
          </p>
          <p className="text-3xl font-black text-slate-900">{formatRevenue(stats.totalRevenue)}</p>
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
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        {/* Status filter */}
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

        {/* Platform filter */}
        <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
          {PLATFORM_TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setPlatformFilter(t.key)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                platformFilter === t.key
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {filtered.length !== reservations.length && (
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
                  Plateforme
                </th>
                <th className="text-left px-4 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">
                  Ref
                </th>
                <th className="text-left px-4 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">
                  Locataire
                </th>
                <th className="text-left px-4 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">
                  Telephone
                </th>
                <th className="text-left px-4 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">
                  Van
                </th>
                <th className="text-left px-4 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">
                  Depart
                </th>
                <th className="text-left px-4 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">
                  Retour
                </th>
                <th className="text-left px-4 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">
                  Duree
                </th>
                <th className="text-left px-4 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">
                  Revenu
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
                  <td colSpan={12} className="text-center py-16 text-slate-400 text-sm">
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
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      <p>Aucune reservation trouvee</p>
                      <p className="text-xs text-slate-300">
                        Cliquez sur &quot;Sync Gmail&quot; pour importer les reservations
                      </p>
                    </div>
                  </td>
                </tr>
              )}
              {filtered.map((r) => {
                const sc = STATUS_CONFIG[r.status];
                const pc = PLATFORM_CONFIG[r.platform];
                const isExpanded = expandedId === r.id;

                return (
                  <Fragment key={r.id}>
                    <tr
                      className={`border-b border-slate-100 hover:bg-slate-50/50 transition-colors cursor-pointer ${
                        isExpanded ? "bg-slate-50/80" : ""
                      }`}
                      onClick={() => setExpandedId(isExpanded ? null : r.id)}
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

                      {/* Platform */}
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${pc.bg} ${pc.text}`}
                        >
                          {pc.label}
                        </span>
                      </td>

                      {/* Ref */}
                      <td className="px-4 py-3 text-slate-600 font-mono text-xs">
                        {r.platform_ref}
                      </td>

                      {/* Client name */}
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {r.client_name ?? <span className="text-slate-300">--</span>}
                      </td>

                      {/* Phone */}
                      <td className="px-4 py-3">
                        {r.client_phone ? (
                          <a
                            href={`tel:${r.client_phone}`}
                            className="text-indigo-600 hover:text-indigo-800 text-xs font-mono underline underline-offset-2 decoration-dashed"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {r.client_phone}
                          </a>
                        ) : (
                          <span className="text-slate-300 text-xs">--</span>
                        )}
                      </td>

                      {/* Van */}
                      <td className="px-4 py-3 text-slate-700 whitespace-nowrap">
                        {r.van_name ?? <span className="text-slate-300">--</span>}
                      </td>

                      {/* Start date */}
                      <td className="px-4 py-3 text-slate-700 whitespace-nowrap text-xs">
                        {formatDateFR(r.start_date)}
                      </td>

                      {/* End date */}
                      <td className="px-4 py-3 text-slate-700 whitespace-nowrap text-xs">
                        {formatDateFR(r.end_date)}
                      </td>

                      {/* Duration */}
                      <td className="px-4 py-3 text-slate-600 text-xs font-medium">
                        {computeDuration(r.start_date, r.end_date)}
                      </td>

                      {/* Revenue */}
                      <td className="px-4 py-3 font-semibold text-slate-900 whitespace-nowrap">
                        {formatRevenue(r.revenue)}
                      </td>

                      {/* WhatsApp status */}
                      <td className="px-4 py-3">
                        {r.whatsapp_pre_sent_at ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600" title={`Envoye le ${formatDateFR(r.whatsapp_pre_sent_at)}`}>
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
                          Envoyer
                        </button>
                      </td>
                    </tr>

                    {/* Expanded details row */}
                    {isExpanded && (
                      <tr className="bg-slate-50/60">
                        <td colSpan={12} className="px-6 py-4">
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                                Email
                              </p>
                              <p className="text-slate-700">
                                {r.client_email ? (
                                  <a
                                    href={`mailto:${r.client_email}`}
                                    className="text-indigo-600 hover:text-indigo-800 underline underline-offset-2 decoration-dashed"
                                  >
                                    {r.client_email}
                                  </a>
                                ) : (
                                  "--"
                                )}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                                Destination
                              </p>
                              <p className="text-slate-700">{r.destination ?? "--"}</p>
                            </div>
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                                Voyageurs
                              </p>
                              <p className="text-slate-700">
                                {r.travelers_count !== null ? `${r.travelers_count} personne${r.travelers_count > 1 ? "s" : ""}` : "--"}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                                Assurance
                              </p>
                              <p className="text-slate-700">{r.insurance ?? "--"}</p>
                            </div>
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                                Km inclus
                              </p>
                              <p className="text-slate-700">{r.km_included ?? "--"}</p>
                            </div>
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                                WhatsApp pre-loc
                              </p>
                              <p className="text-slate-700">
                                {r.whatsapp_pre_sent_at ? formatDateFR(r.whatsapp_pre_sent_at) : "Non envoye"}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                                WhatsApp post-loc
                              </p>
                              <p className="text-slate-700">
                                {r.whatsapp_post_sent_at ? formatDateFR(r.whatsapp_post_sent_at) : "Non envoye"}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                                Importe le
                              </p>
                              <p className="text-slate-700">{formatDateFR(r.created_at)}</p>
                            </div>
                            {r.notes && (
                              <div className="col-span-2 sm:col-span-4">
                                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                                  Notes
                                </p>
                                <p className="text-slate-700 bg-white rounded-lg px-3 py-2 border border-slate-200 text-sm">
                                  {r.notes}
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

