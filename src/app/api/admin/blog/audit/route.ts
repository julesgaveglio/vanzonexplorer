import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function sseEncode(encoder: TextEncoder, data: object): Uint8Array {
  return encoder.encode(`data: ${JSON.stringify(data)}\n\n`);
}

export async function POST(req: NextRequest) {
  const check = await requireAdmin();
  if (check instanceof NextResponse) return check;
  const { slug, targetKeyword } = await req.json().catch(() => ({ slug: null, targetKeyword: null }));

  if (!slug || !targetKeyword) {
    return new Response(JSON.stringify({ error: "slug and targetKeyword are required" }), { status: 400 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      function sendLog(message: string) {
        controller.enqueue(sseEncode(encoder, { type: "log", message }));
      }

      function sendDone(result: object) {
        controller.enqueue(sseEncode(encoder, { type: "done", result }));
      }

      try {
        // Step 1: Fetch article via Jina
        sendLog("Lecture de l'article en cours...");

        const jinaLogin = process.env.JINA_API_KEY;
        const dfsLogin = process.env.DATAFORSEO_LOGIN;
        const dfsPassword = process.env.DATAFORSEO_PASSWORD;
        const groqKey = process.env.GROQ_API_KEY;

        if (!jinaLogin || !dfsLogin || !dfsPassword || !groqKey) {
          sendLog("Erreur : variables d'environnement manquantes (JINA_API_KEY, DATAFORSEO_LOGIN, DATAFORSEO_PASSWORD, GROQ_API_KEY).");
          controller.close();
          return;
        }

        let articleContent = "";
        try {
          const jinaArticleRes = await fetch(`https://r.jina.ai/https://vanzonexplorer.com/vanzon/articles/${slug}`, {
            headers: {
              Authorization: `Bearer ${jinaLogin}`,
              Accept: "text/plain",
            },
          });
          const raw = await jinaArticleRes.text();
          articleContent = raw.slice(0, 8000);
        } catch (err) {
          sendLog(`Avertissement : impossible de lire l'article (${(err as Error).message}). Continuation avec contenu vide.`);
        }

        // Step 2: DataForSEO SERP
        sendLog(`Analyse SERP pour '${targetKeyword}'...`);

        const dfsAuth = Buffer.from(`${dfsLogin}:${dfsPassword}`).toString("base64");
        let competitorUrls: string[] = [];

        try {
          const serpRes = await fetch("https://api.dataforseo.com/v3/serp/google/organic/live/advanced", {
            method: "POST",
            headers: {
              Authorization: `Basic ${dfsAuth}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify([
              {
                keyword: targetKeyword,
                location_code: 2250,
                language_code: "fr",
                device: "desktop",
                depth: 10,
              },
            ]),
          });

          if (serpRes.ok) {
            const serpData = await serpRes.json();
            const items: Array<{ type: string; url: string }> =
              serpData?.tasks?.[0]?.result?.[0]?.items ?? [];
            competitorUrls = items
              .filter((item) => item.type === "organic")
              .slice(0, 5)
              .map((item) => item.url);
          } else {
            sendLog("Avertissement : DataForSEO SERP a retourné une erreur. Continuation sans données SERP.");
          }
        } catch (err) {
          sendLog(`Avertissement : DataForSEO SERP échoué (${(err as Error).message}).`);
        }

        // Step 3: Scrape top 3 competitor URLs
        sendLog("Scraping des 3 articles concurrents...");

        const top3Urls = competitorUrls.slice(0, 3);
        const competitorContents: { url: string; content: string }[] = [];

        for (const url of top3Urls) {
          try {
            const cRes = await fetch(`https://r.jina.ai/${url}`, {
              headers: {
                Authorization: `Bearer ${jinaLogin}`,
                Accept: "text/plain",
              },
            });
            const rawContent = await cRes.text();
            competitorContents.push({ url, content: rawContent.slice(0, 6000) });
          } catch (err) {
            sendLog(`Avertissement : impossible de scraper ${url} (${(err as Error).message}).`);
            competitorContents.push({ url, content: "" });
          }
        }

        // Pad to 3 if fewer
        while (competitorContents.length < 3) {
          competitorContents.push({ url: "", content: "" });
        }

        // Step 4: Groq analysis
        sendLog("Analyse comparative avec l'IA...");

        const userPrompt = `
Mot-clé cible: ${targetKeyword}

ARTICLE VANZON (${slug}):
${articleContent}

CONCURRENT 1 (${competitorContents[0].url}):
${competitorContents[0].content}

CONCURRENT 2 (${competitorContents[1].url}):
${competitorContents[1].content}

CONCURRENT 3 (${competitorContents[2].url}):
${competitorContents[2].content}

Génère un rapport JSON STRICT avec cette structure:
{
  "wordCounts": { "vanzon": number, "competitor1": number, "competitor2": number, "competitor3": number },
  "vanzonPosition": number_or_null,
  "gapScore": 0-100,
  "missingTopics": ["topic1", "topic2", ...max 6],
  "missingFAQ": ["question1", "question2", ...max 4],
  "keywordsToAdd": ["kw1", "kw2", ...max 8],
  "strengths": ["strength1", "strength2", ...max 3],
  "topActions": [
    { "priority": 1, "action": "description courte", "impact": "haut|moyen|faible", "effort": "haut|moyen|faible" },
    ...max 5 actions
  ],
  "summary": "2-3 phrases résumant les lacunes principales"
}
Réponds UNIQUEMENT avec le JSON, sans markdown.
`;

        let auditData: Record<string, unknown> = {
          wordCounts: { vanzon: 0, competitor1: 0, competitor2: 0, competitor3: 0 },
          vanzonPosition: null,
          gapScore: 0,
          missingTopics: [],
          missingFAQ: [],
          keywordsToAdd: [],
          strengths: [],
          topActions: [],
          summary: "Analyse indisponible.",
        };

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
                    "Tu es un expert SEO. Analyse l'article Vanzon vs les concurrents et génère un rapport JSON d'amélioration.",
                },
                {
                  role: "user",
                  content: userPrompt,
                },
              ],
              temperature: 0.3,
              max_tokens: 2000,
            }),
          });

          if (groqRes.ok) {
            const groqData = await groqRes.json();
            const rawJson = groqData?.choices?.[0]?.message?.content ?? "";
            try {
              auditData = JSON.parse(rawJson);
            } catch {
              // Try to extract JSON from text
              const jsonMatch = rawJson.match(/\{[\s\S]*\}/);
              if (jsonMatch) {
                try {
                  auditData = JSON.parse(jsonMatch[0]);
                } catch {
                  sendLog("Avertissement : impossible de parser la réponse JSON de Groq.");
                }
              }
            }
          } else {
            const errText = await groqRes.text();
            sendLog(`Avertissement : Groq a retourné une erreur ${groqRes.status}: ${errText.slice(0, 200)}.`);
          }
        } catch (err) {
          sendLog(`Avertissement : appel Groq échoué (${(err as Error).message}).`);
        }

        sendDone({
          auditData,
          slug,
          targetKeyword,
          competitorUrls: top3Urls,
          timestamp: new Date().toISOString(),
        });
      } catch (err) {
        controller.enqueue(
          sseEncode(encoder, {
            type: "log",
            message: `Erreur fatale : ${(err as Error).message}`,
          })
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
