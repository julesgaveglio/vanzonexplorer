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
  if (parsed.protocol !== "https:") {
    return NextResponse.json({ error: "URL doit être https://" }, { status: 400 });
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

    const allImages  = $("img");
    const totalImages = allImages.length;
    const imagesWithoutAlt = allImages.filter((_, el) => !$(el).attr("alt")).length;

    const checks: OnPageItem[] = [
      { key: "title_present",  label: "Title tag présent",               pass: title.length > 0,              value: title },
      { key: "title_length",   label: "Title longueur (30-60 car.)",     pass: title.length >= 30 && title.length <= 60, detail: `${title.length} caractères` },
      { key: "meta_present",   label: "Meta description présente",       pass: metaDesc.length > 0,            value: metaDesc },
      { key: "meta_length",    label: "Meta description longueur (120-160)", pass: metaDesc.length >= 120 && metaDesc.length <= 160, detail: `${metaDesc.length} caractères` },
      { key: "h1_unique",      label: "H1 unique et présent",            pass: h1s.length === 1,               detail: `${h1s.length} H1 trouvé(s)` },
      { key: "no_noindex",     label: "Pas de balise noindex",           pass: !noindex },
      { key: "canonical",      label: "Canonical tag présent",           pass: canonical.length > 0,           value: canonical },
      { key: "json_ld",        label: "Schema JSON-LD présent",          pass: jsonLd },
    ];

    const passCount = checks.filter((c) => c.pass).length;
    const altBonus = totalImages === 0 ? 1 : imagesWithoutAlt === 0 ? 1 : 0;
    const score = Math.round(((passCount + altBonus) / (checks.length + 1)) * 100);

    const data: OnPageData = { score, items: checks, imagesWithoutAlt, totalImages, h2s, h3s };
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
