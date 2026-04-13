import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import * as cheerio from "cheerio";
import type { OnPageData, OnPageItem } from "@/types/seo-report";

function isPrivateHost(hostname: string): boolean {
  return (
    hostname === "localhost" ||
    /^127\./.test(hostname) ||
    /^10\./.test(hostname) ||
    /^192\.168\./.test(hostname) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(hostname) ||
    /^169\.254\./.test(hostname) ||
    /^::1$/.test(hostname)
  );
}

export async function POST(req: NextRequest) {
  const check = await requireAdmin();
  if (check instanceof NextResponse) return check;

  const { url } = await req.json();
  if (!url) return NextResponse.json({ error: "url requis" }, { status: 400 });

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return NextResponse.json({ error: "URL invalide" }, { status: 400 });
  }
  if (isPrivateHost(parsed.hostname)) {
    return NextResponse.json({ error: "URL non autorisée" }, { status: 400 });
  }

  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(10000),
      headers: { "User-Agent": "Mozilla/5.0 (compatible; VanzonSEOBot/1.0)" },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();
    const $ = cheerio.load(html);

    const title      = $("title").first().text().trim();
    const metaDesc   = $('meta[name="description"]').attr("content")?.trim() ?? "";
    const canonical  = $('link[rel="canonical"]').attr("href")?.trim() ?? "";
    const noindex    = $('meta[name="robots"]').attr("content")?.toLowerCase().includes("noindex") ?? false;
    const jsonLd     = $('script[type="application/ld+json"]').length > 0;
    const h1s        = $("h1").map((_, el) => $(el).text().trim()).get();
    const h2s        = $("h2").map((_, el) => $(el).text().trim()).get().slice(0, 10);
    const h3s        = $("h3").map((_, el) => $(el).text().trim()).get().slice(0, 10);

    // Images
    const allImages  = $("img");
    const totalImages = allImages.length;
    const imagesWithoutAlt = allImages.filter((_, el) => !$(el).attr("alt")).length;

    // Open Graph
    const ogTitle = $('meta[property="og:title"]').attr("content")?.trim() ?? "";
    const ogDesc = $('meta[property="og:description"]').attr("content")?.trim() ?? "";
    const ogImage = $('meta[property="og:image"]').attr("content")?.trim() ?? "";
    const hasOg = Boolean(ogTitle || ogDesc || ogImage);

    // Viewport
    const viewport = $('meta[name="viewport"]').attr("content")?.trim() ?? "";

    // Lang
    const lang = $("html").attr("lang")?.trim() ?? "";

    // HTTPS
    const isHttps = parsed.protocol === "https:";

    // Links
    const allLinks = $("a[href]");
    let internalLinks = 0;
    let externalLinks = 0;
    allLinks.each((_, el) => {
      const href = $(el).attr("href") ?? "";
      if (href.startsWith("/") || href.startsWith("#") || href.includes(parsed.hostname)) {
        internalLinks++;
      } else if (href.startsWith("http")) {
        externalLinks++;
      }
    });

    // Word count (body text)
    const bodyText = $("body").text().replace(/\s+/g, " ").trim();
    const wordCount = bodyText.split(" ").filter((w) => w.length > 1).length;

    const checks: OnPageItem[] = [
      { key: "title_present",  label: "Title tag présent",               pass: title.length > 0,              value: title },
      { key: "title_length",   label: "Title longueur (30-60 car.)",     pass: title.length >= 30 && title.length <= 60, detail: `${title.length} caractères` },
      { key: "meta_present",   label: "Meta description présente",       pass: metaDesc.length > 0,            value: metaDesc },
      { key: "meta_length",    label: "Meta description (120-160)",      pass: metaDesc.length >= 120 && metaDesc.length <= 160, detail: `${metaDesc.length} caractères` },
      { key: "h1_unique",      label: "H1 unique et présent",            pass: h1s.length === 1,               detail: `${h1s.length} H1 trouvé(s)` },
      { key: "no_noindex",     label: "Pas de balise noindex",           pass: !noindex },
      { key: "canonical",      label: "Canonical tag présent",           pass: canonical.length > 0,           value: canonical },
      { key: "json_ld",        label: "Schema JSON-LD présent",          pass: jsonLd },
      { key: "open_graph",     label: "Open Graph (og:title/image)",     pass: hasOg,                          detail: hasOg ? `og:title="${ogTitle.slice(0, 50)}"` : "Absent" },
      { key: "viewport",       label: "Meta viewport présente",          pass: viewport.length > 0,            value: viewport },
      { key: "lang_attr",      label: "Attribut lang sur <html>",        pass: lang.length > 0,                value: lang },
      { key: "https",          label: "HTTPS activé",                    pass: isHttps },
      { key: "img_alt",        label: "Images avec attribut alt",        pass: totalImages === 0 || imagesWithoutAlt === 0, detail: `${imagesWithoutAlt}/${totalImages} sans alt` },
      { key: "word_count",     label: "Contenu suffisant (> 300 mots)",  pass: wordCount > 300,                detail: `${wordCount} mots` },
    ];

    const passCount = checks.filter((c) => c.pass).length;
    const score = Math.round((passCount / checks.length) * 100);

    const data: OnPageData = {
      score,
      items: checks,
      imagesWithoutAlt,
      totalImages,
      h2s,
      h3s,
      internalLinks,
      externalLinks,
      wordCount,
    };
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
