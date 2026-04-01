/**
 * title-optimizer-agent.ts
 *
 * Agent autonome d'optimisation des titres SEO.
 * - Lit les articles `pending` de `article_queue`
 * - Récupère les données keyword depuis `vba_keywords`
 * - Score chaque titre selon 8 critères SEO via Groq (batches de 8)
 * - Réécrit automatiquement les titres avec score < 8
 * - Met à jour `article_queue` (title + seo_score)
 * - Notifie via Telegram et enregistre un agent_run
 *
 * Usage :
 *   npx tsx scripts/agents/title-optimizer-agent.ts
 */

import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import Groq from "groq-sdk";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { notifyTelegram } from "./lib/telegram";
import { startRun, finishRun } from "../lib/agent-runs";

// ── Types ──────────────────────────────────────────────────────────────────────

interface ArticleQueueRow {
  id: string;
  title: string;
  target_keyword: string;
  category: string;
  status: string;
}

interface VbaKeywordRow {
  keyword: string;
  search_volume: number;
  keyword_difficulty: number;
  opportunity_score: number;
}

interface ArticleWithKeyword {
  id: string;
  title: string;
  target_keyword: string;
  category: string;
  search_volume: number;
  keyword_difficulty: number;
  opportunity_score: number;
}

interface ScoringResult {
  id: string;
  score: number;
  rewrittenTitle?: string;
}

// ── Scoring prompt ─────────────────────────────────────────────────────────────

function buildScoringPrompt(articles: ArticleWithKeyword[]): string {
  const articleList = articles.map((a, idx) =>
    `${idx + 1}. ID: "${a.id}"
   Titre actuel: "${a.title}"
   Mot-clé cible: "${a.target_keyword}"
   Catégorie: "${a.category}"
   Volume: ${a.search_volume} | KD: ${Math.round(a.keyword_difficulty)} | Opportunité: ${a.opportunity_score}`
  ).join("\n\n");

  return `Tu es un expert SEO spécialisé dans la création de titres d'articles optimisés pour Vanzon Explorer (formation van aménagé, business, achat-revente, location van — audience francophone).

CRITÈRES DE SCORING (total 10pts) :
1. Mot-clé cible intégré naturellement dans le titre (0-2pts)
2. Longueur 50-70 caractères (0-2pts : 2=idéal, 1=acceptable 45-75, 0=hors plage)
3. Power words présents : guide complet, méthode, chiffres réels, étape par étape, erreurs à éviter, rentable, 2025, comparatif, comment, pourquoi (0-1pt)
4. Bénéfice ou promesse explicite dans le titre (0-1pt)
5. Cohérence positionnement Vanzon : business van, formation, location, Pays Basque (0-1pt)
6. Pas de title case anglais, français naturel (0-1pt)
7. Adapté à la compétitivité : si KD<30 → longue traîne spécifique ✓ ; si KD>60 → angle ultra-précis et différencié ✓ (0-1pt)
8. Pas de nom de concurrent direct dans le titre SAUF si article comparatif (0-1pt)

Pour chaque article :
- Donne un score (entier 1-10)
- Si score < 8, réécris le titre pour atteindre 9/10 minimum (sinon laisse rewrittenTitle à null)

IMPORTANT : Réponds UNIQUEMENT avec un tableau JSON valide. Format strict :
[
  { "id": "...", "score": 8, "rewrittenTitle": null },
  { "id": "...", "score": 6, "rewrittenTitle": "Nouveau titre optimisé" }
]

Articles à analyser :
${articleList}`;
}

