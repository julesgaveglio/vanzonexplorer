"use client";

import { useState } from "react";
import type { ClosingAnalysis, ClosingAnalysisRow } from "@/types/closing-analysis";

type View = "form" | "result";

interface Viewing {
  analysis: ClosingAnalysis;
  title: string | null;
  prospect: string | null;
  created_at: string | null;
}

function scoreColor(score: number): string {
  if (score >= 75) return "#22c55e";
  if (score >= 55) return "#eab308";
  if (score >= 35) return "#f97316";
  return "#ef4444";
}

function outcomeLabel(o: ClosingAnalysis["verdict"]["outcome"]): { txt: string; cls: string } {
  switch (o) {
    case "signe":
      return { txt: "Signé", cls: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" };
    case "perdu":
      return { txt: "Perdu", cls: "bg-red-500/15 text-red-300 border-red-500/30" };
    case "a_suivre":
      return { txt: "À suivre", cls: "bg-amber-500/15 text-amber-300 border-amber-500/30" };
    default:
      return { txt: "Indéterminé", cls: "bg-slate-500/15 text-slate-300 border-slate-500/30" };
  }
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-5">
      <h2 className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-400">{title}</h2>
      {children}
    </section>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-white/10 bg-white/[0.03] p-4 ${className}`}>{children}</div>
  );
}

function Quote({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-2 border-l-2 border-slate-600 pl-3 text-sm italic text-slate-400">“{children}”</p>
  );
}

function AnalysisView({ v }: { v: Viewing }) {
  const a = v.analysis;
  const score = Math.max(0, Math.min(100, Math.round(a?.verdict?.score ?? 0)));
  const col = scoreColor(score);
  const outcome = outcomeLabel(a?.verdict?.outcome ?? "indetermine");

  return (
    <div>
      {/* Score + verdict */}
      <Card className="flex items-center gap-4">
        <div
          className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full text-2xl font-bold"
          style={{ color: col, boxShadow: `inset 0 0 0 4px ${col}` }}
        >
          {score}
        </div>
        <div className="min-w-0">
          <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-semibold ${outcome.cls}`}>
            {outcome.txt}
          </span>
          <p className="mt-1.5 text-sm leading-snug text-slate-200">{a?.verdict?.resume}</p>
        </div>
      </Card>

      {/* Priorités */}
      {a?.priorites?.length ? (
        <Section title="Tes 3 priorités">
          <ol className="space-y-2">
            {a.priorites.map((p, i) => (
              <li key={i} className="flex gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sky-500/20 text-sm font-bold text-sky-300">
                  {i + 1}
                </span>
                <span className="text-sm text-slate-200">{p}</span>
              </li>
            ))}
          </ol>
        </Section>
      ) : null}

      {/* Rubrique */}
      {a?.criteres?.length ? (
        <Section title="Rubrique détaillée">
          <div className="space-y-3">
            {a.criteres.map((c, i) => {
              const n = Math.max(0, Math.min(10, c.note ?? 0));
              const cc = scoreColor(n * 10);
              return (
                <Card key={i}>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-medium text-slate-100">{c.nom}</span>
                    <span className="text-sm font-bold" style={{ color: cc }}>
                      {n}/10
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                    <div className="h-full rounded-full" style={{ width: `${n * 10}%`, background: cc }} />
                  </div>
                  <p className="mt-2 text-sm text-slate-400">{c.commentaire}</p>
                </Card>
              );
            })}
          </div>
        </Section>
      ) : null}

      {/* Points forts */}
      {a?.points_forts?.length ? (
        <Section title="Points forts">
          <div className="space-y-2">
            {a.points_forts.map((p, i) => (
              <Card key={i} className="border-emerald-500/20">
                <p className="text-sm font-medium text-emerald-200">✓ {p.point}</p>
                {p.extrait ? <Quote>{p.extrait}</Quote> : null}
              </Card>
            ))}
          </div>
        </Section>
      ) : null}

      {/* Points faibles */}
      {a?.points_faibles?.length ? (
        <Section title="Points faibles">
          <div className="space-y-2">
            {a.points_faibles.map((p, i) => (
              <Card key={i} className="border-red-500/20">
                <p className="text-sm font-medium text-red-200">✕ {p.point}</p>
                {p.extrait ? <Quote>{p.extrait}</Quote> : null}
                {p.impact ? <p className="mt-2 text-sm text-slate-400">Impact : {p.impact}</p> : null}
              </Card>
            ))}
          </div>
        </Section>
      ) : null}

      {/* Occasions manquées */}
      {a?.occasions_manquees?.length ? (
        <Section title="Occasions manquées">
          <div className="space-y-2">
            {a.occasions_manquees.map((o, i) => (
              <Card key={i}>
                <p className="text-xs font-semibold uppercase tracking-wide text-amber-300">{o.moment}</p>
                <p className="mt-1 text-sm text-slate-300">{o.ce_qui_s_est_passe}</p>
                <p className="mt-2 text-sm text-slate-200">
                  <span className="text-slate-400">Meilleur move : </span>
                  {o.meilleur_move}
                </p>
                {o.exemple_phrase ? (
                  <p className="mt-2 rounded-lg bg-sky-500/10 p-2 text-sm text-sky-200">
                    À dire : « {o.exemple_phrase} »
                  </p>
                ) : null}
              </Card>
            ))}
          </div>
        </Section>
      ) : null}

      {/* Objections */}
      {a?.objections?.length ? (
        <Section title="Traitement des objections">
          <div className="space-y-2">
            {a.objections.map((o, i) => {
              const badge =
                o.note === "bien"
                  ? "bg-emerald-500/15 text-emerald-300"
                  : o.note === "moyen"
                    ? "bg-amber-500/15 text-amber-300"
                    : "bg-red-500/15 text-red-300";
              return (
                <Card key={i}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-slate-100">{o.objection}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${badge}`}>{o.note}</span>
                  </div>
                  <p className="mt-1.5 text-sm text-slate-400">Ta réponse : {o.ta_reponse}</p>
                  <p className="mt-2 rounded-lg bg-white/[0.04] p-2 text-sm text-slate-200">Mieux : {o.mieux}</p>
                </Card>
              );
            })}
          </div>
        </Section>
      ) : null}

      {/* Reformulations */}
      {a?.reformulations?.length ? (
        <Section title="Reformulations">
          <div className="space-y-2">
            {a.reformulations.map((r, i) => (
              <Card key={i}>
                <p className="text-sm text-red-300/90">
                  <span className="text-slate-500">Tu as dit — </span>« {r.tu_as_dit} »
                </p>
                <p className="mt-1.5 text-sm text-emerald-300/90">
                  <span className="text-slate-500">Dis plutôt — </span>« {r.dis_plutot} »
                </p>
                {r.pourquoi ? <p className="mt-1.5 text-xs text-slate-400">{r.pourquoi}</p> : null}
              </Card>
            ))}
          </div>
        </Section>
      ) : null}

      {/* Ratio de parole */}
      {a?.ratio_parole?.estimation ? (
        <Section title="Ratio de parole">
          <Card>
            <p className="text-sm font-medium text-slate-100">{a.ratio_parole.estimation}</p>
            <p className="mt-1 text-sm text-slate-400">{a.ratio_parole.verdict}</p>
          </Card>
        </Section>
      ) : null}

      {/* Exercices */}
      {a?.exercices?.length ? (
        <Section title="À travailler">
          <ul className="space-y-2">
            {a.exercices.map((e, i) => (
              <li key={i} className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm text-slate-200">
                {e}
              </li>
            ))}
          </ul>
        </Section>
      ) : null}
    </div>
  );
}

