// Étape 7 — Stratégie de contenu : Groq génère 10 articles basés sur le business + keywords
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { groqWithFallback } from "@/lib/groq-with-fallback";
import type { ContentStrategyData, BusinessAnalysis, KeywordsData } from "@/types/seo-report";

export async function POST(req: NextRequest) {
  const check = await requireAdmin();
  if (check instanceof NextResponse) return check;

  const { url, business, keywords } = await req.json() as {
    url: string;
    business?: BusinessAnalysis;
    keywords?: KeywordsData;
  };

  if (!url) return NextResponse.json({ error: "url requis" }, { status: 400 });

  const businessContext = business
    ? `Site : ${business.nom_site}\nSecteur : ${business.secteur_activite}\nBusiness model : ${business.business_model}\nProduits/services : ${business.produits_services.join(", ")}\nCible : ${business.cible_audience}\nProposition de valeur : ${business.proposition_valeur}\nZone géo : ${business.zone_geo}\nMots-clés métier : ${business.mots_cles_metier.join(", ")}`
    : `URL : ${url}`;

  const keywordContext = keywords
    ? `Pages indexées : ${keywords.indexedCount}\nTop mots-clés du site :\n${keywords.keywordsForSite.slice(0, 10).map((k) => `  - "${k.keyword}" vol=${k.searchVolume} diff=${k.difficulty} pos=${k.position ?? "?"}`).join("\n")}\nIdées de mots-clés :\n${keywords.keywordIdeas.slice(0, 10).map((k) => `  - "${k.keyword}" vol=${k.searchVolume} diff=${k.difficulty} intent=${k.intent}`).join("\n")}`
    : "Données mots-clés non disponibles";

  try {
    const { content } = await groqWithFallback({
      messages: [
        {
          role: "system",
          content: `Tu es un stratège SEO content expert francophone. Tu connais le business model de ce site et ses données de mots-clés. Génère un plan de 10 articles de blog stratégiques en JSON UNIQUEMENT :
{
  "articles": [
    {
      "rang": number,
      "titre_seo": "string — titre optimisé pour Google (50-60 chars)",
      "mot_cle_principal": "string",
      "volume_mensuel": number,
      "difficulte": number (0-100),
      "intention": "informational | commercial | transactional",
      "pourquoi_ce_site": "string — 1 phrase",
      "angle_editorial": "string — 1 phrase",
      "titre_accrocheur": "string — titre blog attractif",
      "cta_naturel": "string — CTA vers un produit/service du site",
      "priorite": "Quick Win | Moyen terme | Long terme"
    }
  ],
  "strategie_globale": "string — 3-4 phrases sur la logique globale",
  "quick_wins_justification": "string — pourquoi ces articles en priorité"
}

Critères STRICTS :
- Prioriser volume > 100 ET difficulté < 40
- Chaque article DOIT avoir un cta_naturel pointant vers un produit, service ou catégorie RÉEL détecté sur le site. Aucun article purement informatif sans lien de conversion.
- Mix intentions : 40% informational (avec CTA soft), 40% commercial (comparatif, guide d'achat), 20% transactional (landing page, promotion)
- Intégrer la zone géo dans les mots-clés si le business est local
- Le cta_naturel doit mentionner une page/produit CONCRET du site (pas un CTA générique)`,
        },
        {
          role: "user",
          content: `Business :\n${businessContext}\n\nDonnées SEO :\n${keywordContext}\n\nGénère le plan stratégique.`,
        },
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.4,
      response_format: { type: "json_object" },
      max_tokens: 3000,
    });

    const data = JSON.parse(content.trim()) as ContentStrategyData;
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