// ── Main ───────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🎯 Title Optimizer Agent — démarrage");
  console.log("═".repeat(50));

  const runId = await startRun("title-optimizer");

  const supabase = createSupabaseAdmin();
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

  // 1. Lire les articles pending
  console.log("📋 Lecture des articles en attente...");
  const { data: pendingArticles, error: articlesError } = await supabase
    .from("article_queue")
    .select("id, title, target_keyword, category, status")
    .eq("status", "pending")
    .order("priority", { ascending: true });

  if (articlesError || !pendingArticles || pendingArticles.length === 0) {
    const msg = articlesError?.message ?? "Aucun article pending trouvé";
    console.error(`❌ ${msg}`);
    await finishRun(runId, { status: "error", error: msg, itemsProcessed: 0, itemsCreated: 0 });
    return;
  }

  console.log(`✅ ${pendingArticles.length} articles pending chargés`);

  // 2. Récupérer les données keywords depuis vba_keywords
  console.log("🔍 Chargement des données keyword VBA...");
  const keywords = (pendingArticles as ArticleQueueRow[]).map(a => a.target_keyword.toLowerCase());

  const { data: vbaKeywords } = await supabase
    .from("vba_keywords")
    .select("keyword, search_volume, keyword_difficulty, opportunity_score")
    .in("keyword", keywords);

  const kwMap = new Map<string, VbaKeywordRow>();
  for (const kw of (vbaKeywords ?? []) as VbaKeywordRow[]) {
    kwMap.set(kw.keyword.toLowerCase(), kw);
  }

  console.log(`✅ ${kwMap.size} keywords matchés sur ${pendingArticles.length} articles`);

  // 3. Enrichir les articles avec les données keyword
  const enrichedArticles: ArticleWithKeyword[] = (pendingArticles as ArticleQueueRow[]).map(a => {
    const kw = kwMap.get(a.target_keyword.toLowerCase());
    return {
      id: a.id,
      title: a.title,
      target_keyword: a.target_keyword,
      category: a.category,
      search_volume: kw?.search_volume ?? 0,
      keyword_difficulty: kw?.keyword_difficulty ?? 50,
      opportunity_score: kw?.opportunity_score ?? 0,
    };
  });

  // 4. Traitement en batches de 8
  const BATCH_SIZE = 8;
  const allResults: ScoringResult[] = [];
  const totalBatches = Math.ceil(enrichedArticles.length / BATCH_SIZE);

  console.log(`\n🔄 Scoring en ${totalBatches} batch(es) de ${BATCH_SIZE} articles...\n`);

  for (let i = 0; i < enrichedArticles.length; i += BATCH_SIZE) {
    const batch = enrichedArticles.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;

    console.log(`  Batch ${batchNum}/${totalBatches} — ${batch.length} articles...`);

    try {
      const groqRes = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [{
          role: "user",
          content: buildScoringPrompt(batch),
        }],
        temperature: 0.3,
        max_tokens: 2000,
      });

      const rawContent = groqRes.choices[0]?.message?.content ?? "[]";
      let batchResults: ScoringResult[] = [];

      try {
        const jsonMatch = rawContent.match(/\[[\s\S]*\]/);
        batchResults = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(rawContent);
      } catch {
        console.warn(`  ⚠️  Erreur parsing batch ${batchNum}: ${rawContent.substring(0, 200)}`);
        continue;
      }

      allResults.push(...batchResults);

      const rewritten = batchResults.filter(r => r.rewrittenTitle).length;
      const avgScore = batchResults.reduce((s, r) => s + r.score, 0) / batchResults.length;
      console.log(`  ✅ Batch ${batchNum} — score moyen: ${avgScore.toFixed(1)}/10, réécrits: ${rewritten}`);

    } catch (err) {
      console.error(`  ❌ Erreur Groq batch ${batchNum}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  // 5. Mettre à jour article_queue
  console.log(`\n💾 Mise à jour de ${allResults.length} articles dans Supabase...`);

  let updated = 0;
  let rewritten = 0;
  const errors: string[] = [];

  for (const result of allResults) {
    const updateData: { seo_score: number; title?: string } = {
      seo_score: result.score,
    };

    if (result.rewrittenTitle && result.score < 8) {
      updateData.title = result.rewrittenTitle;
      rewritten++;
    }

    const { error: updateError } = await supabase
      .from("article_queue")
      .update(updateData)
      .eq("id", result.id);

    if (updateError) {
      errors.push(`${result.id}: ${updateError.message}`);
    } else {
      updated++;
    }
  }

  // 6. Récap console
  const scored8Plus = allResults.filter(r => r.score >= 8).length;
  const avgScoreAll = allResults.length > 0
    ? (allResults.reduce((s, r) => s + r.score, 0) / allResults.length).toFixed(1)
    : "N/A";

  console.log("\n" + "═".repeat(50));
  console.log("📊 RÉCAPITULATIF");
  console.log("═".repeat(50));
  console.log(`📋 Articles analysés    : ${allResults.length}`);
  console.log(`✅ Mis à jour           : ${updated}`);
  console.log(`✏️  Titres réécrits      : ${rewritten}`);
  console.log(`⭐ Score ≥ 8            : ${scored8Plus}/${allResults.length}`);
  console.log(`📈 Score moyen          : ${avgScoreAll}/10`);
  if (errors.length > 0) {
    console.log(`❌ Erreurs             : ${errors.length}`);
  }
  console.log("═".repeat(50));

  // 7. Notification Telegram
  const telegramMsg = `🎯 <b>Title Optimizer Agent</b>

📋 Articles scorés : <b>${allResults.length}</b>
✏️ Titres réécrits : <b>${rewritten}</b>
⭐ Score ≥ 8 : <b>${scored8Plus}/${allResults.length}</b>
📈 Score moyen : <b>${avgScoreAll}/10</b>

${errors.length > 0 ? `⚠️ ${errors.length} erreur(s) de mise à jour` : "✅ Toutes les mises à jour réussies"}`;

  await notifyTelegram(telegramMsg);

  // 8. Enregistrer le run
  await finishRun(runId, {
    status: errors.length === allResults.length ? "error" : "success",
    itemsProcessed: allResults.length,
    itemsCreated: rewritten,
    error: errors.length > 0 ? errors.slice(0, 3).join("; ") : undefined,
    metadata: {
      scored: allResults.length,
      rewritten,
      scored8Plus,
      avgScore: avgScoreAll,
    },
  });

  console.log("\n✅ Agent Title Optimizer terminé.");
}

main().catch((err) => {
  console.error("💥 Erreur fatale:", err);
  process.exit(1);
});
