import { NextRequest } from "next/server";
import Groq from "groq-sdk";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { NextResponse } from "next/server";
import { createSSEResponse } from "@/lib/sse";

interface TavilyResult {
  url?: string;
  title?: string;
  content?: string;
}

interface TavilyResponse {
  results?: TavilyResult[];
}

interface ProspectCandidate {
  name: string;
  website: string;
  category: string;
  type: string;
  country: string;
  description: string;
  relevance_score: number;
  strategic_interest: string;
}

export async function POST(req: NextRequest) {
  const check = await requireAdmin();
  if (check instanceof NextResponse) return check;
  const body = await req.json();
  const {
    categories,
    country = "France",
    max = 20,
  }: { categories?: string[]; country?: string; max?: number } = body;

  return createSSEResponse(async (send) => {
    try {
    // Build search queries
    const queries: string[] = [];

        if (categories && categories.length > 0) {
          for (const category of categories) {
            queries.push(`marque ${category} van fourgon ${country}`);
            queries.push(`fabricant ${category} véhicule aménagé`);
          }
        } else {
          queries.push("marque équipement van aménagé France");
          queries.push("accessoires fourgon aménagé marque");
          queries.push("distributeur matériel camping-car van");
          queries.push("fabricant équipement vanlife France");
          queries.push("fournisseur aménagement fourgon professionnel");
          queries.push("marque solaire batterie van aménagé");
          queries.push("chauffage réfrigérateur van camping");
          queries.push("équipement autonomie van nomade France");
        }

        send({
          type: "log",
          level: "info",
          message: `Lancement de ${queries.length} recherches Tavily...`,
        });

        // Run all Tavily searches in parallel
        const tavilyResults = await Promise.all(
          queries.map(async (query) => {
            try {
              const response = await fetch("https://api.tavily.com/search", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  api_key: process.env.TAVILY_API_KEY,
                  query,
                  max_results: 10,
                }),
              });
              const data: TavilyResponse = await response.json();
              return data.results || [];
            } catch {
              return [];
            }
          })
        );

        const allResults = tavilyResults.flat();

        // Extract unique domains
        const uniqueDomains = new Set<string>();
        for (const result of allResults) {
          if (result.url) {
            try {
              const domain = new URL(result.url).origin;
              uniqueDomains.add(domain);
            } catch {
              // ignore invalid URLs
            }
          }
        }

        send({
          type: "log",
          level: "info",
          message: `${allResults.length} résultats collectés, ${uniqueDomains.size} domaines uniques trouvés`,
        });

        // Build context string for Groq
        const resultsContext = allResults
          .slice(0, 60)
          .map((r) => `URL: ${r.url}\nTitre: ${r.title}\nContenu: ${r.content}`)
          .join("\n---\n");

        send({
          type: "log",
          level: "info",
          message: "Analyse Groq en cours pour identifier les prospects...",
        });

        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

        const groqResponse = await groq.chat.completions.create({
          model: "llama-3.3-70b-versatile",
          messages: [
            {
              role: "user",
              content: `Tu es un expert en équipement van/fourgon aménagé. Analyse ces résultats web et identifie des marques/fabricants/distributeurs pertinents pour une communauté de vanlifers français.
Pour chaque marque identifiée, retourne un JSON avec: name, website (URL complète avec https://), category (parmi: froid|énergie|chauffage|sanitaire|extérieur|accessoires|distributeur|tendance), type (fabricant|distributeur|grossiste), country (France ou autre), description (2-3 phrases en français), relevance_score (0-100 basé sur pertinence pour équipement van), strategic_interest (pourquoi c'est intéressant pour Vanzon Explorer).
Réponds UNIQUEMENT avec un tableau JSON valide [...]. Pas de texte autour. Maximum ${max} entrées.

Résultats web:
${resultsContext}`,
            },
          ],
          temperature: 0.3,
          max_tokens: 4000,
        });

        const rawContent = groqResponse.choices[0]?.message?.content || "[]";

        let prospects: ProspectCandidate[] = [];
        try {
          // Try to extract JSON array from response
          const jsonMatch = rawContent.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            prospects = JSON.parse(jsonMatch[0]);
          } else {
            prospects = JSON.parse(rawContent);
          }
        } catch {
          send({
            type: "log",
            level: "error",
            message: "Erreur parsing JSON Groq, réponse brute: " + rawContent.substring(0, 200),
          });
          prospects = [];
        }

        send({
          type: "log",
          level: "info",
          message: `${prospects.length} prospects identifiés par Groq, déduplication en cours...`,
        });

        // Dedup against existing prospects in DB
        const supabase = createSupabaseAdmin();
        const { data: existingProspects } = await supabase
          .from("prospects")
          .select("website");

        const existingWebsites = new Set(
          (existingProspects || []).map((p: { website: string }) => {
            try {
              return new URL(p.website).hostname;
            } catch {
              return p.website;
            }
          })
        );

        const dedupedProspects = prospects.filter((p) => {
          if (!p.website) return false;
          try {
            const hostname = new URL(p.website).hostname;
            return !existingWebsites.has(hostname);
          } catch {
            return true;
          }
        });

        send({
          type: "log",
          level: "success",
          message: `${dedupedProspects.length} nouveaux prospects après déduplication (${prospects.length - dedupedProspects.length} déjà existants)`,
        });

        send({
          type: "result",
          prospects: dedupedProspects,
        });

        send({
          type: "done",
          count: dedupedProspects.length,
        });
      } catch (error) {
        send({
          type: "log",
          level: "error",
          message: `Erreur: ${error instanceof Error ? error.message : String(error)}`,
        });
        send({ type: "done", count: 0 });
      }
  });
}
