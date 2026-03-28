#!/usr/bin/env tsx
/**
 * keyword-research-quarterly.ts
 *
 * Agent trimestriel de recherche de mots-clés.
 * Analyse les 4 segments Vanzon et sauvegarde les résultats dans
 * scripts/data/keywords-research.json
 *
 * Usage:
 *   npx tsx scripts/agents/keyword-research-quarterly.ts
 *   npx tsx scripts/agents/keyword-research-quarterly.ts location   # segment unique
 *
 * Segments:
 *   location   — louer un van au Pays Basque
 *   achat      — acheter un van aménagé
 *   club       — deals équipement vanlife
 *   formation  — créer une activité de location de van
 *
 * Required env vars:
 *   DATAFORSEO_LOGIN
 *   DATAFORSEO_PASSWORD
 */

import path from "path";
import fs from "fs/promises";
import fsSync from "fs";
import { notifyTelegram } from "../lib/telegram";

const PROJECT_ROOT = path.resolve(path.dirname(__filename), "../..");
const OUTPUT_FILE = path.join(PROJECT_ROOT, "scripts/data/keywords-research.json");
const PROMPTS_DIR = path.join(PROJECT_ROOT, "scripts/agents/prompts");
const DFS_BASE = "https://api.dataforseo.com/v3";
const DFS_LOCATION_CODE = 2250; // France
const DFS_LANGUAGE_CODE = "fr";

// ── Segments stratégiques (overridable via scripts/agents/prompts/keyword-research-quarterly.json) ─

function loadSegments() {
  const jsonPath = path.join(PROMPTS_DIR, "keyword-research-quarterly.json");
  if (fsSync.existsSync(jsonPath)) {
    try {
      return JSON.parse(fsSync.readFileSync(jsonPath, "utf-8")) as Record<string, { label: string; seeds: string[] }>;
    } catch { /* fall through to defaults */ }
  }
  return null;
}

const DEFAULT_SEGMENTS: Record<string, { label: string; seeds: string[] }> = {
  location: {
    label: "Location de van",
    seeds: [
      "louer van pays basque",
      "location van aménagé",
      "location campervan biarritz",
      "louer fourgon aménagé france",
      "van location été pays basque",
      "location van surf atlantique",
    ],
  },
  achat: {
    label: "Achat de van",
    seeds: [
      "acheter van aménagé occasion",
      "prix van aménagé 2025",
      "quel fourgon choisir vanlife",
      "van clé en main france",
      "fourgon aménagé pas cher",
    ],
  },
  club: {
    label: "Club Privé — Équipement",
    seeds: [
      "batterie lithium van",
      "panneau solaire camping-car",
      "frigo 12v van",
      "kit solaire van complet",
      "réduction équipement van",
      "bon plan vanlife",
    ],
  },
  formation: {
    label: "Formation — Business Van",
    seeds: [
      "mettre van en location yescapa",
      "revenus location van",
      "créer activité location van",
      "formation vanlife revenus",
      "rentabiliser van location",
    ],
  },
};

const SEGMENTS = loadSegments() ?? DEFAULT_SEGMENTS;

// ── Types ─────────────────────────────────────────────────────────────────────

interface KeywordResult {
  keyword: string;
  searchVolume: number;
  competitionLevel: string;
  cpc: number;
  score: number; // volume × difficulty factor
}

interface SegmentReport {
  segment: string;
  label: string;
  generatedAt: string;
  keywords: KeywordResult[];
  topOpportunities: KeywordResult[]; // top 10 by score
}

interface ResearchReport {
  generatedAt: string;
  quarter: string;
  segments: SegmentReport[];
}

// ── DataForSEO helpers ────────────────────────────────────────────────────────

function getDfsAuthHeader(): string {
  const login = process.env.DATAFORSEO_LOGIN;
  const password = process.env.DATAFORSEO_PASSWORD;
  if (!login || !password) throw new Error("DATAFORSEO_LOGIN / DATAFORSEO_PASSWORD manquants");
  return "Basic " + Buffer.from(`${login}:${password}`).toString("base64");
}

