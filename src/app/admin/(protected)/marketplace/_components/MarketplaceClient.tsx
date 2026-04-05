"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { MarketplaceVan } from "../page";

const STATUS_CONFIG = {
  pending: { label: "En attente", bg: "bg-amber-100", text: "text-amber-700", dot: "bg-amber-500" },
  approved: { label: "Approuvé", bg: "bg-emerald-100", text: "text-emerald-700", dot: "bg-emerald-500" },
  rejected: { label: "Rejeté", bg: "bg-red-100", text: "text-red-700", dot: "bg-red-500" },
};

type FilterStatus = "all" | "pending" | "approved" | "rejected";

export default function MarketplaceClient({ vans }: { vans: MarketplaceVan[] }) {
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const filtered = filter === "all" ? vans : vans.filter((v) => v.status === filter);

  const counts = {
    all: vans.length,
    pending: vans.filter((v) => v.status === "pending").length,
    approved: vans.filter((v) => v.status === "approved").length,
    rejected: vans.filter((v) => v.status === "rejected").length,
  };

  async function updateStatus(id: string, status: string) {
    await fetch(`/api/admin/marketplace/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    startTransition(() => router.refresh());
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <p className="text-slate-400 text-sm font-medium mb-1">Administration</p>
        <h1 className="text-3xl font-black text-slate-900">Marketplace</h1>
        <p className="text-slate-500 mt-1">
          {vans.length} fiche{vans.length > 1 ? "s" : ""} van soumise{vans.length > 1 ? "s" : ""}
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6">
        {(["all", "pending", "approved", "rejected"] as FilterStatus[]).map((status) => {
          const labels = { all: "Tous", pending: "En attente", approved: "Approuvés", rejected: "Rejetés" };
          const isActive = filter === status;
          return (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? "bg-blue-500 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {labels[status]}
              <span className={`ml-1.5 ${isActive ? "text-blue-200" : "text-slate-400"}`}>
                {counts[status]}
              </span>
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {filtered.length === 0 ? (
          <p className="px-6 py-10 text-center text-slate-400 text-sm">
            Aucune fiche dans cette catégorie.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-50">
                  <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-6 py-3">Van</th>
                  <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3">Propriétaire</th>
                  <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3">Ville</th>
                  <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3">Prix</th>
                  <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3">Statut</th>
                  <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3">Date</th>
                  <th className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((van) => {
                  const statusConf = STATUS_CONFIG[van.status];
                  return (
                    <tr key={van.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-xl bg-slate-100 flex-shrink-0 overflow-hidden">
                            {van.photos?.[0] && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={van.photos[0]} alt={van.title} className="w-full h-full object-cover" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-800 line-clamp-1">{van.title}</p>
                            <p className="text-xs text-slate-400">
                              {van.van_brand} {van.van_model} · {van.sleeps} couchage{van.sleeps > 1 ? "s" : ""}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-sm text-slate-700">{van.owner_first_name} {van.owner_last_name}</p>
                        <p className="text-xs text-slate-400">{van.owner_email}</p>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm text-slate-600">{van.location_city}</span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm font-semibold text-slate-700">{van.price_per_day}€/j</span>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusConf.bg} ${statusConf.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${statusConf.dot}`} />
                          {statusConf.label}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-xs text-slate-400">
                          {new Date(van.created_at).toLocaleDateString("fr-FR")}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          {van.status === "pending" && (
                            <>
                              <button
                                onClick={() => updateStatus(van.id, "approved")}
                                disabled={isPending}
                                className="text-xs font-medium text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1.5 rounded-lg transition-colors"
                              >
                                Approuver
                              </button>
                              <button
                                onClick={() => updateStatus(van.id, "rejected")}
                                disabled={isPending}
                                className="text-xs font-medium text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-2.5 py-1.5 rounded-lg transition-colors"
                              >
                                Rejeter
                              </button>
                            </>
                          )}
                          <a
                            href={`/admin/marketplace/${van.id}`}
                            className="text-xs font-medium text-slate-500 hover:text-blue-600 bg-slate-50 hover:bg-blue-50 px-2.5 py-1.5 rounded-lg transition-colors"
                          >
                            Détail
                          </a>
                        </div>
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
