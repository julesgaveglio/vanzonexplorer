"use client";

import { useSearchParams } from "next/navigation";

const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content"] as const;
const STORAGE_KEY = "vba_funnel_data";

export interface FunnelData {
  firstname: string;
  email: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
}

export function useUTMParams() {
  const searchParams = useSearchParams();

  const utmParams: Partial<Record<(typeof UTM_KEYS)[number], string>> = {};
  for (const key of UTM_KEYS) {
    const val = searchParams.get(key);
    if (val) utmParams[key] = val;
  }

  return utmParams;
}

export function saveFunnelData(data: FunnelData) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {}
}

export function getFunnelData(): FunnelData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as FunnelData;
  } catch {
    return null;
  }
}
