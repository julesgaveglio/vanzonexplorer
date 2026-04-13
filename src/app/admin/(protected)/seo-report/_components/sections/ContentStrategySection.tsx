import type { ContentStrategyData, BusinessAnalysis } from "@/types/seo-report";

function priorityBadge(p: string) {
  if (p.includes("Quick")) return "bg-emerald-100 text-emerald-800";
  if (p.includes("Moyen")) return "bg-amber-100 text-amber-800";
  return "bg-slate-100 text-slate-600";
}

function diffColor(d: number): string {
  if (d < 30) return "text-emerald-600";
  if (d < 60) return "text-amber-600";
  return "text-red-600";
}

export default function ContentStrategySection({
  data,
  business,
}: {
  data: ContentStrategyData;
  business?: BusinessAnalysis;
}) {
  const quickWins = data.articles.filter((a) => a.priorite.includes("Quick"));

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-5">
      <h3 className="text-base font-semibold text-slate-800">Stratégie de contenu</h3>

      {/* Business context */}
      {business && (
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-full">{business.secteur_activite}</span>
          <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded-full">{business.business_model}</span>
          <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded-full">Cible : {business.cible_audience}</span>
          {business.zone_geo && (
            <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded-full">{business.zone_geo}</span>
          )}
        </div>
      )}

      {/* Stratégie globale */}
      {data.strategie_globale && (
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-lg p-4">
          <p className="text-xs font-bold text-blue-900 mb-1">Stratégie globale</p>
          <p className="text-xs text-blue-800 leading-relaxed">{data.strategie_globale}</p>
        </div>
      )}

      {/* Quick Wins */}
      {quickWins.length > 0 && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
          <p className="text-xs font-bold text-emerald-800 mb-2">Quick Wins — À publier en priorité</p>
          <p className="text-[10px] text-emerald-700 mb-3">Trafic estimé en 60-90 jours</p>
          <div className="space-y-2">
            {quickWins.map((a) => (
              <div key={a.rang} className="bg-white rounded-lg p-3 border border-emerald-100">
                <p className="text-xs font-bold text-slate-900">{a.titre_accrocheur}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Mot-clé : {a.mot_cle_principal} · Vol {a.volume_mensuel} · Diff {a.difficulte}
                </p>
                <p className="text-[10px] text-emerald-700 mt-1">{a.pourquoi_ce_site}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tableau complet des 10 articles */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-slate-200 text-left text-slate-500">
              <th className="py-2 pr-2">#</th>
              <th className="py-2 pr-2">Titre SEO</th>
              <th className="py-2 px-1 text-right">Vol.</th>
              <th className="py-2 px-1 text-right">Diff.</th>
              <th className="py-2 px-1">Intent</th>
              <th className="py-2 px-1">Priorité</th>
            </tr>
          </thead>
          <tbody>
            {data.articles.map((a) => (
              <tr key={a.rang} className="border-b border-slate-50 hover:bg-slate-50">
                <td className="py-2 pr-2 text-slate-400">{a.rang}</td>
                <td className="py-2 pr-2">
                  <p className="font-medium text-slate-800">{a.titre_seo}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{a.mot_cle_principal}</p>
                </td>
                <td className="py-2 px-1 text-right text-slate-600">{a.volume_mensuel}</td>
                <td className={`py-2 px-1 text-right font-bold ${diffColor(a.difficulte)}`}>{a.difficulte}</td>
                <td className="py-2 px-1 text-slate-500">{a.intention}</td>
                <td className="py-2 px-1">
                  <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${priorityBadge(a.priorite)}`}>
                    {a.priorite}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Justification quick wins */}
      {data.quick_wins_justification && (
        <div className="text-xs text-slate-500 italic border-t border-slate-100 pt-3">
          {data.quick_wins_justification}
        </div>
      )}
    </div>
  );
}
