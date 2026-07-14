"use client";

import { useEffect, useState } from "react";
import { Card, SectionTitle, CHANNEL_COLORS } from "../_components/ui";

interface Visitor {
  id: string;
  channel: string;
  channelLabel: string;
  email: string | null;
  landingPage: string | null;
  pageViews: number;
  events: number;
  conversions: string[];
  sawVsl: boolean;
  vslDepth: string | null;
  journey: string[];
  firstSeen: string | null;
  lastSeen: string | null;
}

const CONV_SHORT: Record<string, string> = {
  booking_click: "Réservation", whatsapp_click: "WhatsApp", roadtrip_lead: "Road-trip",
  resource_download: "Téléchargt", vsl_cta_click: "Clic VSL", contact_submit: "Contact",
  optin: "Opt-in", purchase: "Achat",
};

const VSL_LABEL: Record<string, string> = {
  vsl_view: "VSL démarrée", vsl_25: "VSL 25%", vsl_50: "VSL 50%", vsl_75: "VSL 75%", vsl_100: "VSL vue en entier",
};

function timeAgo(iso: string | null): string {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "à l'instant";
  if (m < 60) return `il y a ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `il y a ${h} h`;
  const d = Math.floor(h / 24);
  return `il y a ${d} j`;
}

export default function PulseVisitors() {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/pulse/visitors")
      .then((r) => r.json())
      .then((d) => setVisitors(d.visitors ?? []))
      .catch(() => setVisitors([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-4">
      <SectionTitle>Derniers visiteurs · parcours</SectionTitle>
      {loading && <p className="text-sm text-slate-400 pt-6 text-center">Chargement…</p>}
      {!loading && visitors.length === 0 && (
        <Card><p className="text-sm text-slate-400">Pas encore de visiteurs enregistrés.</p></Card>
      )}

      {visitors.map((v) => (
        <Card key={v.id} className="!p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="flex items-center gap-2 text-sm font-bold text-slate-800">
              <span className="w-2 h-2 rounded-full" style={{ background: CHANNEL_COLORS[v.channel] ?? "#94A3B8" }} />
              {v.channelLabel}
            </span>
            <span className="text-[11px] text-slate-400">{timeAgo(v.lastSeen)}</span>
          </div>

          <div className="flex flex-wrap gap-1.5 mb-2 text-[11px]">
            <Tag>{v.pageViews} page{v.pageViews > 1 ? "s" : ""}</Tag>
            {v.email && <Tag tone="blue">{v.email}</Tag>}
            {v.vslDepth && <Tag tone="purple">{VSL_LABEL[v.vslDepth] ?? v.vslDepth}</Tag>}
            {v.conversions.map((c, i) => (
              <Tag key={i} tone="green">{CONV_SHORT[c] ?? c}</Tag>
            ))}
          </div>

          {v.journey.length > 0 && (
            <div className="flex items-center gap-1 overflow-x-auto pb-1 -mb-1">
              {v.journey.map((step, i) => (
                <span key={i} className="flex items-center gap-1 flex-shrink-0">
                  <span className="text-[10px] text-slate-500 bg-slate-50 border border-slate-100 rounded px-1.5 py-0.5 whitespace-nowrap max-w-[120px] truncate">
                    {step}
                  </span>
                  {i < v.journey.length - 1 && <span className="text-slate-300 text-[10px]">→</span>}
                </span>
              ))}
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}

function Tag({ children, tone = "slate" }: { children: React.ReactNode; tone?: "slate" | "blue" | "green" | "purple" }) {
  const styles: Record<string, string> = {
    slate: "bg-slate-100 text-slate-500",
    blue: "bg-blue-50 text-blue-600",
    green: "bg-emerald-50 text-emerald-600",
    purple: "bg-violet-50 text-violet-600",
  };
  return <span className={`px-2 py-0.5 rounded-full font-semibold ${styles[tone]}`}>{children}</span>;
}
