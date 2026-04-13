import type { KeywordsData } from "@/types/seo-report";

function diffColor(d: number): string {
  if (d < 30) return "text-emerald-600 bg-emerald-50";
  if (d < 60) return "text-amber-600 bg-amber-50";
  return "text-red-600 bg-red-50";
}

export default function KeywordsSection({ data }: { data: KeywordsData }) {
  const quickWins = data.keywordsForSite.filter((k) => k.searchVolume > 100 && k.difficulty < 30);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-slate-800">Positionnement & Mots-clés</h3>
        <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full font-medium">
          {data.indexedCount} pages indexées
        </span>
      </div>

      {/* Pages indexées */}
      {data.indexedPages.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Pages principales indexées</p>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {data.indexedPages.slice(0, 8).map((p, i) => (
              <div key={i} className="text-xs bg-slate-50 rounded-lg p-2">
                <a href={p.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 font-medium hover:underline truncate block">
                  {p.title || p.url}
                </a>
                <p className="text-slate-500 mt-0.5 line-clamp-1">{p.snippet}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Wins */}
      {quickWins.length > 0 && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
          <p className="text-xs font-bold text-emerald-800 mb-2">Quick Wins — Volume {">"} 100, Difficulté {"<"} 30</p>
          <div className="space-y-1">
            {quickWins.slice(0, 5).map((k, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <span className="font-medium text-emerald-900">{k.keyword}</span>
                <span className="text-emerald-700">vol {k.searchVolume} · diff {k.difficulty}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top keywords */}
      {data.keywordsForSite.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Top 20 mots-clés</p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-left text-slate-500">
                  <th className="py-1.5 pr-3">Mot-clé</th>
                  <th className="py-1.5 px-2 text-right">Vol.</th>
                  <th className="py-1.5 px-2 text-right">Diff.</th>
                  <th className="py-1.5 px-2 text-right">Pos.</th>
                  <th className="py-1.5 px-2">Intent</th>
                </tr>
              </thead>
              <tbody>
                {data.keywordsForSite.slice(0, 20).map((k, i) => (
                  <tr key={i} className="border-b border-slate-50">
                    <td className="py-1.5 pr-3 font-medium text-slate-800">{k.keyword}</td>
                    <td className="py-1.5 px-2 text-right text-slate-600">{k.searchVolume.toLocaleString()}</td>
                    <td className="py-1.5 px-2 text-right">
                      <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${diffColor(k.difficulty)}`}>
                        {k.difficulty}
                      </span>
                    </td>
                    <td className="py-1.5 px-2 text-right text-slate-600">{k.position ?? "—"}</td>
                    <td className="py-1.5 px-2 text-slate-500">{k.intent ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Keyword ideas */}
      {data.keywordIdeas.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Idées de mots-clés proches</p>
          <div className="flex flex-wrap gap-1.5">
            {data.keywordIdeas.map((k, i) => (
              <span
                key={i}
                className={`inline-block px-2 py-1 rounded-lg text-[11px] font-medium ${diffColor(k.difficulty)}`}
              >
                {k.keyword} <span className="opacity-60">({k.searchVolume})</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
