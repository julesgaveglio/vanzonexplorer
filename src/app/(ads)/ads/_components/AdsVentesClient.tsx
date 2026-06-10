"use client";

import { useState, useEffect } from "react";

interface Sale {
  email: string;
  full_name: string | null;
  phone: string | null;
  amount: number | null;
  payment_type: string | null;
  promo_code: string | null;
  stripe_session_id: string | null;
  purchased_at: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  optin_at: string | null;
  member_since: string | null;
}

interface KPIs {
  total_sales: number;
  total_revenue: number;
  avg_ticket: number;
  payment_types: { "1x": number; "4x": number; unknown: number };
  source_breakdown: Record<string, number>;
  promo_breakdown: Record<string, number>;
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatAmount(amount: number | null) {
  if (amount === null) return "—";
  return `${amount.toLocaleString("fr-FR")} \u20AC`;
}

function daysBetween(a: string | null, b: string | null) {
  if (!a || !b) return null;
  const diff = new Date(b).getTime() - new Date(a).getTime();
  return Math.round(diff / 86400000);
}

export default function AdsVentesClient() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [kpis, setKpis] = useState<KPIs | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedEmail, setExpandedEmail] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/ads/sales")
      .then((r) => r.json())
      .then((json) => {
        setSales(json.sales ?? []);
        setKpis(json.kpis ?? null);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <svg className="animate-spin h-6 w-6 text-emerald-500" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" strokeDasharray="30 70" />
        </svg>
      </div>
    );
  }

  const pt = kpis?.payment_types ?? { "1x": 0, "4x": 0, unknown: 0 };

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label="Ventes totales"
          value={kpis?.total_sales ?? 0}
          subtitle="membres VBA"
          color="emerald"
        />
        <KPICard
          label="CA total"
          value={formatAmount(kpis?.total_revenue ?? 0)}
          subtitle={`ticket moyen : ${formatAmount(kpis?.avg_ticket ?? 0)}`}
          color="emerald"
        />
        <KPICard
          label="Paiement 1x"
          value={pt["1x"]}
          subtitle={`${pt["4x"]} en 4x · ${pt.unknown} inconnu`}
          color="blue"
        />
        <KPICard
          label="Sources"
          value={Object.keys(kpis?.source_breakdown ?? {}).length}
          subtitle={Object.entries(kpis?.source_breakdown ?? {})
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([s, n]) => `${s} (${n})`)
            .join(", ") || "—"}
          color="slate"
        />
      </div>

      {/* Source + Promo breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <BreakdownCard
          title="Par source"
          data={kpis?.source_breakdown ?? {}}
          total={kpis?.total_sales ?? 0}
          colorFn={(key) =>
            key.includes("ig") || key.includes("instagram")
              ? "bg-gradient-to-r from-purple-500 to-pink-500"
              : key.includes("fb") || key.includes("facebook")
                ? "bg-blue-500"
                : key === "direct"
                  ? "bg-slate-400"
                  : "bg-emerald-500"
          }
        />
        <BreakdownCard
          title="Par code promo"
          data={kpis?.promo_breakdown ?? {}}
          total={kpis?.total_sales ?? 0}
          colorFn={(key) =>
            key === "LANCEMENT"
              ? "bg-amber-500"
              : key === "JACQUE"
                ? "bg-purple-500"
                : key === "Sans code"
                  ? "bg-slate-400"
                  : "bg-blue-500"
          }
        />
      </div>

      {/* Sales table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        {sales.length === 0 ? (
          <div className="text-center py-20 text-slate-400 text-sm">Aucune vente</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="text-left text-xs text-slate-500 uppercase tracking-wider px-4 py-3 font-medium">
                    Client
                  </th>
                  <th className="text-left text-xs text-slate-500 uppercase tracking-wider px-4 py-3 font-medium">
                    Montant
                  </th>
                  <th className="text-left text-xs text-slate-500 uppercase tracking-wider px-4 py-3 font-medium hidden sm:table-cell">
                    Paiement
                  </th>
                  <th className="text-left text-xs text-slate-500 uppercase tracking-wider px-4 py-3 font-medium hidden md:table-cell">
                    Code promo
                  </th>
                  <th className="text-left text-xs text-slate-500 uppercase tracking-wider px-4 py-3 font-medium hidden md:table-cell">
                    Source
                  </th>
                  <th className="text-left text-xs text-slate-500 uppercase tracking-wider px-4 py-3 font-medium">
                    Date achat
                  </th>
                  <th className="text-left text-xs text-slate-500 uppercase tracking-wider px-4 py-3 font-medium hidden lg:table-cell">
                    Opt-in &rarr; Achat
                  </th>
                </tr>
              </thead>
              <tbody>
                {sales.map((sale) => {
                  const isExpanded = expandedEmail === sale.email;
                  const cycleDays = daysBetween(sale.optin_at, sale.purchased_at);

                  return (
                    <tr
                      key={sale.email}
                      className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors cursor-pointer"
                      onClick={() => setExpandedEmail(isExpanded ? null : sale.email)}
                    >
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-slate-900 font-medium">
                            {sale.full_name ?? "—"}
                          </p>
                          <p className="text-xs text-slate-400">{sale.email}</p>
                          {sale.phone && (
                            <p className="text-xs text-slate-400">{sale.phone}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-emerald-600 font-bold">
                          {formatAmount(sale.amount)}
                        </span>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <PaymentBadge type={sale.payment_type} />
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <PromoBadge code={sale.promo_code} />
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <SourceBadge source={sale.utm_source} medium={sale.utm_medium} />
                      </td>
                      <td className="px-4 py-3 text-slate-600 text-xs">
                        {formatDate(sale.purchased_at)}
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        {cycleDays !== null ? (
                          <span className={`text-xs font-medium ${cycleDays <= 7 ? "text-emerald-600" : cycleDays <= 30 ? "text-blue-600" : "text-amber-600"}`}>
                            {cycleDays}j
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Sub-components ── */

function KPICard({
  label,
  value,
  subtitle,
  color,
}: {
  label: string;
  value: string | number;
  subtitle: string;
  color: "slate" | "blue" | "emerald";
}) {
  const accents = {
    slate: "text-slate-700 ring-slate-100",
    blue: "text-blue-600 ring-blue-100",
    emerald: "text-emerald-600 ring-emerald-100",
  };
  return (
    <div className={`bg-white border border-slate-200 rounded-2xl p-5 shadow-sm ring-1 ${accents[color].split(" ")[1]}`}>
      <p className="text-xs text-slate-500 uppercase tracking-wider font-medium mb-1">{label}</p>
      <p className={`text-2xl sm:text-3xl font-bold ${accents[color].split(" ")[0]}`}>
        {typeof value === "number" ? value.toLocaleString("fr-FR") : value}
      </p>
      <p className="text-xs text-slate-400 mt-1">{subtitle}</p>
    </div>
  );
}

function BreakdownCard({
  title,
  data,
  total,
  colorFn,
}: {
  title: string;
  data: Record<string, number>;
  total: number;
  colorFn: (key: string) => string;
}) {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
  if (entries.length === 0) return null;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
      <h3 className="text-slate-900 font-semibold mb-4">{title}</h3>
      <div className="space-y-3">
        {entries.map(([key, count]) => {
          const pct = total > 0 ? Math.round((count / total) * 100) : 0;
          const bgClass = colorFn(key.toLowerCase());
          const isGradient = bgClass.includes("gradient");
          return (
            <div key={key} className="flex items-center gap-3">
              <span className="text-sm font-medium text-slate-700 w-24 shrink-0 truncate">{key}</span>
              <div className="flex-1 h-8 bg-slate-100 rounded-lg overflow-hidden relative">
                <div
                  className={`h-full rounded-lg transition-all duration-500 ${isGradient ? "" : bgClass}`}
                  style={{
                    width: `${Math.max(pct, 8)}%`,
                    ...(isGradient ? { background: "linear-gradient(90deg, #8B5CF6, #EC4899)" } : {}),
                  }}
                />
                <div className="absolute inset-0 flex items-center px-3 justify-between">
                  <span className="text-xs font-bold text-white drop-shadow">{count}</span>
                  <span className="text-xs font-semibold text-slate-600">{pct}%</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PaymentBadge({ type }: { type: string | null }) {
  if (type === "1x") {
    return (
      <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
        1x
      </span>
    );
  }
  if (type === "4x") {
    return (
      <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-blue-50 text-blue-700 border border-blue-100">
        4x sans frais
      </span>
    );
  }
  return (
    <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-slate-100 text-slate-500">
      Inconnu
    </span>
  );
}

function PromoBadge({ code }: { code: string | null }) {
  if (!code || code === "none") {
    return <span className="text-xs text-slate-400">Aucun</span>;
  }
  const colors: Record<string, string> = {
    LANCEMENT: "bg-amber-50 text-amber-700 border-amber-100",
    JACQUE: "bg-purple-50 text-purple-700 border-purple-100",
    OFFREDELANCEMENT: "bg-emerald-50 text-emerald-700 border-emerald-100",
  };
  const cls = colors[code.toUpperCase()] ?? "bg-slate-50 text-slate-700 border-slate-100";
  return (
    <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full border ${cls}`}>
      {code}
    </span>
  );
}

function SourceBadge({ source, medium }: { source: string | null; medium: string | null }) {
  const label = source || "direct";
  const sub = medium && medium !== "paid" ? ` / ${medium}` : "";
  const isIG = label.includes("ig") || label.includes("instagram");
  const isFB = label.includes("fb") || label.includes("facebook");

  const cls = isIG
    ? "bg-gradient-to-r from-purple-50 to-pink-50 text-purple-700 border-purple-100"
    : isFB
      ? "bg-blue-50 text-blue-700 border-blue-100"
      : "bg-slate-100 text-slate-600 border-slate-200";

  return (
    <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full border ${cls}`}>
      {label}{sub}
      {medium === "paid" && (
        <span className="ml-1 text-[10px] opacity-60">paid</span>
      )}
    </span>
  );
}
