"use client";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface CompetitorItem {
  domain?: string;
  avg_position?: number;
  intersections?: number;
  full_domain_metrics?: { organic?: { count?: number; etv?: number } };
  competitor_metrics?: { organic?: { etv?: number } };
}

function TrafficBar({ value, max }: { value: number; max: number }) {
  const pct = Math.max(2, (value / max) * 100);
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-400 rounded-full"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-slate-600 font-medium w-12 text-right">
        {value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}
      </span>
    </div>
  );
}

export function CompetitorsTable() {
  const { data, isLoading } = useSWR("/api/admin/seo/competitors", fetcher, {
    refreshInterval: 1800000,
  });

  const items: CompetitorItem[] = (data?.items ?? []).slice(0, 10);
  const maxEtv = Math.max(
    ...items.map((i) => i.competitor_metrics?.organic?.etv ?? 0),
    1
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-50">
        <h2 className="font-bold text-slate-900">Concurrents SEO</h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Domaines partageant vos mots-clés
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-10">
          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-50">
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">
                  Domaine
                </th>
                <th className="text-center px-3 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">
                  KWs communs
                </th>
                <th className="text-center px-3 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">
                  Pos. moy.
                </th>
                <th className="px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">
                  Trafic estimé
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {items[0] && (
                <tr className="bg-blue-50/50">
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                      <span className="font-bold text-blue-700">
                        vanzonexplorer.com
                      </span>
                      <span className="text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded font-semibold">
                        Vous
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-center font-semibold text-slate-700">
                    {items[0].full_domain_metrics?.organic?.count ?? "—"}
                  </td>
                  <td className="px-3 py-3 text-center text-slate-600">
                    {Number(items[0].avg_position ?? 0).toFixed(1)}
                  </td>
                  <td className="px-6 py-3">
                    <TrafficBar
                      value={Math.round(
                        items[0].full_domain_metrics?.organic?.etv ?? 0
                      )}
                      max={maxEtv}
                    />
                  </td>
                </tr>
              )}
              {items.slice(1).map((item) => (
                <tr
                  key={item.domain}
                  className="hover:bg-slate-50/60 transition-colors"
                >
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-slate-300" />
                      <span className="font-medium text-slate-700">
                        {item.domain}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-center text-slate-600">
                    {item.intersections ?? "—"}
                  </td>
                  <td className="px-3 py-3 text-center text-slate-600">
                    {Number(item.avg_position ?? 0).toFixed(1)}
                  </td>
                  <td className="px-6 py-3">
                    <TrafficBar
                      value={Math.round(
                        item.competitor_metrics?.organic?.etv ?? 0
                      )}
                      max={maxEtv}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
