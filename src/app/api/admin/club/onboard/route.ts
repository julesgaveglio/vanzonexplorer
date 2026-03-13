import { NextRequest } from "next/server";
import Groq from "groq-sdk";
import { createClient as createSanityClient } from "@sanity/client";
import { createClient } from "@supabase/supabase-js";

// ── UTILS ──────────────────────────────────────────────────────────────────────

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[éèêë]/g, "e")
    .replace(/[àâä]/g, "a")
    .replace(/[ùûü]/g, "u")
    .replace(/[ôö]/g, "o")
    .replace(/[îï]/g, "i")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function sseEvent(data: Record<string, unknown>): string {
  return `data: ${JSON.stringify(data)}\n\n`;
}

// ── TYPES ──────────────────────────────────────────────────────────────────────

interface ParsedEmail {
  brandName: string;
  website: string;
  promoCode: string | null;
  discountPct: number | null;
  offerType: string;
  expiresAt: string | null;
  notes: string | null;
}

interface ScrapedAnalysis {
  brandDescription: string;
  logoUrl: string | null;
  categories: Array<{ name: string; icon: string }>;
  products: Array<{
    name: string;
    description: string;
    longDescription: string;
    whyThisDeal: string;
    originalPrice: number | null;
    promoPrice: number | null;
    category: string;
    imageUrl: string | null;
    productUrl: string | null;
  }>;
}

// ── SELF-HEALING DB INSERT ─────────────────────────────────────────────────────

/** Retry an insert removing unknown columns until it succeeds or no more columns to drop */
async function selfHealingInsert(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sb: any,
  table: string,
  data: Record<string, unknown>,
  sendLog: (msg: string) => void,
  maxRetries = 8
): Promise<{ data: { id: string } | null; error: { message: string } | null }> {
  const payload: Record<string, unknown> = { ...data };

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const { data: result, error } = await sb
      .from(table)
      .insert(payload)
      .select("id")
      .single();

    if (!error) return { data: result as { id: string }, error: null };

    // Detect "column not found" pattern and auto-remove the offending column
    const colMatch =
      error.message.match(/Could not find the '([\w]+)' column/i) ||
      error.message.match(/column[s]? ['"]?([\w]+)['"]? (?:of|does not exist|not found)/i);

    if (colMatch) {
      const badCol = colMatch[1].trim();
      if (badCol in payload) {
        sendLog(`🔧 Auto-fix: colonne inconnue "${badCol}" dans "${table}" → supprimée, retry...`);
        delete payload[badCol];
        continue;
      }
    }

    // Detect duplicate slug → append random suffix and retry
    if (error.message.includes("duplicate") && "slug" in payload) {
      const newSlug = `${payload.slug}-${Math.random().toString(36).slice(2, 6)}`;
      sendLog(`🔧 Auto-fix: slug dupliqué → nouveau slug "${newSlug}", retry...`);
      payload.slug = newSlug;
      continue;
    }

    return { data: null, error };
  }

  return { data: null, error: { message: `Échec après ${maxRetries} tentatives` } };
}

// ── CLIENTS ───────────────────────────────────────────────────────────────────

function getSanityClient() {
  return createSanityClient({
    projectId: "lewexa74",
    dataset: "production",
    apiVersion: "2024-01-01",
    token: process.env.SANITY_API_WRITE_TOKEN,
    useCdn: false,
  });
}

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// ── IMAGE UPLOAD ──────────────────────────────────────────────────────────────

async function uploadImageToSanity(
  imageUrl: string,
  filename: string
): Promise<string | null> {
  try {
    const res = await fetch(imageUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; VanzonBot/1.0)" },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return null;

    const contentType = res.headers.get("content-type") || "image/jpeg";
    const buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.length === 0) return null;

    const sanity = getSanityClient();
    const asset = await sanity.assets.upload("image", buffer, {
      filename,
      contentType,
    });
    return asset.url;
  } catch {
    return null;
  }
}

