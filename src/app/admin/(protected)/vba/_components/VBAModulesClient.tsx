"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, ChevronUp, ChevronDown, Trash2, Eye, EyeOff } from "lucide-react";

interface Module {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  order: number;
  is_published: boolean;
  lesson_count: number;
  created_at: string;
}

export default function VBAModulesClient({
  initialModules,
}: {
  initialModules: Module[];
}) {
  const [modules, setModules] = useState(initialModules);
  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  async function createModule(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/admin/vba/modules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle, description: newDescription || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setModules((prev) => [...prev, { ...data.module, lesson_count: 0 }]);
      setNewTitle("");
      setNewDescription("");
      setShowForm(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erreur");
    } finally {
      setCreating(false);
    }
  }

  async function deleteModule(id: string) {
    if (!confirm("Supprimer ce module et toutes ses leçons ?")) return;
    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/vba/modules?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erreur suppression");
      setModules((prev) => prev.filter((m) => m.id !== id));
    } catch {
      alert("Erreur lors de la suppression");
    } finally {
      setActionLoading(null);
    }
  }

  async function togglePublished(mod: Module) {
    setActionLoading(mod.id);
    try {
      const res = await fetch("/api/admin/vba/modules", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: mod.id, is_published: !mod.is_published }),
      });
      if (!res.ok) throw new Error("Erreur");
      setModules((prev) =>
        prev.map((m) =>
          m.id === mod.id ? { ...m, is_published: !m.is_published } : m
        )
      );
    } catch {
      alert("Erreur");
    } finally {
      setActionLoading(null);
    }
  }

  async function reorder(id: string, direction: "up" | "down") {
    const idx = modules.findIndex((m) => m.id === id);
    if (
      (direction === "up" && idx === 0) ||
      (direction === "down" && idx === modules.length - 1)
    )
      return;

    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    const updated = [...modules];
    [updated[idx], updated[swapIdx]] = [updated[swapIdx], updated[idx]];

    // Update order values
    const reordered = updated.map((m, i) => ({ ...m, order: i }));
    setModules(reordered);

    // Persist both changes
    await Promise.all([
      fetch("/api/admin/vba/modules", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: reordered[idx].id, order: idx }),
      }),
      fetch("/api/admin/vba/modules", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: reordered[swapIdx].id, order: swapIdx }),
      }),
    ]);
  }

  return (
    <div className="space-y-4">
      {/* New module form */}
      {showForm ? (
        <form
          onSubmit={createModule}
          className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3"
        >
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Titre du module (ex: Trouver son van)"
            className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400/40"
            autoFocus
          />
          <textarea
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            placeholder="Description (optionnel)"
            className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400/40 resize-none"
            rows={2}
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={creating || !newTitle.trim()}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-slate-900 hover:bg-slate-700 disabled:opacity-50 transition-colors"
            >
              {creating ? "..." : "Créer"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-xl text-sm text-slate-500 hover:bg-slate-100 transition-colors"
            >
              Annuler
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white bg-slate-900 hover:bg-slate-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nouveau module
        </button>
      )}

      {/* Modules list */}
      {modules.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center">
          <p className="text-slate-500">Aucun module. Créez le premier !</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left">
                <th className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider w-10">
                  #
                </th>
                <th className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Module
                </th>
                <th className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider text-center w-24">
                  Leçons
                </th>
                <th className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider text-center w-24">
                  Statut
                </th>
                <th className="px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right w-40">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {modules.map((mod, idx) => (
                <tr key={mod.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex flex-col gap-0.5">
                      <button
                        onClick={() => reorder(mod.id, "up")}
                        disabled={idx === 0}
                        className="text-slate-400 hover:text-slate-600 disabled:opacity-30"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => reorder(mod.id, "down")}
                        disabled={idx === modules.length - 1}
                        className="text-slate-400 hover:text-slate-600 disabled:opacity-30"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <Link
                      href={`/admin/vba/${mod.id}`}
                      className="font-medium text-slate-900 hover:text-blue-600 transition-colors"
                    >
                      {mod.title}
                    </Link>
                    {mod.description && (
                      <p className="text-xs text-slate-400 mt-0.5 truncate max-w-md">
                        {mod.description}
                      </p>
                    )}
                  </td>
                  <td className="px-5 py-3 text-center text-slate-500">
                    {mod.lesson_count}
                  </td>
                  <td className="px-5 py-3 text-center">
                    <button
                      onClick={() => togglePublished(mod)}
                      disabled={actionLoading === mod.id}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium transition-colors ${
                        mod.is_published
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {mod.is_published ? (
                        <>
                          <Eye className="w-3 h-3" /> Publié
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-3 h-3" /> Brouillon
                        </>
                      )}
                    </button>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/admin/vba/${mod.id}`}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors"
                      >
                        Leçons
                      </Link>
                      <button
                        onClick={() => deleteModule(mod.id)}
                        disabled={actionLoading === mod.id}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
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
