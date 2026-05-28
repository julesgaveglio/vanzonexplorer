"use client";

import { useCampaign } from "./CampaignContext";

export default function CampaignSelector() {
  const { campaigns, activeCampaignId, activeCampaign, setActiveCampaignId, loading } = useCampaign();

  if (loading || campaigns.length === 0) return null;

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1.5">
        <div className={`w-2 h-2 rounded-full ${activeCampaign?.end_date ? "bg-slate-400" : "bg-emerald-500 animate-pulse"}`} />
        <select
          value={activeCampaignId}
          onChange={(e) => setActiveCampaignId(e.target.value)}
          className="bg-slate-50 border border-slate-200 text-sm font-medium text-slate-800 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-violet-500/30 cursor-pointer max-w-[200px]"
        >
          {campaigns.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} {!c.end_date ? "(en cours)" : ""}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
