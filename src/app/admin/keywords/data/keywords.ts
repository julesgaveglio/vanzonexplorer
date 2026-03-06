export type Category = "quick-win" | "main-target" | "editorial";
export type Intent = "commercial" | "informational" | "navigational";
export type CompLevel = "LOW" | "MEDIUM" | "HIGH";

export interface KeywordData {
  keyword: string;
  category: Category;
  intent: Intent;
  search_volume: number;
  monthly_searches: Record<string, number>;
  competition_level: CompLevel;
  keyword_difficulty: number | null;
  cpc: number;
  trend_yearly: number | null;
}

export const KEYWORDS: KeywordData[] = [
  { keyword: "location van aménagé landes", category: "quick-win", intent: "commercial", search_volume: 50, monthly_searches: { "2025-01": 20, "2025-02": 20, "2025-03": 40, "2025-04": 50, "2025-05": 70, "2025-06": 90, "2025-07": 110, "2025-08": 90, "2025-09": 50, "2025-10": 40, "2025-11": 20, "2025-12": 20 }, competition_level: "MEDIUM", keyword_difficulty: 24, cpc: 0.67, trend_yearly: null },
  { keyword: "location camping-car pays basque", category: "quick-win", intent: "commercial", search_volume: 50, monthly_searches: { "2025-01": 30, "2025-02": 40, "2025-03": 90, "2025-04": 90, "2025-05": 90, "2025-06": 70, "2025-07": 110, "2025-08": 70, "2025-09": 50, "2025-10": 40, "2025-11": 20, "2025-12": 20 }, competition_level: "HIGH", keyword_difficulty: 33, cpc: 0.84, trend_yearly: -60 },
  { keyword: "location van anglet", category: "quick-win", intent: "commercial", search_volume: 50, monthly_searches: { "2025-01": 40, "2025-02": 50, "2025-03": 70, "2025-04": 70, "2025-05": 70, "2025-06": 70, "2025-07": 110, "2025-08": 70, "2025-09": 30, "2025-10": 20, "2025-11": 10, "2025-12": 20 }, competition_level: "HIGH", keyword_difficulty: null, cpc: 0.47, trend_yearly: 100 },
  { keyword: "location van hossegor", category: "quick-win", intent: "commercial", search_volume: 20, monthly_searches: { "2025-01": 10, "2025-02": 10, "2025-03": 20, "2025-04": 20, "2025-05": 30, "2025-06": 30, "2025-07": 50, "2025-08": 30, "2025-09": 20, "2025-10": 10, "2025-11": 10, "2025-12": 10 }, competition_level: "MEDIUM", keyword_difficulty: 46, cpc: 0.77, trend_yearly: null },
  { keyword: "location van aménagé 64", category: "quick-win", intent: "commercial", search_volume: 20, monthly_searches: { "2025-01": 10, "2025-02": 10, "2025-03": 20, "2025-04": 20, "2025-05": 20, "2025-06": 30, "2025-07": 30, "2025-08": 20, "2025-09": 20, "2025-10": 10, "2025-11": 10, "2025-12": 10 }, competition_level: "HIGH", keyword_difficulty: 6, cpc: 1.24, trend_yearly: null },
  { keyword: "location van bidart", category: "quick-win", intent: "commercial", search_volume: 20, monthly_searches: { "2025-01": 10, "2025-02": 10, "2025-03": 30, "2025-04": 20, "2025-05": 20, "2025-06": 40, "2025-07": 40, "2025-08": 40, "2025-09": 30, "2025-10": 20, "2025-11": 10, "2025-12": 10 }, competition_level: "MEDIUM", keyword_difficulty: 51, cpc: 1.05, trend_yearly: -50 },
  { keyword: "location van saint jean de luz", category: "quick-win", intent: "commercial", search_volume: 20, monthly_searches: { "2025-01": 10, "2025-02": 20, "2025-03": 20, "2025-04": 30, "2025-05": 20, "2025-06": 30, "2025-07": 30, "2025-08": 30, "2025-09": 20, "2025-10": 20, "2025-11": 10, "2025-12": 10 }, competition_level: "HIGH", keyword_difficulty: null, cpc: 0.60, trend_yearly: -50 },
  { keyword: "location van biarritz", category: "main-target", intent: "commercial", search_volume: 390, monthly_searches: { "2025-01": 170, "2025-02": 170, "2025-03": 390, "2025-04": 390, "2025-05": 880, "2025-06": 880, "2025-07": 480, "2025-08": 320, "2025-09": 210, "2025-10": 110, "2025-11": 90, "2025-12": 70 }, competition_level: "HIGH", keyword_difficulty: null, cpc: 1.08, trend_yearly: -50 },
  { keyword: "location van pays basque", category: "main-target", intent: "commercial", search_volume: 210, monthly_searches: { "2025-01": 140, "2025-02": 170, "2025-03": 260, "2025-04": 210, "2025-05": 260, "2025-06": 320, "2025-07": 320, "2025-08": 260, "2025-09": 210, "2025-10": 110, "2025-11": 50, "2025-12": 70 }, competition_level: "HIGH", keyword_difficulty: null, cpc: 0.86, trend_yearly: -22 },
  { keyword: "location camping-car bayonne", category: "main-target", intent: "commercial", search_volume: 210, monthly_searches: { "2025-01": 50, "2025-02": 70, "2025-03": 90, "2025-04": 140, "2025-05": 170, "2025-06": 210, "2025-07": 260, "2025-08": 170, "2025-09": 110, "2025-10": 90, "2025-11": 50, "2025-12": 40 }, competition_level: "MEDIUM", keyword_difficulty: null, cpc: 0.78, trend_yearly: null },
  { keyword: "location van bayonne", category: "main-target", intent: "commercial", search_volume: 170, monthly_searches: { "2025-01": 140, "2025-02": 140, "2025-03": 210, "2025-04": 260, "2025-05": 210, "2025-06": 320, "2025-07": 320, "2025-08": 260, "2025-09": 140, "2025-10": 90, "2025-11": 70, "2025-12": 50 }, competition_level: "HIGH", keyword_difficulty: null, cpc: 0.76, trend_yearly: -44 },
  { keyword: "location van aménagé pays basque", category: "main-target", intent: "commercial", search_volume: 90, monthly_searches: { "2025-01": 40, "2025-02": 70, "2025-03": 110, "2025-04": 90, "2025-05": 90, "2025-06": 90, "2025-07": 110, "2025-08": 110, "2025-09": 140, "2025-10": 70, "2025-11": 20, "2025-12": 30 }, competition_level: "MEDIUM", keyword_difficulty: null, cpc: 0.64, trend_yearly: -25 },
  { keyword: "location van aménagé bayonne", category: "main-target", intent: "commercial", search_volume: 90, monthly_searches: { "2025-01": 30, "2025-02": 50, "2025-03": 70, "2025-04": 90, "2025-05": 110, "2025-06": 90, "2025-07": 110, "2025-08": 90, "2025-09": 70, "2025-10": 50, "2025-11": 30, "2025-12": 20 }, competition_level: "MEDIUM", keyword_difficulty: null, cpc: 0.41, trend_yearly: null },
  { keyword: "location camping-car biarritz", category: "main-target", intent: "commercial", search_volume: 90, monthly_searches: { "2025-01": 30, "2025-02": 40, "2025-03": 70, "2025-04": 90, "2025-05": 90, "2025-06": 110, "2025-07": 140, "2025-08": 110, "2025-09": 70, "2025-10": 50, "2025-11": 30, "2025-12": 20 }, competition_level: "MEDIUM", keyword_difficulty: null, cpc: 0.82, trend_yearly: null },
  { keyword: "location van landes", category: "main-target", intent: "commercial", search_volume: 90, monthly_searches: { "2025-01": 30, "2025-02": 40, "2025-03": 70, "2025-04": 90, "2025-05": 90, "2025-06": 110, "2025-07": 140, "2025-08": 110, "2025-09": 70, "2025-10": 50, "2025-11": 30, "2025-12": 20 }, competition_level: "MEDIUM", keyword_difficulty: null, cpc: 0.72, trend_yearly: null },
  { keyword: "location van bordeaux", category: "main-target", intent: "commercial", search_volume: 880, monthly_searches: { "2025-01": 390, "2025-02": 480, "2025-03": 590, "2025-04": 720, "2025-05": 880, "2025-06": 1000, "2025-07": 1300, "2025-08": 1000, "2025-09": 720, "2025-10": 480, "2025-11": 320, "2025-12": 260 }, competition_level: "HIGH", keyword_difficulty: null, cpc: 1.63, trend_yearly: null },
  { keyword: "location camping-car pau", category: "main-target", intent: "commercial", search_volume: 260, monthly_searches: { "2025-01": 90, "2025-02": 110, "2025-03": 140, "2025-04": 210, "2025-05": 210, "2025-06": 320, "2025-07": 390, "2025-08": 320, "2025-09": 210, "2025-10": 140, "2025-11": 90, "2025-12": 70 }, competition_level: "HIGH", keyword_difficulty: null, cpc: 0.82, trend_yearly: null },
  { keyword: "location van sud-ouest", category: "main-target", intent: "commercial", search_volume: 50, monthly_searches: { "2025-01": 20, "2025-02": 30, "2025-03": 40, "2025-04": 50, "2025-05": 70, "2025-06": 70, "2025-07": 90, "2025-08": 70, "2025-09": 50, "2025-10": 30, "2025-11": 20, "2025-12": 10 }, competition_level: "HIGH", keyword_difficulty: 49, cpc: 0.98, trend_yearly: null },
  { keyword: "location van aménagé dax", category: "main-target", intent: "commercial", search_volume: 20, monthly_searches: { "2025-01": 10, "2025-02": 10, "2025-03": 20, "2025-04": 20, "2025-05": 30, "2025-06": 30, "2025-07": 30, "2025-08": 20, "2025-09": 20, "2025-10": 10, "2025-11": 10, "2025-12": 10 }, competition_level: "HIGH", keyword_difficulty: null, cpc: 0.72, trend_yearly: null },
  { keyword: "road trip pays basque", category: "editorial", intent: "informational", search_volume: 390, monthly_searches: { "2025-01": 320, "2025-02": 390, "2025-03": 480, "2025-04": 480, "2025-05": 480, "2025-06": 480, "2025-07": 720, "2025-08": 480, "2025-09": 210, "2025-10": 210, "2025-11": 170, "2025-12": 170 }, competition_level: "LOW", keyword_difficulty: null, cpc: 0.32, trend_yearly: 21 },
  { keyword: "location camping-car particulier", category: "editorial", intent: "commercial", search_volume: 5400, monthly_searches: { "2025-01": 2400, "2025-02": 2900, "2025-03": 3600, "2025-04": 4400, "2025-05": 5400, "2025-06": 6600, "2025-07": 8100, "2025-08": 6600, "2025-09": 4400, "2025-10": 3600, "2025-11": 2400, "2025-12": 1900 }, competition_level: "HIGH", keyword_difficulty: 51, cpc: 0.77, trend_yearly: null },
  { keyword: "road trip van pays basque", category: "editorial", intent: "informational", search_volume: 10, monthly_searches: { "2025-01": 10, "2025-02": 10, "2025-03": 20, "2025-04": 20, "2025-05": 10, "2025-06": 20, "2025-07": 10, "2025-08": 10, "2025-09": 10, "2025-10": 10, "2025-11": 10, "2025-12": 10 }, competition_level: "LOW", keyword_difficulty: 44, cpc: 0, trend_yearly: null },
  { keyword: "van life pays basque", category: "editorial", intent: "informational", search_volume: 10, monthly_searches: { "2025-01": 10, "2025-02": 10, "2025-03": 10, "2025-04": 10, "2025-05": 10, "2025-06": 10, "2025-07": 20, "2025-08": 10, "2025-09": 10, "2025-10": 10, "2025-11": 10, "2025-12": 10 }, competition_level: "LOW", keyword_difficulty: null, cpc: 0, trend_yearly: null },
  { keyword: "location combi vw pays basque", category: "editorial", intent: "navigational", search_volume: 10, monthly_searches: { "2025-01": 10, "2025-02": 10, "2025-03": 10, "2025-04": 10, "2025-05": 10, "2025-06": 10, "2025-07": 10, "2025-08": 10, "2025-09": 10, "2025-10": 10, "2025-11": 10, "2025-12": 10 }, competition_level: "LOW", keyword_difficulty: null, cpc: 0, trend_yearly: null },
  { keyword: "camping van pays basque", category: "editorial", intent: "informational", search_volume: 10, monthly_searches: { "2025-01": 10, "2025-02": 10, "2025-03": 10, "2025-04": 20, "2025-05": 10, "2025-06": 20, "2025-07": 20, "2025-08": 30, "2025-09": 10, "2025-10": 10, "2025-11": 10, "2025-12": 10 }, competition_level: "LOW", keyword_difficulty: null, cpc: 0.26, trend_yearly: null },
  { keyword: "pays basque en van aménagé", category: "editorial", intent: "informational", search_volume: 10, monthly_searches: { "2025-01": 10, "2025-02": 10, "2025-03": 10, "2025-04": 10, "2025-05": 10, "2025-06": 10, "2025-07": 20, "2025-08": 10, "2025-09": 10, "2025-10": 10, "2025-11": 10, "2025-12": 10 }, competition_level: "LOW", keyword_difficulty: null, cpc: 0, trend_yearly: null },
];

export const CATEGORY_LABELS: Record<Category, string> = {
  "quick-win": "Quick Win",
  "main-target": "Cible principale",
  "editorial": "Éditorial",
};

export const CATEGORY_COLORS: Record<Category, string> = {
  "quick-win": "#10b981",
  "main-target": "#3b82f6",
  "editorial": "#8b5cf6",
};

export const MONTHS_FR = ["Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"];
export const MONTH_KEYS = [
  "2025-01","2025-02","2025-03","2025-04","2025-05","2025-06",
  "2025-07","2025-08","2025-09","2025-10","2025-11","2025-12",
];
