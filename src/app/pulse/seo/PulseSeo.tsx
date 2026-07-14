"use client";

import { useEffect, useState } from "react";
import { PeriodSelector, Card, SectionTitle, pct, fmt } from "../_components/ui";

interface SeoData {
  totals: { clicks: number; impressions: number; ctr: number; position: number };
  queries: { query: string; clicks: number; impressions: number; position: number }[];
  pages: { page: string; clicks: number; impressions: number; position: number }[];
  error?: string;
}

export default function PulseSeo() {
  const [period, setPeriod] = useState("month");
  const [data, setData] = useState<SeoData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/pulse/seo?period=${period}`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [period]);

  return (
    <div className="space-y-5">
      <PeriodSelector value={period} onChange={setPeriod} />
      {loading && <p className="text-sm text-slate-400 pt-6 text-center">Chargement…</p>}

      {!loading && data?.error && (
        <Card><p className="text-sm text-slate-400">Search Console indisponible pour le moment.</p></Card>
      )}

      {!loading && data && !data.error && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <Card className="!p-4">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Clics Google</p>
              <p className="text-3xl font-black text-slate-900 mt-1">{fmt(data.totals.clicks)}</p>
            </Card>
            <Card className="!p-4">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Impressions</p>
              <p className="text-3xl font-black text-slate-900 mt-1">{fmt(data.totals.impressions)}</p>
            </Card>
            <Card className="!p-4">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">CTR</p>
              <p className="text-xl font-black text-slate-900 mt-1">{pct(data.totals.ctr)}</p>
            </Card>
            <Card className="!p-4">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Position moy.</p>
              <p className="text-xl font-black text-slate-900 mt-1">{data.totals.position || "—"}</p>
            </Card>
          </div>

          <div>
            <SectionTitle>Requêtes qui te ramènent du monde</SectionTitle>
            <Card>
              {data.queries.length === 0 ? (
                <p className="text-sm text-slate-400">Pas encore de clics organiques.</p>
              ) : (
                <ul className="space-y-3">
                  {data.queries.map((q) => (
                    <li key={q.query} className="flex items-center justify-between gap-3 text-sm">
                      <span className="text-slate-700 truncate flex-1">{q.query}</span>
                      <span className="text-xs text-slate-400 flex-shrink-0">
                        <b className="text-slate-900">{q.clicks}</b> clics · pos {q.position}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>

          <div>
            <SectionTitle>Pages qui rankent</SectionTitle>
            <Card>
              {data.pages.length === 0 ? (
                <p className="text-sm text-slate-400">—</p>
              ) : (
                <ul className="space-y-3">
                  {data.pages.map((p) => (
                    <li key={p.page} className="flex items-center justify-between gap-3 text-sm">
                      <span className="text-slate-700 truncate flex-1">{p.page || "/"}</span>
                      <span className="text-xs text-slate-400 flex-shrink-0">
                        <b className="text-slate-900">{p.clicks}</b> clics · {fmt(p.impressions)} impr.
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
