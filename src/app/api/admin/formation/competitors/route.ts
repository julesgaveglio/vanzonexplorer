import Groq from "groq-sdk";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { dfsPostRaw, DFS_LOCATION_CODE, DFS_LANGUAGE_CODE } from "@/lib/dataforseo";
import { requireAdmin } from "@/lib/auth";
import { NextResponse } from "next/server";

function sseEvent(data: Record<string, unknown>): string {
  return `data: ${JSON.stringify(data)}\n\n`;
}

interface DfsOrganicItem {
  type?: string;
  domain?: string;
  url?: string;
  title?: string;
  description?: string;
}

interface DfsRawResponse {
  tasks?: Array<{
    result?: Array<Record<string, unknown>>;
  }>;
  cost?: number;
  status_code?: number;
}

export async function GET() {
  const check = await requireAdmin();
  if (check instanceof NextResponse) return check;
  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("vba_competitors")
    .select("*")
    .order("traffic_estimate", { ascending: false });

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ competitors: data ?? [] });
}

export async function POST() {
  const check = await requireAdmin();
  if (check instanceof NextResponse) return check;
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(sseEvent(data)));
      };

      try {
        const formationKeywords = [
          "formation van aménagé",
          "formation vanlife business",
          "acheter van aménagé pour louer",
          "business van aménagé rentable",
          "formation aménagement van",
          "devenir loueur van aménagé",
        ];

        send({ type: "log", level: "info", message: `Analyse SERP pour ${formationKeywords.length} mots-clés formation...` });

        // 1. SERP en parallèle pour tous les keywords
        const serpResults = await Promise.all(
          formationKeywords.map(async (keyword) => {
            try {
              const res = await dfsPostRaw<DfsRawResponse>("/serp/google/organic/live/advanced", [{
                keyword,
                location_code: DFS_LOCATION_CODE,
                language_code: DFS_LANGUAGE_CODE,
                calculate_rectangles: false,
                depth: 20,
              }]);
              const items = res?.tasks?.[0]?.result?.[0]?.items as DfsOrganicItem[] | undefined;
              return items ?? [];
            } catch {
              return [];
            }
          })
        );

        // Extraire les domaines uniques, hors vanzonexplorer.com
        const domainMap = new Map<string, { title: string; url: string }>();
        for (const items of serpResults) {
          for (const item of items) {
            if (item.type === "organic" && item.domain && !item.domain.includes("vanzonexplorer")) {
              if (!domainMap.has(item.domain)) {
                domainMap.set(item.domain, {
                  title: item.title ?? item.domain,
                  url: item.url ?? `https://${item.domain}`,
                });
              }
            }
          }
        }

        const domains = Array.from(domainMap.entries()).slice(0, 10);
        send({ type: "log", level: "info", message: `${domains.length} domaines concurrents trouvés dans les SERPs` });

        // 2. Domain overview pour chaque domaine
        send({ type: "log", level: "info", message: "Récupération des métriques domaines (DataForSEO)..." });

        const domainMetrics = await Promise.all(
          domains.map(async ([domain]) => {
            try {
              const res = await dfsPostRaw<DfsRawResponse>("/dataforseo_labs/google/domain_rank_overview/live", [{
                target: domain,
                location_code: DFS_LOCATION_CODE,
                language_code: DFS_LANGUAGE_CODE,
              }]);
              const result = res?.tasks?.[0]?.result?.[0] as Record<string, unknown> | undefined;
              const metrics = result?.metrics as Record<string, Record<string, unknown>> | undefined;
              return {
                domain,
                etv: Math.round(Number(metrics?.organic?.etv ?? 0)),
                rank: Math.round(Number(result?.rank ?? 0)),
              };
            } catch {
              return { domain, etv: 0, rank: 0 };
            }
          })
        );

        // 3. Tavily search par concurrent
        send({ type: "log", level: "info", message: "Recherche Tavily des offres concurrentes..." });

        const tavilyData = await Promise.all(
          domains.map(async ([domain, info]) => {
            try {
              const response = await fetch("https://api.tavily.com/search", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  api_key: process.env.TAVILY_API_KEY,
                  query: `${domain} formation van aménagé business prix tarif offres`,
                  max_results: 5,
                }),
              });
              const data = await response.json();
              return { domain, results: (data.results ?? []) as Array<{ url?: string; title?: string; content?: string }>, info };
            } catch {
              return { domain, results: [], info };
            }
          })
        );

        // 4. Groq analyse
        send({ type: "log", level: "info", message: "Analyse Groq des profils concurrents..." });

        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

        const context = tavilyData
          .map(({ domain, results, info }) => {
            const texts = results
              .map((r) => `URL: ${r.url}\nTitre: ${r.title}\nContenu: ${r.content ?? ""}`)
              .join("\n---\n");
            return `\n=== DOMAINE: ${domain} ===\nTitre: ${info.title}\n${texts || "Aucune donnée Tavily"}`;
          })
          .join("\n\n");

        const groqResponse = await groq.chat.completions.create({
          model: "llama-3.3-70b-versatile",
          messages: [{
            role: "user",
            content: `Tu es un expert en stratégie business pour la formation van aménagé en France. Analyse ces concurrents potentiels de Vanzon Explorer (qui forme des entrepreneurs au business van aménagé / achat-revente / location) et génère un profil JSON pour chacun.

Pour chaque domaine, retourne un objet JSON avec exactement ces champs :
- domain: le domaine exact (ex: "site.fr")
- name: nom commercial de la marque ou du site
- description: description courte en 2 phrases max
- strengths: points forts séparés par virgule
- weaknesses: points faibles séparés par virgule
- pricing: tarifs/prix si mentionnés, sinon "Non communiqué"
- offerings: formations/produits proposés, séparés par virgule

Réponds UNIQUEMENT avec un tableau JSON valide [...]. Pas de texte avant ni après.

Données collectées :
${context}`,
          }],
          temperature: 0.3,
          max_tokens: 4000,
        });

        const rawContent = groqResponse.choices[0]?.message?.content ?? "[]";
        let profiles: Array<Record<string, string>> = [];
        try {
          const jsonMatch = rawContent.match(/\[[\s\S]*\]/);
          profiles = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(rawContent);
        } catch {
          send({ type: "log", level: "error", message: "Erreur parsing JSON Groq: " + rawContent.substring(0, 300) });
          profiles = [];
        }

        send({ type: "log", level: "info", message: `${profiles.length} profils analysés, enregistrement dans Supabase...` });

        // 5. Upsert dans vba_competitors
        const supabase = createSupabaseAdmin();
        let upserted = 0;

        for (const profile of profiles) {
          const metrics = domainMetrics.find(m => m.domain === profile.domain);
          const { error } = await supabase
            .from("vba_competitors")
            .upsert({
              domain: profile.domain,
              name: profile.name ?? profile.domain,
              description: profile.description ?? null,
              strengths: profile.strengths ?? null,
              weaknesses: profile.weaknesses ?? null,
              pricing: profile.pricing ?? null,
              offerings: profile.offerings ?? null,
              traffic_estimate: metrics?.etv ?? 0,
              domain_authority: metrics?.rank ?? 0,
              last_analyzed: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              raw_data: {},
            }, { onConflict: "domain" });

          if (!error) {
            upserted++;
          } else {
            send({ type: "log", level: "error", message: `Erreur upsert ${profile.domain}: ${error.message}` });
          }
        }

        send({ type: "log", level: "success", message: `${upserted} concurrents enregistrés dans la base` });
        send({ type: "done", count: upserted });

      } catch (error) {
        send({
          type: "log",
          level: "error",
          message: `Erreur: ${error instanceof Error ? error.message : String(error)}`,
        });
        send({ type: "done", count: 0 });
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
