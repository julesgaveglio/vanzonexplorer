"use client";

import { useState, useEffect } from "react";

interface Variant {
  id: string;
  title: string;
  position: number;
  is_active: boolean;
  is_completed: boolean;
  views_target: number;
  views: number;
  hot_leads: number;
  rate: number;
}

interface Unattributed {
  views: number;
  hot_leads: number;
}

export default function AdsTitlesClient() {
  const [variants, setVariants] = useState<Variant[]>([]);
  const [unattributed, setUnattributed] = useState<Unattributed>({ views: 0, hot_leads: 0 });
  const [loading, setLoading] = useState(true);
  const [newTitle, setNewTitle] = useState("");
  const [adding, setAdding] = useState(false);

  const fetchData = () => {
    setLoading(true);
    fetch("/api/ads/titles")
      .then((r) => r.json())
      .then((json) => {
        setVariants(json.variants ?? []);
        setUnattributed(json.unattributed ?? { views: 0, hot_leads: 0 });
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleAdd = async () => {
    if (!newTitle.trim()) return;
    setAdding(true);
    await fetch("/api/ads/titles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTitle.trim() }),
    });
    setNewTitle("");
    setAdding(false);
    fetchData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer ce titre ?")) return;
    await fetch("/api/ads/titles", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    fetchData();
  };

  const bestRate = Math.max(...variants.map((v) => v.rate), 0);
  const totalViews = variants.reduce((s, v) => s + v.views, 0);
  const totalHotLeads = variants.reduce((s, v) => s + v.hot_leads, 0);
  const avgRate = totalViews > 0 ? Math.round((totalHotLeads / totalViews) * 1000) / 10 : 0;
  const grandTotalViews = totalViews + unattributed.views;
  const grandTotalHotLeads = totalHotLeads + unattributed.hot_leads;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">A/B Test Titres</h1>
          <p className="text-sm text-slate-500 mt-1">
            {variants.length} variante{variants.length > 1 ? "s" : ""} — rotation auto a {variants[0]?.views_target ?? 250} vues
          </p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="px-3 py-2 text-sm text-slate-500 hover:text-slate-700 bg-white border border-slate-200 rounded-xl transition-colors disabled:opacity-50 shadow-sm"
        >
          {loading ? (
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" strokeDasharray="30 70" /></svg>
          ) : "Actualiser"}
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <p className="text-xs text-slate-500 uppercase tracking-wider font-medium mb-1">Vues attribuees</p>
          <p className="text-2xl font-bold text-slate-700">{totalViews.toLocaleString("fr-FR")}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <p className="text-xs text-slate-500 uppercase tracking-wider font-medium mb-1">Leads chauds</p>
          <p className="text-2xl font-bold text-blue-600">{totalHotLeads.toLocaleString("fr-FR")}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <p className="text-xs text-slate-500 uppercase tracking-wider font-medium mb-1">Taux moyen</p>
          <p className="text-2xl font-bold text-amber-600">{avgRate}%</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <p className="text-xs text-slate-500 uppercase tracking-wider font-medium mb-1">Total (all)</p>
          <p className="text-2xl font-bold text-slate-400">{grandTotalViews.toLocaleString("fr-FR")} vues</p>
          <p className="text-xs text-slate-400 mt-1">{grandTotalHotLeads} leads chauds · {unattributed.views} non-attribuees</p>
        </div>
      </div>

      {/* Variants table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        {loading && variants.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <svg className="animate-spin h-6 w-6 text-blue-500" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" strokeDasharray="30 70" />
            </svg>
          </div>
        ) : variants.length === 0 ? (
          <div className="text-center py-20 text-slate-400 text-sm">
            Aucun titre configure. Ajoute-en un ci-dessous.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {variants.map((v) => {
              const isBest = v.rate === bestRate && v.rate > 0 && variants.filter((x) => x.views >= 50).length > 1;
              const progress = Math.min(Math.round((v.views / v.views_target) * 100), 100);

              return (
                <div key={v.id} className={`p-5 ${v.is_active ? "bg-blue-50/30" : ""}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <span className="text-xs font-bold text-slate-400 uppercase">#{v.position}</span>
                        {v.is_active && (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
                            En cours
                          </span>
                        )}
                        {v.is_completed && (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                            Termine
                          </span>
                        )}
                        {!v.is_active && !v.is_completed && (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                            En attente
                          </span>
                        )}
                        {isBest && (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                            Meilleur
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-900 leading-relaxed">{v.title}</p>
                    </div>
                    <button
                      onClick={() => handleDelete(v.id)}
                      className="text-slate-300 hover:text-red-500 transition-colors flex-shrink-0 mt-1"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M3 6h18M8 6V4a1 1 0 011-1h6a1 1 0 011 1v2m2 0v14a2 2 0 01-2 2H8a2 2 0 01-2-2V6h12z" />
                      </svg>
                    </button>
                  </div>

                  {/* Stats bar */}
                  <div className="mt-4 flex items-center gap-6">
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-slate-500">{v.views} <span className="text-xs">vues</span></span>
                      <span className="text-blue-600 font-medium">{v.hot_leads} <span className="text-xs">leads chauds</span></span>
                      <span className={`font-bold ${v.rate >= avgRate && v.rate > 0 ? "text-emerald-600" : v.rate > 0 ? "text-amber-600" : "text-slate-400"}`}>
                        {v.rate}%
                      </span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  {v.is_active && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] text-slate-400">Progression</span>
                        <span className="text-[10px] text-slate-400">{v.views}/{v.views_target}</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${progress}%`,
                            background: "linear-gradient(90deg, #3B82F6, #2563EB)",
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Conversion bar visual */}
                  {v.views >= 10 && (
                    <div className="mt-3">
                      <div className="w-full h-6 bg-slate-50 rounded-lg overflow-hidden relative">
                        <div
                          className="h-full rounded-lg transition-all duration-700"
                          style={{
                            width: `${Math.max(v.rate, v.rate > 0 ? 3 : 0)}%`,
                            background: isBest
                              ? "linear-gradient(90deg, #10B981, #34D399)"
                              : v.rate >= avgRate
                                ? "linear-gradient(90deg, #3B82F6, #60A5FA)"
                                : "linear-gradient(90deg, #94A3B8, #CBD5E1)",
                          }}
                        />
                        <div className="absolute inset-0 flex items-center px-3">
                          <span className="text-xs font-bold text-slate-700">{v.rate}%</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add new variant */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-900 mb-3">Ajouter un titre a tester</h3>
        <div className="flex flex-col sm:flex-row gap-3">
          <textarea
            placeholder="Ex: Donne-moi 13 minutes et je te montre comment..."
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            rows={2}
            className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 resize-none"
          />
          <button
            onClick={handleAdd}
            disabled={adding || !newTitle.trim()}
            className="px-5 py-3 text-sm font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 whitespace-nowrap"
          >
            {adding ? "..." : "+ Ajouter"}
          </button>
        </div>
      </div>
    </div>
  );
}