// ── JINA AI HELPERS ───────────────────────────────────────────────────────────

interface JinaResult {
  content: string;
  images: string[];
}

/** Extract clean markdown + all image URLs from a page via Jina AI */
async function jinaExtract(url: string): Promise<JinaResult> {
  try {
    const res = await fetch(`https://r.jina.ai/${url}`, {
      headers: {
        "Authorization": `Bearer ${process.env.JINA_API_KEY}`,
        "Accept": "text/plain",
        "X-Return-Format": "markdown",
        "X-With-Images-Summary": "true",
        "X-Timeout": "20",
      },
      signal: AbortSignal.timeout(25000),
    });
    if (!res.ok) return { content: "", images: [] };
    const text = await res.text();

    // Extract image URLs from markdown: ![alt](url) and raw https://...jpg/png/webp
    const mdImages = Array.from(text.matchAll(/!\[.*?\]\((https?:\/\/[^)]+)\)/g)).map(m => m[1]);
    const rawImages = Array.from(text.matchAll(/(https?:\/\/[^\s"'<>]+\.(?:jpg|jpeg|png|webp)(?:\?[^\s"'<>]*)?)/gi)).map(m => m[1]);
    const images = Array.from(new Set([...mdImages, ...rawImages]))
      .filter(u => !u.match(/logo|icon|favicon|sprite|badge|avatar|pixel|tracking|banner|footer|header/i))
      .slice(0, 10);

    return { content: `=== ${url} ===\n${text}`, images };
  } catch {
    return { content: "", images: [] };
  }
}

/** Extract multiple URLs in parallel with Jina AI (max 5 concurrent) */
async function jinaExtractBatch(urls: string[]): Promise<{ content: string; imagesByUrl: Record<string, string[]> }> {
  const chunks: string[][] = [];
  for (let i = 0; i < urls.length; i += 5) chunks.push(urls.slice(i, i + 5));
  const contents: string[] = [];
  const imagesByUrl: Record<string, string[]> = {};

  for (const chunk of chunks) {
    const results = await Promise.all(chunk.map((url) =>
      jinaExtract(url).then(r => ({ url, ...r }))
    ));
    for (const r of results) {
      if (r.content) contents.push(r.content);
      if (r.images.length > 0) imagesByUrl[r.url] = r.images;
    }
  }
  return { content: contents.join("\n\n"), imagesByUrl };
}

/** Fetch og:image / twitter:image from a product page HTML — always publicly accessible */
async function fetchOgImage(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; Twitterbot/1.0)",
        "Accept": "text/html",
      },
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) return null;
    const html = await res.text();
    // og:image (two attribute orders), twitter:image, first large img
    const patterns = [
      /property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
      /content=["']([^"']+)["'][^>]+property=["']og:image["']/i,
      /name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i,
      /content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i,
      /<img[^>]+src=["'](https?:\/\/[^"']+\.(?:jpg|jpeg|png|webp)[^"']*)["'][^>]+(?:width=["'](?:[4-9]\d{2}|\d{4,})["'])/i,
    ];
    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match?.[1]?.startsWith("http")) return match[1];
    }
    return null;
  } catch {
    return null;
  }
}

/** Try uploading from multiple candidate URLs — cycles through User-Agent variants */
async function uploadImageFromCandidates(
  candidates: string[],
  filename: string
): Promise<string | null> {
  const userAgents = [
    "Mozilla/5.0 (compatible; Twitterbot/1.0)",
    "Mozilla/5.0 (compatible; facebookexternalhit/1.1)",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
    "VanzonBot/1.0",
  ];
  for (const url of candidates) {
    if (!url?.startsWith("http")) continue;
    for (const ua of userAgents) {
      try {
        const res = await fetch(url, {
          headers: { "User-Agent": ua },
          signal: AbortSignal.timeout(12000),
        });
        if (!res.ok) continue;
        const contentType = res.headers.get("content-type") || "";
        if (!contentType.startsWith("image/")) continue;
        const buffer = Buffer.from(await res.arrayBuffer());
        if (buffer.length < 1000) continue; // skip tiny/broken images
        const sanity = getSanityClient();
        const asset = await sanity.assets.upload("image", buffer, { filename, contentType });
        return asset.url;
      } catch {
        continue;
      }
    }
  }
  return null;
}

