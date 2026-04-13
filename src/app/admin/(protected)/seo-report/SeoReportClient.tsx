"use client";
import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import UrlInput from "./_components/UrlInput";
import ProgressPipeline from "./_components/ProgressPipeline";
import ReportHistory from "./_components/ReportHistory";
import ScoreGlobal from "./_components/sections/ScoreGlobal";
import PerformanceSection from "./_components/sections/PerformanceSection";
import OnPageSection from "./_components/sections/OnPageSection";
import AuthoritySection from "./_components/sections/AuthoritySection";
import CompetitorsSection from "./_components/sections/CompetitorsSection";
import KeywordsSection from "./_components/sections/KeywordsSection";
import ContentStrategySection from "./_components/sections/ContentStrategySection";
import AiInsightsSection from "./_components/sections/AiInsightsSection";
import { calcScoreGlobal } from "./_lib/score";
import type {
  PipelineState, SeoReportData,
  PagespeedData, OnPageData, AuthorityData, CompetitorsData,
  KeywordsData, ContentStrategyData, AiInsightsData, BusinessAnalysis
} from "@/types/seo-report";

const PdfDownloadButton = dynamic(() => import("./_pdf/PdfDownloadButton"), { ssr: false });

const INITIAL_PIPELINE: PipelineState = {
  business:          "pending",
  pagespeed:         "pending",
  onpage:            "pending",
  authority:         "pending",
  keywords:          "pending",
  competitors:       "pending",
  "content-strategy": "pending",
  "ai-insights":     "pending",
};

async function callStep<T>(url: string, body: unknown): Promise<T | null> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) return null;
    return await res.json() as T;
  } catch {
    return null;
  }
}

