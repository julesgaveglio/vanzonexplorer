// src/app/admin/(protected)/seo-report/_lib/score.ts
import type { PagespeedData, OnPageData, AuthorityData } from "@/types/seo-report";

export function calcScoreGlobal(
  pagespeed?: PagespeedData,
  onpage?: OnPageData,
  authority?: AuthorityData
): number {
  let score = 0;
  let weight = 0;

  if (pagespeed) {
    score += pagespeed.mobile.scores.seo * 0.30;
    score += pagespeed.mobile.scores.performance * 0.25;
    weight += 0.55;
  }
  if (onpage) {
    score += onpage.score * 0.30;
    weight += 0.30;
  }
  if (authority) {
    score += authority.domainAuthority * 0.15;
    weight += 0.15;
  }

  if (weight === 0) return 0;
  return Math.round(score / weight);
}

export function getScoreColor(score: number): string {
  if (score >= 80) return "#10B981";
  if (score >= 50) return "#F59E0B";
  return "#EF4444";
}

export function getScoreLabel(score: number): string {
  if (score >= 80) return "Bon";
  if (score >= 50) return "À améliorer";
  return "Critique";
}
