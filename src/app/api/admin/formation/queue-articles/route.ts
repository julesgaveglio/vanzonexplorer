import Groq from "groq-sdk";
import { NextRequest } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { NextResponse } from "next/server";
import { createSSEResponse } from "@/lib/sse";

export async function GET() {
  const check = await requireAdmin();
  if (check instanceof NextResponse) return check;
  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("article_queue")
    .select("id, title, slug, excerpt, category, target_keyword, secondary_keywords, target_word_count, status, priority, added_by, published_at, seo_score")
    .order("priority", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ articles: data ?? [] });
}

export async function PATCH(req: NextRequest) {
  const check = await requireAdmin();
  if (check instanceof NextResponse) return check;
  const supabase = createSupabaseAdmin();
  const body = await req.json();
  const { articles } = body as {
    articles: Array<{
      id: string;
      title?: string;
      excerpt?: string;
      category?: string;
      target_keyword?: string;
      secondary_keywords?: string[];
      target_word_count?: number;
      status?: string;
      priority?: number;
    }>;
  };

  if (!Array.isArray(articles) || articles.length === 0) {
    return Response.json({ error: "No articles provided" }, { status: 400 });
  }

  const errors: string[] = [];
  await Promise.all(
    articles.map(async ({ id, ...fields }) => {
      const { error } = await supabase
        .from("article_queue")
        .update(fields)
        .eq("id", id);
      if (error) errors.push(`${id}: ${error.message}`);
    })
  );

  if (errors.length > 0) return Response.json({ errors }, { status: 207 });
  return Response.json({ updated: articles.length });
}

export async function DELETE(req: NextRequest) {
  const check = await requireAdmin();
  if (check instanceof NextResponse) return check;
  const supabase = createSupabaseAdmin();
  const { id } = await req.json() as { id: string };

  if (!id) return Response.json({ error: "Missing id" }, { status: 400 });

  const { error } = await supabase.from("article_queue").delete().eq("id", id);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ deleted: true });
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .substring(0, 80);
}

interface VbaKeyword {
  keyword: string;
  search_volume: number;
  keyword_difficulty: number;
  topic_cluster: string;
  opportunity_score: number;
}

interface ArticleProposal {
  title: string;
  slug: string;
  excerpt: string;
  targetKeyword: string;
  secondaryKeywords: string[];
  category: string;
  targetWordCount: number;
  priority: number;
  titleScore: number;
}

function clusterToCategory(cluster: string): string {
  if (cluster.includes("Business")) return "Business Van";
  if (cluster.includes("Aménagement")) return "Aménagement Van";
  if (cluster.includes("Achat")) return "Achat Van";
  if (cluster.includes("Location")) return "Location Van";
  if (cluster.includes("Formation")) return "Business Van";
  return "Business Van";
}

