import type { OnPageData } from "@/types/seo-report";

export default function OnPageSection({ data }: { data: OnPageData }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-slate-800">Audit on-page</h3>
        <span className={`text-lg font-bold ${data.score >= 80 ? "text-emerald-600" : data.score >= 50 ? "text-amber-600" : "text-red-600"}`}>
          {data.score}/100
        </span>
      </div>
      <div className="space-y-2">
        {data.items.map((item) => (
          <div key={item.key} className="flex items-start gap-3 py-2 border-b border-slate-50 last:border-0">
            <span className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${item.pass ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
              {item.pass ? "✓" : "✗"}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-slate-700">{item.label}</p>
              {item.detail && <p className="text-xs text-slate-400 mt-0.5">{item.detail}</p>}
              {item.value && !item.pass && (
                <p className="text-xs text-slate-400 mt-0.5 truncate">{item.value}</p>
              )}
            </div>
          </div>
        ))}
      </div>
      {data.totalImages > 0 && (
        <div className={`mt-4 p-3 rounded-lg text-sm ${data.imagesWithoutAlt === 0 ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
          {data.imagesWithoutAlt === 0
            ? `✓ Toutes les ${data.totalImages} images ont un attribut alt`
            : `⚠ ${data.imagesWithoutAlt} image(s) sans alt sur ${data.totalImages}`}
        </div>
      )}
    </div>
  );
}
