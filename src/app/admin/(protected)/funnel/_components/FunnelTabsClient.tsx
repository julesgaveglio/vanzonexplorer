"use client";

import { useState } from "react";
import { BarChart3, Megaphone, Users } from "lucide-react";
import FunnelDashboardClient from "./FunnelDashboardClient";
import CampaignsClient from "./CampaignsClient";
import LeadsClient from "./LeadsClient";

const TABS = [
  { key: "tunnel", label: "Tunnel", icon: BarChart3 },
  { key: "campaigns", label: "Campagnes", icon: Megaphone },
  { key: "leads", label: "Leads", icon: Users },
] as const;

type Tab = (typeof TABS)[number]["key"];

export default function FunnelTabsClient() {
  const [tab, setTab] = useState<Tab>("tunnel");

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200 mb-6 -mt-2 overflow-x-auto">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                tab === t.key
                  ? "border-slate-900 text-slate-900"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {tab === "tunnel" && <FunnelDashboardClient />}
      {tab === "campaigns" && <CampaignsClient />}
      {tab === "leads" && <LeadsClient />}
    </div>
  );
}
