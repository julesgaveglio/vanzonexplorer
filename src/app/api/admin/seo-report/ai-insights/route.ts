import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { groqWithFallback } from "@/lib/groq-with-fallback";
import type { AiInsightsData, SeoReportData } from "@/types/seo-report";

export async function POST(req: NextRequest) {
  const check = await requireAdmin();
  if (check instanceof NextResponse) return check;

  const reportData: Partial<SeoReportData> & { url: string } = await req.json();

  const sslGrade = reportData.authority?.ssl?.grade ?? "N/A";
  const domainAge = reportData.authority?.whois?.domainAge ?? "N/A";
  const domainExpiry = reportData.authority?.whois?.expiryDate
    ? new Date(reportData.authority.whois.expiryDate).toLocaleDateString("fr-FR")
    : "N/A";
  const registrar = reportData.authority?.whois?.registrar ?? "N/A";
  const pageRank = reportData.authority?.pageRank ?? "N/A";
  const ip = reportData.authority?.dns?.ip ?? "N/A";

  const prompt = `Tu es un consultant SEO senior expert francophone. Analyse les données d'audit technique d'un site web et produis un rapport complet en français.

URL analysée : ${reportData.url}

═══ PERFORMANCE (Google PageSpeed Insights) ═══
Mobile : performance ${reportData.pagespeed?.mobile.scores.performance ?? "N/A"}/100, SEO ${reportData.pagespeed?.mobile.scores.seo ?? "N/A"}/100, accessibilité ${reportData.pagespeed?.mobile.scores.accessibility ?? "N/A"}/100
Desktop : performance ${reportData.pagespeed?.desktop.scores.performance ?? "N/A"}/100, SEO ${reportData.pagespeed?.desktop.scores.seo ?? "N/A"}/100
Core Web Vitals mobile :
  - LCP : ${reportData.pagespeed?.mobile.vitals.lcp.value ?? "N/A"}
  - CLS : ${reportData.pagespeed?.mobile.vitals.cls.value ?? "N/A"}
  - TBT : ${reportData.pagespeed?.mobile.vitals.tbt.value ?? "N/A"}
  - FCP : ${reportData.pagespeed?.mobile.vitals.fcp.value ?? "N/A"}
Opportunités : ${reportData.pagespeed?.mobile.opportunities.map((o) => o.title).join(", ") || "aucune"}

═══ ON-PAGE ═══
Score : ${reportData.onpage?.score ?? "N/A"}/100
Vérifications échouées : ${reportData.onpage?.items.filter((i) => !i.pass).map((i) => `${i.label} (${i.detail ?? i.value ?? ""})`).join(", ") || "aucune"}
Images sans alt : ${reportData.onpage?.imagesWithoutAlt ?? 0}/${reportData.onpage?.totalImages ?? 0}
Liens internes : ${reportData.onpage?.internalLinks ?? "N/A"} · Liens externes : ${reportData.onpage?.externalLinks ?? "N/A"}
Nombre de mots : ${reportData.onpage?.wordCount ?? "N/A"}

═══ AUTORITÉ & TECHNIQUE ═══
Domain Authority (DFS) : ${reportData.authority?.domainAuthority ?? "N/A"}
Backlinks : ${reportData.authority?.backlinksCount ?? "N/A"}
Domaines référents : ${reportData.authority?.referringDomains ?? "N/A"}
PageRank : ${pageRank}
SSL Grade : ${sslGrade}
Âge du domaine : ${domainAge}
Expiration : ${domainExpiry}
Registrar : ${registrar}
IP : ${ip}

═══ CONCURRENTS ═══
${reportData.competitors?.competitors.map((c) => `- ${c.domain} (${c.intersections} mots-clés communs, pertinence ${c.relevance}%)`).join("\n") || "N/A"}

Réponds UNIQUEMENT avec un objet JSON valide :
{
  "secteur": "secteur d'activité détecté",
  "resumeExecutif": "3 phrases : forces principales + faiblesses principales + verdict",
  "scoreGlobal": nombre 0-100,
  "scoreJustification": "1-2 phrases expliquant le score",
  "axes": [
    {
      "titre": "titre court de l'action",
      "priorite": "Fort" | "Moyen" | "Faible",
      "description": "explication concrète 1-2 phrases",
      "impact": "impact estimé ex. 'Peut améliorer le score perf de ~20pts'"
    }
  ],
  "analyseCwv": "analyse des Core Web Vitals en langage non-technique (3-4 phrases)",
  "analyseAutorite": "commentaire sur l'autorité, les backlinks et le positionnement (3-4 phrases)",
  "conclusion": "paragraphe de synthèse 4-5 phrases avec plan d'action global"
}

Génère 5 à 7 axes. Priorise les axes Fort en premier. Sois CONCRET et ACTIONNABLE.`;

  try {
    const { content } = await groqWithFallback({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
      temperature: 0.3,
      response_format: { type: "json_object" },
      max_tokens: 3000,
    });

    const data = JSON.parse(content.trim()) as AiInsightsData;
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
