"use client";
import { useState } from "react";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function PosBadge({ pos }: { pos: number }) {
  const color =
    pos <= 3
      ? "bg-emerald-100 text-emerald-700"
      : pos <= 10
      ? "bg-blue-100 text-blue-700"
      : pos <= 20
      ? "bg-purple-100 text-purple-700"
      : pos <= 50
      ? "bg-amber-100 text-amber-700"
      : "bg-slate-100 text-slate-500";
  return (
    <span
      className={`inline-flex items-center justify-center w-8 h-6 rounded text-xs font-bold ${color}`}
    >
      {pos}
    </span>
  );
}

function fmtVol(vol: number): string {
  return vol >= 1000 ? `${(vol / 1000).toFixed(1)}k` : String(vol);
}

interface RankedItem {
  keyword_data?: {
    keyword?: string;
    keyword_info?: { search_volume?: number; cpc?: number };
  };
  ranked_serp_element?: {
    serp_item?: { rank_group?: number; url?: string };
  };
}

export function KeywordsTable() {
  const [page, setPage] = useState(0);
  const [orderBy, setOrderBy] = useState(
    "keyword_data.keyword_info.search_volume,desc"
  );
  const limit = 20;

  const { data, isLoading } = useSWR(
    `/api/admin/seo/keywords?limit=${limit}&offset=${page * limit}&order=${orderBy}`,
    fetcher,
    { refreshInterval: 1800000 }
  );

  const keywords: RankedItem[] = data?.items ?? [];
  const totalCount: number = data?.total_count ?? 0;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-50">
        <h2 className="font-bold text-slate-900">Mots-clés positionnés</h2>
        <select
          value={orderBy}
          onChange={(e) => {
            setOrderBy(e.target.value);
            setPage(0);
          }}
          className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-400"
        >
          <option value="keyword_data.keyword_info.search_volume,desc">Volume ↓</option>
          <option value="ranked_serp_element.serp_item.rank_group,asc">Position ↑</option>
          <option value="keyword_data.keyword_info.cpc,desc">CPC ↓</option>
        </select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-50">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">
                    Mot-clé
                  </th>
                  <th className="text-center px-3 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">
                    Pos.
                  </th>
                  <th className="text-right px-3 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">
                    Vol.
                  </th>
                  <th className="text-right px-3 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">
                    CPC
                  </th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">
                    URL
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {keywords.map((item) => {
                  const kw = item.keyword_data?.keyword ?? "—";
                  const pos = item.ranked_serp_element?.serp_item?.rank_group ?? 0;
                  const vol = item.keyword_data?.keyword_info?.search_volume ?? 0;
                  const cpc = item.keyword_data?.keyword_info?.cpc ?? 0;
                  const url = (item.ranked_serp_element?.serp_item?.url ?? "")
                    .replace("https://vanzonexplorer.com", "")
                    .replace("https://www.vanzonexplorer.com", "") || "/";

                  return (
                    <tr
                      key={kw}
                      className="hover:bg-slate-50/60 transition-colors"
                    >
                      <td className="px-6 py-3 font-medium text-slate-800">{kw}</td>
                      <td className="px-3 py-3 text-center">
                        <PosBadge pos={pos} />
                      </td>
                      <td className="px-3 py-3 text-right text-xs text-slate-500">
                        {fmtVol(vol)}
                      </td>
                      <td className="px-3 py-3 text-right text-xs text-slate-500">
                        {cpc ? `${cpc.toFixed(2)}€` : "—"}
                      </td>
                      <td className="px-6 py-3 text-right">
                        <span className="text-xs text-slate-400 font-mono truncate max-w-[200px] inline-block">
                          {url}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between px-6 py-3 border-t border-slate-50">
            <p className="text-xs text-slate-400">{totalCount} mots-clés total</p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 rounded-lg disabled:opacity-40 hover:bg-slate-200 transition-colors"
              >
                ← Préc
              </button>
              <span className="text-xs text-slate-500 font-medium">Page {page + 1}</span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={(page + 1) * limit >= totalCount}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 rounded-lg disabled:opacity-40 hover:bg-slate-200 transition-colors"
              >
                Suiv →
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
