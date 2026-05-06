"use client";

import { useState } from "react";
import { BarChart3, UserPlus, Users, Play, Mail } from "lucide-react";
import AdsDashboardClient from "../../../../(ads)/ads/_components/AdsDashboardClient";
import AdsOptinClient from "../../../../(ads)/ads/_components/AdsOptinClient";
import AdsLeadsClient from "../../../../(ads)/ads/_components/AdsLeadsClient";
import AdsVSLClient from "../../../../(ads)/ads/_components/AdsVSLClient";
import AdsEmailClient from "../../../../(ads)/ads/_components/AdsEmailClient";

const TABS = [
  { key: "dashboard", label: "Dashboard", icon: BarChart3 },
  { key: "optin", label: "Opt-in", icon: UserPlus },
  { key: "leads", label: "Leads", icon: Users },
  { key: "vsl", label: "VSL Analytics", icon: Play },
  { key: "email", label: "Email", icon: Mail },
] as const;

type Tab = (typeof TABS)[number]["key"];

export default function FunnelTabsClient() {
  const [tab, setTab] = useState<Tab>("dashboard");

  return (
    <div>
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

      {tab === "dashboard" && <AdsDashboardClient />}
      {tab === "optin" && <AdsOptinClient />}
      {tab === "leads" && <AdsLeadsClient />}
      {tab === "vsl" && <AdsVSLClient />}
      {tab === "email" && <AdsEmailClient />}
    </div>
  );
}