/** Search for a product image via Tavily — returns publicly-indexed image URLs */
async function searchProductImage(productName: string, brandName: string): Promise<string[]> {
  try {
    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: process.env.TAVILY_API_KEY,
        query: `${brandName} ${productName} product official`,
        include_images: true,
        max_results: 8,
      }),
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.images as string[]) || [];
  } catch {
    return [];
  }
}

// ── TAVILY HELPERS ────────────────────────────────────────────────────────────

async function tavilySearch(
  query: string,
  includeDomains: string[]
): Promise<{ urls: string[]; images: string[]; content: string }> {
  try {
    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: process.env.TAVILY_API_KEY,
        query,
        include_images: true,
        max_results: 10,
        include_domains: includeDomains,
      }),
      signal: AbortSignal.timeout(30000),
    });
    if (!res.ok) return { urls: [], images: [], content: "" };
    const data = await res.json();
    const results: Array<{ url: string; content?: string }> = data.results || [];
    const images: string[] = data.images || [];
    const urls = results.map((r) => r.url);
    const content = results.map((r) => `=== ${r.url} ===\n${r.content || ""}`).join("\n\n");
    return { urls, images, content };
  } catch {
    return { urls: [], images: [], content: "" };
  }
}

/** Try to fetch product URLs from sitemap.xml */
async function scrapeSitemap(website: string): Promise<string[]> {
  const sitemapUrls = [
    `${website}/sitemap.xml`,
    `${website}/sitemap_index.xml`,
    `${website}/products/sitemap.xml`,
  ];
  for (const sitemapUrl of sitemapUrls) {
    try {
      const res = await fetch(sitemapUrl, { signal: AbortSignal.timeout(10000) });
      if (!res.ok) continue;
      const xml = await res.text();
      const matches = xml.match(/<loc>(https?:\/\/[^<]+)<\/loc>/g) || [];
      const urls = matches
        .map((m) => m.replace(/<\/?loc>/g, "").trim())
        .filter((u) => /\/(products?|collections?|shop|boutique|accessoires?|solaire)/i.test(u))
        .slice(0, 30);
      if (urls.length > 0) return urls;
    } catch {
      continue;
    }
  }
  return [];
}

// ── CLAUDE HELPERS ────────────────────────────────────────────────────────────

async function claudeParseEmail(emailText: string): Promise<ParsedEmail> {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `Tu es un assistant qui extrait les informations d'une marque partenaire depuis un email.

Extrait les informations suivantes de cet email et réponds UNIQUEMENT avec un JSON valide (pas de markdown, pas de texte autour) :
{
  "brandName": "Nom de la marque",
  "website": "URL du site (avec https://)",
  "promoCode": "Code promo ou null",
  "discountPct": pourcentage de réduction (nombre) ou null,
  "offerType": "code_promo" | "lien_affiliation" | "remise_directe",
  "expiresAt": "date ISO ou null",
  "notes": "notes supplémentaires ou null"
}

Email :
${emailText}`,
      },
    ],
  });

  const text = completion.choices[0]?.message?.content || "";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Le modèle n'a pas retourné de JSON valide");
  return JSON.parse(jsonMatch[0]) as ParsedEmail;
}

