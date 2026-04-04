import { readFile, writeFile } from "fs/promises";
import path from "path";
import { requireAdmin } from "@/lib/auth";
import { NextResponse } from "next/server";
import { createSSEResponse } from "@/lib/sse";
import { slugify } from "@/lib/slugify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BLOCKED_DOMAINS = ["google.com", "pinterest.com", "amazon.fr", "youtube.com"];

interface ArticleQueueItem {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  tag: string | null;
  readTime: string;
  targetKeyword: string;
  secondaryKeywords: string[];
  targetWordCount: number;
  wordCountNote: string;
  status: string;
  priority: number;
  sanityId: null;
  publishedAt: null;
  lastSeoCheck: null;
  seoPosition: null;
}

interface Opportunity {
  title: string;
  targetKeyword: string;
  category: string;
  relevanceScore: number;
  competitorSource: string;
  reasoning: string;
}

export async function POST() {
  const check = await requireAdmin();
  if (check instanceof NextResponse) return check;

  return createSSEResponse(async (send) => {
    const sendLog = (message: string) => send({ type: "log", message });
    const sendDone = (result: Record<string, unknown>) => send({ type: "done", result });

    const dfsLogin = process.env.DATAFORSEO_LOGIN;
        const dfsPassword = process.env.DATAFORSEO_PASSWORD;
        const tavilyKey = process.env.TAVILY_API_KEY;
        const groqKey = process.env.GROQ_API_KEY;

        if (!dfsLogin || !dfsPassword || !tavilyKey || !groqKey) {
          sendLog(
            "Erreur : variables d'environnement manquantes (DATAFORSEO_LOGIN, DATAFORSEO_PASSWORD, TAVILY_API_KEY, GROQ_API_KEY)."
          );
          return;
        }

        const dfsAuth = Buffer.from(`${dfsLogin}:${dfsPassword}`).toString("base64");

        // Step 1: Identify competitors via DataForSEO
        sendLog("Identification des concurrents de vanzonexplorer.com...");

        let competitorDomains: string[] = [];

        try {
          const compRes = await fetch(
            "https://api.dataforseo.com/v3/dataforseo_labs/google/competitors_domain/live",
            {
              method: "POST",
              headers: {
                Authorization: `Basic ${dfsAuth}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify([
                {
                  target: "vanzonexplorer.com",
                  location_code: 2250,
                  language_code: "fr",
                  limit: 8,
                },
              ]),
            }
          );

          if (compRes.ok) {
            const compData = await compRes.json();
            const items: Array<{ domain: string }> =
              compData?.tasks?.[0]?.result?.[0]?.items ?? [];
            competitorDomains = items
              .map((item) => item.domain)
              .filter((d) => !BLOCKED_DOMAINS.some((blocked) => d.includes(blocked)))
              .slice(0, 5);
          } else {
            sendLog("Avertissement : DataForSEO competitors_domain a retourné une erreur.");
          }
        } catch (err) {
          sendLog(`Avertissement : DataForSEO échoué (${(err as Error).message}).`);
        }

        if (competitorDomains.length === 0) {
          sendLog("Aucun concurrent identifié, utilisation de domaines vanlife par défaut.");
          competitorDomains = ["nomade-vanlife.fr", "vanlifers.fr", "fourgonlife.com"];
        }

        // Step 2: Tavily search for recent articles from each competitor
        sendLog("Recherche des publications récentes des concurrents...");

        interface TavilyResult {
          title: string;
          url: string;
          content: string;
        }

        const allArticles: Array<TavilyResult & { domain: string }> = [];

        for (const domain of competitorDomains) {
          try {
            const tavilyRes = await fetch("https://api.tavily.com/search", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                api_key: tavilyKey,
                query: `site:${domain} vanlife van aménagé`,
                search_depth: "basic",
                max_results: 5,
                days: 30,
              }),
            });

            if (tavilyRes.ok) {
              const tavilyData = await tavilyRes.json();
              const results: TavilyResult[] = tavilyData?.results ?? [];
              for (const r of results) {
                allArticles.push({ ...r, domain });
              }
            }
          } catch (err) {
            sendLog(`Avertissement : Tavily échoué pour ${domain} (${(err as Error).message}).`);
          }
        }

        // Deduplicate by URL
        const seen = new Set<string>();
        const dedupedArticles = allArticles.filter((a) => {
          if (seen.has(a.url)) return false;
          seen.add(a.url);
          return true;
        });

        // Step 3: Groq analysis
        sendLog("Analyse IA des opportunités de contenu...");

        const articleListText = dedupedArticles
          .map((a) => `- Title: ${a.title}\n  URL: ${a.url}\n  Domain: ${a.domain}`)
          .join("\n");

        let opportunities: Opportunity[] = [];
        let competitorsSummary = "Analyse des concurrents indisponible.";

        try {
          const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${groqKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "llama-3.3-70b-versatile",
              messages: [
                {
                  role: "system",
                  content:
                    "Tu es un expert SEO vanlife France. Analyse les articles concurrents et identifie des opportunités de contenu pour vanzonexplorer.com (location van, achat van, vanlife Pays Basque, Club Privé équipement van).",
                },
                {
                  role: "user",
                  content: `Voici les articles récents des concurrents vanlife en France:\n\n${articleListText}\n\nVanzon couvre déjà: location van Pays Basque, achat van, formation business van, club privé équipement.\n\nGénère un JSON strict:\n{\n  "opportunities": [\n    {\n      "title": "titre article suggéré en français",\n      "targetKeyword": "mot-clé principal",\n      "category": "Pays Basque|Aménagement Van|Business Van|Achat Van|Vie en van|Club Privé",\n      "relevanceScore": 0-100,\n      "competitorSource": "domain.com",\n      "reasoning": "pourquoi ce sujet est stratégique pour Vanzon"\n    },\n    ...max 8 opportunities scored >60\n  ],\n  "competitorsSummary": "résumé 2 phrases des tendances concurrents"\n}\nRéponds UNIQUEMENT avec le JSON.`,
                },
              ],
              temperature: 0.3,
              max_tokens: 2000,
            }),
          });

          if (groqRes.ok) {
            const groqData = await groqRes.json();
            const rawJson = groqData?.choices?.[0]?.message?.content ?? "";
            let parsed: { opportunities?: Opportunity[]; competitorsSummary?: string } = {};
            try {
              parsed = JSON.parse(rawJson);
            } catch {
              const jsonMatch = rawJson.match(/\{[\s\S]*\}/);
              if (jsonMatch) {
                try {
                  parsed = JSON.parse(jsonMatch[0]);
                } catch {
                  sendLog("Avertissement : impossible de parser la réponse JSON de Groq.");
                }
              }
            }
            opportunities = parsed.opportunities ?? [];
            competitorsSummary = parsed.competitorsSummary ?? competitorsSummary;
          } else {
            sendLog(`Avertissement : Groq a retourné une erreur ${groqRes.status}.`);
          }
        } catch (err) {
          sendLog(`Avertissement : appel Groq échoué (${(err as Error).message}).`);
        }

        // Step 4: Filter opportunities and add to article queue
        const filteredOpportunities = opportunities.filter((o) => o.relevanceScore >= 65);

        let addedToQueue = 0;

        if (filteredOpportunities.length > 0) {
          const queuePath = path.resolve(process.cwd(), "scripts/data/article-queue.json");
          let queue: ArticleQueueItem[] = [];
          try {
            const raw = await readFile(queuePath, "utf-8");
            queue = JSON.parse(raw);
          } catch {
            queue = [];
          }

          const existingKeywords = queue.map((item) =>
            slugify(item.targetKeyword ?? "")
          );

          const timestamp = Date.now();

          for (let i = 0; i < filteredOpportunities.length; i++) {
            const opp = filteredOpportunities[i];
            const kwSlug = slugify(opp.targetKeyword);

            // Skip if a similar keyword already exists
            const isDuplicate = existingKeywords.some(
              (existing) =>
                existing === kwSlug ||
                existing.includes(kwSlug.slice(0, 15)) ||
                kwSlug.includes(existing.slice(0, 15))
            );

            if (isDuplicate) continue;

            const newEntry: ArticleQueueItem = {
              id: `competitor-${timestamp}-${i}`,
              slug: slugify(opp.title),
              title: opp.title,
              excerpt: `Article suggéré par l'agent competitor-tracker basé sur l'analyse des concurrents.`,
              category: opp.category,
              tag: "Concurrent",
              readTime: "8 min",
              targetKeyword: opp.targetKeyword,
              secondaryKeywords: [],
              targetWordCount: 1500,
              wordCountNote: `Suggestion auto competitor-tracker. Source: ${opp.competitorSource}. Reasoning: ${opp.reasoning}`,
              status: "pending",
              priority: 35,
              sanityId: null,
              publishedAt: null,
              lastSeoCheck: null,
              seoPosition: null,
            };

            queue.push(newEntry);
            existingKeywords.push(kwSlug);
            addedToQueue++;
          }

          if (addedToQueue > 0) {
            try {
              await writeFile(queuePath, JSON.stringify(queue, null, 2), "utf-8");
            } catch (err) {
              sendLog(`Avertissement : impossible d'écrire article-queue.json (${(err as Error).message}).`);
            }
          }
        }

        sendDone({
          competitors: competitorDomains,
          totalArticlesFound: dedupedArticles.length,
          opportunities: filteredOpportunities,
          addedToQueue,
          summary: competitorsSummary,
        });
  });
}
