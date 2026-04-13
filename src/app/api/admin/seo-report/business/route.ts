// Étape 0 — Analyse business : scrape pages + Groq pour comprendre le business model
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { groqWithFallback } from "@/lib/groq-with-fallback";
import type { BusinessAnalysis } from "@/types/seo-report";

async function fetchPageText(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(8000),
      headers: { "User-Agent": "Mozilla/5.0 (compatible; VanzonSEOBot/1.0)" },
    });
    if (!res.ok) return "";
    const html = await res.text();
    // Extraire le texte brut (title, h1-h3, meta, nav, buttons, p)
    const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
    const metaDescMatch = html.match(/<meta[^>]*name="description"[^>]*content="([^"]*)"[^>]*>/i);
    const headings = Array.from(html.matchAll(/<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/gi))
      .map((m) => m[1].replace(/<[^>]+>/g, "").trim())
      .filter(Boolean)
      .slice(0, 15);
    const navLinks = Array.from(html.matchAll(/<a[^>]*>([\s\S]*?)<\/a>/gi))
      .map((m) => m[1].replace(/<[^>]+>/g, "").trim())
      .filter((t) => t.length > 2 && t.length < 60)
      .slice(0, 20);
    const buttons = Array.from(html.matchAll(/<button[^>]*>([\s\S]*?)<\/button>/gi))
      .map((m) => m[1].replace(/<[^>]+>/g, "").trim())
      .filter(Boolean)
      .slice(0, 10);

    return [
      `URL: ${url}`,
      `Title: ${titleMatch?.[1] ?? ""}`,
      `Meta: ${metaDescMatch?.[1] ?? ""}`,
      `Headings: ${headings.join(" | ")}`,
      `Nav: ${navLinks.join(", ")}`,
      `CTAs: ${buttons.join(", ")}`,
    ].join("\n");
  } catch {
    return "";
  }
}

async function fetchSitemapUrls(baseUrl: string): Promise<string[]> {
  try {
    const res = await fetch(`${baseUrl}/sitemap.xml`, {
      signal: AbortSignal.timeout(5000),
      headers: { "User-Agent": "VanzonSEOBot/1.0" },
    });
    if (!res.ok) return [];
    const xml = await res.text();
    const urls = Array.from(xml.matchAll(/<loc>([^<]+)<\/loc>/gi))
      .map((m) => m[1])
      .slice(0, 20);
    return urls;
  } catch {
    return [];
  }
}

export async function POST(req: NextRequest) {
  const check = await requireAdmin();
  if (check instanceof NextResponse) return check;

  const { url } = await req.json();
  if (!url) return NextResponse.json({ error: "url requis" }, { status: 400 });

  try {
    let baseUrl: string;
    try {
      const u = new URL(url);
      baseUrl = `${u.protocol}//${u.hostname}`;
    } catch {
      return NextResponse.json({ error: "URL invalide" }, { status: 400 });
    }

    // Scrape homepage + sitemap + pages clés
    const [homepageText, sitemapUrls] = await Promise.all([
      fetchPageText(url),
      fetchSitemapUrls(baseUrl),
    ]);

    // Sélectionner 5 pages clés du sitemap
    const priorityPaths = ["/about", "/a-propos", "/services", "/pricing", "/tarif", "/blog", "/contact", "/formation", "/location", "/achat"];
    const selectedUrls = sitemapUrls
      .filter((u) => priorityPaths.some((p) => u.toLowerCase().includes(p)))
      .slice(0, 5);
    // Compléter avec d'autres pages si pas assez
    if (selectedUrls.length < 3) {
      for (const u of sitemapUrls) {
        if (!selectedUrls.includes(u) && selectedUrls.length < 5) selectedUrls.push(u);
      }
    }

    const pagesTexts = await Promise.all(selectedUrls.map(fetchPageText));
    const allContent = [homepageText, ...pagesTexts.filter(Boolean)].join("\n\n---\n\n");

    // Groq analysis
    const { content } = await groqWithFallback({
      messages: [
        {
          role: "system",
          content: `À partir du contenu HTML suivant de plusieurs pages d'un site web, détermine en JSON UNIQUEMENT :
{
  "nom_site": "string",
  "secteur_activite": "string",
  "business_model": "string — ex: SaaS, e-commerce, marketplace, service local, média",
  "produits_services": ["string"],
  "cible_audience": "string",
  "proposition_valeur": "string — 1 phrase",
  "zone_geo": "string — ex: France, Pays Basque, International",
  "mots_cles_metier": ["string — 5 à 10 mots-clés métier"]
}
Sois factuel, base-toi uniquement sur le contenu fourni.`,
        },
        { role: "user", content: allContent.slice(0, 8000) },
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.2,
      response_format: { type: "json_object" },
      max_tokens: 1000,
    });

    const data = JSON.parse(content.trim()) as BusinessAnalysis;
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
