import type { PagespeedData, PsiVital } from "@/types/seo-report";

function VitalBadge({ vital, label }: { vital: PsiVital; label: string }) {
  const color =
    vital.score === null ? "text-slate-400" :
    vital.score >= 0.9   ? "text-emerald-600" :
    vital.score >= 0.5   ? "text-amber-600"   :
                            "text-red-600";
  const bg =
    vital.score === null ? "bg-slate-50" :
    vital.score >= 0.9   ? "bg-emerald-50" :
    vital.score >= 0.5   ? "bg-amber-50"   :
                            "bg-red-50";
  return (
    <div className={`${bg} rounded-lg p-3`}>
      <div className={`text-lg font-bold ${color}`}>{vital.value}</div>
      <div className="text-xs text-slate-500">{label}</div>
    </div>
  );
}

function ScoreBar({ score, label }: { score: number; label: string }) {
  const color = score >= 80 ? "bg-emerald-500" : score >= 50 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-slate-600 w-32">{label}</span>
      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-sm font-medium text-slate-700 w-8 text-right">{score}</span>
    </div>
  );
}

export default function PerformanceSection({ data }: { data: PagespeedData }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <h3 className="text-base font-semibold text-slate-800 mb-4">Performance technique</h3>
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div>
          <p className="text-sm font-medium text-slate-500 mb-3">Mobile</p>
          <div className="space-y-2">
            <ScoreBar score={data.mobile.scores.performance} label="Performance" />
            <ScoreBar score={data.mobile.scores.seo} label="SEO" />
            <ScoreBar score={data.mobile.scores.accessibility} label="Accessibilité" />
          </div>
        </div>
        <div>
          <p className="text-sm font-medium text-slate-500 mb-3">Desktop</p>
          <div className="space-y-2">
            <ScoreBar score={data.desktop.scores.performance} label="Performance" />
            <ScoreBar score={data.desktop.scores.seo} label="SEO" />
            <ScoreBar score={data.desktop.scores.accessibility} label="Accessibilité" />
          </div>
        </div>
      </div>
      <p className="text-sm font-medium text-slate-500 mb-3">Core Web Vitals (mobile)</p>
      <div className="grid grid-cols-3 gap-3">
        <VitalBadge vital={data.mobile.vitals.lcp} label="LCP" />
        <VitalBadge vital={data.mobile.vitals.cls} label="CLS" />
        <VitalBadge vital={data.mobile.vitals.tbt} label="TBT" />
        <VitalBadge vital={data.mobile.vitals.fcp} label="FCP" />
        <VitalBadge vital={data.mobile.vitals.si}  label="Speed Index" />
        <VitalBadge vital={data.mobile.vitals.tti} label="TTI" />
      </div>
      {data.mobile.opportunities.length > 0 && (
        <div className="mt-4">
          <p className="text-sm font-medium text-slate-500 mb-2">Opportunités d&apos;amélioration</p>
          <ul className="space-y-1.5">
            {data.mobile.opportunities.map((opp) => (
              <li key={opp.id} className="flex items-center justify-between text-sm">
                <span className="text-slate-700">{opp.title}</span>
                <span className="text-amber-600 font-medium">−{Math.round(opp.savingsMs)}ms</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
