"use client";

import { useState } from "react";
import type { ArticleQueueItem } from "../types";
import { CATEGORY_COLORS } from "../types";

interface AgentRunRow {
  id: string;
  agentName: string;
  startedAt: string;
  finishedAt: string | null;
  status: "running" | "success" | "error";
  itemsProcessed: number;
  itemsCreated: number;
  errorMessage: string | null;
}

interface AgentPanelProps {
  publishedArticles: ArticleQueueItem[];
  agentRuns?: AgentRunRow[];
}

interface AuditData {
  wordCounts?: { vanzon: number; competitor1: number; competitor2: number; competitor3: number };
  vanzonPosition?: number | null;
  gapScore?: number;
  missingTopics?: string[];
  missingFAQ?: string[];
  keywordsToAdd?: string[];
  strengths?: string[];
  topActions?: Array<{ priority: number; action: string; impact: string; effort: string }>;
  summary?: string;
}

interface AuditResult {
  auditData: AuditData;
  slug: string;
  targetKeyword: string;
  competitorUrls: string[];
  timestamp: string;
}

interface CompetitorOpportunity {
  title: string;
  targetKeyword: string;
  category: string;
  relevanceScore: number;
  competitorSource: string;
  reasoning: string;
}

interface CompetitorResult {
  competitors: string[];
  totalArticlesFound: number;
  opportunities: CompetitorOpportunity[];
  addedToQueue: number;
  summary: string;
}

interface NewSection {
  heading: string;
  content: string;
  insertAfter: string;
}

interface FaqItem {
  question: string;
  answer: string;
}

interface InternalLink {
  anchorText: string;
  href: string;
  context: string;
}

interface ImproveResult {
  success: boolean;
  improvements: {
    newSections?: NewSection[];
    faqToAdd?: FaqItem[];
    metaImprovement?: { newSeoTitle: string | null; newSeoDescription: string | null };
    internalLinksToAdd?: InternalLink[];
  };
  slug: string;
  sources: Array<{ title: string; url: string }>;
}

async function streamAgent(
  url: string,
  body: object,
  onLog: (msg: string) => void,
  onDone: (result: unknown) => void
) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (line.startsWith("data: ")) {
        try {
          const event = JSON.parse(line.slice(6));
          if (event.type === "log") onLog(event.message);
          if (event.type === "done") onDone(event.result);
        } catch {
          // Ignore parse errors
        }
      }
    }
  }
}

