import { createSupabaseAdmin } from "@/lib/supabase/server";
import { dfsPostRaw, DFS_LOCATION_CODE, DFS_LANGUAGE_CODE } from "@/lib/dataforseo";
import { requireAdmin } from "@/lib/auth";
import { NextResponse } from "next/server";
import { createSSEResponse } from "@/lib/sse";

interface DfsKeywordItem {
  keyword?: string;
  keyword_info?: {
    search_volume?: number;
    cpc?: number;
    competition_level?: string;
    monthly_searches?: Array<{ year: number; month: number; search_volume: number }>;
  };
  keyword_properties?: {
    keyword_difficulty?: number;
  };
  search_intent_info?: {
    main_intent?: string;
  };
}

interface DfsBulkDifficultyItem {
  keyword?: string;
  keyword_difficulty?: number;
}

interface DfsSearchIntentItem {
  keyword?: string;
  intent?: {
    main_intent?: string;
  };
}

interface DfsRawResponse {
  tasks?: Array<{
    result?: unknown[];
  }>;
  cost?: number;
  status_code?: number;
}

// Assigner un cluster thématique basé sur le contenu du mot-clé
function assignCluster(keyword: string): string {
  const kw = keyword.toLowerCase();
  if (/formation|cours|apprendre|programme|module|coaching|accompagnement/.test(kw)) return "Formation Van";
  if (/business|rentabilit|revenu|gagner|profit|entrepreneur|créer activité|monétis/.test(kw)) return "Business Van";
  if (/aménag|construire|installer|isolation|électricité|mobilier|lit|cuisine/.test(kw)) return "Aménagement Van";
  if (/acheter|achat|prix van|revendre|occasion|neuf|budget|financement/.test(kw)) return "Achat Van";
  if (/location|louer|airbnb|yescapa|chilien|client|réservation|tarif location/.test(kw)) return "Location Van";
  if (/assurance|homologation|réglementation|vasp|contrôle technique|carte grise/.test(kw)) return "Réglementation";
  if (/vanlife|vie nomade|voyager|itinéraire|destinations|nomad|liberté/.test(kw)) return "Vanlife";
  return "Général";
}

export async function GET() {
  const check = await requireAdmin();
  if (check instanceof NextResponse) return check;
  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("vba_keywords")
    .select("*")
    .order("opportunity_score", { ascending: false });

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ keywords: data ?? [] });
}

