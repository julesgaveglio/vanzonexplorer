"use client";

import { useEffect, useState } from "react";
import { PeriodSelector, Card, SectionTitle, Sparkline, DeltaBadge, CHANNEL_COLORS, BLUE_GRADIENT, pct, fmt } from "./_components/ui";

interface Overview {
  totals: { visitors: number; pageViews: number; conversions: number; conversionRate: number };
  visitorsDelta: number;
  trend: { date: string; visitors: number }[];
  topChannel: { channel: string; label: string; visitors: number } | null;
  topPage: { page: string; views: number } | null;
  bestConverting: { channel: string; label: string; conversionRate: number } | null;
  headline: string;
}

export default function PulseHome() {
  const [period, setPeriod] = useState("week");
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/pulse/overview?period=${period}`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [period]);

  return (
    <div className="space-y-5">
      <PeriodSelector value={period} onChange={setPeriod} />

      {loading && <p className="text-sm text-slate-400 pt-6 text-center">Chargement…</p>}

      {!loading && data && (
        <>
          {/* Headline dirigé */}
          {data.headline && (
            <div
              className="rounded-3xl p-5 text-white"
              style={{ background: BLUE_GRADIENT }}
            >
              <p className="text-[11px] font-bold uppercase tracking-wider opacity-80 mb-1">Ce qui marche</p>
              <p className="text-[17px] font-bold leading-snug">{data.headline}</p>
            </div>
          )}

          {/* Hero visiteurs + tendance */}
          <Card>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Visiteurs</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-4xl font-black text-slate-900">{fmt(data.totals.visitors)}</span>
                  <DeltaBadge delta={data.visitorsDelta} />
                </div>
              </div>
            </div>
            <div className="mt-3">
              <Sparkline data={data.trend.map((t) => t.visitors)} />
            </div>
          </Card>

          {/* KPIs secondaires */}
          <div className="grid grid-cols-2 gap-3">
            <Card className="!p-4">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Pages vues</p>
              <p className="text-2xl font-black text-slate-900 mt-1">{fmt(data.totals.pageViews)}</p>
            </Card>
            <Card className="!p-4">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Conversions</p>
              <p className="text-2xl font-black text-slate-900 mt-1">{fmt(data.totals.conversions)}</p>
            </Card>
          </div>

          {/* Podium : ce qui performe */}
          <div>
            <SectionTitle>Tes meilleurs leviers</SectionTitle>
            <div className="space-y-3">
              {data.topChannel && (
                <HighlightRow
                  color={CHANNEL_COLORS[data.topChannel.channel] ?? "#3B82F6"}
                  label="Canal n°1"
                  value={data.topChannel.label}
                  sub={`${fmt(data.topChannel.visitors)} visiteurs`}
                />
              )}
              {data.topPage && (
                <HighlightRow
                  color="#0EA5E9"
                  label="Page la plus vue"
                  value={data.topPage.page}
                  sub={`${fmt(data.topPage.views)} vues`}
                />
              )}
              {data.bestConverting && (
                <HighlightRow
                  color="#10B981"
                  label="Meilleur taux de conversion"
                  value={data.bestConverting.label}
                  sub={pct(data.bestConverting.conversionRate)}
                />
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function HighlightRow({ color, label, value, sub }: { color: string; label: string; value: string; sub: string }) {
  return (
    <Card className="!p-4">
      <div className="flex items-center gap-3">
        <span className="w-1.5 h-10 rounded-full flex-shrink-0" style={{ background: color }} />
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
          <p className="text-[15px] font-bold text-slate-900 truncate">{value}</p>
        </div>
        <span className="text-sm font-bold text-slate-500 flex-shrink-0">{sub}</span>
      </div>
    </Card>
  );
}
