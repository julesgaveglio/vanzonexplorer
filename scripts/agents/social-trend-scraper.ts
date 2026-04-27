/**
 * Social Trend Scraper — analyse les tendances vanlife et génère des idées de Reels
 * Exécution : 1x/semaine (cron) ou manuellement
 * npx tsx scripts/agents/social-trend-scraper.ts
 */

import fs from "fs";
import path from "path";

require("dotenv").config({ path: ".env.local" });

const GROQ_KEY = process.env.GROQ_API_KEY!;
const IDEAS_PATH = path.join(process.cwd(), "Vanzon Memory Database/🌐 PUBLIC/social/📋 Reel Ideas Bank.md");
const TRENDS_PATH = path.join(process.cwd(), "Vanzon Memory Database/🌐 PUBLIC/social/📊 Trends — Dernière analyse.md");

async function groqChat(messages: { role: string; content: string }[]): Promise<string> {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${GROQ_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages,
      temperature: 0.8,
      max_tokens: 2000,
    }),
  });
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

function getExistingIdeas(): string[] {
  if (!fs.existsSync(IDEAS_PATH)) return [];
  const content = fs.readFileSync(IDEAS_PATH, "utf-8");
  const lines = content.split("\n").filter((l) => l.startsWith("|") && !l.includes("Statut") && !l.includes("---"));
  return lines.map((l) => {
    const cols = l.split("|").map((c) => c.trim());
    return cols[3] ?? ""; // Concept column
  }).filter(Boolean);
}

function getNextId(): number {
  if (!fs.existsSync(IDEAS_PATH)) return 1;
  const content = fs.readFileSync(IDEAS_PATH, "utf-8");
  const matches = content.match(/\| (\d+) \|/g);
  if (!matches) return 1;
  const ids = matches.map((m) => parseInt(m.replace(/\|/g, "").trim()));
  return Math.max(...ids) + 1;
}

async function generateIdeas(): Promise<void> {
  console.log("🔍 Analyse des tendances vanlife...\n");

  const existingIdeas = getExistingIdeas();
  const existingList = existingIdeas.length > 0
    ? `\n\nIDÉES DÉJÀ EXISTANTES (ne pas dupliquer) :\n${existingIdeas.map((i, idx) => `${idx + 1}. ${i}`).join("\n")}`
    : "";

  const response = await groqChat([
    {
      role: "system",
      content: `Tu es un expert en contenu Instagram pour une marque de location de vans aménagés au Pays Basque (Vanzon Explorer). Tu connais parfaitement les tendances Reels 2026.

CONTEXTE VANZON :
- Location de vans aménagés (Yoni = vert, Xalbat = blanc)
- Basé à Cambo-les-Bains, Pays Basque
- Cible : communauté vanlife au sens large (pas que les clients)
- Ton : authentique, passionné, jamais commercial
- Les Reels doivent être reproductibles avec des clips vidéo d'intérieur/extérieur de van et des photos de spots nature

TENDANCES REELS 2026 :
- Cuts synchronisés sur les beats
- Slow reveal / zoom progressif
- Text overlay minimaliste (3-5 mots bold)
- Durée idéale : 15-25 secondes
- Les Reels ambiance/mood surperforment les Reels informatifs
- Les saves et partages DM comptent plus que les likes`,
    },
    {
      role: "user",
      content: `Génère exactement 10 nouvelles idées de Reels Instagram pour Vanzon Explorer.

Pour chaque idée, donne :
- concept : description courte (max 15 mots)
- style : type de montage (ex: "slow reveal", "cuts rapides", "timelapse")
- mood_musique : une des catégories (chill, upbeat, cinematic, adventure, nature)
- difficulte : easy, medium, hard (basé sur ce qu'il faut filmer)

Priorise les idées FACILES à reproduire avec des clips d'intérieur de van, d'aménagement, et de paysages.
${existingList}

Réponds UNIQUEMENT en JSON valide :
{
  "ideas": [
    { "concept": "...", "style": "...", "mood": "...", "difficulty": "easy" }
  ],
  "trend_insights": "2-3 phrases sur les tendances du moment"
}`,
    },
  ]);

  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    console.error("❌ Groq n'a pas renvoyé de JSON valide");
    console.log(response);
    return;
  }

  const data = JSON.parse(jsonMatch[0]);
  const ideas = data.ideas ?? [];
  const insights = data.trend_insights ?? "";

  console.log(`✅ ${ideas.length} nouvelles idées générées\n`);
  ideas.forEach((idea: { concept: string; style: string; mood: string; difficulty: string }, i: number) => {
    console.log(`  ${i + 1}. [${idea.mood}] ${idea.concept} (${idea.difficulty})`);
  });

  // Append to Ideas Bank
  let nextId = getNextId();
  const today = new Date().toISOString().slice(0, 10);
  const newRows = ideas.map((idea: { concept: string; style: string; mood: string; difficulty: string }) => {
    const row = `| ${nextId++} | 💡 | ${idea.concept} | ${idea.style} | ${idea.mood} | ${today} |`;
    return row;
  });

  if (fs.existsSync(IDEAS_PATH)) {
    const content = fs.readFileSync(IDEAS_PATH, "utf-8");
    const updated = content.trimEnd() + "\n" + newRows.join("\n") + "\n";
    fs.writeFileSync(IDEAS_PATH, updated);
  }

  console.log(`\n📝 ${ideas.length} idées ajoutées à la banque`);

  // Update trends file
  if (insights) {
    const trendsContent = fs.readFileSync(TRENDS_PATH, "utf-8");
    const updatedTrends = trendsContent.replace(
      /## Dernière analyse : .*/,
      `## Dernière analyse : ${today}\n\n### Insights IA\n${insights}`
    );
    fs.writeFileSync(TRENDS_PATH, updatedTrends);
    console.log(`📊 Trends mis à jour`);
  }
}

generateIdeas().catch((e) => {
  console.error("❌", e.message);
  process.exit(1);
});
