import { getScoreColor, getScoreLabel } from "../../_lib/score";
import type { SeoReportData } from "@/types/seo-report";

interface Props { report: Partial<SeoReportData> & { scoreGlobal: number; url: string } }

export default function ScoreGlobal({ report }: Props) {
  const color = getScoreColor(report.scoreGlobal);
  const label = getScoreLabel(report.scoreGlobal);
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Score SEO Global</h2>
          <p className="text-sm text-slate-500">{report.url}</p>
        </div>
        <div className="text-right">
          <div className="text-5xl font-bold" style={{ color }}>{report.scoreGlobal}</div>
          <div className="text-sm text-slate-500">/ 100</div>
          <div className="text-sm font-medium mt-1" style={{ color }}>{label}</div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {report.pagespeed && (
          <div className="bg-slate-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-slate-800">{report.pagespeed.mobile.scores.performance}</div>
            <div className="text-xs text-slate-500 mt-1">Performance mobile</div>
          </div>
        )}
        {report.onpage && (
          <div className="bg-slate-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-slate-800">{report.onpage.score}</div>
            <div className="text-xs text-slate-500 mt-1">On-page</div>
          </div>
        )}
        {report.authority && (
          <div className="bg-slate-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-slate-800">{report.authority.domainAuthority}</div>
            <div className="text-xs text-slate-500 mt-1">Autorité domaine</div>
          </div>
        )}
      </div>
    </div>
  );
}
