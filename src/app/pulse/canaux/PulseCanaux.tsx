"use client";

import { useEffect, useState } from "react";
import { PeriodSelector, Card, SectionTitle, CHANNEL_COLORS, pct, fmt } from "../_components/ui";

interface ChannelStat {
  channel: string; label: string; visitors: number; conversions: number; conversionRate: number;
}
interface Data {
  channels: ChannelStat[];
  conversionTypes: { event: string; count: number }[];
}

const CONV_LABELS: Record<string, string> = {
  booking_click: "Clic réservation (Yescapa / Wiki)", whatsapp_click: "Clic WhatsApp",
  roadtrip_lead: "Lead road-trip", resource_download: "Téléchargement ressource",
  vsl_cta_click: "Clic VSL formation", contact_submit: "Formulaire contact",
  optin: "Opt-in VBA", purchase: "Achat VBA",
};

export default function PulseCanaux() {
  const [period, setPeriod] = useState("week");
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/pulse/overview?period=${period}`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [period]);

  const maxVisitors = data ? Math.max(...data.channels.map((c) => c.visitors), 1) : 1;

  return (
    <div className="space-y-5">
      <PeriodSelector value={period} onChange={setPeriod} />
      {loading && <p className="text-sm text-slate-400 pt-6 text-center">Chargement…</p>}

      {!loading && data && (
        <>
          <div>
            <SectionTitle>Trafic par canal</SectionTitle>
            <Card>
              {data.channels.length === 0 ? (
                <p className="text-sm text-slate-400">Pas encore de données sur cette période.</p>
              ) : (
                <div className="space-y-4">
                  {data.channels.map((c) => (
                    <div key={c.channel}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ background: CHANNEL_COLORS[c.channel] ?? "#94A3B8" }} />
                          {c.label}
                        </span>
                        <span className="text-xs text-slate-400">
                          <b className="text-slate-700">{fmt(c.visitors)}</b> vis. · <b className="text-slate-700">{c.conversions}</b> conv.
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${(c.visitors / maxVisitors) * 100}%`, background: CHANNEL_COLORS[c.channel] ?? "#94A3B8" }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          <div>
            <SectionTitle>Conversions par type</SectionTitle>
            <Card>
              {data.conversionTypes.length === 0 ? (
                <p className="text-sm text-slate-400">Aucune conversion sur cette période.</p>
              ) : (
                <ul className="space-y-3">
                  {data.conversionTypes.map((c) => (
                    <li key={c.event} className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">{CONV_LABELS[c.event] ?? c.event}</span>
                      <span className="font-black text-slate-900">{c.count}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>

          <p className="text-xs text-slate-400 text-center px-4">
            Taux de conversion par canal : {data.channels.filter((c) => c.visitors >= 3).map((c) => `${c.label} ${pct(c.conversionRate)}`).join(" · ") || "—"}
          </p>
        </>
      )}
    </div>
  );
}
