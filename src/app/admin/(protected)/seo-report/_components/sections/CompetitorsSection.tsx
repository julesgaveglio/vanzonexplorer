import type { CompetitorsData } from "@/types/seo-report";

export default function CompetitorsSection({ data }: { data: CompetitorsData }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <h3 className="text-base font-semibold text-slate-800 mb-4">Concurrents organiques</h3>
      <div className="space-y-2">
        {data.competitors.length === 0 ? (
          <p className="text-sm text-slate-400">Aucun concurrent détecté.</p>
        ) : (
          data.competitors.map((c, i) => (
            <div key={c.domain} className="flex items-center gap-4 py-2 border-b border-slate-50 last:border-0">
              <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
                {i + 1}
              </span>
              <span className="flex-1 text-sm font-medium text-slate-700">{c.domain}</span>
              <div className="text-right">
                <div className="text-xs text-slate-500">{c.intersections} mots-clés communs</div>
                <div className="text-xs text-indigo-600 font-medium">Pertinence {c.relevance}%</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
