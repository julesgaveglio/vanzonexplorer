"use client";

import { useState, useCallback } from "react";
import type { Reservation } from "../page";

/* ─── Status & Platform config ─── */

const STATUS_CONFIG = {
  confirmed: { label: "A venir", bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500", border: "border-blue-100" },
  in_progress: { label: "En cours", bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500", border: "border-amber-100" },
  completed: { label: "Terminee", bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500", border: "border-emerald-100" },
  cancelled: { label: "Annulee", bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500", border: "border-red-100" },
} as const;

const PLATFORM_CONFIG = {
  yescapa: { label: "Yescapa", bg: "bg-teal-50", text: "text-teal-700" },
  wikicampers: { label: "Wikicampers", bg: "bg-purple-50", text: "text-purple-700" },
} as const;

type FilterKey = "all" | "confirmed" | "in_progress" | "completed";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "Toutes" },
  { key: "confirmed", label: "A venir" },
  { key: "in_progress", label: "En cours" },
  { key: "completed", label: "Terminees" },
];

/* ─── Helpers ─── */

function formatDateFR(dateStr: string | null): string {
  if (!dateStr) return "--";
  return new Date(dateStr).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

function formatDateShort(dateStr: string | null): string {
  if (!dateStr) return "--";
  return new Date(dateStr).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

function computeDuration(start: string | null, end: string | null): string {
  if (!start || !end) return "--";
  const days = Math.round((new Date(end).getTime() - new Date(start).getTime()) / 86400000);
  return days <= 0 ? "1j" : `${days}j`;
}

function formatRevenue(amount: number | null): string {
  if (amount === null) return "--";
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
}

/* ─── Components ─── */

function SyncButton() {
  const [syncing, setSyncing] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const handleSync = useCallback(async () => {
    setSyncing(true);
    setToast(null);
    try {
      const res = await fetch("/api/admin/reservations/sync-gmail", { method: "POST" });
      if (!res.ok) throw new Error("Sync failed");
      setToast({ type: "success", message: "Sync OK" });
    } catch {
      setToast({ type: "error", message: "Erreur sync" });
    } finally {
      setSyncing(false);
      setTimeout(() => setToast(null), 2500);
    }
  }, []);

  return (
    <div className="relative">
      <button
        onClick={handleSync}
        disabled={syncing}
        className="flex items-center justify-center w-10 h-10 rounded-xl bg-white border border-slate-200 active:scale-95 transition-transform"
        aria-label="Synchroniser"
      >
        <svg
          className={`w-5 h-5 text-slate-600 ${syncing ? "animate-spin" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </button>
      {toast && (
        <div
          className={`absolute top-12 right-0 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap shadow-lg z-50 ${
            toast.type === "success" ? "bg-emerald-500 text-white" : "bg-red-500 text-white"
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white rounded-xl border border-slate-100 p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-lg font-semibold text-slate-900 mt-0.5">{value}</p>
    </div>
  );
}

function ReservationCard({ reservation }: { reservation: Reservation }) {
  const [expanded, setExpanded] = useState(false);
  const status = STATUS_CONFIG[reservation.status];
  const platform = PLATFORM_CONFIG[reservation.platform];
  const whatsappSent = !!(reservation.whatsapp_pre_sent_at || reservation.whatsapp_post_sent_at);

  return (
    <div
      className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 active:bg-slate-50 transition-colors"
      onClick={() => setExpanded(!expanded)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setExpanded(!expanded); }}
    >
      {/* Row 1: Status + Platform */}
      <div className="flex items-center gap-2 mb-2">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${status.bg} ${status.text}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
          {status.label}
        </span>
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${platform.bg} ${platform.text}`}>
          {platform.label}
        </span>
      </div>

      {/* Row 2: Client name + Revenue */}
      <div className="flex items-center justify-between mb-1">
        <p className="text-base font-semibold text-slate-900 truncate mr-2">
          {reservation.client_name || "Client inconnu"}
        </p>
        <p className="text-base font-bold text-slate-900 shrink-0">
          {formatRevenue(reservation.revenue)}
        </p>
      </div>

      {/* Row 3: Van name */}
      {reservation.van_name && (
        <p className="text-sm text-slate-500 mb-2">{reservation.van_name}</p>
      )}

      {/* Row 4: Dates */}
      <div className="flex items-center gap-1.5 text-sm text-slate-600">
        <span className="shrink-0">📅</span>
        <span>
          {formatDateShort(reservation.start_date)} → {formatDateShort(reservation.end_date)}{" "}
          <span className="text-slate-400">({computeDuration(reservation.start_date, reservation.end_date)})</span>
        </span>
      </div>

      {/* Row 5: Destination */}
      {reservation.destination && (
        <div className="flex items-center gap-1.5 text-sm text-slate-600 mt-1">
          <span className="shrink-0">📍</span>
          <span>{reservation.destination}</span>
        </div>
      )}

      {/* Expand chevron */}
      <div className="flex justify-center mt-2">
        <svg
          className={`w-5 h-5 text-slate-300 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="bg-slate-50 rounded-xl p-3 mt-3 space-y-2.5" onClick={(e) => e.stopPropagation()}>
          {reservation.client_phone && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">Telephone</span>
              <a href={`tel:${reservation.client_phone}`} className="text-sm font-medium text-indigo-600">
                {reservation.client_phone}
              </a>
            </div>
          )}
          {reservation.client_email && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">Email</span>
              <span className="text-sm text-slate-700 truncate ml-4">{reservation.client_email}</span>
            </div>
          )}
          {reservation.travelers_count && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">Voyageurs</span>
              <span className="text-sm text-slate-700">{reservation.travelers_count}</span>
            </div>
          )}
          {reservation.insurance && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">Assurance</span>
              <span className="text-sm text-slate-700">{reservation.insurance}</span>
            </div>
          )}
          {reservation.km_included && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">Km inclus</span>
              <span className="text-sm text-slate-700">{reservation.km_included}</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">WhatsApp</span>
            <span className={`text-sm font-medium ${whatsappSent ? "text-emerald-600" : "text-slate-400"}`}>
              {whatsappSent ? "Envoye" : "Non envoye"}
            </span>
          </div>
          {reservation.whatsapp_pre_sent_at && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">WA pre-loc</span>
              <span className="text-sm text-slate-700">{formatDateFR(reservation.whatsapp_pre_sent_at)}</span>
            </div>
          )}
          {reservation.whatsapp_post_sent_at && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">WA post-loc</span>
              <span className="text-sm text-slate-700">{formatDateFR(reservation.whatsapp_post_sent_at)}</span>
            </div>
          )}
          {reservation.notes && (
            <div className="pt-2 border-t border-slate-200">
              <span className="text-xs text-slate-500 block mb-1">Notes</span>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{reservation.notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Main ─── */

export default function MobileReservations({ reservations }: { reservations: Reservation[] }) {
  const [filter, setFilter] = useState<FilterKey>("all");

  const filtered = reservations.filter((r) => {
    if (filter === "all") return true;
    return r.status === filter;
  });

  // Stats
  const totalRevenue = reservations.reduce((sum, r) => sum + (r.revenue ?? 0), 0);
  const upcoming = reservations.filter((r) => r.status === "confirmed").length;
  const whatsappSent = reservations.filter((r) => r.whatsapp_pre_sent_at || r.whatsapp_post_sent_at).length;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-slate-50/80 backdrop-blur-lg border-b border-slate-200/60">
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Reservations</h1>
            <p className="text-xs text-slate-500">{reservations.length} au total</p>
          </div>
          <SyncButton />
        </div>

        {/* Filter pills */}
        <div className="flex overflow-x-auto gap-2 px-4 pb-3 scrollbar-hide">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                filter === f.key
                  ? "bg-slate-900 text-white"
                  : "bg-white text-slate-600 border border-slate-200 active:bg-slate-100"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2 px-4 pt-4 pb-2">
        <StatCard label="Total" value={reservations.length} />
        <StatCard label="Revenus" value={formatRevenue(totalRevenue)} />
        <StatCard label="A venir" value={upcoming} />
        <StatCard label="WhatsApp" value={whatsappSent} />
      </div>

      {/* Cards */}
      <div className="flex flex-col gap-3 px-4 py-4">
        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-400 text-sm">Aucune reservation</p>
          </div>
        ) : (
          filtered.map((r) => <ReservationCard key={r.id} reservation={r} />)
        )}
      </div>

      {/* Bottom safe area */}
      <div className="h-24" />
    </div>
  );
}
