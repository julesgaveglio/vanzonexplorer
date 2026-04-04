import { NextRequest } from "next/server";
import Groq from "groq-sdk";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { NextResponse } from "next/server";
import { createSSEResponse } from "@/lib/sse";

interface SerpApiOrganicResult {
  link?: string;
  title?: string;
  snippet?: string;
  displayed_link?: string;
}

interface SerpApiResponse {
  organic_results?: SerpApiOrganicResult[];
  error?: string;
}

interface ScoredProspect {
  domain: string;
  url: string;
  type: "blog" | "forum" | "partenaire" | "annuaire" | "media";
  score: number;
  notes: string;
  source_query: string;
}

const SERP_QUERIES = [
  "meilleur blog van life france",
  "forum aménagement fourgon",
  "guide road trip campervan france",
  "homologation VASP forum",
  "vanlife france communauté",
  "blog voyage van aménagé",
  "forum fourgon aménagé entraide",
  "site road trip france camping",
  "communauté vanlife française",
  "blog pays basque van voyage",
];

async function searchSerpApi(query: string): Promise<SerpApiOrganicResult[]> {
  try {
    const params = new URLSearchParams({
      api_key: process.env.SERPAPI_KEY || "",
      q: query,
      hl: "fr",
      gl: "fr",
      num: "10",
      engine: "google",
    });
    const resp = await fetch(`https://serpapi.com/search?${params.toString()}`);
    if (!resp.ok) return [];
    const data: SerpApiResponse = await resp.json();
    if (data.error) return [];
    return data.organic_results || [];
  } catch {
    return [];
  }
}

