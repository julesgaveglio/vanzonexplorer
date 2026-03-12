"use client";
import { useState } from "react";

interface SerpResultItem {
  rank_group: number;
  type: string;
  title?: string;
  url?: string;
  domain?: string;
  description?: string;
}

const TARGET = "vanzonexplorer.com";

export function SerpChecker() {
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SerpResultItem[]>([]);
  const [searched, setSearched] = useState("");
  const [error, setError] = useState("");

  async function handleSearch() {
    if (!keyword.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/seo/serp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword: keyword.trim() }),
      });
      const data = await res.json();
      const items = (data?.items ?? []).filter(
        (i: SerpResultItem) => i.type === "organic"
      );
      setResults(items);
      setSearched(keyword.trim());
    } catch {
      setError("Erreur lors de la requête SERP");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-50">
        <h2 className="font-bold text-slate-900">Vérificateur SERP en direct</h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Voir les 20 premiers résultats Google FR pour n&apos;importe quel mot-clé
        </p>
      </div>

      <div className="p-6">
        <div className="flex gap-3">
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="ex: location van aménagé biarritz..."
            className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
          />
          <button
            onClick={handleSearch}
            disabled={loading || !keyword.trim()}
            className="px-5 py-2.5 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors flex items-center gap-2"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              "Analyser"
            )}
          </button>
        </div>

        {error && <p className="mt-3 text-sm text-red-500">{error}</p>}

        {results.length > 0 && (
          <div className="mt-5 space-y-3">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
              Résultats pour «&nbsp;{searched}&nbsp;»
            </p>
            {results.map((item) => {
              const isYou =
                item.domain === TARGET || item.url?.includes(TARGET);
              return (
                <div
                  key={item.rank_group}
                  className={`p-3 rounded-xl border transition-colors ${
                    isYou
                      ? "border-blue-200 bg-blue-50"
                      : "border-slate-100 bg-slate-50/50"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`w-7 h-6 rounded flex items-center justify-center text-xs font-bold shrink-0 ${
                        isYou
                          ? "bg-blue-500 text-white"
                          : "bg-white text-slate-500 border border-slate-200"
                      }`}
                    >
                      {item.rank_group}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm font-semibold truncate ${
                          isYou ? "text-blue-700" : "text-slate-800"
                        }`}
                      >
                        {item.title}
                        {isYou && (
                          <span className="ml-2 text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded font-bold">
                            VOUS
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-slate-400 truncate mt-0.5">
                        {item.url}
                      </p>
                      {item.description && (
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
