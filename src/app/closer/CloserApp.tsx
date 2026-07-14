"use client";

import { useState } from "react";
import type { ClosingAnalysis, ClosingAnalysisRow, ClosingContext } from "@/types/closing-analysis";

// Charte Vanzon : blanc + bleu (#4D5FEC primaire, #4BC3E3 cyan doux).
const BLUE = "#4D5FEC";

type View = "form" | "result";

interface Viewing {
  analysis: ClosingAnalysis;
  context: ClosingContext | null;
  title: string | null;
  prospect: string | null;
  closer: string | null;
  call_date: string | null;
}

function scoreColor(score: number): string {
  if (score >= 75) return "#16a34a";
  if (score >= 55) return "#ca8a04";
  if (score >= 35) return "#ea580c";
  return "#dc2626";
}

function outcomeLabel(o: ClosingAnalysis["verdict"]["outcome"]): { txt: string; cls: string } {
  switch (o) {
    case "signe":
      return { txt: "Signé", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" };
    case "perdu":
      return { txt: "Perdu", cls: "bg-red-50 text-red-700 border-red-200" };
    case "a_suivre":
      return { txt: "À suivre", cls: "bg-amber-50 text-amber-700 border-amber-200" };
    default:
      return { txt: "Indéterminé", cls: "bg-slate-100 text-slate-600 border-slate-200" };
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
    <div className={`rounded-2xl border border-slate-200 bg-white p-4 shadow-sm ${className}`}>{children}</div>
  );
}

function Quote({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-2 border-l-2 border-slate-300 pl-3 text-sm italic text-slate-500">“{children}”</p>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className="text-sm text-slate-800">{value}</dd>
    </div>
  );
}

function Chips({ label, items }: { label: string; items?: string[] }) {
  if (!items?.length) return null;
  return (
    <div className="mt-3">
      <p className="mb-1.5 text-[11px] uppercase tracking-wide text-slate-400">{label}</p>
      <ul className="space-y-1.5">
        {items.map((it, i) => (
          <li key={i} className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-sm text-slate-700">
            {it}
          </li>
        ))}
      </ul>
    </div>
  );
}

function FicheView({ c, closer, callDate }: { c: ClosingContext; closer: string | null; callDate: string | null }) {
  const lieu = [c.ville, c.region, c.pays].filter(Boolean).join(", ") || null;
  const nom = [c.prenom, c.nom].filter(Boolean).join(" ") || null;
  const acq = c.acquisition;
  return (
    <Card className="mb-4">
      <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">Fiche prospect</p>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
        <Field label="Prospect" value={nom} />
        <Field label="Âge" value={c.age ? `${c.age} ans` : null} />
        <Field label="Lieu" value={lieu} />
        <Field label="Closer" value={closer} />
        <Field label="Date" value={callDate} />
        <Field label="Statut" value={c.statut} />
        <Field label="Métier" value={c.metier} />
        <Field label="Objectif" value={c.objectif_business === null ? null : c.objectif_business ? "Business" : "Perso"} />
        <Field label="Budget véhicule" value={c.budget_vehicule} />
        <Field label="Budget aménagement" value={c.budget_amenagement} />
        <Field label="Canal contact" value={c.canal} />
        <Field label="Offre proposée" value={c.offre_proposee} />
        <Field label="Montant" value={c.montant} />
      </dl>

      {acq && (acq.canal || acq.detail) ? (
        <div className="mt-3 rounded-xl border border-[#4D5FEC]/20 bg-[#4D5FEC]/[0.06] p-3">
          <p className="text-[11px] uppercase tracking-wide text-slate-400">Provenance (attribution)</p>
          <p className="mt-0.5 text-sm font-medium" style={{ color: BLUE }}>
            {acq.canal ?? "Inconnu"}
            {acq.type && acq.type !== "inconnu" ? ` · ${acq.type}` : ""}
          </p>
          {acq.detail ? <p className="mt-1 text-sm text-slate-600">{acq.detail}</p> : null}
          {acq.indice ? <p className="mt-1 text-xs italic text-slate-400">« {acq.indice} »</p> : null}
        </div>
      ) : null}

      {c.situation ? <p className="mt-3 text-sm text-slate-700">{c.situation}</p> : null}
      {c.projet ? (
        <p className="mt-2 text-sm text-slate-700">
          <span className="text-slate-400">Projet — </span>
          {c.projet}
        </p>
      ) : null}
      {c.resultat ? (
        <p className="mt-2 text-sm text-slate-700">
          <span className="text-slate-400">Résultat — </span>
          {c.resultat}
        </p>
      ) : null}
      <Chips label="Objections" items={c.objections} />
      <Chips label="Signaux d'achat" items={c.signaux_achat} />
      <Chips label="Chiffres clés" items={c.chiffres_cles} />
      <Chips label="Verbatims" items={c.verbatims} />
      <Chips label="Prochaines étapes" items={c.next_steps} />
    </Card>
  );
}

function AnalysisView({ v }: { v: Viewing }) {
  const a = v.analysis;
  const score = Math.max(0, Math.min(100, Math.round(a?.verdict?.score ?? 0)));
  const col = scoreColor(score);
  const outcome = outcomeLabel(a?.verdict?.outcome ?? "indetermine");

  return (
    <div>
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
          <p className="mt-1.5 text-sm leading-snug text-slate-700">{a?.verdict?.resume}</p>
        </div>
      </Card>

      {a?.priorites?.length ? (
        <Section title="Tes 3 priorités">
          <ol className="space-y-2">
            {a.priorites.map((p, i) => (
              <li key={i} className="flex gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                <span
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                  style={{ background: BLUE }}
                >
                  {i + 1}
                </span>
                <span className="text-sm text-slate-800">{p}</span>
              </li>
            ))}
          </ol>
        </Section>
      ) : null}

      {a?.criteres?.length ? (
        <Section title="Rubrique détaillée">
          <div className="space-y-3">
            {a.criteres.map((c, i) => {
              const n = Math.max(0, Math.min(10, c.note ?? 0));
              const cc = scoreColor(n * 10);
              return (
                <Card key={i}>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-medium text-slate-900">{c.nom}</span>
                    <span className="text-sm font-bold" style={{ color: cc }}>
                      {n}/10
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full" style={{ width: `${n * 10}%`, background: cc }} />
                  </div>
                  <p className="mt-2 text-sm text-slate-500">{c.commentaire}</p>
                </Card>
              );
            })}
          </div>
        </Section>
      ) : null}

      {a?.points_forts?.length ? (
        <Section title="Points forts">
          <div className="space-y-2">
            {a.points_forts.map((p, i) => (
              <Card key={i} className="border-emerald-200">
                <p className="text-sm font-medium text-emerald-700">✓ {p.point}</p>
                {p.extrait ? <Quote>{p.extrait}</Quote> : null}
              </Card>
            ))}
          </div>
        </Section>
      ) : null}

      {a?.points_faibles?.length ? (
        <Section title="Points faibles">
          <div className="space-y-2">
            {a.points_faibles.map((p, i) => (
              <Card key={i} className="border-red-200">
                <p className="text-sm font-medium text-red-700">✕ {p.point}</p>
                {p.extrait ? <Quote>{p.extrait}</Quote> : null}
                {p.impact ? <p className="mt-2 text-sm text-slate-500">Impact : {p.impact}</p> : null}
              </Card>
            ))}
          </div>
        </Section>
      ) : null}

      {a?.occasions_manquees?.length ? (
        <Section title="Occasions manquées">
          <div className="space-y-2">
            {a.occasions_manquees.map((o, i) => (
              <Card key={i}>
                <p className="text-xs font-semibold uppercase tracking-wide text-amber-600">{o.moment}</p>
                <p className="mt-1 text-sm text-slate-600">{o.ce_qui_s_est_passe}</p>
                <p className="mt-2 text-sm text-slate-800">
                  <span className="text-slate-400">Meilleur move : </span>
                  {o.meilleur_move}
                </p>
                {o.exemple_phrase ? (
                  <p className="mt-2 rounded-lg p-2 text-sm" style={{ background: `${BLUE}12`, color: BLUE }}>
                    À dire : « {o.exemple_phrase} »
                  </p>
                ) : null}
              </Card>
            ))}
          </div>
        </Section>
      ) : null}

      {a?.objections?.length ? (
        <Section title="Traitement des objections">
          <div className="space-y-2">
            {a.objections.map((o, i) => {
              const badge =
                o.note === "bien"
                  ? "bg-emerald-50 text-emerald-700"
                  : o.note === "moyen"
                    ? "bg-amber-50 text-amber-700"
                    : "bg-red-50 text-red-700";
              return (
                <Card key={i}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-slate-900">{o.objection}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${badge}`}>{o.note}</span>
                  </div>
                  <p className="mt-1.5 text-sm text-slate-500">Ta réponse : {o.ta_reponse}</p>
                  <p className="mt-2 rounded-lg bg-slate-50 p-2 text-sm text-slate-800">Mieux : {o.mieux}</p>
                </Card>
              );
            })}
          </div>
        </Section>
      ) : null}

      {a?.reformulations?.length ? (
        <Section title="Reformulations">
          <div className="space-y-2">
            {a.reformulations.map((r, i) => (
              <Card key={i}>
                <p className="text-sm text-red-600">
                  <span className="text-slate-400">Tu as dit — </span>« {r.tu_as_dit} »
                </p>
                <p className="mt-1.5 text-sm text-emerald-700">
                  <span className="text-slate-400">Dis plutôt — </span>« {r.dis_plutot} »
                </p>
                {r.pourquoi ? <p className="mt-1.5 text-xs text-slate-500">{r.pourquoi}</p> : null}
              </Card>
            ))}
          </div>
        </Section>
      ) : null}

      {a?.ratio_parole?.estimation ? (
        <Section title="Ratio de parole">
          <Card>
            <p className="text-sm font-medium text-slate-900">{a.ratio_parole.estimation}</p>
            <p className="mt-1 text-sm text-slate-500">{a.ratio_parole.verdict}</p>
          </Card>
        </Section>
      ) : null}

      {a?.exercices?.length ? (
        <Section title="À travailler">
          <ul className="space-y-2">
            {a.exercices.map((e, i) => (
              <li key={i} className="rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-800 shadow-sm">
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
        body: JSON.stringify({ transcript }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? "Une erreur est survenue.");
        return;
      }
      const saved = (data.saved ?? null) as ClosingAnalysisRow | null;
      const ctx = (data.context ?? null) as ClosingContext | null;
      const v: Viewing = {
        analysis: data.analysis,
        context: ctx,
        title: saved?.title ?? null,
        prospect: saved?.prospect ?? (ctx ? [ctx.prenom, ctx.nom].filter(Boolean).join(" ") || null : null),
        closer: saved?.closer ?? "Jules",
        call_date: saved?.call_date ?? new Date().toISOString().slice(0, 10),
      };
      setViewing(v);
      setView("result");
      if (saved) setHistory((h) => [saved, ...h]);
      setTranscript("");
    } catch {
      setError("Connexion impossible. Vérifie ton réseau et réessaie.");
    } finally {
      setLoading(false);
    }
  }

  function openHistory(row: ClosingAnalysisRow) {
    setViewing({
      analysis: row.analysis,
      context: row.context ?? null,
      title: row.title,
      prospect: row.prospect,
      closer: row.closer,
      call_date: row.call_date,
    });
    setView("result");
    setShowHistory(false);
  }

  return (
    <main className="mx-auto min-h-[100dvh] max-w-xl px-4 pb-28 pt-[max(1rem,env(safe-area-inset-top))]">
      <header className="flex items-center justify-between py-3">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-slate-900">Closer Coach</h1>
          <p className="text-xs text-slate-400">Feedback sans complaisance · Vanzon</p>
        </div>
        <button
          onClick={() => setShowHistory((s) => !s)}
          className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm active:scale-95"
        >
          Historique{history.length ? ` (${history.length})` : ""}
        </button>
      </header>

      {showHistory && (
        <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
          {history.length === 0 ? (
            <p className="p-3 text-sm text-slate-400">Aucune analyse enregistrée pour l&apos;instant.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {history.map((row) => (
                <li key={row.id}>
                  <button
                    onClick={() => openHistory(row)}
                    className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left active:bg-slate-50"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm text-slate-800">
                        {row.prospect || "Appel sans nom"}
                      </span>
                      <span className="block truncate text-xs text-slate-400">
                        {[row.ville, row.statut, row.closer].filter(Boolean).join(" · ")}
                        {row.call_date ? ` · ${row.call_date}` : ""}
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
          <textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder="Colle ici le transcript de ton appel de closing…"
            rows={16}
            className="w-full resize-y rounded-2xl border border-slate-200 bg-white p-4 text-sm leading-relaxed text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-[#4D5FEC] focus:outline-none focus:ring-2 focus:ring-[#4D5FEC]/20"
          />
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          <p className="mt-2 text-center text-xs text-slate-400">
            {transcript.length} caractères · nom, ville, provenance et fiche extraits automatiquement
          </p>
        </div>
      )}

      {view === "result" && viewing && (
        <div>
          <button onClick={() => setView("form")} className="mb-3 text-sm font-medium" style={{ color: BLUE }}>
            ← Nouvelle analyse
          </button>
          {(viewing.prospect || viewing.closer || viewing.call_date) && (
            <p className="mb-2 text-sm text-slate-500">
              {[viewing.prospect, viewing.closer, viewing.call_date].filter(Boolean).join(" · ")}
            </p>
          )}
          {viewing.context && (
            <FicheView c={viewing.context} closer={viewing.closer} callDate={viewing.call_date} />
          )}
          <AnalysisView v={viewing} />
        </div>
      )}

      {view === "form" && (
        <div className="fixed inset-x-0 bottom-0 border-t border-slate-200 bg-white/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur">
          <div className="mx-auto max-w-xl">
            <button
              onClick={analyze}
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-semibold text-white shadow-sm transition active:scale-[0.99] disabled:opacity-60"
              style={{ background: BLUE }}
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