export default function CloserApp({ initialHistory }: { initialHistory: ClosingAnalysisRow[] }) {
  const [history, setHistory] = useState<ClosingAnalysisRow[]>(initialHistory);
  const [view, setView] = useState<View>("form");
  const [viewing, setViewing] = useState<Viewing | null>(null);

  const [title, setTitle] = useState("");
  const [prospect, setProspect] = useState("");
  const [transcript, setTranscript] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  async function analyze() {
    setError(null);
    if (transcript.trim().length < 80) {
      setError("Colle un transcript plus complet (au moins quelques échanges).");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/closer/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript, title, prospect }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? "Une erreur est survenue.");
        return;
      }
      const v: Viewing = {
        analysis: data.analysis,
        title: title.trim() || null,
        prospect: prospect.trim() || null,
        created_at: new Date().toISOString(),
      };
      setViewing(v);
      setView("result");
      if (data.saved) setHistory((h) => [data.saved as ClosingAnalysisRow, ...h]);
      // Reset du formulaire pour la prochaine analyse
      setTranscript("");
      setTitle("");
      setProspect("");
    } catch {
      setError("Connexion impossible. Vérifie ton réseau et réessaie.");
    } finally {
      setLoading(false);
    }
  }

  function openHistory(row: ClosingAnalysisRow) {
    setViewing({
      analysis: row.analysis,
      title: row.title,
      prospect: row.prospect,
      created_at: row.created_at,
    });
    setView("result");
    setShowHistory(false);
  }

  return (
    <main className="mx-auto min-h-[100dvh] max-w-xl px-4 pb-24 pt-[max(1rem,env(safe-area-inset-top))]">
      {/* Header */}
      <header className="flex items-center justify-between py-3">
        <div>
          <h1 className="text-lg font-bold tracking-tight">Closer Coach</h1>
          <p className="text-xs text-slate-500">Feedback sans complaisance · VBA</p>
        </div>
        <button
          onClick={() => setShowHistory((s) => !s)}
          className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-slate-300 active:scale-95"
        >
          Historique{history.length ? ` (${history.length})` : ""}
        </button>
      </header>

      {/* Historique */}
      {showHistory && (
        <div className="mb-4 rounded-2xl border border-white/10 bg-white/[0.03] p-2">
          {history.length === 0 ? (
            <p className="p-3 text-sm text-slate-500">Aucune analyse enregistrée pour l&apos;instant.</p>
          ) : (
            <ul className="divide-y divide-white/5">
              {history.map((row) => (
                <li key={row.id}>
                  <button
                    onClick={() => openHistory(row)}
                    className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left active:bg-white/5"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm text-slate-200">
                        {row.title || row.prospect || "Appel sans titre"}
                      </span>
                      <span className="block text-xs text-slate-500">
                        {new Date(row.created_at).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </span>
                    {typeof row.score === "number" && (
                      <span className="text-sm font-bold" style={{ color: scoreColor(row.score) }}>
                        {row.score}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {view === "form" && (
        <div>
          <div className="grid grid-cols-2 gap-2">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Titre (optionnel)"
              className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:border-sky-500/50 focus:outline-none"
            />
            <input
              value={prospect}
              onChange={(e) => setProspect(e.target.value)}
              placeholder="Prospect (optionnel)"
              className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:border-sky-500/50 focus:outline-none"
            />
          </div>
          <textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder="Colle ici le transcript de ton appel de closing…"
            rows={14}
            className="mt-2 w-full resize-y rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm leading-relaxed text-slate-100 placeholder:text-slate-600 focus:border-sky-500/50 focus:outline-none"
          />
          {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
          <p className="mt-2 text-center text-xs text-slate-600">{transcript.length} caractères</p>
        </div>
      )}

      {view === "result" && viewing && (
        <div>
          <button
            onClick={() => setView("form")}
            className="mb-3 text-sm text-sky-400 active:opacity-70"
          >
            ← Nouvelle analyse
          </button>
          {(viewing.title || viewing.prospect) && (
            <p className="mb-2 text-sm text-slate-400">
              {[viewing.prospect, viewing.title].filter(Boolean).join(" · ")}
            </p>
          )}
          <AnalysisView v={viewing} />
        </div>
      )}

      {/* Barre d'action fixe */}
      {view === "form" && (
        <div className="fixed inset-x-0 bottom-0 border-t border-white/10 bg-[#0b0f19]/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur">
          <div className="mx-auto max-w-xl">
            <button
              onClick={analyze}
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-sky-500 py-3.5 text-sm font-semibold text-white transition active:scale-[0.99] disabled:opacity-60"
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  Analyse en cours… (~30-60 s)
                </>
              ) : (
                "Analyser l'appel"
              )}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
