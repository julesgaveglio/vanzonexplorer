"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

const COOKIE_NAME = "ads_active_campaign";

export interface Campaign {
  id: string;
  name: string;
  start_date: string;
  end_date: string | null;
  budget_euros: number | null;
  platform: string | null;
}

export type AdsRole = "admin" | "viewer";

interface CampaignContextValue {
  campaigns: Campaign[];
  activeCampaign: Campaign | null;
  activeCampaignId: string;
  setActiveCampaignId: (id: string) => void;
  /** Query string for API calls: either start=...&end=... or days=N */
  buildQS: (fallbackDays?: number) => string;
  loading: boolean;
  /** User role: admin = full access, viewer = read-only */
  role: AdsRole;
  isAdmin: boolean;
}

const Ctx = createContext<CampaignContextValue | null>(null);

export function useCampaign() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCampaign must be used inside CampaignProvider");
  return ctx;
}

/** Read campaign id from cookie */
function readCookie(): string {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(new RegExp(`(?:^|; )${COOKIE_NAME}=([^;]*)`));
  return match?.[1] ?? "";
}

/** Write campaign id to cookie (30 days) */
function writeCookie(id: string) {
  document.cookie = `${COOKIE_NAME}=${id}; path=/; max-age=${30 * 86400}; SameSite=Lax`;
}

export function CampaignProvider({ children, role = "admin" }: { children: ReactNode; role?: AdsRole }) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [activeCampaignId, setIdRaw] = useState("");
  const [loading, setLoading] = useState(true);

  // Fetch campaigns on mount
  useEffect(() => {
    fetch("/api/ads/campaigns")
      .then((r) => r.json())
      .then((json) => {
        const camps = (json.campaigns ?? []) as Campaign[];
        setCampaigns(camps);

        // Restore from cookie, or default to latest active campaign (no end_date)
        const saved = readCookie();
        const valid = camps.find((c) => c.id === saved);
        if (valid) {
          setIdRaw(saved);
        } else {
          // Default: latest campaign without end_date (still running)
          const running = camps.find((c) => !c.end_date);
          const fallback = running ?? camps[0]; // camps are ordered by start_date DESC
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

  const buildQS = useCallback(
    (fallbackDays = 30) => {
      if (activeCampaign) {
        return `start=${activeCampaign.start_date}${activeCampaign.end_date ? `&end=${activeCampaign.end_date}` : ""}`;
      }
      return `days=${fallbackDays}`;
    },
    [activeCampaign]
  );

  return (
    <Ctx.Provider
      value={{ campaigns, activeCampaign, activeCampaignId, setActiveCampaignId, buildQS, loading, role, isAdmin: role === "admin" }}
    >
      {children}
    </Ctx.Provider>
  );
}
