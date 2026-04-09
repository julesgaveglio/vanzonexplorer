"use client";

import { useState, useRef } from "react";
import {
  Link2, Search, Mail, CheckCircle, XCircle, RefreshCw,
  ExternalLink, Loader2, BarChart3, Send, AlertCircle, Sparkles
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────

type Statut = "découvert" | "contacté" | "relancé" | "obtenu" | "rejeté";
type ProspectType = "blog" | "forum" | "partenaire" | "annuaire" | "media";

interface Prospect {
  id: string;
  domain: string;
  url: string;
  type: ProspectType;
  score: number;
  statut: Statut;
  notes: string | null;
  source_query: string | null;
  created_at: string;
}

interface Outreach {
  id: string;
  prospect_id: string;
  recipient_email: string | null;
  email_subject: string | null;
  email_body: string | null;
  template_type: string | null;
  approved: boolean;
  sent_at: string | null;
  reply_received: boolean;
  follow_up_sent_at: string | null;
  created_at: string;
  backlink_prospects?: { domain: string; url: string; type: string } | null;
}

interface Obtained {
  id: string;
  prospect_id: string;
  backlink_url: string;
  anchor_text: string | null;
  dr_score: number | null;
  date_obtained: string;
  backlink_prospects?: { domain: string } | null;
}

interface EmailDiscovery {
  found: boolean;
  email: string | null;
  confidence: number | null;
  source: "hunter" | "snov" | "scraped" | null;
  allCandidates: { email: string; confidence: number; source: string }[];
}

interface InitialData {
  prospects: Prospect[];
  outreach: Outreach[];
  obtained: Obtained[];
}

// ── Constantes ─────────────────────────────────────────────────────────────────

const STATUTS: { key: Statut; label: string; color: string; bg: string }[] = [
  { key: "découvert",  label: "Découvert",  color: "text-slate-600",   bg: "bg-slate-100" },
  { key: "contacté",   label: "Contacté",   color: "text-blue-700",    bg: "bg-blue-50" },
  { key: "relancé",    label: "Relancé",    color: "text-amber-700",   bg: "bg-amber-50" },
  { key: "obtenu",     label: "Obtenu ✓",   color: "text-emerald-700", bg: "bg-emerald-50" },
  { key: "rejeté",     label: "Rejeté",     color: "text-red-600",     bg: "bg-red-50" },
];

const TYPE_LABELS: Record<ProspectType, string> = {
  blog: "Blog", forum: "Forum", partenaire: "Partenaire", annuaire: "Annuaire", media: "Média",
};

const TYPE_COLORS: Record<ProspectType, string> = {
  blog: "bg-purple-100 text-purple-700",
  forum: "bg-blue-100 text-blue-700",
  partenaire: "bg-emerald-100 text-emerald-700",
  annuaire: "bg-orange-100 text-orange-700",
  media: "bg-pink-100 text-pink-700",
};

const SOURCE_LABELS: Record<string, string> = {
  hunter: "Hunter.io",
  snov: "Snov.io",
  scraped: "Scraping",
};

// ── Composant principal ────────────────────────────────────────────────────────

export default function BacklinksClient({ initialData }: { initialData: InitialData }) {
  const [tab, setTab] = useState<"kanban" | "stats">("kanban");
  const [prospects, setProspects] = useState<Prospect[]>(initialData.prospects);
  const [outreachList, setOutreachList] = useState<Outreach[]>(initialData.outreach);
  const [obtained] = useState<Obtained[]>(initialData.obtained);

  // Discovery state
  const [discovering, setDiscovering] = useState(false);
  const [discoveryLog, setDiscoveryLog] = useState<string[]>([]);
  const logRef = useRef<HTMLDivElement>(null);

  // Add prospect modal
  const [addModal, setAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ domain: "", url: "", type: "annuaire" as ProspectType, score: 7, notes: "" });
  const [adding, setAdding] = useState(false);

  // Outreach modal
  const [outreachModal, setOutreachModal] = useState<{
    prospect: Prospect;
    existing: Outreach | null;
  } | null>(null);
  const [generatingEmail, setGeneratingEmail] = useState(false);
  const [draftEmail, setDraftEmail] = useState<{ subject: string; body: string } | null>(null);
  const [emailDiscovery, setEmailDiscovery] = useState<EmailDiscovery | null>(null);
  const [recipientEmail, setRecipientEmail] = useState("");
  const [outreachId, setOutreachId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);

  // Drag & drop
  const [dragging, setDragging] = useState<string | null>(null);

  // ── Add prospect ──────────────────────────────────────────────────────────

  async function addProspect() {
    if (!addForm.domain || !addForm.url) return;
    setAdding(true);
    try {
      const resp = await fetch("/api/admin/backlinks/prospects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addForm),
      });
      const data = await resp.json();
      if (data.success && data.prospect) {
        setProspects((prev) => [data.prospect, ...prev]);
        setAddModal(false);
        setAddForm({ domain: "", url: "", type: "annuaire", score: 7, notes: "" });
      }
    } finally {
      setAdding(false);
    }
  }

  // ── Discovery ──────────────────────────────────────────────────────────────

  async function launchDiscovery() {
    setDiscovering(true);
    setDiscoveryLog([]);
    try {
      const resp = await fetch("/api/admin/backlinks/discovery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ max: 15 }),
      });
      const reader = resp.body?.getReader();
      if (!reader) return;
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const event = JSON.parse(line.slice(6));
            if (event.type === "log") {
              setDiscoveryLog((prev) => [...prev, `[${event.level}] ${event.message}`]);
              setTimeout(() => logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: "smooth" }), 50);
            } else if (event.type === "result" && Array.isArray(event.prospects)) {
              setProspects((prev) => [
                ...event.prospects.map((p: Prospect) => ({ ...p, statut: "découvert" as Statut })),
                ...prev,
              ]);
            }
          } catch { /* ignore */ }
        }
      }
    } catch (e) {
      setDiscoveryLog((prev) => [...prev, `[error] ${String(e)}`]);
    } finally {
      setDiscovering(false);
    }
  }

  // ── Drag & Drop ────────────────────────────────────────────────────────────

  function handleDragStart(id: string) { setDragging(id); }
  function handleDragOver(e: React.DragEvent) { e.preventDefault(); }

  async function handleDrop(e: React.DragEvent, newStatut: Statut) {
    e.preventDefault();
    if (!dragging) return;
    const id = dragging;
    setDragging(null);
    setProspects((prev) => prev.map((p) => (p.id === id ? { ...p, statut: newStatut } : p)));
    await fetch(`/api/admin/backlinks/prospects/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ statut: newStatut }),
    }).catch(() => null);
  }

  // ── Outreach modal ─────────────────────────────────────────────────────────

  function openOutreachModal(prospect: Prospect) {
    const existing = outreachList.find((o) => o.prospect_id === prospect.id) || null;
    setOutreachModal({ prospect, existing });
    setDraftEmail(existing ? { subject: existing.email_subject || "", body: existing.email_body || "" } : null);
    setRecipientEmail(existing?.recipient_email || "");
    setEmailDiscovery(null);
    setOutreachId(existing?.id || null);
    setSentSuccess(false);
  }

  async function generateEmail() {
    if (!outreachModal) return;
    setGeneratingEmail(true);
    setEmailDiscovery(null);
    setSentSuccess(false);
    try {
      const resp = await fetch("/api/admin/backlinks/outreach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prospectId: outreachModal.prospect.id }),
      });
      const data = await resp.json();
      if (data.success) {
        setDraftEmail({ subject: data.subject, body: data.body });
        setEmailDiscovery(data.emailDiscovery);
        setOutreachId(data.outreachId);
        if (data.emailDiscovery?.email && !recipientEmail) {
          setRecipientEmail(data.emailDiscovery.email);
        }
        const newOutreach: Outreach = {
          id: data.outreachId,
          prospect_id: outreachModal.prospect.id,
          recipient_email: data.emailDiscovery?.email || null,
          email_subject: data.subject,
          email_body: data.body,
          template_type: data.templateType,
          approved: false,
          sent_at: null,
          reply_received: false,
          follow_up_sent_at: null,
          created_at: new Date().toISOString(),
        };
        setOutreachList((prev) => [newOutreach, ...prev.filter((o) => o.prospect_id !== outreachModal.prospect.id)]);
      }
    } finally {
      setGeneratingEmail(false);
    }
  }

  async function sendEmail() {
    if (!outreachId || !draftEmail) return;
    if (!recipientEmail) {
      alert("Veuillez saisir l'email destinataire avant d'envoyer.");
      return;
    }
    setSending(true);
    try {
      const resp = await fetch(`/api/admin/backlinks/outreach/${outreachId}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientEmail,
          subject: draftEmail.subject,
          emailBody: draftEmail.body,
        }),
      });
      const data = await resp.json();
      if (data.success) {
        setSentSuccess(true);
        setOutreachList((prev) =>
          prev.map((o) =>
            o.id === outreachId ? { ...o, approved: true, sent_at: new Date().toISOString(), recipient_email: recipientEmail } : o
          )
        );
        setProspects((prev) =>
          prev.map((p) =>
            p.id === outreachModal?.prospect.id ? { ...p, statut: "contacté" } : p
          )
        );
      } else {
        alert(`Erreur envoi : ${data.error}`);
      }
    } finally {
      setSending(false);
    }
  }

  async function copyEmail() {
    if (!draftEmail) return;
    await navigator.clipboard.writeText(draftEmail.body).catch(() => null);
  }

  // ── Stats ──────────────────────────────────────────────────────────────────

  const stats = {
    total: prospects.length,
    obtenu: prospects.filter((p) => p.statut === "obtenu").length,
    obtained: obtained.length,
    pendingApproval: outreachList.filter((o) => !o.approved).length,
    emailsFound: outreachList.filter((o) => o.recipient_email).length,
    conversionRate: prospects.length > 0
      ? Math.round((prospects.filter((p) => p.statut === "obtenu").length / prospects.length) * 100)
      : 0,
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div>
      {/* Top bar */}
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
          {(["kanban", "stats"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${tab === t ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
              {t === "kanban" ? "Kanban" : "Statistiques"}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          {stats.pendingApproval > 0 && (
            <span className="px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-700 text-sm rounded-lg font-medium">
              {stats.pendingApproval} en attente
            </span>
          )}
          <button onClick={() => setAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition-colors">
            + Ajouter
          </button>
          <button onClick={launchDiscovery} disabled={discovering}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-sm font-semibold rounded-xl transition-colors">
            {discovering ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            {discovering ? "Discovery…" : "Lancer le discovery"}
          </button>
        </div>
      </div>

      {/* Discovery log */}
      {(discovering || discoveryLog.length > 0) && (
        <div className="mb-6 bg-slate-900 rounded-xl p-4 font-mono text-xs text-slate-300 max-h-40 overflow-y-auto" ref={logRef}>
          {discoveryLog.map((line, i) => (
            <div key={i} className={line.includes("[error]") ? "text-red-400" : line.includes("[success]") ? "text-emerald-400" : line.includes("[info]") ? "text-blue-300" : "text-slate-300"}>
              {line}
            </div>
          ))}
          {discovering && <div className="animate-pulse text-slate-500 mt-1">▋</div>}
        </div>
      )}

      {/* ── KANBAN ─────────────────────────────────────────────────────────── */}
      {tab === "kanban" && (
        <div className="flex flex-col lg:flex-row gap-4 overflow-x-auto pb-2">
          {STATUTS.map(({ key, label, color, bg }) => {
            const col = prospects.filter((p) => p.statut === key);
            return (
              <div key={key} onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, key)}
                className="min-w-[280px] lg:min-w-0 lg:flex-1 min-h-[200px] rounded-xl bg-slate-50 border border-slate-200">
                <div className={`px-3 py-2.5 rounded-t-xl border-b border-slate-200 ${bg}`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-bold ${color}`}>{label}</span>
                    <span className={`text-xs font-mono px-1.5 py-0.5 rounded-md ${bg} ${color}`}>{col.length}</span>
                  </div>
                </div>
                <div className="p-2 space-y-2">
                  {col.map((p) => {
                    const outreach = outreachList.find((o) => o.prospect_id === p.id);
                    const hasSent = !!outreach?.sent_at;
                    const hasDraft = !!outreach && !outreach.sent_at;
                    return (
                      <div key={p.id} draggable onDragStart={() => handleDragStart(p.id)}
                        className={`bg-white rounded-lg border border-slate-200 p-3 cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md transition-shadow ${dragging === p.id ? "opacity-50 scale-95" : ""}`}>
                        <div className="flex items-center gap-1.5 mb-2">
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${TYPE_COLORS[p.type]}`}>
                            {TYPE_LABELS[p.type]}
                          </span>
                          <span className="ml-auto text-xs font-mono font-bold text-slate-700">{p.score}/10</span>
                        </div>
                        <p className="text-sm font-semibold text-slate-800 truncate">{p.domain}</p>
                        {p.notes && <p className="text-xs text-slate-400 mt-1 line-clamp-2">{p.notes}</p>}
                        {/* Email status */}
                        {outreach?.recipient_email && (
                          <p className="text-[10px] text-slate-400 mt-1 truncate">✉ {outreach.recipient_email}</p>
                        )}
                        <div className="flex items-center gap-1 mt-2.5">
                          <a href={p.url} target="_blank" rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="p-1 text-slate-400 hover:text-blue-500 transition-colors" title="Voir la page">
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                          <button onClick={() => openOutreachModal(p)}
                            className={`ml-auto flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-colors ${
                              hasSent ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                              : hasDraft ? "bg-amber-50 text-amber-700 hover:bg-amber-100"
                              : "bg-blue-50 text-blue-700 hover:bg-blue-100"
                            }`}>
                            <Mail className="w-3 h-3" />
                            {hasSent ? "Envoyé ✓" : hasDraft ? "Draft prêt" : "Rédiger"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── STATS ──────────────────────────────────────────────────────────── */}
      {tab === "stats" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {[
              { label: "Total prospects",   value: stats.total,         icon: <Link2 className="w-5 h-5" />,        color: "text-slate-700" },
              { label: "Emails découverts", value: stats.emailsFound,   icon: <Mail className="w-5 h-5" />,         color: "text-blue-600" },
              { label: "Backlinks obtenus", value: stats.obtained,      icon: <CheckCircle className="w-5 h-5" />,  color: "text-emerald-600" },
              { label: "En attente",        value: stats.pendingApproval, icon: <AlertCircle className="w-5 h-5" />, color: "text-amber-600" },
              { label: "Taux conversion",   value: `${stats.conversionRate}%`, icon: <BarChart3 className="w-5 h-5" />, color: "text-purple-600" },
            ].map((kpi) => (
              <div key={kpi.label} className="bg-white rounded-xl border border-slate-200 p-4">
                <div className={`mb-2 ${kpi.color}`}>{kpi.icon}</div>
                <p className="text-2xl font-black text-slate-900">{kpi.value}</p>
                <p className="text-xs text-slate-400 mt-0.5">{kpi.label}</p>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="font-bold text-slate-800 mb-4">Funnel</h3>
            <div className="space-y-3">
              {STATUTS.map(({ key, label, color }) => {
                const count = prospects.filter((p) => p.statut === key).length;
                const pct = stats.total > 0 ? (count / stats.total) * 100 : 0;
                const barColor = key === "obtenu" ? "#059669" : key === "rejeté" ? "#dc2626" : key === "contacté" ? "#2563eb" : key === "relancé" ? "#d97706" : "#94a3b8";
                return (
                  <div key={key} className="flex items-center gap-3">
                    <span className={`w-24 text-sm font-medium ${color}`}>{label}</span>
                    <div className="flex-1 bg-slate-100 rounded-full h-2.5 overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: barColor }} />
                    </div>
                    <span className="w-8 text-right text-sm font-mono text-slate-600">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
          {obtained.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="font-bold text-slate-800 mb-4">Backlinks obtenus ({obtained.length})</h3>
              <div className="space-y-2">
                {obtained.map((o) => (
                  <div key={o.id} className="flex items-center gap-3 py-2 border-b border-slate-100 last:border-0">
                    <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                    <a href={o.backlink_url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline truncate flex-1">{o.backlink_url}</a>
                    {o.anchor_text && <span className="text-xs text-slate-400 shrink-0">&ldquo;{o.anchor_text}&rdquo;</span>}
                    {o.dr_score && <span className="text-xs font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 shrink-0">DR {o.dr_score}</span>}
                    <span className="text-xs text-slate-400 shrink-0">{o.date_obtained}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── ADD PROSPECT MODAL ──────────────────────────────────────────────── */}
      {addModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="font-bold text-slate-900">Ajouter un prospect</h2>
              <button onClick={() => setAddModal(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500">
                <XCircle className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">Domaine</label>
                <input type="text" value={addForm.domain} onChange={(e) => setAddForm((f) => ({ ...f, domain: e.target.value }))}
                  placeholder="exemple.fr" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-blue-400" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">URL cible</label>
                <input type="text" value={addForm.url} onChange={(e) => setAddForm((f) => ({ ...f, url: e.target.value }))}
                  placeholder="https://exemple.fr/page" className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-blue-400" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">Type</label>
                  <select value={addForm.type} onChange={(e) => setAddForm((f) => ({ ...f, type: e.target.value as ProspectType }))}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-blue-400">
                    <option value="annuaire">Annuaire</option>
                    <option value="blog">Blog</option>
                    <option value="partenaire">Partenaire</option>
                    <option value="media">Média</option>
                    <option value="forum">Forum</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">Score /10</label>
                  <input type="number" min={1} max={10} value={addForm.score} onChange={(e) => setAddForm((f) => ({ ...f, score: Number(e.target.value) }))}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-blue-400" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">Notes</label>
                <textarea value={addForm.notes} onChange={(e) => setAddForm((f) => ({ ...f, notes: e.target.value }))}
                  rows={2} placeholder="OT local, lien institutionnel..."
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-blue-400 resize-none" />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button onClick={addProspect} disabled={adding || !addForm.domain || !addForm.url}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white text-sm font-semibold rounded-xl transition-colors">
                {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
                {adding ? "Ajout…" : "Ajouter"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── OUTREACH MODAL ─────────────────────────────────────────────────── */}
      {outreachModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden">

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <h2 className="font-bold text-slate-900">Outreach — {outreachModal.prospect.domain}</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {TYPE_LABELS[outreachModal.prospect.type]} · Score {outreachModal.prospect.score}/10
                </p>
              </div>
              <button onClick={() => setOutreachModal(null)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500">
                <XCircle className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">

              {/* Email discovery badge */}
              {emailDiscovery && (
                <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm ${
                  emailDiscovery.found
                    ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                    : "bg-amber-50 border-amber-200 text-amber-800"
                }`}>
                  {emailDiscovery.found ? (
                    <>
                      <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
                      <div>
                        <span className="font-semibold">{emailDiscovery.email}</span>
                        <span className="ml-2 text-xs opacity-70">
                          via {SOURCE_LABELS[emailDiscovery.source || ""] || emailDiscovery.source}
                          {emailDiscovery.confidence && ` · confiance ${emailDiscovery.confidence}%`}
                        </span>
                        {emailDiscovery.allCandidates.length > 1 && (
                          <span className="ml-2 text-xs opacity-60">
                            (+{emailDiscovery.allCandidates.length - 1} autre{emailDiscovery.allCandidates.length > 2 ? "s" : ""})
                          </span>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                      <span>Email non trouvé automatiquement — saisissez-le manuellement</span>
                    </>
                  )}
                </div>
              )}

              {/* Recipient email */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">
                  Email destinataire
                </label>
                <input type="email" value={recipientEmail} onChange={(e) => setRecipientEmail(e.target.value)}
                  placeholder="contact@exemple.fr"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-blue-400" />
              </div>

              {/* Generate button */}
              <button onClick={generateEmail} disabled={generatingEmail || sentSuccess}
                className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-all shadow-sm">
                {generatingEmail ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {generatingEmail
                  ? "Recherche email + génération en cours…"
                  : draftEmail ? "Régénérer (Hunter + Groq)" : "Générer l'email (Hunter + Groq)"}
              </button>

              {generatingEmail && (
                <div className="text-xs text-slate-400 space-y-1 pl-1">
                  <p>1. 🔍 Recherche email via Hunter.io / Snov.io…</p>
                  <p>2. 🌐 Scraping du site pour personnalisation…</p>
                  <p>3. 🤖 Génération email personnalisé avec Groq…</p>
                </div>
              )}

              {/* Draft */}
              {draftEmail && !sentSuccess && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">Objet</label>
                    <input type="text" value={draftEmail.subject}
                      onChange={(e) => setDraftEmail((d) => d ? { ...d, subject: e.target.value } : d)}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-blue-400" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">Corps</label>
                    <textarea value={draftEmail.body}
                      onChange={(e) => setDraftEmail((d) => d ? { ...d, body: e.target.value } : d)}
                      rows={11}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-blue-400 resize-none font-mono" />
                  </div>
                </>
              )}

              {/* Sent success */}
              {sentSuccess && (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle className="w-8 h-8 text-emerald-600" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-lg">Email envoyé !</h3>
                  <p className="text-slate-500 text-sm mt-1">
                    Envoyé à <span className="font-medium text-slate-700">{recipientEmail}</span>
                  </p>
                  <p className="text-xs text-slate-400 mt-1">Le prospect est passé en statut &ldquo;Contacté&rdquo;</p>
                </div>
              )}
            </div>

            {/* Footer */}
            {draftEmail && !sentSuccess && (
              <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
                <button onClick={copyEmail}
                  className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors">
                  <RefreshCw className="w-3.5 h-3.5" />
                  Copier
                </button>
                <button onClick={sendEmail} disabled={sending || !recipientEmail}
                  className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-colors shadow-sm">
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {sending ? "Envoi en cours…" : !recipientEmail ? "Email requis" : "Envoyer via Resend"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