function ImpactBadge({ value }: { value: string }) {
  const colorMap: Record<string, string> = {
    haut: "bg-red-50 text-red-600",
    moyen: "bg-amber-50 text-amber-600",
    faible: "bg-slate-50 text-slate-500",
  };
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${colorMap[value] ?? "bg-slate-50 text-slate-500"}`}>
      {value}
    </span>
  );
}

function GapScoreBadge({ score }: { score: number }) {
  const color =
    score >= 71 ? "bg-green-100 text-green-700" : score >= 50 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700";
  return (
    <span className={`text-lg font-black px-4 py-1.5 rounded-xl ${color}`}>{score}/100</span>
  );
}

function WordCountBar({ label, count, max }: { label: string; count: number; max: number }) {
  const pct = max > 0 ? Math.round((count / max) * 100) : 0;
  const isVanzon = label === "Vanzon";
  return (
    <div className="flex items-center gap-3">
      <span className={`text-xs font-medium w-24 flex-shrink-0 ${isVanzon ? "text-indigo-700 font-bold" : "text-slate-500"}`}>{label}</span>
      <div className="flex-1 bg-slate-100 rounded-full h-2.5 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${isVanzon ? "bg-indigo-500" : "bg-slate-300"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={`text-xs font-bold w-12 text-right ${isVanzon ? "text-indigo-700" : "text-slate-500"}`}>{count}</span>
    </div>
  );
}

export default function AgentPanel({ publishedArticles, agentRuns = [] }: AgentPanelProps) {
  const [activeAgent, setActiveAgent] = useState<"competitor" | "audit" | "improve" | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [competitorResult, setCompetitorResult] = useState<CompetitorResult | null>(null);
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null);
  const [improveResult, setImproveResult] = useState<ImproveResult | null>(null);
  const [selectedSlug, setSelectedSlug] = useState<string>(publishedArticles[0]?.slug ?? "");
  const [lastScanDate, setLastScanDate] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("lastCompetitorScan");
    }
    return null;
  });

  function appendLog(msg: string) {
    setLogs((prev) => [...prev, msg]);
  }

  async function runCompetitorScan() {
    setActiveAgent("competitor");
    setLogs([]);
    setCompetitorResult(null);
    try {
      await streamAgent(
        "/vanzon/api/admin/blog/track-competitors",
        {},
        appendLog,
        (result) => {
          const r = result as CompetitorResult;
          setCompetitorResult(r);
          setActiveAgent(null);
          const now = new Date().toLocaleDateString("fr-FR", {
            day: "numeric",
            month: "short",
            year: "numeric",
          });
          setLastScanDate(now);
          if (typeof window !== "undefined") {
            localStorage.setItem("lastCompetitorScan", now);
          }
        }
      );
    } catch (err) {
      appendLog(`Erreur : ${(err as Error).message}`);
      setActiveAgent(null);
    }
  }

  async function runAudit() {
    if (!selectedSlug) return;
    const article = publishedArticles.find((a) => a.slug === selectedSlug);
    if (!article) return;
    setActiveAgent("audit");
    setLogs([]);
    setAuditResult(null);
    setImproveResult(null);
    try {
      await streamAgent(
        "/vanzon/api/admin/blog/audit",
        { slug: selectedSlug, targetKeyword: article.targetKeyword },
        appendLog,
        (result) => {
          setAuditResult(result as AuditResult);
          setActiveAgent(null);
        }
      );
    } catch (err) {
      appendLog(`Erreur : ${(err as Error).message}`);
      setActiveAgent(null);
    }
  }

  async function runImprove() {
    if (!auditResult) return;
    setActiveAgent("improve");
    setLogs([]);
    setImproveResult(null);
    try {
      const res = await fetch("/vanzon/api/admin/blog/improve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: auditResult.slug,
          targetKeyword: auditResult.targetKeyword,
          auditData: auditResult.auditData,
        }),
      });
      const data = await res.json();
      setImproveResult(data as ImproveResult);
    } catch (err) {
      appendLog(`Erreur : ${(err as Error).message}`);
    } finally {
      setActiveAgent(null);
    }
  }

  function copyImprovementsToClipboard() {
    if (!improveResult?.improvements) return;
    const { newSections, faqToAdd, metaImprovement, internalLinksToAdd } = improveResult.improvements;
    let md = `# Améliorations pour ${improveResult.slug}\n\n`;
    if (newSections && newSections.length > 0) {
      md += `## Nouvelles sections\n\n`;
      for (const s of newSections) {
        md += `### ${s.heading}\n${s.content}\n\n> Insérer après: ${s.insertAfter}\n\n`;
      }
    }
    if (faqToAdd && faqToAdd.length > 0) {
      md += `## FAQ à ajouter\n\n`;
      for (const f of faqToAdd) {
        md += `**Q: ${f.question}**\n${f.answer}\n\n`;
      }
    }
    if (metaImprovement) {
      md += `## Métadonnées\n\n`;
      if (metaImprovement.newSeoTitle) md += `**SEO Title:** ${metaImprovement.newSeoTitle}\n`;
      if (metaImprovement.newSeoDescription) md += `**Meta description:** ${metaImprovement.newSeoDescription}\n`;
      md += "\n";
    }
    if (internalLinksToAdd && internalLinksToAdd.length > 0) {
      md += `## Liens internes à ajouter\n\n`;
      for (const l of internalLinksToAdd) {
        md += `- [${l.anchorText}](${l.href}) — ${l.context}\n`;
      }
    }
    navigator.clipboard.writeText(md).catch(() => {});
  }

  const agentName =
    activeAgent === "competitor"
      ? "Competitor Tracker"
      : activeAgent === "audit"
      ? "Content Auditor"
      : "Article Improver";

  const wordCounts = auditResult?.auditData.wordCounts;
  const maxWords = wordCounts
    ? Math.max(wordCounts.vanzon, wordCounts.competitor1, wordCounts.competitor2, wordCounts.competitor3, 1)
    : 1;

  return (
    <div>
      {/* Agent cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Competitor Tracker */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div
            className="h-1.5 w-full"
            style={{ background: "linear-gradient(135deg, #7C3AED 0%, #6366F1 100%)" }}
          />
          <div className="p-5">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
              style={{ background: "linear-gradient(135deg, #7C3AED 0%, #6366F1 100%)" }}
            >
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                <circle cx="11" cy="11" r="8" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 11h6M11 8v6" />
              </svg>
            </div>
            <h3 className="font-bold text-slate-900 mb-1">Scanner les concurrents</h3>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Détecte les nouveaux contenus concurrents et suggère des articles à créer.
            </p>
            {lastScanDate && (
              <p className="text-xs text-slate-400 mb-3">Dernier scan : {lastScanDate}</p>
            )}
            <button
              onClick={runCompetitorScan}
              disabled={activeAgent !== null}
              className="w-full inline-flex items-center justify-center gap-2 text-sm font-semibold text-white py-2.5 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: "linear-gradient(135deg, #7C3AED 0%, #6366F1 100%)" }}
            >
              {activeAgent === "competitor" ? (
                <>
                  <span className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  Scan en cours...
                </>
              ) : (
                "Lancer le scan"
              )}
            </button>
          </div>
        </div>

        {/* Card 2: Content Auditor */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div
            className="h-1.5 w-full"
            style={{ background: "linear-gradient(135deg, #3B82F6 0%, #0EA5E9 100%)" }}
          />
          <div className="p-5">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
              style={{ background: "linear-gradient(135deg, #3B82F6 0%, #0EA5E9 100%)" }}
            >
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="font-bold text-slate-900 mb-1">Auditer un article</h3>
            <p className="text-xs text-slate-500 mb-3 leading-relaxed">
              Compare un article publié avec les top 3 résultats Google et identifie les lacunes.
            </p>
            <select
              value={selectedSlug}
              onChange={(e) => setSelectedSlug(e.target.value)}
              className="w-full text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 mb-3 focus:outline-none focus:ring-2 focus:ring-blue-300"
            >
              {publishedArticles.length === 0 ? (
                <option value="">Aucun article publié</option>
              ) : (
                publishedArticles.map((a) => (
                  <option key={a.id} value={a.slug}>
                    {a.title}
                  </option>
                ))
              )}
            </select>
            <button
              onClick={runAudit}
              disabled={activeAgent !== null || !selectedSlug}
              className="w-full inline-flex items-center justify-center gap-2 text-sm font-semibold text-white py-2.5 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: "linear-gradient(135deg, #3B82F6 0%, #0EA5E9 100%)" }}
            >
              {activeAgent === "audit" ? (
                <>
                  <span className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  Audit en cours...
                </>
              ) : (
                "Auditer"
              )}
            </button>
          </div>
        </div>

        {/* Card 3: Article Improver */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div
            className="h-1.5 w-full"
            style={{ background: "linear-gradient(135deg, #10B981 0%, #059669 100%)" }}
          />
          <div className="p-5">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
              style={{ background: "linear-gradient(135deg, #10B981 0%, #059669 100%)" }}
            >
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
              </svg>
            </div>
            <h3 className="font-bold text-slate-900 mb-1">Générer des améliorations</h3>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Génère des sections, FAQ et métadonnées pour améliorer un article audité.
            </p>
            {!auditResult && (
              <p className="text-xs text-slate-400 mb-3 italic">Lance d&apos;abord un audit.</p>
            )}
            <button
              onClick={runImprove}
              disabled={activeAgent !== null || !auditResult}
              className="w-full inline-flex items-center justify-center gap-2 text-sm font-semibold text-white py-2.5 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: "linear-gradient(135deg, #10B981 0%, #059669 100%)" }}
            >
              {activeAgent === "improve" ? (
                <>
                  <span className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  Génération...
                </>
              ) : (
                "Générer"
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Live stream panel */}
      {(activeAgent !== null || logs.length > 0) && (
        <div className="mt-4 bg-slate-950 rounded-2xl p-4 font-mono text-sm overflow-hidden">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-green-400 text-xs font-semibold uppercase tracking-wider">
              {agentName} {activeAgent !== null ? "en cours..." : "terminé"}
            </span>
          </div>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {logs.map((log, i) => (
              <div key={i} className="text-slate-300">
                › {log}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Competitor results */}
      {competitorResult && (
        <div className="mt-6 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-50 flex items-center justify-between flex-wrap gap-2">
            <h3 className="font-bold text-slate-900">Résultats — Competitor Tracker</h3>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-slate-500">
                {competitorResult.totalArticlesFound} articles analysés
              </span>
              <span className="text-xs font-semibold text-violet-700 bg-violet-50 px-2.5 py-1 rounded-full">
                {competitorResult.addedToQueue} ajouté{competitorResult.addedToQueue > 1 ? "s" : ""} à la queue
              </span>
            </div>
          </div>

          {/* Competitor domains */}
          <div className="px-5 py-3 border-b border-slate-50 flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Concurrents</span>
            {competitorResult.competitors.map((d) => (
              <span key={d} className="text-xs bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full font-mono">
                {d}
              </span>
            ))}
          </div>

          {/* Summary */}
          {competitorResult.summary && (
            <div className="px-5 py-3 border-b border-slate-50">
              <p className="text-sm text-slate-600 italic">{competitorResult.summary}</p>
            </div>
          )}

          {/* Opportunities */}
          {competitorResult.opportunities.length > 0 ? (
            <div className="divide-y divide-slate-50">
              {competitorResult.opportunities.map((opp, i) => {
                const catColor = CATEGORY_COLORS[opp.category] ?? { bg: "bg-slate-50", text: "text-slate-600" };
                const scoreColor =
                  opp.relevanceScore >= 80
                    ? "bg-green-50 text-green-700"
                    : "bg-amber-50 text-amber-700";
                return (
                  <div key={i} className="px-5 py-4">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <p className="text-sm font-semibold text-slate-800 flex-1">{opp.title}</p>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0 ${scoreColor}`}>
                        {opp.relevanceScore}%
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${catColor.bg} ${catColor.text}`}>
                        {opp.category}
                      </span>
                      <span className="text-xs text-slate-400 font-mono bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                        {opp.targetKeyword}
                      </span>
                      <span className="text-xs text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                        {opp.competitorSource}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">{opp.reasoning}</p>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="px-5 py-8 text-center">
              <p className="text-slate-400 text-sm">Aucune opportunité identifiée au-dessus du seuil.</p>
            </div>
          )}
        </div>
      )}

      {/* Audit results */}
      {auditResult && (
        <div className="mt-6 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-50 flex items-center justify-between flex-wrap gap-2">
            <h3 className="font-bold text-slate-900">Rapport d&apos;audit — {auditResult.slug}</h3>
            {auditResult.auditData.gapScore !== undefined && (
              <GapScoreBadge score={auditResult.auditData.gapScore} />
            )}
          </div>

          {/* Summary */}
          {auditResult.auditData.summary && (
            <div className="px-5 py-4 border-b border-slate-50 bg-slate-50/50">
              <p className="text-sm text-slate-700">{auditResult.auditData.summary}</p>
            </div>
          )}

          <div className="px-5 py-4 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Word count comparison */}
            {wordCounts && (
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">
                  Nombre de mots
                </h4>
                <div className="space-y-2.5">
                  <WordCountBar label="Vanzon" count={wordCounts.vanzon} max={maxWords} />
                  {auditResult.competitorUrls[0] && (
                    <WordCountBar
                      label={new URL(auditResult.competitorUrls[0]).hostname.replace("www.", "")}
                      count={wordCounts.competitor1}
                      max={maxWords}
                    />
                  )}
                  {auditResult.competitorUrls[1] && (
                    <WordCountBar
                      label={new URL(auditResult.competitorUrls[1]).hostname.replace("www.", "")}
                      count={wordCounts.competitor2}
                      max={maxWords}
                    />
                  )}
                  {auditResult.competitorUrls[2] && (
                    <WordCountBar
                      label={new URL(auditResult.competitorUrls[2]).hostname.replace("www.", "")}
                      count={wordCounts.competitor3}
                      max={maxWords}
                    />
                  )}
                </div>
              </div>
            )}

            {/* Missing topics */}
            {auditResult.auditData.missingTopics && auditResult.auditData.missingTopics.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">
                  Sujets manquants
                </h4>
                <ul className="space-y-1.5">
                  {auditResult.auditData.missingTopics.map((t, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-slate-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Keywords to add */}
            {auditResult.auditData.keywordsToAdd && auditResult.auditData.keywordsToAdd.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">
                  Mots-clés à ajouter
                </h4>
                <div className="flex flex-wrap gap-2">
                  {auditResult.auditData.keywordsToAdd.map((kw, i) => (
                    <span key={i} className="text-xs font-mono bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg border border-blue-100">
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Strengths */}
            {auditResult.auditData.strengths && auditResult.auditData.strengths.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">
                  Points forts
                </h4>
                <ul className="space-y-1.5">
                  {auditResult.auditData.strengths.map((s, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-slate-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Top actions */}
          {auditResult.auditData.topActions && auditResult.auditData.topActions.length > 0 && (
            <div className="px-5 pb-4 border-t border-slate-50">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide my-3">
                Actions prioritaires
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="text-left text-xs font-semibold text-slate-400 pb-2 pr-4">#</th>
                      <th className="text-left text-xs font-semibold text-slate-400 pb-2 pr-4">Action</th>
                      <th className="text-left text-xs font-semibold text-slate-400 pb-2 pr-4">Impact</th>
                      <th className="text-left text-xs font-semibold text-slate-400 pb-2">Effort</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {auditResult.auditData.topActions.map((action) => (
                      <tr key={action.priority}>
                        <td className="py-2 pr-4 text-slate-400 font-mono text-xs">{action.priority}</td>
                        <td className="py-2 pr-4 text-slate-700">{action.action}</td>
                        <td className="py-2 pr-4">
                          <ImpactBadge value={action.impact} />
                        </td>
                        <td className="py-2">
                          <ImpactBadge value={action.effort} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4">
                <button
                  onClick={runImprove}
                  disabled={activeAgent !== null}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-white px-4 py-2.5 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ background: "linear-gradient(135deg, #10B981 0%, #059669 100%)" }}
                >
                  {activeAgent === "improve" ? (
                    <>
                      <span className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      Génération...
                    </>
                  ) : (
                    <>
                      Générer les améliorations
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Improve results */}
      {improveResult?.improvements && (
        <div className="mt-6 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-50 flex items-center justify-between flex-wrap gap-2">
            <h3 className="font-bold text-slate-900">Plan d&apos;amélioration — {improveResult.slug}</h3>
            <button
              onClick={copyImprovementsToClipboard}
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-3 py-2 rounded-lg transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copier les améliorations
            </button>
          </div>

          <div className="divide-y divide-slate-50">
            {/* New sections */}
            {improveResult.improvements.newSections && improveResult.improvements.newSections.length > 0 && (
              <div className="px-5 py-4">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">
                  Nouvelles sections ({improveResult.improvements.newSections.length})
                </h4>
                <div className="space-y-4">
                  {improveResult.improvements.newSections.map((s, i) => (
                    <div key={i} className="bg-slate-50 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-semibold text-slate-800 text-sm">{s.heading}</h5>
                        <span className="text-xs text-slate-400 bg-white px-2 py-0.5 rounded-lg border border-slate-100">
                          Après: {s.insertAfter}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed line-clamp-4">{s.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* FAQ */}
            {improveResult.improvements.faqToAdd && improveResult.improvements.faqToAdd.length > 0 && (
              <div className="px-5 py-4">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">
                  FAQ à ajouter ({improveResult.improvements.faqToAdd.length})
                </h4>
                <div className="space-y-3">
                  {improveResult.improvements.faqToAdd.map((f, i) => (
                    <div key={i} className="bg-blue-50/50 rounded-xl p-4">
                      <p className="font-semibold text-slate-800 text-sm mb-1.5">Q : {f.question}</p>
                      <p className="text-xs text-slate-600 leading-relaxed">{f.answer}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Meta improvements */}
            {improveResult.improvements.metaImprovement &&
              (improveResult.improvements.metaImprovement.newSeoTitle ||
                improveResult.improvements.metaImprovement.newSeoDescription) && (
                <div className="px-5 py-4">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">
                    Métadonnées améliorées
                  </h4>
                  <div className="space-y-2">
                    {improveResult.improvements.metaImprovement.newSeoTitle && (
                      <div className="bg-amber-50 rounded-lg p-3">
                        <span className="text-xs font-semibold text-amber-600 uppercase tracking-wide">SEO Title</span>
                        <p className="text-sm text-slate-800 mt-1">{improveResult.improvements.metaImprovement.newSeoTitle}</p>
                      </div>
                    )}
                    {improveResult.improvements.metaImprovement.newSeoDescription && (
                      <div className="bg-amber-50 rounded-lg p-3">
                        <span className="text-xs font-semibold text-amber-600 uppercase tracking-wide">Meta Description</span>
                        <p className="text-sm text-slate-800 mt-1">{improveResult.improvements.metaImprovement.newSeoDescription}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

            {/* Internal links */}
            {improveResult.improvements.internalLinksToAdd && improveResult.improvements.internalLinksToAdd.length > 0 && (
              <div className="px-5 py-4">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">
                  Liens internes à ajouter
                </h4>
                <div className="space-y-2">
                  {improveResult.improvements.internalLinksToAdd.map((l, i) => (
                    <div key={i} className="flex items-start gap-3 text-sm">
                      <span className="text-blue-600 font-semibold flex-shrink-0">{l.anchorText}</span>
                      <span className="text-slate-400">→</span>
                      <span className="font-mono text-xs text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-100 flex-shrink-0">{l.href}</span>
                      <span className="text-slate-500 text-xs">{l.context}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Agent Runs History */}
      {agentRuns.length > 0 && (
        <div className="mt-6 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-50">
            <h3 className="text-sm font-bold text-slate-700">Historique des agents (50 derniers)</h3>
          </div>
          <div className="divide-y divide-slate-50">
            {agentRuns.slice(0, 20).map((run) => {
              const dot = run.status === "success" ? "bg-green-400" : run.status === "error" ? "bg-red-400" : "bg-amber-400 animate-pulse";
              const ago = run.finishedAt
                ? (() => {
                    const diff = Date.now() - new Date(run.finishedAt).getTime();
                    if (diff < 60000) return "à l'instant";
                    if (diff < 3600000) return `il y a ${Math.floor(diff / 60000)} min`;
                    if (diff < 86400000) return `il y a ${Math.floor(diff / 3600000)} h`;
                    return `il y a ${Math.floor(diff / 86400000)} j`;
                  })()
                : "en cours…";
              return (
                <div key={run.id} className="flex items-center gap-3 px-5 py-2.5">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dot}`} />
                  <span className="text-xs font-mono text-slate-600 w-44 truncate">{run.agentName}</span>
                  <span className="text-xs text-slate-400 flex-1">{ago}</span>
                  {run.itemsCreated > 0 && (
                    <span className="text-xs bg-green-50 text-green-600 font-semibold px-2 py-0.5 rounded-full">+{run.itemsCreated}</span>
                  )}
                  {run.itemsProcessed > 0 && (
                    <span className="text-xs text-slate-400">{run.itemsProcessed} traité{run.itemsProcessed > 1 ? "s" : ""}</span>
                  )}
                  {run.errorMessage && (
                    <span className="text-xs text-red-500 truncate max-w-xs">{run.errorMessage}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
