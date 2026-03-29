/**
 * pinterest/research.ts — Logique partagée de recherche Pinterest
 *
 * Utilisé par :
 *  - scripts/agents/pinterest-research-agent.ts (CLI)
 *  - src/app/api/admin/pinterest/research/route.ts (API SSE)
 */

import Groq from "groq-sdk";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import {
  fetchUserBoards,
  searchPins,
  type PinterestBoard,
  type PinterestPin,
} from "./client";

// ── Types ──────────────────────────────────────────────────────────────────────

type LogLevel = "info" | "success" | "warning" | "error";

export type LogFn = (level: LogLevel, message: string) => void;

interface BoardRecommendation {
  board_name: string;
  description: string;
  target_keywords: string[];
  content_pillars: string[];
}

interface ContentQueueItem {
  title: string;
  description: string;
  target_keyword: string;
  destination_url: string;
  source_article_slug: string;
  board_name: string;
}

interface GroqStrategyResponse {
  board_recommendations: BoardRecommendation[];
  content_queue: ContentQueueItem[];
  summary: string;
}

export interface PinterestResearchResult {
  boardsFetched: number;
  keywordsAnalyzed: number;
  boardRecommendations: number;
  contentQueueItems: number;
  summary: string;
}

// ── Keywords cibles ────────────────────────────────────────────────────────────

const TARGET_KEYWORDS = [
  "location van pays basque",
  "vanlife france",
  "van aménagé",
  "road trip pays basque",
  "camping van",
  "fourgon aménagé",
  "équipement vanlife",
];

// ── Pipeline principal ─────────────────────────────────────────────────────────

