#!/usr/bin/env tsx
/**
 * cmo-weekly-agent.ts — Rapport hebdomadaire CMO autonome
 * Usage: npx tsx scripts/agents/cmo-weekly-agent.ts
 * Déclenché par GitHub Actions chaque lundi à 7h UTC
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

function getWeekLabel(): string {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const week = Math.ceil(
    ((now.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7
  );
  return `Semaine ${week} — ${now.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}`;
}

const WEEKLY_PROMPT = (season: string) =>
  `Tu es le Directeur Marketing 360° de Vanzon Explorer (location/vente vans aménagés, Pays Basque). Saison actuelle : ${season}. Génère le rapport marketing hebdomadaire. Produis un JSON strict sans markdown : { "summary": "...", "top_actions": [{ "title": "...", "channel": "acquisition|content|retention|reputation|intelligence", "ice_score": 72, "effort": "low|medium|high", "rationale": "..." }] }. Exactement 3 actions. JSON valide, pas de texte autour.`;

type ActionItem = {
  title: string;
  channel: string;
  ice_score: number;
  effort: "low" | "medium" | "high";
  rationale?: string;
};

type WeeklyReport = {
  summary?: string;
  top_actions?: ActionItem[];
  error?: string;
};

async function main() {
  const weekLabel = getWeekLabel();
  console.log(`[CMO Weekly] Démarrage — ${weekLabel}`);

  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  let reportContent: WeeklyReport;

  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: WEEKLY_PROMPT(getCurrentSeason()) }],
      max_tokens: 1024,
      temperature: 0.3,
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    reportContent = JSON.parse(raw) as WeeklyReport;
    console.log("[CMO Weekly] Rapport généré :", JSON.stringify(reportContent, null, 2));
  } catch (err) {
    console.error("[CMO Weekly] Erreur génération :", err);
    reportContent = { error: "Génération échouée", summary: "Rapport indisponible cette semaine." };
  }

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "weekly",
        period_label: weekLabel,
        content: reportContent,
        actions: reportContent.top_actions ?? [],
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("[CMO Weekly] Erreur stockage Supabase :", text);
      process.exit(1);
    }

    const { id } = (await res.json()) as { id: string };
    console.log(`[CMO Weekly] Rapport stocké — ID : ${id}`);
  } catch (err) {
    console.error("[CMO Weekly] Erreur fetch API :", err);
    process.exit(1);
  }
}

main()
  .then(() => notifyTelegram("📈 *CMO Weekly* — Rapport hebdomadaire généré. Visible sur /admin/marketing."))
  .catch(async (err) => {
    await notifyTelegram(\`❌ *CMO Weekly* — Erreur : \${(err as Error).message}\`);
    process.exit(1);
  });
