"use client";
import { useState } from "react";

interface KwIdea {
  keyword: string;
  search_volume: number;
  cpc: number;
  keyword_difficulty: number;
}

function DiffBadge({ score }: { score: number }) {
  const color =
    score < 30
      ? "bg-emerald-100 text-emerald-700"
      : score < 60
      ? "bg-amber-100 text-amber-700"
      : "bg-red-100 text-red-600";
  const label = score < 30 ? "Facile" : score < 60 ? "Moyen" : "Difficile";
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${color}`}>
      {label} {score}
    </span>
  );
}

export function KeywordIdeas() {
  const [seed, setSeed] = useState("van aménagé");
  const [loading, setLoading] = useState(false);
  const [ideas, setIdeas] = useState<KwIdea[]>([]);
  const [searched, setSearched] = useState("");

  async function fetchIdeas() {
    if (!seed.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/admin/seo/ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword: seed.trim() }),
      });
      const data = await res.json();
      const items: KwIdea[] = (data?.items ?? []).map(
        (i: {
          keyword: string;
          keyword_info?: { search_volume?: number; cpc?: number };
          keyword_properties?: { keyword_difficulty?: number };
        }) => ({
          keyword: i.keyword,
          search_volume: i.keyword_info?.search_volume ?? 0,
          cpc: i.keyword_info?.cpc ?? 0,
          keyword_difficulty: i.keyword_properties?.keyword_difficulty ?? 0,
        })
      );
      setIdeas(items);
      setSearched(seed.trim());
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-50">
        <h2 className="font-bold text-slate-900">Explorateur de mots-clés</h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Trouve des opportunités dans ton secteur
        </p>
      </div>

      <div className="p-6">
        <div className="flex gap-3">
          <input
            type="text"
            value={seed}
            onChange={(e) => setSeed(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchIdeas()}
            placeholder="ex: van aménagé, location van pays basque..."
            className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-400"
          />
          <button
            onClick={fetchIdeas}
            disabled={loading || !seed.trim()}
            className="px-5 py-2.5 bg-purple-500 hover:bg-purple-600 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors flex items-center gap-2"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              "Explorer"
            )}
          </button>
        </div>

        {ideas.length > 0 && (
          <div className="mt-5">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
              {ideas.length} idées pour «&nbsp;{searched}&nbsp;»
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left py-2 text-xs text-slate-400 font-semibold">
                      Mot-clé
                    </th>
                    <th className="text-right py-2 px-3 text-xs text-slate-400 font-semibold">
                      Vol.
                    </th>
                    <th className="text-right py-2 px-3 text-xs text-slate-400 font-semibold">
                      CPC
                    </th>
                    <th className="text-right py-2 text-xs text-slate-400 font-semibold">
                      Difficulté
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {ideas.map((idea) => (
                    <tr key={idea.keyword} className="hover:bg-slate-50/60">
                      <td className="py-2.5 font-medium text-slate-800">
                        {idea.keyword}
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-600 text-xs">
                        {idea.search_volume >= 1000
                          ? `${(idea.search_volume / 1000).toFixed(1)}k`
                          : idea.search_volume}
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-500 text-xs">
                        {idea.cpc ? `${idea.cpc.toFixed(2)}€` : "—"}
                      </td>
                      <td className="py-2.5 text-right">
                        <DiffBadge score={idea.keyword_difficulty} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
