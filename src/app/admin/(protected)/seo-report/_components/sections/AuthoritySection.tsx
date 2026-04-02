import type { AuthorityData } from "@/types/seo-report";

export default function AuthoritySection({ data }: { data: AuthorityData }) {
  const daColor = data.domainAuthority >= 50 ? "text-emerald-600" : data.domainAuthority >= 25 ? "text-amber-600" : "text-red-600";
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <h3 className="text-base font-semibold text-slate-800 mb-4">Autorité du domaine</h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-50 rounded-lg p-4">
          <div className={`text-3xl font-bold ${daColor}`}>{data.domainAuthority}</div>
          <div className="text-xs text-slate-500 mt-1">Domain Authority / 100</div>
          <div className="mt-2 h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${data.domainAuthority}%` }} />
          </div>
        </div>
        <div className="space-y-3">
          <div className="bg-slate-50 rounded-lg p-3">
            <div className="text-xl font-bold text-slate-800">{data.backlinksCount.toLocaleString("fr-FR")}</div>
            <div className="text-xs text-slate-500">Backlinks</div>
          </div>
          <div className="bg-slate-50 rounded-lg p-3">
            <div className="text-xl font-bold text-slate-800">{data.referringDomains.toLocaleString("fr-FR")}</div>
            <div className="text-xs text-slate-500">Domaines référents</div>
          </div>
        </div>
      </div>
    </div>
  );
}
