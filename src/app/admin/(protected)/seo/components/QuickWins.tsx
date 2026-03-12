"use client";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface RankedItem {
  keyword_data?: {
    keyword?: string;
    keyword_info?: { search_volume?: number };
  };
  ranked_serp_element?: {
    serp_item?: { rank_group?: number; url?: string };
  };
}

export function QuickWins() {
  const { data, isLoading } = useSWR(
    "/api/admin/seo/keywords?limit=100&offset=0&order=ranked_serp_element.serp_item.rank_group,asc",
    fetcher,
    { refreshInterval: 1800000 }
  );

  const quickWins: RankedItem[] = ((data?.items ?? []) as RankedItem[])
    .filter((item) => {
      const pos = item.ranked_serp_element?.serp_item?.rank_group ?? 0;
      const vol = item.keyword_data?.keyword_info?.search_volume ?? 0;
      return pos >= 11 && pos <= 20 && vol >= 50;
    })
    .slice(0, 8);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-50 flex items-center gap-2">
        <span className="text-amber-400">⚡</span>
        <h2 className="font-bold text-slate-900">Quick Wins</h2>
        <span className="text-xs bg-amber-100 text-amber-600 font-semibold px-2 py-0.5 rounded-full ml-auto">
          Page 2 → Page 1
        </span>
      </div>
      <div className="divide-y divide-slate-50">
        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <div className="w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : quickWins.length === 0 ? (
          <p className="px-6 py-8 text-center text-slate-400 text-sm">
            Aucun quick win détecté
          </p>
        ) : (
          quickWins.map((item) => {
            const kw = item.keyword_data?.keyword ?? "—";
            const pos = item.ranked_serp_element?.serp_item?.rank_group ?? "—";
            const vol = item.keyword_data?.keyword_info?.search_volume ?? 0;
            const url = (item.ranked_serp_element?.serp_item?.url ?? "")
              .replace("https://vanzonexplorer.com", "")
              .replace("https://www.vanzonexplorer.com", "") || "/";

            return (
              <div
                key={kw}
                className="flex items-center gap-3 px-6 py-3.5 hover:bg-amber-50/40 transition-colors"
              >
                <div className="w-8 h-6 rounded bg-amber-100 flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-amber-600">{pos}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800">{kw}</p>
                  <p className="text-xs text-slate-400 truncate">{url}</p>
                </div>
                <span className="text-xs text-slate-500 font-medium shrink-0">
                  {vol >= 1000 ? `${(vol / 1000).toFixed(1)}k` : vol} rech/mois
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
