"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Base {
  id: string;
  name: string;
  icon: string;
  color: string;
  updated_at: string;
  spreadsheet_tables: { id: string }[];
}

const ICON_OPTIONS = ["📋", "📊", "🚐", "🎓", "💰", "🛠️", "📦", "🏗️", "⚡", "🎯", "📱", "🌐", "📝", "🔧"];
const COLOR_OPTIONS = ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#f97316"];

export default function SpreadsheetHome({ initialBases }: { initialBases: Base[] }) {
  const router = useRouter();
  const [bases, setBases] = useState<Base[]>(initialBases);
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState("");
  const [newIcon, setNewIcon] = useState("📋");
  const [newColor, setNewColor] = useState("#3b82f6");

  const handleCreate = async () => {
    if (!newName.trim()) return;
    const res = await fetch("/api/admin/spreadsheet/bases", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim(), icon: newIcon, color: newColor }),
    });
    const json = await res.json();
    if (json.base) {
      setNewName("");
      setShowNew(false);
      router.push(`/admin/finances/${json.base.id}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Supprimer cette base et toutes ses donnees ?")) return;
    const res = await fetch(`/api/admin/spreadsheet/bases/${id}`, { method: "DELETE" });
    if (res.ok) setBases((prev) => prev.filter((b) => b.id !== id));
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "a l'instant";
    if (mins < 60) return `il y a ${mins} min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `il y a ${hours}h`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `il y a ${days}j`;
    return `il y a ${Math.floor(days / 30)} mois`;
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-black text-slate-900">Spreadsheets</h1>
        <button
          onClick={() => setShowNew(true)}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-sm font-medium hover:bg-slate-800 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Nouvelle base
        </button>
      </div>

      {/* New base modal */}
      {showNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setShowNew(false)}>
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-slate-900 mb-4">Nouvelle base</h2>

            <input
              type="text"
              placeholder="Nom de la base..."
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full text-sm border border-slate-200 rounded-xl px-4 py-3 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            />

            {/* Icon picker */}
            <p className="text-xs font-medium text-slate-500 mb-2">Icone</p>
            <div className="flex flex-wrap gap-1.5 mb-4">
              {ICON_OPTIONS.map((icon) => (
                <button
                  key={icon}
                  onClick={() => setNewIcon(icon)}
                  className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg transition-all ${
                    newIcon === icon ? "bg-slate-100 ring-2 ring-slate-400" : "hover:bg-slate-50"
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>

            {/* Color picker */}
            <p className="text-xs font-medium text-slate-500 mb-2">Couleur</p>
            <div className="flex gap-2 mb-6">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c}
                  onClick={() => setNewColor(c)}
                  className={`w-7 h-7 rounded-full transition-all ${
                    newColor === c ? "ring-2 ring-offset-2 ring-slate-400 scale-110" : "hover:scale-105"
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>

            <div className="flex gap-2">
              <button onClick={() => setShowNew(false)} className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-200">
                Annuler
              </button>
              <button onClick={handleCreate} className="flex-1 px-4 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-medium hover:bg-slate-800">
                Creer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bases grid */}
      {bases.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
          <p className="text-slate-500 mb-1">Aucune base</p>
          <p className="text-sm text-slate-400">Cree ta premiere base pour commencer a organiser tes donnees</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {bases.map((base) => (
            <div key={base.id} className="group relative">
              <Link
                href={`/admin/finances/${base.id}`}
                className="block bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-lg hover:border-slate-300 transition-all duration-200"
              >
                <div className="flex items-start gap-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                    style={{ backgroundColor: `${base.color}15`, color: base.color }}
                  >
                    {base.icon}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-slate-900 truncate">{base.name}</h3>
                    <p className="text-xs text-slate-400 mt-1">
                      {base.spreadsheet_tables?.length || 0} table{(base.spreadsheet_tables?.length || 0) !== 1 ? "s" : ""} • Ouvert {timeAgo(base.updated_at)}
                    </p>
                  </div>
                </div>
              </Link>
              <button
                onClick={() => handleDelete(base.id)}
                className="absolute top-3 right-3 p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