async function fetchKeywordIdeas(seeds: string[]): Promise<KeywordResult[]> {
  const res = await fetch(`${DFS_BASE}/dataforseo_labs/google/keyword_ideas/live`, {
    method: "POST",
    headers: {
      Authorization: getDfsAuthHeader(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify([
      {
        keywords: seeds,
        language_code: DFS_LANGUAGE_CODE,
        location_code: DFS_LOCATION_CODE,
        include_serp_info: false,
        limit: 200,
      },
    ]),
  });

  if (!res.ok) throw new Error(`DataForSEO HTTP ${res.status}: ${await res.text()}`);
  const json = await res.json();
  if (json.status_code !== 20000) throw new Error(`DataForSEO: ${json.status_message}`);

  const items = json.tasks?.[0]?.result?.[0]?.items ?? [];

  const COMPETITION_FACTOR: Record<string, number> = { LOW: 1.5, MEDIUM: 1.0, HIGH: 0.5, TOP: 0.3 };

  return (items as Array<{
    keyword: string;
    keyword_info?: { search_volume?: number; competition_level?: string; cpc?: number };
  }>)
    .filter((item) => (item.keyword_info?.search_volume ?? 0) >= 50)
    .map((item) => {
      const vol = item.keyword_info?.search_volume ?? 0;
      const comp = item.keyword_info?.competition_level ?? "MEDIUM";
      const factor = COMPETITION_FACTOR[comp] ?? 1;
      return {
        keyword: item.keyword,
        searchVolume: vol,
        competitionLevel: comp,
        cpc: item.keyword_info?.cpc ?? 0,
        score: Math.round(vol * factor),
      };
    })
    .sort((a, b) => b.score - a.score);
}

// ── Quarter helper ────────────────────────────────────────────────────────────

function getCurrentQuarter(): string {
  const now = new Date();
  const q = Math.ceil((now.getMonth() + 1) / 3);
  return `Q${q}-${now.getFullYear()}`;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const segmentArg = process.argv[2]?.toLowerCase();
  const segmentsToRun = segmentArg ? [segmentArg] : Object.keys(SEGMENTS);

  console.log("🔍 Agent Recherche de Mots-Clés — " + getCurrentQuarter());
  console.log(`Segments : ${segmentsToRun.join(", ")}\n`);

  // Load existing report to merge/update
  let existingReport: ResearchReport | null = null;
  try {
    const raw = await fs.readFile(OUTPUT_FILE, "utf-8");
    existingReport = JSON.parse(raw) as ResearchReport;
  } catch {
    // first run
  }

  const segmentReports: SegmentReport[] = existingReport?.segments ?? [];

  for (const segmentKey of segmentsToRun) {
    const segment = SEGMENTS[segmentKey];
    if (!segment) {
      console.warn(`⚠️  Segment inconnu : ${segmentKey}`);
      continue;
    }

    console.log(`\n▶ ${segment.label}`);
    console.log(`  Seeds : ${segment.seeds.join(", ")}`);

    try {
      const keywords = await fetchKeywordIdeas(segment.seeds);
      console.log(`  ✓ ${keywords.length} mots-clés trouvés`);

      const report: SegmentReport = {
        segment: segmentKey,
        label: segment.label,
        generatedAt: new Date().toISOString(),
        keywords,
        topOpportunities: keywords.slice(0, 10),
      };

      // Replace or add segment
      const idx = segmentReports.findIndex((s) => s.segment === segmentKey);
      if (idx >= 0) segmentReports[idx] = report;
      else segmentReports.push(report);

      console.log(`  Top 5 opportunités :`);
      report.topOpportunities.slice(0, 5).forEach((k) => {
        console.log(`    "${k.keyword}" — ${k.searchVolume} rech/mois (${k.competitionLevel}) score:${k.score}`);
      });
    } catch (err) {
      console.error(`  ✗ Erreur segment ${segmentKey} : ${(err as Error).message}`);
    }
  }

  const report: ResearchReport = {
    generatedAt: new Date().toISOString(),
    quarter: getCurrentQuarter(),
    segments: segmentReports,
  };

  await fs.writeFile(OUTPUT_FILE, JSON.stringify(report, null, 2), "utf-8");
  console.log(`\n✅ Rapport sauvegardé → scripts/data/keywords-research.json`);
  console.log(`   ${segmentReports.reduce((sum, s) => sum + s.keywords.length, 0)} mots-clés au total`);
}

main()
  .then(() => notifyTelegram("🔍 *Keywords* — Analyse trimestrielle terminée. Résultats dans /admin/seo."))
  .catch(async (err) => {
    await notifyTelegram(`❌ *Keywords* — Erreur : ${(err as Error).message}`);
    console.error("❌ Fatal:", (err as Error).message);
    process.exit(1);
  });