function extractDomain(url: string): string | null {
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

// Domains to exclude (competitors, social media, marketplace, etc.)
const EXCLUDED_DOMAINS = new Set([
  "youtube.com", "facebook.com", "instagram.com", "twitter.com",
  "pinterest.com", "tiktok.com", "reddit.com", "wikipedia.org",
  "amazon.fr", "amazon.com", "leboncoin.fr", "airbnb.fr",
  "yescapa.fr", "wikicampers.fr", "camping-car.fr",
  "google.com", "google.fr", "bing.com", "maps.google.com",
  "vanzonexplorer.com",
]);

export async function POST(req: NextRequest) {
  const check = await requireAdmin();
  if (check instanceof NextResponse) return check;
  const body = await req.json().catch(() => ({}));
  const { max = 15 }: { max?: number } = body;

  return createSSEResponse(async (send) => {
    try {
      send({
        type: "log",
        level: "info",
        message: `Lancement de ${SERP_QUERIES.length} recherches SerpApi...`,
      });

        // Run SerpApi queries in parallel (by batches of 5 to avoid rate limits)
        const allResults: Array<{ result: SerpApiOrganicResult; query: string }> = [];

        for (let i = 0; i < SERP_QUERIES.length; i += 5) {
          const batch = SERP_QUERIES.slice(i, i + 5);
          const batchResults = await Promise.all(
            batch.map(async (query) => {
              const results = await searchSerpApi(query);
              return results.map((r) => ({ result: r, query }));
            })
          );
          allResults.push(...batchResults.flat());
        }

        send({
          type: "log",
          level: "info",
          message: `${allResults.length} résultats SerpApi collectés`,
        });

        // Extract unique domains with their best result
        const domainMap = new Map<string, { url: string; title: string; snippet: string; query: string }>();
        for (const { result, query } of allResults) {
          if (!result.link) continue;
          const domain = extractDomain(result.link);
          if (!domain || EXCLUDED_DOMAINS.has(domain)) continue;
          if (!domainMap.has(domain)) {
            domainMap.set(domain, {
              url: result.link,
              title: result.title || "",
              snippet: result.snippet || "",
              query,
            });
          }
        }

        send({
          type: "log",
          level: "info",
          message: `${domainMap.size} domaines uniques identifiés après filtrage`,
        });

        // Filter domains already in backlink_prospects
        const supabase = createSupabaseAdmin();
        const { data: existing } = await supabase
          .from("backlink_prospects")
          .select("domain");

        const existingDomains = new Set((existing || []).map((r: { domain: string }) => r.domain));
        const newDomains = Array.from(domainMap.entries()).filter(([d]) => !existingDomains.has(d));

        send({
          type: "log",
          level: "info",
          message: `${newDomains.length} nouveaux domaines après déduplication (${domainMap.size - newDomains.length} déjà en base)`,
        });

        if (newDomains.length === 0) {
          send({ type: "log", level: "success", message: "Aucun nouveau prospect à ajouter." });
          send({ type: "done", count: 0 });
          return;
        }

        // Score via Groq — send up to 40 candidates
        const candidatesForGroq = newDomains.slice(0, 40).map(([domain, info]) => ({
          domain,
          url: info.url,
          title: info.title,
          snippet: info.snippet,
          query: info.query,
        }));

        send({
          type: "log",
          level: "info",
          message: `Scoring Groq de ${candidatesForGroq.length} candidats...`,
        });

        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

        const groqResponse = await groq.chat.completions.create({
          model: "llama-3.3-70b-versatile",
          messages: [
            {
              role: "user",
              content: `Tu es un expert SEO spécialisé en link building pour un site de location de vans aménagés au Pays Basque (vanzonexplorer.com).

Analyse ces domaines trouvés via Google et pour chacun évalue sa pertinence pour obtenir un backlink vers vanzonexplorer.com.

Critères de scoring (1-10) :
- Thématique van life / road trip / voyage / camping : +3 points
- Audience française : +2 points
- Contenu éditorial (blog, guide, article) vs simple annuaire : +2 points
- Domaine actif et de qualité : +2 points
- Forte audience potentielle : +1 point

Types possibles : "blog", "forum", "partenaire", "annuaire", "media"

Réponds UNIQUEMENT avec un tableau JSON valide. Maximum ${Math.min(max, candidatesForGroq.length)} entrées, garde les plus pertinents (score ≥ 5).

Format :
[
  {
    "domain": "exemple.fr",
    "url": "https://exemple.fr/page-cible",
    "type": "blog",
    "score": 7,
    "notes": "Blog van life actif, contenu sur road trips France, audience engagée",
    "source_query": "meilleur blog van life france"
  }
]

Domaines à évaluer :
${JSON.stringify(candidatesForGroq, null, 2)}`,
            },
          ],
          temperature: 0.2,
          max_tokens: 3000,
        });

        const rawContent = groqResponse.choices[0]?.message?.content || "[]";

        let scored: ScoredProspect[] = [];
        try {
          const jsonMatch = rawContent.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            scored = JSON.parse(jsonMatch[0]);
          }
        } catch {
          send({
            type: "log",
            level: "error",
            message: "Erreur parsing JSON Groq: " + rawContent.substring(0, 200),
          });
        }

        // Validate and sanitize scored results
        const validScored = scored
          .filter((p) => p.domain && p.url && p.score >= 1 && p.score <= 10)
          .map((p) => ({
            domain: p.domain,
            url: p.url,
            type: (["blog", "forum", "partenaire", "annuaire", "media"].includes(p.type)
              ? p.type
              : "blog") as "blog" | "forum" | "partenaire" | "annuaire" | "media",
            score: Math.min(10, Math.max(1, Math.round(p.score))),
            notes: p.notes || "",
            source_query: p.source_query || candidatesForGroq.find((c) => c.domain === p.domain)?.query || "",
          }));

        send({
          type: "log",
          level: "info",
          message: `${validScored.length} prospects scorés (score ≥ 5), insertion en base...`,
        });

        // Insert into backlink_prospects
        if (validScored.length > 0) {
          const { error: insertError } = await supabase.from("backlink_prospects").insert(
            validScored.map((p) => ({
              domain: p.domain,
              url: p.url,
              type: p.type,
              score: p.score,
              statut: "découvert",
              notes: p.notes,
              source_query: p.source_query,
            }))
          );

          if (insertError) {
            send({
              type: "log",
              level: "error",
              message: `Erreur insertion Supabase: ${insertError.message}`,
            });
          } else {
            send({
              type: "log",
              level: "success",
              message: `✅ ${validScored.length} nouveaux prospects insérés en base`,
            });
          }
        }

        send({ type: "result", prospects: validScored });
        send({ type: "done", count: validScored.length });
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
