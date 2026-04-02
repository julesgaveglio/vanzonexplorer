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
import AiInsightsSection from "./_components/sections/AiInsightsSection";
import { calcScoreGlobal } from "./_lib/score";
import type {
  PipelineState, SeoReportData,
  PagespeedData, OnPageData, AuthorityData, CompetitorsData, AiInsightsData
} from "@/types/seo-report";

// PDF côté client uniquement (react-pdf utilise des APIs canvas non SSR-compatibles)
const PdfDownloadButton = dynamic(() => import("./_pdf/PdfDownloadButton"), { ssr: false });

const INITIAL_PIPELINE: PipelineState = {
  pagespeed:    "pending",
  onpage:       "pending",
  authority:    "pending",
  competitors:  "pending",
  "ai-insights": "pending",
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

    // Étape 1 — PageSpeed
    setStep("pagespeed", "loading");
    const pagespeed = await callStep<PagespeedData>("/api/admin/seo-report/pagespeed", { url });
    setStep("pagespeed", pagespeed ? "done" : "error");
    if (pagespeed) setReport((r) => ({ ...r, pagespeed }));

    // Étape 2 — On-page
    setStep("onpage", "loading");
    const onpage = await callStep<OnPageData>("/api/admin/seo-report/onpage", { url });
    setStep("onpage", onpage ? "done" : "error");
    if (onpage) setReport((r) => ({ ...r, onpage }));

    // Étape 3 — Authority
    setStep("authority", "loading");
    const authority = await callStep<AuthorityData>("/api/admin/seo-report/authority", { url });
    setStep("authority", authority ? "done" : "error");
    if (authority) setReport((r) => ({ ...r, authority }));

    // Calcul score global intermédiaire
    setReport((r) => {
      const scoreGlobal = calcScoreGlobal(
        r?.pagespeed ?? pagespeed ?? undefined,
        r?.onpage ?? onpage ?? undefined,
        r?.authority ?? authority ?? undefined,
      );
      return { ...r, scoreGlobal };
    });

    // Étape 4 — Concurrents
    setStep("competitors", "loading");
    const competitors = await callStep<CompetitorsData>("/api/admin/seo-report/competitors", { url });
    setStep("competitors", competitors ? "done" : "error");
    if (competitors) setReport((r) => ({ ...r, competitors }));

    // Étape 5 — IA (envoyer toutes les données collectées)
    setStep("ai-insights", "loading");
    const aiPayload = { url, pagespeed, onpage, authority, competitors };
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
      {/* Input URL */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-base font-semibold text-slate-800 mb-4">Analyser un site</h2>
        <UrlInput onGenerate={generate} loading={isGenerating} />
      </div>

      {/* Pipeline progress */}
      {(isGenerating || isComplete) && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <ProgressPipeline state={pipeline} />
        </div>
      )}

      {/* Rapport */}
      {hasReport && report.scoreGlobal !== undefined && (
        <div className="space-y-4">
          <ScoreGlobal report={report as SeoReportData & { scoreGlobal: number; url: string }} />
          {report.pagespeed  && <PerformanceSection data={report.pagespeed} />}
          {report.onpage     && <OnPageSection data={report.onpage} />}
          {report.authority  && <AuthoritySection data={report.authority} />}
          {report.competitors && <CompetitorsSection data={report.competitors} />}
          {report.aiInsights  && <AiInsightsSection data={report.aiInsights} />}

          {/* Actions */}
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

      {/* Historique */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <ReportHistory key={historyKey} />
      </div>
    </div>
  );
}
