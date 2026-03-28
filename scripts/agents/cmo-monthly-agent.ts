#!/usr/bin/env tsx
/**
 * cmo-monthly-agent.ts — Audit mensuel CMO 360°
 * Usage: npx tsx scripts/agents/cmo-monthly-agent.ts
 * Déclenché par GitHub Actions le 1er de chaque mois à 7h UTC
 */

import Groq from "groq-sdk";
import { notifyTelegram } from "../lib/telegram";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://vanzonexplorer.com";
const API_URL = `${SITE_URL}/api/admin/cmo/run`;

function getCurrentSeason(): "haute" | "moyenne" | "basse" {
  const now = new Date();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  const mmdd = month * 100 + day;
  if (mmdd >= 415 && mmdd <= 915) return "haute";
  if ((mmdd >= 301 && mmdd < 415) || (mmdd > 915 && mmdd <= 1031)) return "moyenne";
  return "basse";
}

function getMonthLabel(): string {
  return new Date().toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
}

const MONTHLY_PROMPT = (season: string) =>
  `Tu es le Directeur Marketing 360° de Vanzon Explorer (location/vente vans aménagés, Pays Basque). Saison actuelle : ${season}. Génère l'audit marketing mensuel complet. Produis un JSON strict sans markdown : { "health_score": 74, "health_breakdown": { "acquisition": 70, "content": 65, "retention": 80, "reputation": 75, "intelligence": 72 }, "aarrr": { "acquisition": "...", "activation": "...", "retention": "...", "referral": "...", "revenue": "..." }, "actions": [{ "title": "...", "channel": "acquisition|content|retention|reputation|intelligence", "ice_score": 72, "effort": "low|medium|high", "rationale": "..." }], "alerts": [], "summary": "..." }. 10-15 actions. health_score = acquisition×0.25 + content×0.20 + retention×0.20 + reputation×0.20 + intelligence×0.15. JSON valide, pas de texte autour.`;

type ActionItem = {
  title: string;
  channel: string;
  ice_score: number;
  effort: "low" | "medium" | "high";
  rationale?: string;
};

type MonthlyReport = {
  health_score?: number;
  actions?: ActionItem[];
  error?: string;
  [key: string]: unknown;
};

async function main() {
  const monthLabel = getMonthLabel();
  console.log(`[CMO Monthly] Démarrage — ${monthLabel}`);

  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  let reportContent: MonthlyReport;
  let healthScore: number | undefined;

  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: MONTHLY_PROMPT(getCurrentSeason()) }],
      max_tokens: 3000,
      temperature: 0.3,
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    reportContent = JSON.parse(raw) as MonthlyReport;
    healthScore = typeof reportContent.health_score === "number" ? reportContent.health_score : undefined;
    console.log(`[CMO Monthly] Health Score : ${healthScore ?? "N/A"}/100`);
    console.log(`[CMO Monthly] Actions générées : ${reportContent.actions?.length ?? 0}`);
  } catch (err) {
    console.error("[CMO Monthly] Erreur génération :", err);
    reportContent = { error: "Génération échouée" };
  }

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "monthly",
        period_label: monthLabel,
        content: reportContent,
        health_score: healthScore,
        actions: reportContent.actions ?? [],
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("[CMO Monthly] Erreur stockage :", text);
      process.exit(1);
    }

    const { id } = (await res.json()) as { id: string };
    console.log(`[CMO Monthly] Rapport stocké — ID : ${id}`);
  } catch (err) {
    console.error("[CMO Monthly] Erreur fetch API :", err);
    process.exit(1);
  }
}

main()
  .then(() => notifyTelegram("📊 *CMO Monthly* — Audit mensuel complet généré. Visible sur /admin/marketing."))
  .catch(async (err) => {
    await notifyTelegram(\`❌ *CMO Monthly* — Erreur : \${(err as Error).message}\`);
    process.exit(1);
  });
