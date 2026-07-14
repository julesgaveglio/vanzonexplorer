"use client";

import { useEffect, useState } from "react";

interface ChannelStat {
  channel: string;
  label: string;
  visitors: number;
  pageViews: number;
  conversions: number;
  conversionRate: number;
}

interface AnalyticsData {
  period: string;
  totals: {
    visitors: number;
    pageViews: number;
    conversions: number;
    conversionRate: number;
    blogVisitors: number;
  };
  channels: ChannelStat[];
  conversionTypes: { event: string; count: number }[];
}

const PERIODS = [
  { key: "day", label: "Jour" },
  { key: "week", label: "Semaine" },
  { key: "month", label: "Mois" },
  { key: "year", label: "Année" },
];

const CONVERSION_LABELS: Record<string, string> = {
  booking_click: "Clic réservation (Yescapa / Wikicampers)",
  whatsapp_click: "Clic WhatsApp",
  roadtrip_lead: "Lead road-trip",
  resource_download: "Téléchargement ressource",
  vsl_cta_click: "Clic VSL formation",
  contact_submit: "Formulaire contact",
  optin: "Opt-in VBA",
  purchase: "Achat VBA",
};

// Couleur par canal (cohérent light/dark)
const CHANNEL_COLORS: Record<string, string> = {
  organic: "#10B981",
  "google-ads": "#3B82F6",
  "meta-ads": "#8B5CF6",
  "meta-organic": "#A78BFA",
  referral: "#F59E0B",
  campaign: "#EC4899",
  direct: "#64748B",
};

function pct(n: number) {
  return `${(n * 100).toFixed(1)}%`;
}

export default function AnalyticsDashboard() {
  const [period, setPeriod] = useState("month");
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/analytics?period=${period}`)
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [period]);

  const maxVisitors = data ? Math.max(...data.channels.map((c) => c.visitors), 1) : 1;

  return (
    <div className="space-y-6">
      {/* Sélecteur de période */}
      <div className="flex gap-2">
        {PERIODS.map((p) => (
          <button
            key={p.key}
            onClick={() => setPeriod(p.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              period === p.key
                ? "bg-slate-900 text-white"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {loading && <p className="text-sm text-slate-400">Chargement…</p>}

      {!loading && data && (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Kpi label="Visiteurs" value={data.totals.visitors.toLocaleString("fr-FR")} />
            <Kpi label="Pages vues" value={data.totals.pageViews.toLocaleString("fr-FR")} />
            <Kpi label="Conversions" value={data.totals.conversions.toLocaleString("fr-FR")} />
            <Kpi label="Taux de conversion" value={pct(data.totals.conversionRate)} />
          </div>

          {/* Par canal */}
          <div className="bg-white rounded-2xl border border-slate-100 p-6">
            <h2 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-wider">
              Par canal d&apos;acquisition
            </h2>
            {data.channels.length === 0 ? (
              <p className="text-sm text-slate-400">
                Aucune donnée sur cette période. La collecte vient de démarrer — reviens dans quelques heures.
              </p>
            ) : (
              <div className="space-y-4">
                {data.channels.map((c) => (
                  <div key={c.channel}>
                    <div className="flex items-center justify-between mb-1.5 text-sm">
                      <span className="flex items-center gap-2 font-medium text-slate-700">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ background: CHANNEL_COLORS[c.channel] ?? "#94A3B8" }}
                        />
                        {c.label}
                      </span>
                      <span className="text-slate-400">
                        <span className="font-semibold text-slate-700">{c.visitors}</span> visiteurs ·{" "}
                        <span className="font-semibold text-slate-700">{c.conversions}</span> conv. ·{" "}
                        {pct(c.conversionRate)}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${(c.visitors / maxVisitors) * 100}%`,
                          background: CHANNEL_COLORS[c.channel] ?? "#94A3B8",
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Détail conversions + blog */}
          <div className="grid lg:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-slate-100 p-6">
              <h2 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-wider">
                Conversions par type
              </h2>
              {data.conversionTypes.length === 0 ? (
                <p className="text-sm text-slate-400">Aucune conversion sur cette période.</p>
              ) : (
                <ul className="space-y-2.5">
                  {data.conversionTypes.map((c) => (
                    <li key={c.event} className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">{CONVERSION_LABELS[c.event] ?? c.event}</span>
                      <span className="font-bold text-slate-900">{c.count}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 p-6">
              <h2 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-wider">
                Focus blog
              </h2>
              <p className="text-3xl font-black text-slate-900">{data.totals.blogVisitors}</p>
              <p className="text-sm text-slate-500 mt-1">
                visiteurs dont la première page était un article de blog
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5">
      <p className="text-2xl font-black text-slate-900">{value}</p>
      <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-medium">{label}</p>
    </div>
  );
}
