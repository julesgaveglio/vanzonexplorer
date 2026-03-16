import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface AuditData {
  missingTopics?: string[];
  missingFAQ?: string[];
  keywordsToAdd?: string[];
  topActions?: Array<{ priority: number; action: string; impact: string; effort: string }>;
}

export async function POST(req: NextRequest) {
  const tavilyKey = process.env.TAVILY_API_KEY;
  const groqKey = process.env.GROQ_API_KEY;

  if (!tavilyKey || !groqKey) {
    return NextResponse.json(
      { error: "Variables d'environnement manquantes (TAVILY_API_KEY, GROQ_API_KEY)." },
      { status: 500 }
    );
  }

  let slug: string;
  let targetKeyword: string;
  let auditData: AuditData;

  try {
    const body = await req.json();
    slug = body.slug;
    targetKeyword = body.targetKeyword;
    auditData = body.auditData ?? {};
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide." }, { status: 400 });
  }

  if (!slug || !targetKeyword) {
    return NextResponse.json({ error: "slug et targetKeyword sont requis." }, { status: 400 });
  }

  // Step 1: Tavily search for fresh sources
  interface TavilyResult {
    title: string;
    url: string;
    content: string;
  }

  let sources: TavilyResult[] = [];

  try {
    const tavilyRes = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: tavilyKey,
        query: `${targetKeyword} France 2025`,
        search_depth: "advanced",
        max_results: 5,
        days: 90,
      }),
    });

    if (tavilyRes.ok) {
      const tavilyData = await tavilyRes.json();
      sources = (tavilyData?.results ?? []).slice(0, 5);
    }
  } catch {
    // Continue without Tavily sources
  }

  const sourcesText = sources
    .map((s) => `- ${s.title}\n  URL: ${s.url}\n  ${s.content?.slice(0, 300) ?? ""}`)
    .join("\n\n");

  // Step 2: Groq analysis
  const userPrompt = `
Article à améliorer: ${slug}
Mot-clé: ${targetKeyword}

Audit réalisé:
- Topics manquants: ${(auditData.missingTopics ?? []).join(", ")}
- FAQ manquante: ${(auditData.missingFAQ ?? []).join(", ")}
- Mots-clés à ajouter: ${(auditData.keywordsToAdd ?? []).join(", ")}
- Actions prioritaires: ${JSON.stringify(auditData.topActions ?? [])}

Sources récentes disponibles:
${sourcesText}

Génère un JSON strict avec les améliorations concrètes à apporter:
{
  "newSections": [
    {
      "heading": "titre H2 ou H3",
      "content": "contenu markdown 150-300 mots à insérer",
      "insertAfter": "indication de position dans l'article"
    }
  ],
  "faqToAdd": [
    { "question": "...", "answer": "réponse 80-120 mots optimisée featured snippet" }
  ],
  "metaImprovement": {
    "newSeoTitle": "nouveau seoTitle 55-60 chars ou null si bon",
    "newSeoDescription": "nouvelle meta description 150-160 chars ou null si bonne"
  },
  "internalLinksToAdd": [
    { "anchorText": "texte", "href": "/location | /achat | /formation | /club", "context": "où insérer" }
  ]
}
Réponds UNIQUEMENT avec le JSON.`;

  interface Improvements {
    newSections?: Array<{ heading: string; content: string; insertAfter: string }>;
    faqToAdd?: Array<{ question: string; answer: string }>;
    metaImprovement?: { newSeoTitle: string | null; newSeoDescription: string | null };
    internalLinksToAdd?: Array<{ anchorText: string; href: string; context: string }>;
  }

  let improvements: Improvements = {
    newSections: [],
    faqToAdd: [],
    metaImprovement: { newSeoTitle: null, newSeoDescription: null },
    internalLinksToAdd: [],
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
              "Tu es un expert SEO et rédacteur vanlife France. Tu génères des améliorations précises et actionnables pour des articles de blog.",
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
        improvements = JSON.parse(rawJson);
      } catch {
        const jsonMatch = rawJson.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            improvements = JSON.parse(jsonMatch[0]);
          } catch {
            // Return default improvements
          }
        }
      }
    } else {
      const errText = await groqRes.text();
      return NextResponse.json(
        { error: `Groq API erreur ${groqRes.status}: ${errText.slice(0, 200)}` },
        { status: 502 }
      );
    }
  } catch (err) {
    return NextResponse.json(
      { error: `Appel Groq échoué: ${(err as Error).message}` },
      { status: 502 }
    );
  }

  return NextResponse.json({ success: true, improvements, slug, sources });
}
