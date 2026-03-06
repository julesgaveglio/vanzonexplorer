"use client";
import { useState, useEffect } from "react";
import { KEYWORDS, KeywordData } from "./data/keywords";

const CACHE_KEY = "vanzon_keywords_research";
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24h

interface CacheEntry {
  items: KeywordData[];
  fetched_at: string;
}

export default function KeywordsClient() {
  const [keywords, setKeywords] = useState<KeywordData[]>(KEYWORDS);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (raw) {
        const cache: CacheEntry = JSON.parse(raw);
        const age = Date.now() - new Date(cache.fetched_at).getTime();
        if (age < CACHE_TTL) {
          setKeywords(cache.items);
          setLastUpdated(cache.fetched_at);
        }
      }
    } catch {
      // silent
    }
  }, []);

  async function handleRefresh() {
    setRefreshing(true);
    try {
      const res = await fetch("/api/admin/seo/keywords-research", { method: "POST" });
      const data: CacheEntry = await res.json();
      if (data.items) {
        setKeywords(data.items);
        setLastUpdated(data.fetched_at);
        localStorage.setItem(CACHE_KEY, JSON.stringify(data));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <p className="text-slate-400 text-sm font-medium mb-1">Stratégie SEO</p>
          <h1 className="text-3xl font-black text-slate-900">Recherche de Mots-Clés</h1>
          <p className="text-slate-500 mt-1">Pays Basque · Location Van · France</p>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-xs text-slate-400">
              MAJ :{" "}
              {new Date(lastUpdated).toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          )}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            <svg
              className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Actualiser
          </button>
        </div>
      </div>

      {/* Placeholder — composants à venir */}
      <div className="text-slate-400 text-sm">{keywords.length} keywords chargés.</div>
    </div>
  );
}
