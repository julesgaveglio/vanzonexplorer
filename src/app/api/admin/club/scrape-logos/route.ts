import { NextRequest } from "next/server";
import { createClient as createSanityClient } from "@sanity/client";
import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/auth";
import { NextResponse } from "next/server";

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

function sseEvent(data: Record<string, unknown>): string {
  return `data: ${JSON.stringify(data)}\n\n`;
}

/** Strategies to find a logo from a brand's homepage */
async function scrapeLogo(websiteUrl: string, brandName: string): Promise<string | null> {
  const candidates: string[] = [];

  // 1. Fetch the homepage HTML and extract logo candidates
  try {
    const res = await fetch(websiteUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; Twitterbot/1.0)",
        "Accept": "text/html",
      },
      signal: AbortSignal.timeout(12000),
    });
    if (res.ok) {
      const html = await res.text();

      // og:image (brand sites often use their logo as og:image)
      const ogMatch = html.match(/property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
        || html.match(/content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
      if (ogMatch?.[1]?.startsWith("http")) candidates.push(ogMatch[1]);

      // Explicit logo image tags
      const logoPatterns = [
        /<img[^>]+(?:class|id|alt)=["'][^"']*logo[^"']*["'][^>]+src=["'](https?:\/\/[^"']+)["']/gi,
        /src=["'](https?:\/\/[^"']+(?:logo|brand)[^"']*\.(?:png|svg|webp|jpg))["']/gi,
        /<link[^>]+rel=["'][^"']*icon[^"']*["'][^>]+href=["'](https?:\/\/[^"']+)["']/gi,
      ];
      for (const pattern of logoPatterns) {
        const matches = Array.from(html.matchAll(pattern));
        for (const m of matches.slice(0, 3)) {
          if (m[1]?.startsWith("http")) candidates.push(m[1]);
        }
      }
    }
  } catch { /* continue */ }

  // 2. Try Jina AI with image summary
  try {
    const res = await fetch(`https://r.jina.ai/${websiteUrl}`, {
      headers: {
        "Authorization": `Bearer ${process.env.JINA_API_KEY}`,
        "Accept": "text/plain",
        "X-Return-Format": "markdown",
        "X-With-Images-Summary": "true",
        "X-Timeout": "15",
      },
      signal: AbortSignal.timeout(20000),
    });
    if (res.ok) {
      const text = await res.text();
      // Look for logo in image lines
      const logoLines = text.split("\n").filter(l =>
        l.toLowerCase().includes("logo") && l.includes("http")
      );
      for (const line of logoLines.slice(0, 3)) {
        const m = line.match(/\((https?:\/\/[^)]+)\)/);
        if (m?.[1]) candidates.push(m[1]);
      }
    }
  } catch { /* continue */ }

  // 3. Common logo URL patterns
  const origin = new URL(websiteUrl).origin;
  candidates.push(
    `${origin}/logo.png`,
    `${origin}/logo.svg`,
    `${origin}/images/logo.png`,
    `${origin}/assets/logo.png`,
    `${origin}/img/logo.png`,
  );

  // Try uploading each candidate
  const userAgents = [
    "Mozilla/5.0 (compatible; Twitterbot/1.0)",
    "Mozilla/5.0 (compatible; facebookexternalhit/1.1)",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
  ];
  const filename = `logo-${brandName.toLowerCase().replace(/[^a-z0-9]/g, "-")}.png`;
  const sanity = getSanityClient();

  for (const url of candidates) {
    if (!url?.startsWith("http")) continue;
    for (const ua of userAgents) {
      try {
        const res = await fetch(url, {
          headers: { "User-Agent": ua },
          signal: AbortSignal.timeout(10000),
        });
        if (!res.ok) continue;
        const contentType = res.headers.get("content-type") || "";
        if (!contentType.startsWith("image/")) continue;
        const buffer = Buffer.from(await res.arrayBuffer());
        if (buffer.length < 500) continue;
        const asset = await sanity.assets.upload("image", buffer, { filename, contentType });
        return asset.url;
      } catch { continue; }
    }
  }

  return null;
}

export async function POST(req: NextRequest) {
  const check = await requireAdmin();
  if (check instanceof NextResponse) return check;
  const body = await req.json().catch(() => ({}));
  const brandId: string | undefined = body.brandId; // optional: scrape one specific brand

  const stream = new ReadableStream({
    async start(controller) {
      function send(data: Record<string, unknown>) {
        controller.enqueue(new TextEncoder().encode(sseEvent(data)));
      }

      try {
        const sb = getSupabase();

        // Fetch brands to process
        let query = sb.from("brands").select("id, name, website_url, logo_url").eq("status", "active");
        if (brandId) query = query.eq("id", brandId);

        const { data: brands, error } = await query;
        if (error) {
          send({ type: "error", message: `Erreur Supabase: ${error.message}` });
          controller.close();
          return;
        }

        send({ type: "log", level: "info", message: `🔍 ${brands.length} marque(s) à traiter...` });

        let updated = 0;
        for (const brand of brands as Array<{ id: string; name: string; website_url: string | null; logo_url: string | null }>) {
          if (!brand.website_url) {
            send({ type: "log", level: "warning", message: `⚠️ ${brand.name} — pas d'URL, ignoré` });
            continue;
          }

          send({ type: "log", level: "info", message: `🔍 Scraping logo ${brand.name} (${brand.website_url})...` });

          const logoUrl = await scrapeLogo(brand.website_url, brand.name);

          if (logoUrl) {
            await sb.from("brands").update({ logo_url: logoUrl }).eq("id", brand.id);
            send({ type: "log", level: "success", message: `✅ Logo ${brand.name} uploadé` });
            send({ type: "brand", id: brand.id, name: brand.name, logoUrl });
            updated++;
          } else {
            send({ type: "log", level: "warning", message: `⚠️ Aucun logo trouvé pour ${brand.name}` });
          }
        }

        send({ type: "done", updated, total: brands.length });
      } catch (e) {
        controller.enqueue(new TextEncoder().encode(sseEvent({ type: "error", message: String(e) })));
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
