import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
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
  }>;
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

// ── TAVILY HELPERS ────────────────────────────────────────────────────────────

async function tavilyExtract(urls: string[]): Promise<string> {
  try {
    const res = await fetch("https://api.tavily.com/extract", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: process.env.TAVILY_API_KEY,
        urls,
        extract_depth: "advanced",
      }),
      signal: AbortSignal.timeout(30000),
    });
    if (!res.ok) return "";
    const data = await res.json();
    const results: Array<{ url: string; raw_content?: string }> =
      data.results || [];
    return results.map((r) => `=== ${r.url} ===\n${r.raw_content || ""}`).join("\n\n");
  } catch {
    return "";
  }
}

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
    const results: Array<{ url: string; content?: string }> =
      data.results || [];
    const images: string[] = data.images || [];
    const urls = results.map((r) => r.url);
    const content = results
      .map((r) => `=== ${r.url} ===\n${r.content || ""}`)
      .join("\n\n");
    return { urls, images, content };
  } catch {
    return { urls: [], images: [], content: "" };
  }
}

// ── CLAUDE HELPERS ────────────────────────────────────────────────────────────

async function claudeParseEmail(emailText: string): Promise<ParsedEmail> {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const msg = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
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

  const text =
    msg.content[0].type === "text" ? msg.content[0].text : "";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Claude n'a pas retourné de JSON valide");
  return JSON.parse(jsonMatch[0]) as ParsedEmail;
}

async function claudeAnalyzeContent(
  parsed: ParsedEmail,
  homepageContent: string,
  searchContent: string,
  productPagesContent: string,
  searchImages: string[]
): Promise<ScrapedAnalysis> {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const msg = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
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
${homepageContent.substring(0, 3000)}

## Résultats de recherche produits :
${searchContent.substring(0, 3000)}

## Contenu des pages produits :
${productPagesContent.substring(0, 6000)}

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
      "imageUrl": "URL de l'image du produit ou null"
    }
  ]
}

Règles :
- Maximum 10 produits, choisis les plus pertinents pour des vanlifers
- Icônes disponibles : Zap (énergie), Thermometer (isolation/température), Utensils (cuisine), Wifi (connectivité), Camera (photo/vidéo), Shield (sécurité), Droplets (eau/douche), Wind (aération/clim), Package (stockage/rangement), Compass (navigation/GPS), Wrench (outillage), Sun (solaire/lumière), Truck (véhicule), Star (premium/général)
- Les prix doivent être des nombres (ex: 299.99) ou null
- Si le code promo s'applique à tout le magasin, applique le même promoCode à chaque produit
- Rédige tout le contenu en français
`,
      },
    ],
  });

  const text =
    msg.content[0].type === "text" ? msg.content[0].text : "";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Claude n'a pas retourné de JSON valide");
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

        // ── STEP 2: Scrape homepage ──────────────────────────────────────
        send({ type: "log", level: "scraping", message: `🔍 Scraping de la homepage ${parsed.website}...` });
        const homepageContent = await tavilyExtract([parsed.website]);
        send({ type: "log", level: "info", message: `✅ Homepage scrapée (${homepageContent.length} caractères)` });

        // ── STEP 3: Search products ──────────────────────────────────────
        send({
          type: "log",
          level: "scraping",
          message: `🔍 Recherche des produits sur ${domain}...`,
        });
        const { urls: productUrls, images: searchImages, content: searchContent } =
          await tavilySearch(
            `${parsed.brandName} products catalog ${parsed.website}`,
            [domain]
          );
        send({
          type: "log",
          level: "info",
          message: `✅ ${productUrls.length} pages produits trouvées, ${searchImages.length} images`,
        });

        // ── STEP 4: Scrape product pages ─────────────────────────────────
        const top8Urls = productUrls.slice(0, 8);
        let productPagesContent = "";

        if (top8Urls.length > 0) {
          send({
            type: "log",
            level: "scraping",
            message: `🔍 Scraping de ${top8Urls.length} pages produits en lots de 3...`,
          });

          const batches: string[][] = [];
          for (let i = 0; i < top8Urls.length; i += 3) {
            batches.push(top8Urls.slice(i, i + 3));
          }

          for (const batch of batches) {
            const content = await tavilyExtract(batch);
            productPagesContent += content + "\n\n";
            send({
              type: "log",
              level: "scraping",
              message: `🔍 Lot de ${batch.length} pages scrapé`,
            });
          }
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

        // ── STEP 7: Upload product images ────────────────────────────────
        const productsWithImages = await Promise.all(
          analysis.products.slice(0, 10).map(async (product, i) => {
            if (!product.imageUrl) return { ...product, uploadedImageUrl: null };
            send({
              type: "log",
              level: "info",
              message: `📤 Upload image produit ${i + 1}/${Math.min(analysis.products.length, 10)} : ${product.name}`,
            });
            const uploadedUrl = await uploadImageToSanity(
              product.imageUrl,
              `product-${slugify(product.name)}.jpg`
            );
            if (!uploadedUrl) {
              send({
                type: "log",
                level: "warning",
                message: `⚠️ Upload image "${product.name}" échoué`,
              });
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
            const { data: newCat, error: catError } = await sb
              .from("categories")
              .insert({
                name: cat.name,
                slug: catSlug,
                icon: cat.icon,
                description: null,
                sort_order: 0,
              })
              .select("id")
              .single();

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
        const { data: newBrand, error: brandError } = await sb
          .from("brands")
          .insert({
            name: parsed.brandName,
            slug: brandSlug,
            description: analysis.brandDescription,
            website_url: parsed.website,
            logo_png_url: finalLogoUrl,
            logo_url: finalLogoUrl,
            promo_code_global: parsed.promoCode,
            affiliate_url_base: parsed.website,
            is_partner: true,
            is_trusted: true,
            status: "active",
          })
          .select("id")
          .single();

        if (brandError) {
          send({
            type: "error",
            message: `Erreur création marque: ${brandError.message}`,
          });
          controller.close();
          return;
        }

        const brandId = newBrand.id;
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

            const { error: productError } = await sb.from("products").insert({
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
              affiliate_url: parsed.website,
              main_image_url: product.uploadedImageUrl || product.imageUrl,
              is_featured: productsCreated < 3,
              is_active: true,
              priority_score: 10 - productsCreated,
              expires_at: parsed.expiresAt,
            });

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
