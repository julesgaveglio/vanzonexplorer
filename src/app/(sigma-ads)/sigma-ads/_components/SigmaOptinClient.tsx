"use client";

import { useState, useEffect, useCallback } from "react";
import { useSigmaCampaign } from "./SigmaCampaignContext";

interface OptinData {
  views: number;
  optins: number;
  rate: number;
}

export default function SigmaOptinClient() {
  const { activeCampaign, activeCampaignId, buildQS, loading: campLoading } = useSigmaCampaign();
  const [data, setData] = useState<OptinData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const qs = buildQS();
      const res = await fetch(`/api/sigma/optin?${qs}`);
      const json = await res.json();
      setData(json);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [buildQS]);

  useEffect(() => {
    if (!campLoading) fetchData();
  }, [fetchData, campLoading, activeCampaignId]);

  const campaignLabel = activeCampaign?.name ?? "Toutes les campagnes";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Opt-in</h1>
          <p className="text-sm text-slate-500 mt-0.5">{campaignLabel}</p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="px-3 py-2 text-sm text-slate-500 hover:text-slate-700 bg-white border border-slate-200 rounded-xl transition-colors disabled:opacity-50"
        >
          {loading ? (
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" strokeDasharray="30 70" /></svg>
          ) : "Actualiser"}
        </button>
      </div>

      {loading && !data ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#B9945F]" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <KPICard label="Pages vues" value={data?.views ?? 0} color="slate" />
          <KPICard label="Opt-ins" value={data?.optins ?? 0} color="gold" />
          <KPICard label="Taux de conversion" value={`${data?.rate ?? 0}%`} color="emerald" />
        </div>
      )}
    </div>
  );
}

function KPICard({ label, value, color }: { label: string; value: string | number; color: string }) {
  const colors: Record<string, string> = {
    slate: "border-slate-200 bg-slate-50",
    gold: "border-[#B9945F]/20 bg-[#B9945F]/5",
    emerald: "border-emerald-200 bg-emerald-50",
  };
  const textColors: Record<string, string> = {
    slate: "text-slate-700",
    gold: "text-[#B9945F]",
    emerald: "text-emerald-700",
  };

  return (
    <div className={`border rounded-2xl p-4 sm:p-5 ${colors[color] ?? colors.slate}`}>
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className={`text-2xl sm:text-3xl font-bold ${textColors[color] ?? textColors.slate}`}>{value}</p>
    </div>
  );
}
