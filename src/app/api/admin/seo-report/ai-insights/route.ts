import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import Groq from "groq-sdk";
import type { AiInsightsData, SeoReportData } from "@/types/seo-report";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const reportData: Partial<SeoReportData> & { url: string } = await req.json();

  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

  const prompt = `Tu es un expert SEO. Analyse les données d'audit SEO suivantes et génère des recommandations concrètes.

URL analysée : ${reportData.url}

PERFORMANCE (PSI) :
- Mobile : performance ${reportData.pagespeed?.mobile.scores.performance ?? "N/A"}/100, SEO ${reportData.pagespeed?.mobile.scores.seo ?? "N/A"}/100
- Desktop : performance ${reportData.pagespeed?.desktop.scores.performance ?? "N/A"}/100, SEO ${reportData.pagespeed?.desktop.scores.seo ?? "N/A"}/100
- LCP mobile : ${reportData.pagespeed?.mobile.vitals.lcp.value ?? "N/A"}
- CLS mobile : ${reportData.pagespeed?.mobile.vitals.cls.value ?? "N/A"}

ON-PAGE :
- Score : ${reportData.onpage?.score ?? "N/A"}/100
- Problèmes : ${reportData.onpage?.items.filter((i) => !i.pass).map((i) => i.label).join(", ") || "aucun"}
- Images sans alt : ${reportData.onpage?.imagesWithoutAlt ?? 0}/${reportData.onpage?.totalImages ?? 0}

AUTORITÉ :
- Domain Authority : ${reportData.authority?.domainAuthority ?? "N/A"}/100
- Backlinks : ${reportData.authority?.backlinksCount ?? "N/A"}
- Domaines référents : ${reportData.authority?.referringDomains ?? "N/A"}

CONCURRENTS :
${reportData.competitors?.competitors.map((c) => `- ${c.domain} (${c.intersections} mots-clés en commun)`).join("\n") || "N/A"}

Réponds UNIQUEMENT avec un objet JSON valide correspondant exactement à ce schéma :
{
  "secteur": "string — secteur d'activité détecté depuis l'URL et les données",
  "axes": [
    {
      "titre": "string — titre court de l'action",
      "priorite": "Fort" | "Moyen" | "Faible",
      "description": "string — explication concrète en 1-2 phrases",
      "impact": "string — impact estimé ex. 'Peut améliorer le LCP de ~30%'"
    }
  ],
  "conclusion": "string — paragraphe de synthèse 3-5 phrases, adapté au secteur détecté"
}

Génère 5 à 7 axes. Priorise les axes à impact Fort. Sois concret et actionnable.`;

  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    const text = completion.choices[0]?.message?.content ?? "{}";
    const data = JSON.parse(text) as AiInsightsData;
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
