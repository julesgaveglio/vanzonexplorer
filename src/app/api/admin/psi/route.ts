import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const check = await requireAdmin();
  if (check instanceof NextResponse) return check;

  const url = req.nextUrl.searchParams.get("url");
  const strategy = req.nextUrl.searchParams.get("strategy") ?? "mobile";

  if (!url) return NextResponse.json({ error: "url requis" }, { status: 400 });

  const apiKey = process.env.GOOGLE_PSI_API_KEY ?? process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "GOOGLE_PSI_API_KEY non configuré" }, { status: 500 });

  const psiUrl = new URL("https://www.googleapis.com/pagespeedonline/v5/runPagespeed");
  psiUrl.searchParams.set("url", url);
  psiUrl.searchParams.set("key", apiKey);
  psiUrl.searchParams.set("strategy", strategy);
  psiUrl.searchParams.set("category", "performance");
  psiUrl.searchParams.set("category", "seo");
  psiUrl.searchParams.set("category", "accessibility");
  psiUrl.searchParams.set("category", "best-practices");

  // PSI doesn't support multiple category params via URLSearchParams — use raw URL
  const rawUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&key=${apiKey}&strategy=${strategy}&category=performance&category=seo&category=accessibility&category=best-practices`;

  try {
    const res = await fetch(rawUrl, { next: { revalidate: 0 } });
    if (!res.ok) {
      const err = await res.json();
      return NextResponse.json({ error: err?.error?.message ?? "Erreur PSI" }, { status: res.status });
    }
    const data = await res.json();
    const lr = data.lighthouseResult;
    const audits = lr?.audits ?? {};

    // Helper: score 0-1 → 0-100
    const score = (cat: string) => Math.round((lr?.categories?.[cat]?.score ?? 0) * 100);

    // Core Web Vitals
    const lcp = audits["largest-contentful-paint"];
    const cls = audits["cumulative-layout-shift"];
    const tbt = audits["total-blocking-time"];
    const fcp = audits["first-contentful-paint"];
    const si = audits["speed-index"];
    const tti = audits["interactive"];

    // Top opportunities (failed audits sorted by wastedMs)
    const opportunities = Object.values(audits as Record<string, { id: string; title: string; description: string; score: number | null; displayValue?: string; details?: { overallSavingsMs?: number } }>)
      .filter((a) => a.score !== null && a.score < 0.9 && a.details?.overallSavingsMs)
      .sort((a, b) => (b.details?.overallSavingsMs ?? 0) - (a.details?.overallSavingsMs ?? 0))
      .slice(0, 5)
      .map((a) => ({ id: a.id, title: a.title, displayValue: a.displayValue ?? "", savingsMs: a.details?.overallSavingsMs ?? 0 }));

    // Diagnostics (failed audits with no savings but score < 0.9)
    const diagnostics = Object.values(audits as Record<string, { id: string; title: string; score: number | null; displayValue?: string }>)
      .filter((a) => a.score !== null && a.score < 0.9)
      .sort((a, b) => (a.score ?? 1) - (b.score ?? 1))
      .slice(0, 5)
      .map((a) => ({ id: a.id, title: a.title, score: a.score, displayValue: a.displayValue ?? "" }));

    return NextResponse.json({
      scores: {
        performance: score("performance"),
        seo: score("seo"),
        accessibility: score("accessibility"),
        bestPractices: score("best-practices"),
      },
      vitals: {
        lcp: { value: lcp?.displayValue ?? "--", score: lcp?.score },
        cls: { value: cls?.displayValue ?? "--", score: cls?.score },
        tbt: { value: tbt?.displayValue ?? "--", score: tbt?.score },
        fcp: { value: fcp?.displayValue ?? "--", score: fcp?.score },
        si: { value: si?.displayValue ?? "--", score: si?.score },
        tti: { value: tti?.displayValue ?? "--", score: tti?.score },
      },
      opportunities,
      diagnostics,
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
