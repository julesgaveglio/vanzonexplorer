// src/types/seo-report.ts

export interface PsiVital {
  value: string;
  score: number | null;
}

export interface PsiOpportunity {
  id: string;
  title: string;
  displayValue: string;
  savingsMs: number;
}

export interface PsiResult {
  scores: {
    performance: number;
    seo: number;
    accessibility: number;
    bestPractices: number;
  };
  vitals: {
    lcp: PsiVital;
    cls: PsiVital;
    tbt: PsiVital;
    fcp: PsiVital;
    si: PsiVital;
    tti: PsiVital;
  };
  opportunities: PsiOpportunity[];
  diagnostics: { id: string; title: string; score: number | null; displayValue: string }[];
}

export interface PagespeedData {
  mobile: PsiResult;
  desktop: PsiResult;
}

export interface OnPageItem {
  key: string;
  label: string;
  pass: boolean;
  value?: string;
  detail?: string;
}

export interface OnPageData {
  score: number;
  items: OnPageItem[];
  imagesWithoutAlt: number;
  totalImages: number;
  h2s: string[];
  h3s: string[];
}

export interface AuthorityData {
  domainAuthority: number;
  backlinksCount: number;
  referringDomains: number;
  organicTraffic: number;
}

export interface CompetitorItem {
  domain: string;
  intersections: number;
  relevance: number;
}

export interface CompetitorsData {
  competitors: CompetitorItem[];
}

export interface AiAxis {
  titre: string;
  priorite: "Fort" | "Moyen" | "Faible";
  description: string;
  impact: string;
}

export interface AiInsightsData {
  secteur: string;
  axes: AiAxis[];
  conclusion: string;
}

export interface SeoReportData {
  url: string;
  label?: string;
  generatedAt: string;
  scoreGlobal: number;
  pagespeed?: PagespeedData;
  onpage?: OnPageData;
  authority?: AuthorityData;
  competitors?: CompetitorsData;
  aiInsights?: AiInsightsData;
}

export type PipelineStep = "pagespeed" | "onpage" | "authority" | "competitors" | "ai-insights";

export type StepStatus = "pending" | "loading" | "done" | "error";

export interface PipelineState {
  pagespeed: StepStatus;
  onpage: StepStatus;
  authority: StepStatus;
  competitors: StepStatus;
  "ai-insights": StepStatus;
}
