"use client";

import { useState } from "react";

interface QueueItem {
  id: string;
  title: string;
  description: string | null;
  target_keyword: string | null;
  destination_url: string | null;
  board_name: string | null;
  status: "draft" | "approved" | "scheduled" | "published" | "failed";
  created_at: string;
}

interface ContentQueueTableProps {
  items: QueueItem[];
}

const STATUS_TABS = [
  { value: "all", label: "Tous" },
  { value: "draft", label: "Brouillons" },
  { value: "approved", label: "Approuvés" },
  { value: "scheduled", label: "Planifiés" },
  { value: "published", label: "Publiés" },
  { value: "failed", label: "Échoués" },
] as const;

const STATUS_BADGES: Record<string, string> = {
  draft: "bg-slate-100 text-slate-600",
  approved: "bg-blue-100 text-blue-700",
  scheduled: "bg-amber-100 text-amber-700",
  published: "bg-emerald-100 text-emerald-700",
  failed: "bg-red-100 text-red-700",
};

const STATUS_LABELS: Record<string, string> = {
  draft: "Brouillon",
  approved: "Approuvé",
  scheduled: "Planifié",
  published: "Publié",
  failed: "Échoué",
};

export default function ContentQueueTable({ items }: ContentQueueTableProps) {
  const [activeTab, setActiveTab] = useState<string>("all");

  const filtered = activeTab === "all" ? items : items.filter((i) => i.status === activeTab);

  const countByStatus = (status: string) =>
    status === "all" ? items.length : items.filter((i) => i.status === status).length;

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {STATUS_TABS.map((tab) => {
          const count = countByStatus(tab.value);
          return (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.value
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {tab.label}
              <span className={`ml-1.5 text-xs ${activeTab === tab.value ? "opacity-80" : "opacity-60"}`}>
                ({count})
              </span>
            </button>
          );
        })}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="text-center py-8 text-slate-400 text-sm">
          Aucun pin dans cette catégorie
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Titre</th>
                <th className="text-left py-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Keyword</th>
                <th className="text-left py-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Board</th>
                <th className="text-left py-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Statut</th>
                <th className="text-left py-2 px-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-2.5 px-3">
                    <div className="font-medium text-slate-800 line-clamp-1 max-w-xs">{item.title}</div>
                    {item.destination_url && (
                      <div className="text-xs text-slate-400 truncate max-w-xs">{item.destination_url}</div>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-slate-600">
                    {item.target_keyword ?? "—"}
                  </td>
                  <td className="py-2.5 px-3 text-slate-600">
                    {item.board_name ?? "—"}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGES[item.status] ?? "bg-slate-100 text-slate-600"}`}>
                      {STATUS_LABELS[item.status] ?? item.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-400 text-xs">
                    {new Date(item.created_at).toLocaleDateString("fr-FR")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