export async function POST() {
  const check = await requireAdmin();
  if (check instanceof NextResponse) return check;

  return createSSEResponse(async (send) => {
    try {
    // 7 batches de seeds
        const seedBatches = [
          ["formation van aménagé", "formation vanlife"],
          ["business van aménagé", "rentabilité location van"],
          ["acheter van pour louer", "revendre van aménagé"],
          ["aménager van soi même", "homologation VASP van"],
          ["réglementation van aménagé", "assurance van aménagé"],
          ["location van entre particuliers", "tarif location van"],
          ["vanlife France", "budget vanlife mensuel"],
        ];

        send({ type: "log", level: "info", message: `Lancement de ${seedBatches.length} batches DataForSEO keyword_ideas...` });

        // 1. Keyword ideas en parallèle
        const allKeywordItems: DfsKeywordItem[] = [];

        await Promise.all(
          seedBatches.map(async (seeds, i) => {
            try {
              const res = await dfsPostRaw<DfsRawResponse>("/dataforseo_labs/google/keyword_ideas/live", [{
                keywords: seeds,
                location_code: DFS_LOCATION_CODE,
                language_code: DFS_LANGUAGE_CODE,
                limit: 50,
                filters: [["keyword_info.search_volume", ">", 10]],
              }]);
              const items = (res?.tasks?.[0]?.result ?? []) as DfsKeywordItem[];
              allKeywordItems.push(...items);
              send({ type: "log", level: "info", message: `Batch ${i + 1}/${seedBatches.length} : ${items.length} mots-clés` });
            } catch (err) {
              send({ type: "log", level: "error", message: `Batch ${i + 1} erreur: ${err instanceof Error ? err.message : String(err)}` });
            }
          })
        );

        // Dédupliquer par keyword
        const uniqueKeywordsMap = new Map<string, DfsKeywordItem>();
        for (const item of allKeywordItems) {
          if (item.keyword && !uniqueKeywordsMap.has(item.keyword)) {
            uniqueKeywordsMap.set(item.keyword, item);
          }
        }
        const uniqueKeywords = Array.from(uniqueKeywordsMap.values());
        send({ type: "log", level: "info", message: `${uniqueKeywords.length} mots-clés uniques collectés` });

        if (uniqueKeywords.length === 0) {
          send({ type: "log", level: "error", message: "Aucun mot-clé collecté, arrêt." });
          send({ type: "done", count: 0 });
          return;
        }

        const keywordStrings = uniqueKeywords.map(k => k.keyword!);

        // 2. Bulk keyword difficulty
        send({ type: "log", level: "info", message: "Récupération des difficultés (bulk)..." });
        const difficultyMap = new Map<string, number>();
        try {
          const diffRes = await dfsPostRaw<DfsRawResponse>("/dataforseo_labs/google/bulk_keyword_difficulty/live", [{
            keywords: keywordStrings.slice(0, 1000),
            location_code: DFS_LOCATION_CODE,
            language_code: DFS_LANGUAGE_CODE,
          }]);
          const diffItems = (diffRes?.tasks?.[0]?.result ?? []) as DfsBulkDifficultyItem[];
          for (const d of diffItems) {
            if (d.keyword) difficultyMap.set(d.keyword, d.keyword_difficulty ?? 50);
          }
          send({ type: "log", level: "info", message: `Difficultés récupérées pour ${difficultyMap.size} mots-clés` });
        } catch (err) {
          send({ type: "log", level: "error", message: `Erreur bulk difficulty: ${err instanceof Error ? err.message : String(err)}` });
        }

        // 3. Search intent
        send({ type: "log", level: "info", message: "Classification des intentions de recherche..." });
        const intentMap = new Map<string, string>();
        try {
          const intentRes = await dfsPostRaw<DfsRawResponse>("/dataforseo_labs/google/search_intent/live", [{
            keywords: keywordStrings.slice(0, 1000),
            location_code: DFS_LOCATION_CODE,
            language_code: DFS_LANGUAGE_CODE,
          }]);
          const intentItems = (intentRes?.tasks?.[0]?.result ?? []) as DfsSearchIntentItem[];
          for (const item of intentItems) {
            if (item.keyword && item.intent?.main_intent) {
              intentMap.set(item.keyword, item.intent.main_intent);
            }
          }
          send({ type: "log", level: "info", message: `Intentions classifiées pour ${intentMap.size} mots-clés` });
        } catch (err) {
          send({ type: "log", level: "error", message: `Erreur search_intent: ${err instanceof Error ? err.message : String(err)}` });
        }

        // 4. Calcul des scores et upsert
        send({ type: "log", level: "info", message: "Calcul des scores d'opportunité et enregistrement..." });

        const volumes = uniqueKeywords.map(k => k.keyword_info?.search_volume ?? 0);
        const maxVolume = Math.max(...volumes, 1);
        const cpcs = uniqueKeywords.map(k => k.keyword_info?.cpc ?? 0);
        const maxCpc = Math.max(...cpcs, 1);

        const supabase = createSupabaseAdmin();
        let upserted = 0;
        const batchSize = 50;

        for (let i = 0; i < uniqueKeywords.length; i += batchSize) {
          const batch = uniqueKeywords.slice(i, i + batchSize);
          const rows = batch.map(item => {
            const kw = item.keyword!;
            const volume = item.keyword_info?.search_volume ?? 0;
            const difficulty = difficultyMap.get(kw) ?? item.keyword_properties?.keyword_difficulty ?? 50;
            const cpc = item.keyword_info?.cpc ?? 0;

            const volumeNorm = volume / maxVolume;
            const diffNorm = (100 - difficulty) / 100;
            const cpcNorm = cpc / maxCpc;
            const opportunityScore = Math.round((volumeNorm * 0.4 + diffNorm * 0.4 + cpcNorm * 0.2) * 100);

            const monthlySearches: Record<string, number> = {};
            for (const ms of item.keyword_info?.monthly_searches ?? []) {
              monthlySearches[`${ms.year}-${String(ms.month).padStart(2, "0")}`] = ms.search_volume;
            }

            return {
              keyword: kw,
              search_volume: volume,
              keyword_difficulty: difficulty,
              cpc,
              intent: intentMap.get(kw) ?? item.search_intent_info?.main_intent ?? null,
              topic_cluster: assignCluster(kw),
              opportunity_score: opportunityScore,
              competition_level: item.keyword_info?.competition_level ?? null,
              monthly_searches: monthlySearches,
              last_checked: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };
          });

          const { error } = await supabase
            .from("vba_keywords")
            .upsert(rows, { onConflict: "keyword" });

          if (error) {
            send({ type: "log", level: "error", message: `Erreur upsert batch: ${error.message}` });
          } else {
            upserted += rows.length;
          }
        }

        send({ type: "log", level: "success", message: `${upserted} mots-clés enregistrés dans vba_keywords` });
        send({ type: "done", count: upserted });

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