async function claudeAnalyzeContent(
  parsed: ParsedEmail,
  homepageContent: string,
  searchContent: string,
  productPagesContent: string,
  searchImages: string[]
): Promise<ScrapedAnalysis> {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: `Tu es un expert e-commerce qui analyse le contenu d'un site de marque vanlife pour en extraire les produits clés.

Marque : ${parsed.brandName}
Site : ${parsed.website}
Code promo : ${parsed.promoCode || "aucun"}
Réduction : ${parsed.discountPct ? parsed.discountPct + "%" : "non précisée"}
Type d'offre : ${parsed.offerType}
Notes : ${parsed.notes || "aucune"}

## Contenu de la page d'accueil :
${homepageContent.substring(0, 2000)}

## Résultats de recherche produits :
${searchContent.substring(0, 2000)}

## Contenu des pages produits :
${productPagesContent.substring(0, 10000)}

## Images trouvées :
${searchImages.slice(0, 20).join("\n")}

Réponds UNIQUEMENT avec un JSON valide (pas de markdown, pas de texte autour) selon ce format :
{
  "brandDescription": "Description courte et percutante de la marque en français (2-3 phrases), orientée vanlife",
  "logoUrl": "URL la plus probable du logo de la marque (cherche dans les images, sinon null)",
  "categories": [
    { "name": "Énergie Solaire", "icon": "Zap" }
  ],
  "products": [
    {
      "name": "Nom du produit",
      "description": "Description courte (1-2 phrases) en français",
      "longDescription": "Description longue (3-5 phrases) en français avec les caractéristiques clés",
      "whyThisDeal": "Pourquoi c'est un bon deal pour les vanlifers (1-2 phrases) en français",
      "originalPrice": prix_original_en_euros_ou_null,
      "promoPrice": prix_promo_en_euros_ou_null,
      "category": "Nom de la catégorie (doit matcher une des catégories ci-dessus)",
      "imageUrl": "URL de l'image du produit ou null",
      "productUrl": "URL directe de la page produit sur le site de la marque ou null"
    }
  ]
}

Règles :
- Maximum 30 produits, couvre TOUTES les catégories trouvées (batteries, panneaux solaires, accessoires, etc.)
- Icônes disponibles : Zap (énergie), Thermometer (isolation/température), Utensils (cuisine), Wifi (connectivité), Camera (photo/vidéo), Shield (sécurité), Droplets (eau/douche), Wind (aération/clim), Package (stockage/rangement), Compass (navigation/GPS), Wrench (outillage), Sun (solaire/lumière), Truck (véhicule), Star (premium/général)
- Les prix doivent être des nombres (ex: 299.99) ou null
- Si le code promo s'applique à tout le magasin, applique le même promoCode à chaque produit
- productUrl doit être l'URL exacte de la page produit (ex: https://fr.bluettipower.eu/products/ac200p), extraite du contenu scrapé
- Rédige tout le contenu en français
`,
      },
    ],
  });

  const text = completion.choices[0]?.message?.content || "";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Le modèle n'a pas retourné de JSON valide");
  return JSON.parse(jsonMatch[0]) as ScrapedAnalysis;
}