export async function POST() {
  const check = await requireAdmin();
  if (check instanceof NextResponse) return check;

  return createSSEResponse(async (send) => {
    try {
    const supabase = createSupabaseAdmin();

        // 1. Lire top 60 keywords de vba_keywords
        send({ type: "log", level: "info", message: "Lecture des meilleurs mots-clés VBA..." });

        const { data: keywords, error: kwError } = await supabase
          .from("vba_keywords")
          .select("keyword, search_volume, keyword_difficulty, topic_cluster, opportunity_score")
          .order("opportunity_score", { ascending: false })
          .limit(60);

        if (kwError || !keywords || keywords.length === 0) {
          send({ type: "log", level: "error", message: "Aucun mot-clé VBA trouvé. Lance d'abord la recherche de mots-clés." });
          send({ type: "done", inserted: 0, skipped: 0 });
          return;
        }

        send({ type: "log", level: "info", message: `${keywords.length} mots-clés chargés` });

        // 2. Groq en batches de 15 → générer propositions d'articles
        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
        const batchSize = 15;
        const proposals: ArticleProposal[] = [];

        for (let i = 0; i < keywords.length; i += batchSize) {
          const batch = (keywords as VbaKeyword[]).slice(i, i + batchSize);
          const batchNum = Math.floor(i / batchSize) + 1;
          const totalBatches = Math.ceil(keywords.length / batchSize);

          send({ type: "log", level: "info", message: `Génération batch ${batchNum}/${totalBatches} (${batch.length} mots-clés)...` });

          const kwList = batch.map((k, idx) =>
            `${idx + 1}. Mot-clé: "${k.keyword}" | Cluster: ${k.topic_cluster} | Volume: ${k.search_volume} | KD: ${Math.round(k.keyword_difficulty ?? 50)} | Opportunité: ${k.opportunity_score ?? 0}`
          ).join("\n");

          try {
            const groqRes = await groq.chat.completions.create({
              model: "llama-3.3-70b-versatile",
              messages: [{
                role: "user",
                content: `Tu es un expert SEO et formateur en business van aménagé. Pour chaque mot-clé ci-dessous, génère une proposition d'article de blog optimisé SEO pour Vanzon Explorer (formation van aménagé, business, achat-revente, location van — audience francophone).

STRATÉGIE SELON KD :
- KD < 30 → longue traîne spécifique, titre ultra-précis avec contexte
- KD 30-60 → titre informatif complet, promesse claire de valeur
- KD > 60 → angle ultra-précis/original, différenciation forte, niche Vanzon

CRITÈRES DE SCORING TITRE (totalise 10pts) :
1. Mot-clé cible intégré naturellement (0-2pts)
2. Longueur 50-70 caractères (0-2pts)
3. Power words : guide complet, méthode, chiffres réels, étape par étape, erreurs à éviter, rentable, 2025, comparatif, comment, pourquoi (0-1pt)
4. Bénéfice ou promesse explicite (0-1pt)
5. Cohérence positionnement Vanzon : business van, formation, location, Pays Basque (0-1pt)
6. Pas de title case anglais, français naturel (0-1pt)
7. Adapté à la compétitivité selon KD (0-1pt)
8. Pas de nom de concurrent direct (0-1pt)

EXIGENCE : titleScore doit être >= 8. Si ton titre initial est < 8, réécris-le jusqu'à atteindre 8+.

Pour chaque mot-clé, retourne un objet JSON avec :
- title: titre de l'article (50-70 caractères, score >= 8 obligatoire)
- slug: slug URL (tirets, minuscules, pas d'accents, max 60 chars)
- excerpt: résumé de 150 caractères max
- targetKeyword: le mot-clé exact donné
- secondaryKeywords: tableau de 3-5 mots-clés secondaires liés
- category: une parmi "Business Van" | "Aménagement Van" | "Achat Van" | "Location Van"
- targetWordCount: nombre de mots cible entre 1200 et 2500
- priority: priorité de 1 (haute) à 100 (basse) selon le volume/difficulté
- titleScore: entier 1-10 représentant le score SEO du titre selon les 8 critères

Réponds UNIQUEMENT avec un tableau JSON valide. Pas de texte autour.

Mots-clés :
${kwList}`,
              }],
              temperature: 0.4,
              max_tokens: 4000,
            });

            const rawContent = groqRes.choices[0]?.message?.content ?? "[]";
            let batchProposals: ArticleProposal[] = [];
            try {
              const jsonMatch = rawContent.match(/\[[\s\S]*\]/);
              batchProposals = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(rawContent);
            } catch {
              send({ type: "log", level: "error", message: `Erreur parsing batch ${batchNum}: ${rawContent.substring(0, 200)}` });
            }

            // Filtre les titres de mauvaise qualité et retry une fois
            const validProposals = batchProposals.filter(p => (p.titleScore ?? 0) >= 8);
            const weakProposals = batchProposals.filter(p => (p.titleScore ?? 0) < 8);

            if (weakProposals.length > 0) {
              send({ type: "log", level: "info", message: `${weakProposals.length} titres < 8/10 → retry Groq...` });
              try {
                const retryKwList = weakProposals.map((p, idx) =>
                  `${idx + 1}. Mot-clé: "${p.targetKeyword}" — Titre actuel: "${p.title}" (score: ${p.titleScore}/10)`
                ).join("\n");
                const retryRes = await groq.chat.completions.create({
                  model: "llama-3.3-70b-versatile",
                  messages: [{ role: "user", content: `Réécris UNIQUEMENT les titres suivants pour qu'ils atteignent un score SEO >= 8/10 selon ces critères :\n1. Mot-clé cible intégré naturellement (0-2pts)\n2. 50-70 caractères (0-2pts)\n3. Power word : guide, méthode, chiffres, étape par étape, erreurs, rentable, 2025 (0-1pt)\n4. Bénéfice explicite (0-1pt)\n5. Positionnement Vanzon (0-1pt)\n6. Français naturel sans title case (0-1pt)\n7. KD-adapté (0-1pt)\n8. Pas de concurrent direct (0-1pt)\n\nRetourne UNIQUEMENT un tableau JSON : [{"targetKeyword": "...", "title": "nouveau titre", "titleScore": 8}]\n\nTitres à améliorer :\n${retryKwList}` }],
                  temperature: 0.3,
                  max_tokens: 2000,
                });
                const retryContent = retryRes.choices[0]?.message?.content ?? "[]";
                const jsonRetry = retryContent.match(/\[[\s\S]*\]/);
                const retriedProposals: Array<{targetKeyword: string; title: string; titleScore: number}> = jsonRetry ? JSON.parse(jsonRetry[0]) : [];

                // Merge: replace weak titles with retried ones
                for (const retried of retriedProposals) {
                  const original = weakProposals.find(p => p.targetKeyword === retried.targetKeyword);
                  if (original) {
                    original.title = retried.title;
                    original.titleScore = retried.titleScore;
                    validProposals.push(original);
                  }
                }
                // Add remaining unmatched weak proposals as-is (fallback)
                for (const weak of weakProposals) {
                  if (!validProposals.find(v => v.targetKeyword === weak.targetKeyword)) {
                    validProposals.push(weak);
                  }
                }
                send({ type: "log", level: "info", message: `Retry : ${retriedProposals.length} titres améliorés` });
              } catch {
                // Fallback: use weak proposals as-is
                validProposals.push(...weakProposals);
              }
            }
            proposals.push(...validProposals);
            send({ type: "log", level: "info", message: `Batch ${batchNum} : ${batchProposals.length} articles proposés` });

          } catch (err) {
            send({ type: "log", level: "error", message: `Erreur Groq batch ${batchNum}: ${err instanceof Error ? err.message : String(err)}` });
          }
        }

        send({ type: "log", level: "info", message: `${proposals.length} articles générés, déduplication en cours...` });

        // 3. Dédupliquer vs article_queue existante
        const { data: existingItems } = await supabase
          .from("article_queue")
          .select("target_keyword")
          .eq("added_by", "vba-keyword-strategy");

        const existingKeywords = new Set(
          (existingItems ?? []).map((r: { target_keyword: string }) => r.target_keyword?.toLowerCase() ?? "")
        );

        let inserted = 0;
        let skipped = 0;

        // 4. Insérer dans article_queue
        for (const proposal of proposals) {
          const targetKw = (proposal.targetKeyword ?? "").toLowerCase();
          if (existingKeywords.has(targetKw)) {
            skipped++;
            continue;
          }

          const slug = proposal.slug || slugify(proposal.title ?? proposal.targetKeyword);
          const { error: insertError } = await supabase
            .from("article_queue")
            .insert({
              id: crypto.randomUUID(),
              slug,
              title: proposal.title,
              excerpt: proposal.excerpt ?? "",
              category: proposal.category ?? clusterToCategory("Business Van"),
              tag: "VBA",
              read_time: "7 min",
              target_keyword: proposal.targetKeyword,
              secondary_keywords: proposal.secondaryKeywords ?? [],
              target_word_count: proposal.targetWordCount ?? 1500,
              status: "pending",
              priority: proposal.priority ?? 50,
              seo_score: proposal.titleScore ?? null,
              sanity_id: null,
              published_at: null,
              added_by: "vba-keyword-strategy",
            });

          if (insertError) {
            if (insertError.code === "23505") {
              skipped++;
            } else {
              send({ type: "log", level: "error", message: `Erreur insert "${proposal.title}": ${insertError.message}` });
            }
          } else {
            inserted++;
            existingKeywords.add(targetKw);
          }
        }

        send({ type: "log", level: "success", message: `${inserted} articles ajoutés à la file, ${skipped} doublons ignorés` });
        send({ type: "done", inserted, skipped });

      } catch (error) {
        send({
          type: "log",
          level: "error",
          message: `Erreur: ${error instanceof Error ? error.message : String(error)}`,
        });
        send({ type: "done", inserted: 0, skipped: 0 });
      }
  });
}
