import Groq from "groq-sdk";
import { createSupabaseAdmin } from "@/lib/supabase/server";

function sseEvent(data: Record<string, unknown>): string {
  return `data: ${JSON.stringify(data)}\n\n`;
}

interface ArticleQueueRow {
  id: string;
  title: string;
  target_keyword: string;
  category: string;
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
  rewrittenTitle?: string | null;
}

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

export async function POST() {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(sseEvent(data)));
      };

      try {
        const supabase = createSupabaseAdmin();

        // 1. Charger les articles pending
        send({ type: "log", level: "info", message: "Chargement des articles en attente..." });

        const { data: pendingArticles, error: articlesError } = await supabase
          .from("article_queue")
          .select("id, title, target_keyword, category")
          .eq("status", "pending")
          .order("priority", { ascending: true });

        if (articlesError || !pendingArticles || pendingArticles.length === 0) {
          send({ type: "log", level: "error", message: articlesError?.message ?? "Aucun article pending trouvé" });
          send({ type: "done", scored: 0, rewritten: 0 });
          controller.close();
          return;
        }

        send({ type: "log", level: "info", message: `${pendingArticles.length} articles chargés` });

        // 2. Charger les données keyword VBA
        send({ type: "log", level: "info", message: "Chargement des données keyword VBA..." });

        const kwTargets = (pendingArticles as ArticleQueueRow[]).map(a => a.target_keyword.toLowerCase());

        const { data: vbaKeywords } = await supabase
          .from("vba_keywords")
          .select("keyword, search_volume, keyword_difficulty, opportunity_score")
          .in("keyword", kwTargets);

        const kwMap = new Map<string, VbaKeywordRow>();
        for (const kw of (vbaKeywords ?? []) as VbaKeywordRow[]) {
          kwMap.set(kw.keyword.toLowerCase(), kw);
        }

        send({ type: "log", level: "info", message: `${kwMap.size} keywords matchés` });

        // 3. Enrichir les articles
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

        // 4. Scoring en batches de 8
        const BATCH_SIZE = 8;
        const allResults: ScoringResult[] = [];
        const totalBatches = Math.ceil(enrichedArticles.length / BATCH_SIZE);
        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

        for (let i = 0; i < enrichedArticles.length; i += BATCH_SIZE) {
          const batch = enrichedArticles.slice(i, i + BATCH_SIZE);
          const batchNum = Math.floor(i / BATCH_SIZE) + 1;

          send({ type: "log", level: "info", message: `Scoring batch ${batchNum}/${totalBatches} (${batch.length} articles)...` });

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
              send({ type: "log", level: "error", message: `Erreur parsing batch ${batchNum}: ${rawContent.substring(0, 200)}` });
              continue;
            }

            allResults.push(...batchResults);

            const rewrittenInBatch = batchResults.filter(r => r.rewrittenTitle).length;
            const avgScore = batchResults.length > 0
              ? (batchResults.reduce((s, r) => s + r.score, 0) / batchResults.length).toFixed(1)
              : "0";

            send({
              type: "log",
              level: "success",
              message: `Batch ${batchNum} — score moyen: ${avgScore}/10, ${rewrittenInBatch} titre(s) réécrit(s)`,
            });

          } catch (err) {
            send({
              type: "log",
              level: "error",
              message: `Erreur Groq batch ${batchNum}: ${err instanceof Error ? err.message : String(err)}`,
            });
          }
        }

        // 5. Mettre à jour article_queue
        send({ type: "log", level: "info", message: `Mise à jour de ${allResults.length} articles...` });

        let scored = 0;
        let rewritten = 0;

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
            send({ type: "log", level: "error", message: `Erreur update ${result.id}: ${updateError.message}` });
          } else {
            scored++;
          }
        }

        send({
          type: "log",
          level: "success",
          message: `Optimisation terminée — ${scored} scorés, ${rewritten} titres réécrits`,
        });

        send({ type: "done", scored, rewritten });

      } catch (error) {
        send({
          type: "log",
          level: "error",
          message: `Erreur: ${error instanceof Error ? error.message : String(error)}`,
        });
        send({ type: "done", scored: 0, rewritten: 0 });
      }

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
