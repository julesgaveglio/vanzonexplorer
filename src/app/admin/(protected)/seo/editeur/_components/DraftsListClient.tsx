"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Draft {
  id: string;
  title: string;
  excerpt: string;
  target_url: string;
  status: "draft" | "queued" | "archived";
  created_at: string;
  updated_at: string;
}

interface Props {
  initialDrafts: Draft[];
}

const STATUS_STYLES: Record<string, string> = {
  draft:    "bg-amber-50 text-amber-700 border border-amber-200",
  queued:   "bg-green-50 text-green-700 border border-green-200",
  archived: "bg-slate-100 text-slate-500 border border-slate-200",
};

const STATUS_LABELS: Record<string, string> = {
  draft:    "Brouillon",
  queued:   "En file",
  archived: "Archivé",
};

export default function DraftsListClient({ initialDrafts }: Props) {
  const router = useRouter();
  const [drafts, setDrafts]       = useState<Draft[]>(initialDrafts);
  const [selected, setSelected]   = useState<Set<string>>(new Set());
  const [emailTo, setEmailTo]     = useState("");
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback]   = useState<{ type: "ok" | "err"; msg: string } | null>(null);

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === drafts.length) setSelected(new Set());
    else setSelected(new Set(drafts.map((d) => d.id)));
  }

  function flash(type: "ok" | "err", msg: string) {
    setFeedback({ type, msg });
    setTimeout(() => setFeedback(null), 4000);
  }

  // ── Créer un nouveau brouillon ──────────────────────────────────────────────
  async function handleNew() {
    const res = await fetch("/api/admin/seo/drafts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Nouvel article", html_content: "<p>Commencez à écrire…</p>" }),
    });
    if (!res.ok) { flash("err", "Erreur lors de la création"); return; }
    const draft: Draft = await res.json();
    router.push(`/admin/seo/editeur/${draft.id}`);
  }

  // ── Supprimer ───────────────────────────────────────────────────────────────
  async function handleDelete(id: string) {
    if (!confirm("Supprimer ce brouillon ?")) return;
    await fetch(`/api/admin/seo/drafts/${id}`, { method: "DELETE" });
    setDrafts((prev) => prev.filter((d) => d.id !== id));
    setSelected((prev) => { const n = new Set(prev); n.delete(id); return n; });
  }

  // ── Valider → file d'attente ────────────────────────────────────────────────
  async function handleQueue(id: string) {
    if (!confirm("Valider cet article et l'ajouter à la file de publication ?")) return;
    startTransition(async () => {
      const res = await fetch(`/api/admin/seo/drafts/${id}/queue`, { method: "POST" });
      if (!res.ok) {
        const { error } = await res.json();
        flash("err", error ?? "Erreur");
        return;
      }
      setDrafts((prev) => prev.map((d) => d.id === id ? { ...d, status: "queued" } : d));
      flash("ok", "Article ajouté à la file d'attente ✓");
    });
  }

  // ── Envoyer par email ───────────────────────────────────────────────────────
  async function handleSendEmail() {
    if (!emailTo.trim() || !emailTo.includes("@")) {
      flash("err", "Adresse email invalide");
      return;
    }
    const ids = Array.from(selected);
    const res = await fetch("/api/admin/seo/drafts/send-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids, to: emailTo.trim() }),
    });
    if (!res.ok) {
      const { error } = await res.json();
      flash("err", error ?? "Erreur d'envoi");
      return;
    }
    setShowEmailModal(false);
    setEmailTo("");
    setSelected(new Set());
    flash("ok", `${ids.length} article${ids.length > 1 ? "s" : ""} envoyé${ids.length > 1 ? "s" : ""} à ${emailTo} ✓`);
  }

  const selectedCount = selected.size;

  return (
    <div>
      {/* Feedback banner */}
      {feedback && (
        <div className={`mb-4 px-4 py-3 rounded-lg text-sm font-medium ${feedback.type === "ok" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
          {feedback.msg}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-5 gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          {drafts.length > 0 && (
            <label className="flex items-center gap-2 text-sm text-slate-500 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={selected.size === drafts.length && drafts.length > 0}
                onChange={toggleAll}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              Tout sélectionner
            </label>
          )}
          {selectedCount > 0 && (
            <button
              onClick={() => setShowEmailModal(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Envoyer par email ({selectedCount})
            </button>
          )}
        </div>
        <button
          onClick={handleNew}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-sm font-semibold rounded-lg hover:bg-slate-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Nouvel article
        </button>
      </div>

      {/* Liste */}
      {drafts.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <svg className="w-10 h-10 mx-auto mb-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-sm">Aucun brouillon. Créez votre premier article.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {drafts.map((draft) => (
            <div
              key={draft.id}
              className={`bg-white border rounded-xl p-4 flex items-start gap-4 transition-shadow hover:shadow-sm ${selected.has(draft.id) ? "border-blue-300 bg-blue-50/30" : "border-slate-200"}`}
            >
              {/* Checkbox */}
              <input
                type="checkbox"
                checked={selected.has(draft.id)}
                onChange={() => toggleSelect(draft.id)}
                className="mt-1 rounded border-slate-300 text-blue-600 focus:ring-blue-500 flex-shrink-0"
              />

              {/* Contenu */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLES[draft.status]}`}>
                    {STATUS_LABELS[draft.status]}
                  </span>
                  {draft.target_url && (
                    <a
                      href={draft.target_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-blue-500 hover:underline truncate max-w-[200px]"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {draft.target_url.replace("https://", "")}
                    </a>
                  )}
                </div>
                <h3 className="font-semibold text-slate-900 text-sm leading-tight mb-1 truncate">
                  {draft.title}
                </h3>
                {draft.excerpt && (
                  <p className="text-xs text-slate-500 line-clamp-2">{draft.excerpt}</p>
                )}
                <p className="text-[11px] text-slate-400 mt-1.5">
                  {new Date(draft.updated_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <Link
                  href={`/admin/seo/editeur/${draft.id}/preview`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                  title="Aperçu dans le style Vanzon"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  Visualiser
                </Link>
                <Link
                  href={`/admin/seo/editeur/${draft.id}`}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white text-xs font-medium rounded-lg hover:bg-slate-700 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Éditer
                </Link>

                {draft.status === "draft" && (
                  <button
                    onClick={() => handleQueue(draft.id)}
                    disabled={isPending}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white text-xs font-medium rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
                    title="Valider et mettre en file de publication"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Valider
                  </button>
                )}

                <button
                  onClick={() => handleDelete(draft.id)}
                  className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                  title="Supprimer"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal email */}
      {showEmailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Envoyer par email</h3>
            <p className="text-sm text-slate-500 mb-4">
              {selectedCount} article{selectedCount > 1 ? "s" : ""} sélectionné{selectedCount > 1 ? "s" : ""}
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Adresse email destinataire</label>
              <input
                type="email"
                value={emailTo}
                onChange={(e) => setEmailTo(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleSendEmail(); }}
                placeholder="contact@exemple.com"
                autoFocus
                className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => { setShowEmailModal(false); setEmailTo(""); }}
                className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleSendEmail}
                className="px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"
              >
                Envoyer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
