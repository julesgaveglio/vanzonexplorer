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
  internalLinks: number;
  externalLinks: number;
  wordCount: number;
}

// ─── Authority enrichi ──────────────────────────────────────────────────────

export interface SslInfo {
  grade: string | null;
  validFrom: string | null;
  validTo: string | null;
  issuer: string | null;
  protocol: string | null;
}

export interface DomainWhois {
  createdDate: string | null;
  expiryDate: string | null;
  registrar: string | null;
  nameservers: string[];
  domainAge: string | null;
}

export interface DnsInfo {
  ip: string | null;
  ttl: number | null;
}

export interface AuthorityData {
  domainAuthority: number;
  backlinksCount: number;
  referringDomains: number;
  organicTraffic: number;
  // Nouveaux champs
  pageRank: number | null;
  pageRankDecimal: number | null;
  ssl: SslInfo | null;
  whois: DomainWhois | null;
  dns: DnsInfo | null;
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
  resumeExecutif?: string;
  scoreGlobal?: number;
  scoreJustification?: string;
  analyseCwv?: string;
  analyseAutorite?: string;
  positionnementActuel?: string;
  analyseConcurrents?: string;
  strategieContenu?: string;
}

// ─── Business analysis ───────────────────────────────────────────────────────
export interface BusinessAnalysis {
  nom_site: string;
  secteur_activite: string;
  business_model: string;
  produits_services: string[];
  cible_audience: string;
  proposition_valeur: string;
  zone_geo: string;
  mots_cles_metier: string[];
}

// ─── Keywords & indexation ───────────────────────────────────────────────────
export interface IndexedPage {
  url: string;
  title: string;
  snippet: string;
}

export interface KeywordOpportunity {
  keyword: string;
  searchVolume: number;
  difficulty: number;
  position: number | null;
  cpc: number | null;
  intent?: string;
  priority: number; // volume / max(difficulty, 1)
}

export interface KeywordIdea {
  keyword: string;
  searchVolume: number;
  difficulty: number;
  intent: string;
}

export interface KeywordsData {
  indexedPages: IndexedPage[];
  indexedCount: number;
  keywordsForSite: KeywordOpportunity[];
  keywordIdeas: KeywordIdea[];
}

// ─── Content strategy ────────────────────────────────────────────────────────
export interface ContentArticle {
  rang: number;
  titre_seo: string;
  mot_cle_principal: string;
  volume_mensuel: number;
  difficulte: number;
  intention: string;
  pourquoi_ce_site: string;
  angle_editorial: string;
  titre_accrocheur: string;
  cta_naturel: string;
  priorite: string;
}

export interface ContentStrategyData {
  articles: ContentArticle[];
  strategie_globale: string;
  quick_wins_justification: string;
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
  business?: BusinessAnalysis;
  keywords?: KeywordsData;
  contentStrategy?: ContentStrategyData;
}

export type PipelineStep = "business" | "pagespeed" | "onpage" | "authority" | "keywords" | "competitors" | "content-strategy" | "ai-insights";

export type StepStatus = "pending" | "loading" | "done" | "error";

export interface PipelineState {
  business: StepStatus;
  pagespeed: StepStatus;
  onpage: StepStatus;
  authority: StepStatus;
  keywords: StepStatus;
  competitors: StepStatus;
  "content-strategy": StepStatus;
  "ai-insights": StepStatus;
}
