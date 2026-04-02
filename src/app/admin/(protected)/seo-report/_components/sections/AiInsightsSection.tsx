import type { AiInsightsData } from "@/types/seo-report";

const PRIORITY_STYLES = {
  Fort:   "bg-red-100 text-red-700",
  Moyen:  "bg-amber-100 text-amber-700",
  Faible: "bg-slate-100 text-slate-600",
};

export default function AiInsightsSection({ data }: { data: AiInsightsData }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-slate-800">Recommandations IA</h3>
        <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">
          Secteur : {data.secteur}
        </span>
      </div>
      <div className="space-y-3 mb-6">
        {data.axes.map((axe, i) => (
          <div key={i} className="flex gap-3 p-3 rounded-lg bg-slate-50">
            <span className={`flex-shrink-0 text-xs font-bold px-2 py-0.5 rounded-full h-fit mt-0.5 ${PRIORITY_STYLES[axe.priorite]}`}>
              {axe.priorite}
            </span>
            <div>
              <p className="text-sm font-medium text-slate-800">{axe.titre}</p>
              <p className="text-xs text-slate-600 mt-0.5">{axe.description}</p>
              <p className="text-xs text-indigo-600 mt-1">{axe.impact}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="bg-indigo-50 rounded-lg p-4">
        <p className="text-xs font-semibold text-indigo-700 mb-2 uppercase tracking-wide">Conclusion</p>
        <p className="text-sm text-slate-700 leading-relaxed">{data.conclusion}</p>
      </div>
    </div>
  );
}