export async function runPinterestResearch(onLog: LogFn): Promise<PinterestResearchResult> {
  const supabase = createSupabaseAdmin();

  // ── Étape 1/6 : Fetch boards ─────────────────────────────────────────────
  onLog("info", "[1/6] Récupération des boards Pinterest...");

  const boards: PinterestBoard[] = await fetchUserBoards();
  onLog("info", `  → ${boards.length} boards récupérés`);

  // Upsert boards dans Supabase
  if (boards.length > 0) {
    const boardRows = boards.map((b) => ({
      pinterest_id: b.id,
      name: b.name,
      description: b.description ?? null,
      pin_count: b.pin_count ?? 0,
      follower_count: b.follower_count ?? 0,
      privacy: b.privacy ?? "public",
      fetched_at: new Date().toISOString(),
    }));

    const { error } = await supabase
      .from("pinterest_boards")
      .upsert(boardRows, { onConflict: "pinterest_id" });

    if (error) {
      onLog("warning", `  Erreur upsert boards: ${error.message}`);
    } else {
      onLog("success", `  ${boards.length} boards sauvegardés en base`);
    }
  } else {
    onLog("warning", "  Aucun board — compte Trial ou token invalide, on continue l'analyse");
  }

  // ── Étape 2/6 : Recherche keywords avec rate limit 2s ────────────────────
  onLog("info", "[2/6] Analyse des keywords vanlife sur Pinterest...");

  const keywordData: Array<{ keyword: string; pins: PinterestPin[] | null }> = [];

  for (const kw of TARGET_KEYWORDS) {
    onLog("info", `  → Recherche: "${kw}"`);
    const pins = await searchPins(kw, 25);
    keywordData.push({ keyword: kw, pins });
  }

  const analyzedCount = keywordData.filter((k) => k.pins !== null).length;
  onLog("success", `  ${analyzedCount}/${TARGET_KEYWORDS.length} keywords analysés (${TARGET_KEYWORDS.length - analyzedCount} refusés en trial)`);

  // ── Étape 3/6 : Analyse patterns ─────────────────────────────────────────
  onLog("info", "[3/6] Analyse des patterns de contenu...");

  const keywordStats = keywordData.map(({ keyword, pins }) => {
    if (!pins || pins.length === 0) {
      return { keyword, pin_count: 0, avg_repin_count: 0, competition_level: "unknown" as const };
    }

    const avgSaves = pins.reduce((sum, p) => sum + (p.save_count ?? 0), 0) / pins.length;
    const competition =
      pins.length >= 20 ? "high" : pins.length >= 10 ? "medium" : "low";

    return {
      keyword,
      pin_count: pins.length,
      avg_repin_count: Math.round(avgSaves * 10) / 10,
      competition_level: competition as "low" | "medium" | "high",
    };
  });

  onLog("info", `  Patterns analysés pour ${keywordStats.length} keywords`);

  // Upsert keyword opportunities
  const kwRows = keywordStats
    .filter((k) => k.competition_level !== "unknown")
    .map((k) => ({
      keyword: k.keyword,
      pin_count: k.pin_count,
      avg_repin_count: k.avg_repin_count,
      competition_level: k.competition_level as "low" | "medium" | "high",
      recommended_priority: k.competition_level === "low" ? 8 : k.competition_level === "medium" ? 6 : 4,
      analyzed_at: new Date().toISOString(),
    }));

  if (kwRows.length > 0) {
    await supabase
      .from("pinterest_keyword_opportunities")
      .upsert(kwRows, { onConflict: "keyword" });
  }

  // ── Étape 4/6 : Stratégie Groq ───────────────────────────────────────────
  onLog("info", "[4/6] Génération de la stratégie Pinterest via Groq...");

  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

  const contextText = keywordStats
    .map((k) => `- "${k.keyword}": ${k.pin_count} pins, compétition: ${k.competition_level}`)
    .join("\n");

  const boardsContext = boards.length > 0
    ? boards.map((b) => `- ${b.name} (${b.pin_count ?? 0} pins)`).join("\n")
    : "Aucun board existant (compte Trial)";

  const prompt = `Tu es un expert Pinterest marketing pour une marque de location de van en Pays Basque (vanzonexplorer.com).

Boards existants:
${boardsContext}

Données keyword Pinterest:
${contextText}

Génère une stratégie Pinterest complète en JSON avec exactement cette structure:
{
  "board_recommendations": [
    {
      "board_name": "nom du board",
      "description": "description courte",
      "target_keywords": ["kw1", "kw2"],
      "content_pillars": ["pilier1", "pilier2"]
    }
  ],
  "content_queue": [
    {
      "title": "titre du pin (max 100 chars)",
      "description": "description SEO du pin",
      "target_keyword": "mot-clé cible",
      "destination_url": "https://vanzonexplorer.com/...",
      "source_article_slug": "slug-article-source",
      "board_name": "nom du board cible"
    }
  ],
  "summary": "résumé de la stratégie en 2-3 phrases"
}

Crée 3-5 boards recommendations et 10-15 pins dans la content_queue.
Les destination_url doivent pointer vers vanzonexplorer.com avec des paths réalistes (/location, /blog/..., /pays-basque, /club, etc).
Réponds UNIQUEMENT avec le JSON, sans texte autour.`;

  let strategy: GroqStrategyResponse = {
    board_recommendations: [],
    content_queue: [],
    summary: "Stratégie générée",
  };

  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.4,
      max_tokens: 4000,
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      strategy = JSON.parse(jsonMatch[0]) as GroqStrategyResponse;
    }
    onLog("success", `  Groq: ${strategy.board_recommendations.length} boards + ${strategy.content_queue.length} pins générés`);
  } catch (err) {
    onLog("error", `  Erreur Groq: ${err instanceof Error ? err.message : String(err)}`);
  }

  // ── Étape 5/6 : Insertion en base ────────────────────────────────────────
  onLog("info", "[5/6] Sauvegarde des résultats en base...");

  let boardRecsInserted = 0;
  let queueInserted = 0;

  if (strategy.board_recommendations.length > 0) {
    const { error, count } = await supabase
      .from("pinterest_board_recommendations")
      .insert(
        strategy.board_recommendations.map((r) => ({
          board_name: r.board_name,
          description: r.description,
          target_keywords: r.target_keywords,
          content_pillars: r.content_pillars,
          status: "suggested",
        }))
      );
    if (error) {
      onLog("warning", `  Erreur board_recommendations: ${error.message}`);
    } else {
      boardRecsInserted = count ?? strategy.board_recommendations.length;
    }
  }

  if (strategy.content_queue.length > 0) {
    const { error, count } = await supabase
      .from("pinterest_content_queue")
      .insert(
        strategy.content_queue.map((q) => ({
          title: q.title,
          description: q.description,
          target_keyword: q.target_keyword,
          destination_url: q.destination_url,
          source_article_slug: q.source_article_slug,
          board_name: q.board_name,
          status: "draft",
        }))
      );
    if (error) {
      onLog("warning", `  Erreur content_queue: ${error.message}`);
    } else {
      queueInserted = count ?? strategy.content_queue.length;
    }
  }

  onLog("success", `  ${boardRecsInserted} recommandations + ${queueInserted} pins insérés`);

  // ── Étape 6/6 : Summary ───────────────────────────────────────────────────
  onLog("info", "[6/6] Recherche terminée.");
  onLog("success", strategy.summary);

  return {
    boardsFetched: boards.length,
    keywordsAnalyzed: analyzedCount,
    boardRecommendations: boardRecsInserted,
    contentQueueItems: queueInserted,
    summary: strategy.summary,
  };
}