// ── MAIN HANDLER ──────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const body = await req.json();
  const emailText: string = body.emailText || "";

  if (!emailText.trim()) {
    return new Response(
      sseEvent({ type: "error", message: "Email vide" }),
      { headers: { "Content-Type": "text/event-stream" } }
    );
  }

  const stream = new ReadableStream({
    async start(controller) {
      function send(data: Record<string, unknown>) {
        controller.enqueue(new TextEncoder().encode(sseEvent(data)));
      }

      try {
        // ── STEP 1: Parse email ──────────────────────────────────────────
        send({ type: "log", level: "info", message: "📧 Analyse de l'email en cours..." });

        let parsed: ParsedEmail;
        try {
          parsed = await claudeParseEmail(emailText);
        } catch (e) {
          send({ type: "error", message: `Erreur parsing email: ${String(e)}` });
          controller.close();
          return;
        }

        send({
          type: "log",
          level: "success",
          message: `✅ Marque détectée : ${parsed.brandName} — ${parsed.website}`,
        });
        if (parsed.promoCode) {
          send({
            type: "log",
            level: "info",
            message: `📧 Code promo : ${parsed.promoCode}${parsed.discountPct ? ` (${parsed.discountPct}%)` : ""}`,
          });
        }

        const domain = (() => {
          try {
            return new URL(parsed.website).hostname;
          } catch {
            return parsed.website;
          }
        })();

        // ── STEP 2: Scrape homepage via Jina AI ─────────────────────────
        send({ type: "log", level: "scraping", message: `🔍 Scraping homepage via Jina AI...` });
        const homepageResult = await jinaExtract(parsed.website);
        const homepageContent = homepageResult.content;
        send({ type: "log", level: "info", message: `✅ Homepage scrapée (${homepageContent.length} cars)` });

        // ── STEP 3: Discover product URLs ────────────────────────────────
        send({ type: "log", level: "scraping", message: `🗺️ Recherche URLs produits (sitemap + Tavily multi-catégories)...` });

        // 3a: Sitemap
        const sitemapUrls = await scrapeSitemap(parsed.website);
        send({ type: "log", level: "info", message: `📋 Sitemap: ${sitemapUrls.length} URLs produits trouvées` });

        // 3b: Multi-category Tavily searches in parallel
        const categories = ["batteries portables", "panneaux solaires", "accessoires"];
        const searchResults = await Promise.all(
          categories.map((cat) =>
            tavilySearch(`${parsed.brandName} ${cat} site:${domain}`, [domain])
          )
        );

        // Merge & deduplicate URLs
        const allImages: string[] = [];
        const seenUrls = new Set<string>(sitemapUrls);
        const allSearchContent: string[] = [];

        for (const result of searchResults) {
          allImages.push(...result.images);
          allSearchContent.push(result.content);
          for (const url of result.urls) seenUrls.add(url);
        }

        const productUrls = Array.from(seenUrls).filter((u) =>
          /\/(product|collection|shop|boutique|accessoire|solaire|batterie|panneau)/i.test(u)
        );
        const searchImages = Array.from(new Set(allImages));
        const searchContent = allSearchContent.join("\n\n");

        send({
          type: "log",
          level: "info",
          message: `✅ ${productUrls.length} URLs produits uniques, ${searchImages.length} images`,
        });

        // ── STEP 4: Deep scrape top product pages via Jina AI ───────────
        const top20Urls = productUrls.slice(0, 20);
        let productPagesContent = "";
        let imagesByUrl: Record<string, string[]> = {};

        if (top20Urls.length > 0) {
          send({
            type: "log",
            level: "scraping",
            message: `🔍 Scraping Jina AI de ${top20Urls.length} pages produits...`,
          });
          const jinaResult = await jinaExtractBatch(top20Urls);
          productPagesContent = jinaResult.content;
          imagesByUrl = jinaResult.imagesByUrl;
          const totalImages = Object.values(imagesByUrl).reduce((n, imgs) => n + imgs.length, 0);
          send({
            type: "log",
            level: "info",
            message: `✅ Contenu extrait (${productPagesContent.length} cars, ${totalImages} images trouvées)`,
          });
        }

        // ── STEP 5: Claude analysis ──────────────────────────────────────
        send({ type: "log", level: "info", message: "🤖 Analyse Claude des produits en cours..." });

        let analysis: ScrapedAnalysis;
        try {
          analysis = await claudeAnalyzeContent(
            parsed,
            homepageContent,
            searchContent,
            productPagesContent,
            searchImages
          );
        } catch (e) {
          send({ type: "error", message: `Erreur analyse Claude: ${String(e)}` });
          controller.close();
          return;
        }

        send({
          type: "log",
          level: "success",
          message: `✅ Analyse terminée : ${analysis.products.length} produits, ${analysis.categories.length} catégories`,
        });

        // Stream brand info
        send({
          type: "brand",
          name: parsed.brandName,
          website: parsed.website,
          description: analysis.brandDescription,
          logoUrl: analysis.logoUrl,
          promoCode: parsed.promoCode,
        });

        // ── STEP 6: Upload logo ──────────────────────────────────────────
        let finalLogoUrl: string | null = null;
        if (analysis.logoUrl) {
          send({
            type: "log",
            level: "info",
            message: `📤 Upload du logo : ${analysis.logoUrl}`,
          });
          finalLogoUrl = await uploadImageToSanity(
            analysis.logoUrl,
            `logo-${slugify(parsed.brandName)}.png`
          );
          if (finalLogoUrl) {
            send({ type: "log", level: "success", message: `✅ Logo uploadé : ${finalLogoUrl}` });
          } else {
            send({ type: "log", level: "warning", message: `⚠️ Upload logo échoué, on continue sans logo` });
          }
        }

        // ── STEP 7: Upload product images — stratégie 5 sources ──────────
        const productsWithImages = await Promise.all(
          analysis.products.slice(0, 30).map(async (product, i) => {
            const filename = `product-${slugify(product.name)}.jpg`;
            send({
              type: "log",
              level: "info",
              message: `📤 Image ${i + 1}/${Math.min(analysis.products.length, 30)}: ${product.name}`,
            });

            // Source 1 — og:image de la page produit (toujours public pour social preview)
            const productPageUrl = product.productUrl || null;
            const ogImage = productPageUrl ? await fetchOgImage(productPageUrl) : null;

            // Source 2 — URL suggérée par Groq
            // Source 3 — Images Jina extraites (pages dont l'URL contient le nom produit)
            const jinaImages = Object.entries(imagesByUrl)
              .filter(([url]) =>
                product.name.toLowerCase().split(" ").some(w => w.length > 3 && url.toLowerCase().includes(w))
              )
              .flatMap(([, imgs]) => imgs);

            // Source 4 — Images Tavily globales matchées par nom
            const tavilyMatches = searchImages.filter(u =>
              product.name.toLowerCase().split(" ").some(w => w.length > 4 && u.toLowerCase().includes(w))
            );

            const candidates = [
              ogImage,
              product.imageUrl,
              ...jinaImages,
              ...tavilyMatches,
            ].filter(Boolean) as string[];

            let uploadedUrl = await uploadImageFromCandidates(candidates, filename);

            // Source 5 — Tavily image search dédié en dernier recours
            if (!uploadedUrl) {
              send({ type: "log", level: "warning", message: `🔍 Image search pour "${product.name}"...` });
              const fallbackImages = await searchProductImage(product.name, parsed.brandName);
              uploadedUrl = await uploadImageFromCandidates(fallbackImages, filename);
            }

            if (uploadedUrl) {
              send({ type: "log", level: "success", message: `✅ Image uploadée : ${product.name}` });
            } else {
              send({ type: "log", level: "warning", message: `⚠️ Pas d'image uploadable pour "${product.name}" — placeholder utilisé` });
            }

            return { ...product, uploadedImageUrl: uploadedUrl };
          })
        );

        // ── STEP 8: DB operations ────────────────────────────────────────
        const sb = getSupabase();

        // Upsert categories
        send({ type: "log", level: "info", message: "💾 Création des catégories..." });
        const categoryIdMap: Record<string, string> = {};

        for (const cat of analysis.categories) {
          const catSlug = slugify(cat.name);
          // Check if category exists
          const { data: existingCat } = await sb
            .from("categories")
            .select("id")
            .eq("slug", catSlug)
            .single();

          if (existingCat) {
            categoryIdMap[cat.name] = existingCat.id;
            send({
              type: "log",
              level: "info",
              message: `ℹ️ Catégorie existante : ${cat.name}`,
            });
          } else {
            const { data: newCat, error: catError } = await selfHealingInsert(
              sb,
              "categories",
              {
                name: cat.name,
                slug: catSlug,
                icon: cat.icon,
                description: null,
                sort_order: 0,
              },
              (msg) => send({ type: "log", level: "warning", message: msg })
            );

            if (catError) {
              send({
                type: "log",
                level: "warning",
                message: `⚠️ Erreur catégorie "${cat.name}": ${catError.message}`,
              });
            } else if (newCat) {
              categoryIdMap[cat.name] = newCat.id;
              send({
                type: "log",
                level: "success",
                message: `✅ Catégorie créée : ${cat.name}`,
              });
            }
          }
        }

        // Insert brand
        send({ type: "log", level: "info", message: "💾 Création de la marque..." });
        const brandSlug = slugify(parsed.brandName);
        const { data: newBrand, error: brandError } = await selfHealingInsert(
          sb,
          "brands",
          {
            name: parsed.brandName,
            slug: brandSlug,
            description: analysis.brandDescription,
            website_url: parsed.website,
            logo_url: finalLogoUrl,
            promo_code_global: parsed.promoCode,
            affiliate_url_base: parsed.website,
            is_partner: true,
            is_trusted: true,
            status: "active",
          },
          (msg) => send({ type: "log", level: "warning", message: msg })
        );

        if (brandError) {
          send({
            type: "error",
            message: `Erreur création marque: ${brandError.message}`,
          });
          controller.close();
          return;
        }

        const brandId = newBrand!.id;
        send({
          type: "log",
          level: "success",
          message: `✅ Marque "${parsed.brandName}" créée (id: ${brandId})`,
        });

        // Insert products
        send({ type: "log", level: "info", message: "💾 Insertion des produits..." });
        let productsCreated = 0;

        for (const product of productsWithImages) {
          try {
            const categoryId =
              categoryIdMap[product.category] ||
              Object.values(categoryIdMap)[0] ||
              null;

            const productSlug = slugify(product.name);

            const { error: productError } = await selfHealingInsert(
              sb,
              "products",
              {
                name: product.name,
                slug: productSlug,
                brand_id: brandId,
                category_id: categoryId,
                description: product.description,
                long_description: product.longDescription,
                why_this_deal: product.whyThisDeal,
                original_price: product.originalPrice ?? 0,
                promo_price: product.promoPrice ?? 0,
                promo_code: parsed.promoCode,
                offer_type: parsed.offerType,
                affiliate_url: product.productUrl || parsed.website,
                main_image_url: product.uploadedImageUrl || product.imageUrl,
                is_featured: productsCreated < 3,
                is_active: true,
                priority_score: 10 - productsCreated,
                expires_at: parsed.expiresAt,
              },
              (msg) => send({ type: "log", level: "warning", message: msg })
            );

            if (productError) {
              send({
                type: "log",
                level: "warning",
                message: `⚠️ Erreur produit "${product.name}": ${productError.message}`,
              });
            } else {
              productsCreated++;
              send({
                type: "product",
                name: product.name,
                description: product.description,
                imageUrl: product.uploadedImageUrl || product.imageUrl,
                category: product.category,
                originalPrice: product.originalPrice,
                promoPrice: product.promoPrice,
              });
              send({
                type: "log",
                level: "product",
                message: `📦 Produit créé : ${product.name}`,
              });
            }
          } catch (e) {
            send({
              type: "log",
              level: "warning",
              message: `⚠️ Erreur produit "${product.name}": ${String(e)}`,
            });
          }
        }

        // ── DONE ──────────────────────────────────────────────────────────
        send({
          type: "done",
          brandName: parsed.brandName,
          brandId,
          productsCreated,
          categoriesCreated: analysis.categories.length,
          logoUrl: finalLogoUrl,
        });

        send({
          type: "log",
          level: "success",
          message: `🎉 Onboarding terminé ! Marque "${parsed.brandName}" créée avec ${productsCreated} produits.`,
        });
      } catch (e) {
        controller.enqueue(
          new TextEncoder().encode(
            sseEvent({ type: "error", message: `Erreur inattendue: ${String(e)}` })
          )
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
      "X-Accel-Buffering": "no",
    },
  });
}