export default function SeoReportClient() {
  const [pipeline, setPipeline] = useState<PipelineState>(INITIAL_PIPELINE);
  const [report, setReport] = useState<Partial<SeoReportData> | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [historyKey, setHistoryKey] = useState(0);

  const setStep = (step: keyof PipelineState, status: PipelineState[keyof PipelineState]) =>
    setPipeline((prev) => ({ ...prev, [step]: status }));

  const generate = useCallback(async (url: string, label: string) => {
    setIsGenerating(true);
    setSavedId(null);
    setPipeline(INITIAL_PIPELINE);
    setReport({ url, label: label || undefined, generatedAt: new Date().toISOString(), scoreGlobal: 0 });

    // ═══ Étape 0 — Analyse business ═══
    setStep("business", "loading");
    const business = await callStep<BusinessAnalysis>("/api/admin/seo-report/business", { url });
    setStep("business", business ? "done" : "error");
    if (business) setReport((r) => ({ ...r, business }));

    // ═══ Étapes 1-3 en PARALLÈLE ═══
    setStep("pagespeed", "loading");
    setStep("onpage", "loading");
    setStep("authority", "loading");

    const [pagespeedRes, onpageRes, authorityRes] = await Promise.allSettled([
      callStep<PagespeedData>("/api/admin/seo-report/pagespeed", { url }),
      callStep<OnPageData>("/api/admin/seo-report/onpage", { url }),
      callStep<AuthorityData>("/api/admin/seo-report/authority", { url }),
    ]);

    const pagespeed = pagespeedRes.status === "fulfilled" ? pagespeedRes.value : null;
    const onpage = onpageRes.status === "fulfilled" ? onpageRes.value : null;
    const authority = authorityRes.status === "fulfilled" ? authorityRes.value : null;

    setStep("pagespeed", pagespeed ? "done" : "error");
    setStep("onpage", onpage ? "done" : "error");
    setStep("authority", authority ? "done" : "error");

    const scoreGlobal = calcScoreGlobal(pagespeed ?? undefined, onpage ?? undefined, authority ?? undefined);
    setReport((r) => ({
      ...r,
      pagespeed: pagespeed ?? undefined,
      onpage: onpage ?? undefined,
      authority: authority ?? undefined,
      scoreGlobal,
    }));

    // ═══ Étapes 4-5 en PARALLÈLE (Keywords + Competitors) ═══
    setStep("keywords", "loading");
    setStep("competitors", "loading");

    const [keywordsRes, competitorsRes] = await Promise.allSettled([
      callStep<KeywordsData>("/api/admin/seo-report/keywords", {
        url,
        businessKeywords: business?.mots_cles_metier,
      }),
      callStep<CompetitorsData>("/api/admin/seo-report/competitors", { url }),
    ]);

    const keywords = keywordsRes.status === "fulfilled" ? keywordsRes.value : null;
    const competitors = competitorsRes.status === "fulfilled" ? competitorsRes.value : null;

    setStep("keywords", keywords ? "done" : "error");
    setStep("competitors", competitors ? "done" : "error");
    if (keywords) setReport((r) => ({ ...r, keywords }));
    if (competitors) setReport((r) => ({ ...r, competitors }));

    // ═══ Étape 6 — Stratégie contenu (basée sur business + keywords) ═══
    setStep("content-strategy", "loading");
    const contentStrategy = await callStep<ContentStrategyData>("/api/admin/seo-report/content-strategy", {
      url,
      business,
      keywords,
    });
    setStep("content-strategy", contentStrategy ? "done" : "error");
    if (contentStrategy) setReport((r) => ({ ...r, contentStrategy }));

    // ═══ Étape 7 — Synthèse IA (toutes les données) ═══
    setStep("ai-insights", "loading");
    const aiPayload = { url, pagespeed, onpage, authority, competitors, keywords, business, contentStrategy };
    const aiInsights = await callStep<AiInsightsData>("/api/admin/seo-report/ai-insights", aiPayload);
    setStep("ai-insights", aiInsights ? "done" : "error");
    if (aiInsights) setReport((r) => ({ ...r, aiInsights }));

    setIsGenerating(false);
  }, []);

  const saveReport = async () => {
    if (!report) return;
    setIsSaving(true);
    try {
      const res = await fetch("/api/admin/seo-report/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(report),
      });
      const data = await res.json();
      setSavedId(data.id);
      setHistoryKey((k) => k + 1);
    } finally {
      setIsSaving(false);
    }
  };

  const isComplete = Object.values(pipeline).every((s) => s === "done" || s === "error");
  const hasReport = report && (report.pagespeed || report.onpage || report.authority);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-base font-semibold text-slate-800 mb-4">Analyser un site</h2>
        <UrlInput onGenerate={generate} loading={isGenerating} />
      </div>

      {(isGenerating || isComplete) && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <ProgressPipeline state={pipeline} />
        </div>
      )}

      {hasReport && report.scoreGlobal !== undefined && (
        <div className="space-y-4">
          <ScoreGlobal report={report as SeoReportData & { scoreGlobal: number; url: string }} />

          {report.aiInsights?.resumeExecutif && (
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-5">
              <h3 className="text-sm font-bold text-blue-900 mb-2">Résumé exécutif</h3>
              <p className="text-sm text-blue-800 leading-relaxed">{report.aiInsights.resumeExecutif}</p>
            </div>
          )}

          {report.pagespeed   && <PerformanceSection data={report.pagespeed} />}
          {report.onpage       && <OnPageSection data={report.onpage} />}
          {report.authority    && <AuthoritySection data={report.authority} />}
          {report.keywords     && <KeywordsSection data={report.keywords} />}
          {report.competitors  && <CompetitorsSection data={report.competitors} />}
          {report.contentStrategy && (
            <ContentStrategySection data={report.contentStrategy} business={report.business} />
          )}
          {report.aiInsights   && <AiInsightsSection data={report.aiInsights} />}

          {isComplete && (
            <div className="flex gap-3">
              <PdfDownloadButton report={report as SeoReportData} />
              <button
                onClick={saveReport}
                disabled={isSaving || !!savedId}
                className="px-4 py-2 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition-colors"
              >
                {savedId ? "✓ Sauvegardé" : isSaving ? "Sauvegarde…" : "Sauvegarder"}
              </button>
            </div>
          )}
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <ReportHistory key={historyKey} />
      </div>
    </div>
  );
}
