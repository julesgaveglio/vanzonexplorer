#!/usr/bin/env tsx
/**
 * pinterest-research-agent.ts
 *
 * Agent CLI — Analyse Pinterest pour Vanzon Explorer.
 * Fetch les boards, analyse les keywords vanlife, génère stratégie via Groq.
 *
 * Usage:
 *   npx tsx scripts/agents/pinterest-research-agent.ts
 *
 * Variables d'environnement requises:
 *   PINTEREST_ACCESS_TOKEN
 *   GROQ_API_KEY
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { notifyTelegram } from "../lib/telegram";
import { runPinterestResearch, type LogFn } from "../../src/lib/pinterest/research";

// ── Validation env vars ────────────────────────────────────────────────────────

const REQUIRED_ENV = [
  "PINTEREST_ACCESS_TOKEN",
  "GROQ_API_KEY",
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
];

for (const key of REQUIRED_ENV) {
  if (!process.env[key]) {
    console.error(`[Pinterest Research] Env var manquante: ${key}`);
    process.exit(1);
  }
}

// ── Logger CLI ─────────────────────────────────────────────────────────────────

const logFn: LogFn = (level, message) => {
  const prefix = {
    info: "ℹ️ ",
    success: "✅",
    warning: "⚠️ ",
    error: "❌",
  }[level];
  console.log(`${prefix} ${message}`);
};

// ── Main ───────────────────────────────────────────────────────────────────────

async function main() {
  console.log("📌 Agent Pinterest Research — Vanzon Explorer");
  console.log("─".repeat(50));

  const result = await runPinterestResearch(logFn);

  console.log("─".repeat(50));
  console.log("📊 Résumé:");
  console.log(`  Boards récupérés:        ${result.boardsFetched}`);
  console.log(`  Keywords analysés:       ${result.keywordsAnalyzed}`);
  console.log(`  Board recommendations:   ${result.boardRecommendations}`);
  console.log(`  Content queue items:     ${result.contentQueueItems}`);

  await notifyTelegram(
    `📌 <b>Agent Pinterest Research terminé</b>\n\n` +
    `• Boards récupérés: ${result.boardsFetched}\n` +
    `• Keywords analysés: ${result.keywordsAnalyzed}\n` +
    `• Recommandations boards: ${result.boardRecommendations}\n` +
    `• Pins en queue: ${result.contentQueueItems}\n\n` +
    `<i>${result.summary}</i>`
  );
}

main().catch((err) => {
  console.error("❌ Erreur fatale:", err instanceof Error ? err.message : String(err));
  process.exit(1);
});
