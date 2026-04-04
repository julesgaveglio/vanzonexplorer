import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import type { PsiResult } from "@/types/seo-report";

async function runPsi(url: string, strategy: "mobile" | "desktop"): Promise<PsiResult> {
  const apiKey = process.env.GOOGLE_PSI_API_KEY ?? process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_PSI_API_KEY non configuré");

  const rawUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&key=${apiKey}&strategy=${strategy}&category=performance&category=seo&category=accessibility&category=best-practices`;

  const res = await fetch(rawUrl, { cache: "no-store" });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err?.error?.message ?? `PSI error ${res.status}`);
  }

  const data = await res.json();
  const lr = data.lighthouseResult;
  const audits = lr?.audits ?? {};
  const score = (cat: string) => Math.round((lr?.categories?.[cat]?.score ?? 0) * 100);

  const lcp = audits["largest-contentful-paint"];
  const cls = audits["cumulative-layout-shift"];
  const tbt = audits["total-blocking-time"];
  const fcp = audits["first-contentful-paint"];
  const si  = audits["speed-index"];
  const tti = audits["interactive"];

  const opportunities = Object.values(
    audits as Record<string, { id: string; title: string; score: number | null; displayValue?: string; details?: { overallSavingsMs?: number } }>
  )
    .filter((a) => a.score !== null && a.score < 0.9 && a.details?.overallSavingsMs)
    .sort((a, b) => (b.details?.overallSavingsMs ?? 0) - (a.details?.overallSavingsMs ?? 0))
    .slice(0, 5)
    .map((a) => ({ id: a.id, title: a.title, displayValue: a.displayValue ?? "", savingsMs: a.details?.overallSavingsMs ?? 0 }));

  const diagnostics = Object.values(
    audits as Record<string, { id: string; title: string; score: number | null; displayValue?: string }>
  )
    .filter((a) => a.score !== null && a.score < 0.9)
    .sort((a, b) => (a.score ?? 1) - (b.score ?? 1))
    .slice(0, 5)
    .map((a) => ({ id: a.id, title: a.title, score: a.score, displayValue: a.displayValue ?? "" }));

  return {
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
      si:  { value: si?.displayValue  ?? "--", score: si?.score  },
      tti: { value: tti?.displayValue ?? "--", score: tti?.score },
    },
    opportunities,
    diagnostics,
  };
}

export async function POST(req: NextRequest) {
  const check = await requireAdmin();
  if (check instanceof NextResponse) return check;

  const { url } = await req.json();
  if (!url) return NextResponse.json({ error: "url requis" }, { status: 400 });

  try {
    const [mobile, desktop] = await Promise.all([
      runPsi(url, "mobile"),
      runPsi(url, "desktop"),
    ]);
    return NextResponse.json({ mobile, desktop });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
