"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

const COOKIE_NAME = "sigma_active_campaign";

export interface SigmaCampaign {
  id: string;
  name: string;
  start_date: string;
  end_date: string | null;
  budget_euros: number | null;
}

interface SigmaCampaignContextValue {
  campaigns: SigmaCampaign[];
  activeCampaign: SigmaCampaign | null;
  activeCampaignId: string;
  setActiveCampaignId: (id: string) => void;
  buildQS: (fallbackDays?: number) => string;
  loading: boolean;
}

const Ctx = createContext<SigmaCampaignContextValue | null>(null);

export function useSigmaCampaign() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useSigmaCampaign must be used inside SigmaCampaignProvider");
  return ctx;
}

function readCookie(): string {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(new RegExp(`(?:^|; )${COOKIE_NAME}=([^;]*)`));
  return match?.[1] ?? "";
}

function writeCookie(id: string) {
  document.cookie = `${COOKIE_NAME}=${id}; path=/; max-age=${30 * 86400}; SameSite=Lax`;
}

export function SigmaCampaignProvider({ children }: { children: ReactNode }) {
  const [campaigns, setCampaigns] = useState<SigmaCampaign[]>([]);
  const [activeCampaignId, setIdRaw] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/sigma/campaigns")
      .then((r) => r.json())
      .then((json) => {
        const camps = (json.campaigns ?? []) as SigmaCampaign[];
        setCampaigns(camps);

        const running = camps.find((c) => !c.end_date);
        const saved = readCookie();
        const savedCamp = camps.find((c) => c.id === saved);

        if (running && savedCamp && savedCamp.end_date) {
          setIdRaw(running.id);
          writeCookie(running.id);
        } else if (savedCamp) {
          setIdRaw(saved);
        } else {
          const fallback = running ?? camps[0];
          if (fallback) {
            setIdRaw(fallback.id);
            writeCookie(fallback.id);
          }
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const setActiveCampaignId = useCallback((id: string) => {
    setIdRaw(id);
    writeCookie(id);
  }, []);

  const activeCampaign = campaigns.find((c) => c.id === activeCampaignId) ?? null;

  const earliestStart = campaigns.length > 0
    ? campaigns.reduce((min, c) => c.start_date < min ? c.start_date : min, campaigns[0].start_date)
    : null;

  const buildQS = useCallback(
    (fallbackDays = 30) => {
      if (activeCampaign) {
        return `start=${activeCampaign.start_date}${activeCampaign.end_date ? `&end=${activeCampaign.end_date}` : ""}`;
      }
      if (earliestStart) {
        return `start=${earliestStart}`;
      }
      return `days=${fallbackDays}`;
    },
    [activeCampaign, earliestStart]
  );

  return (
    <Ctx.Provider
      value={{ campaigns, activeCampaign, activeCampaignId, setActiveCampaignId, buildQS, loading }}
    >
      {children}
    </Ctx.Provider>
  );
}
