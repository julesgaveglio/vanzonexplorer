"use client";

import { useState, useRef } from "react";
import { Link2, Search, Mail, CheckCircle, XCircle, RefreshCw, ExternalLink, ChevronDown, Loader2, BarChart3 } from "lucide-react";

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

interface InitialData {
  prospects: Prospect[];
  outreach: Outreach[];
  obtained: Obtained[];
}

// ── Constantes ─────────────────────────────────────────────────────────────────

const STATUTS: { key: Statut; label: string; color: string; bg: string }[] = [
  { key: "découvert",  label: "Découvert",  color: "text-slate-600",  bg: "bg-slate-100" },
  { key: "contacté",   label: "Contacté",   color: "text-blue-700",   bg: "bg-blue-50" },
  { key: "relancé",    label: "Relancé",    color: "text-amber-700",  bg: "bg-amber-50" },
  { key: "obtenu",     label: "Obtenu ✓",   color: "text-emerald-700",bg: "bg-emerald-50" },
  { key: "rejeté",     label: "Rejeté",     color: "text-red-600",    bg: "bg-red-50" },
];

const TYPE_LABELS: Record<ProspectType, string> = {
  blog: "Blog",
  forum: "Forum",
  partenaire: "Partenaire",
  annuaire: "Annuaire",
  media: "Média",
};

const TYPE_COLORS: Record<ProspectType, string> = {
  blog: "bg-purple-100 text-purple-700",
  forum: "bg-blue-100 text-blue-700",
  partenaire: "bg-emerald-100 text-emerald-700",
  annuaire: "bg-orange-100 text-orange-700",
  media: "bg-pink-100 text-pink-700",
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

  // Outreach modal
  const [outreachModal, setOutreachModal] = useState<{
    prospect: Prospect;
    existing: Outreach | null;
  } | null>(null);
  const [generatingEmail, setGeneratingEmail] = useState(false);
  const [draftEmail, setDraftEmail] = useState<{ subject: string; body: string } | null>(null);
  const [recipientEmail, setRecipientEmail] = useState("");

  // Drag & drop
  const [dragging, setDragging] = useState<string | null>(null);

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
              // Reload page data
              const newProspects: Prospect[] = event.prospects.map((p: Prospect) => ({
                ...p,
                statut: "découvert" as Statut,
              }));
              setProspects((prev) => [...newProspects, ...prev]);
            }
          } catch {
            // ignore parse errors
          }
        }
      }
    } catch (e) {
      setDiscoveryLog((prev) => [...prev, `[error] ${String(e)}`]);
    } finally {
      setDiscovering(false);
    }
  }

  // ── Drag & Drop ────────────────────────────────────────────────────────────

  function handleDragStart(id: string) {
    setDragging(id);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
  }

  async function handleDrop(e: React.DragEvent, newStatut: Statut) {
    e.preventDefault();
    if (!dragging) return;
    const id = dragging;
    setDragging(null);

    setProspects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, statut: newStatut } : p))
    );

    await fetch(`/api/admin/backlinks/prospects/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ statut: newStatut }),
    }).catch(() => null);
  }

  // ── Outreach email ─────────────────────────────────────────────────────────

  function openOutreachModal(prospect: Prospect) {
    const existing = outreachList.find((o) => o.prospect_id === prospect.id) || null;
    setOutreachModal({ prospect, existing });
    setDraftEmail(
      existing
        ? { subject: existing.email_subject || "", body: existing.email_body || "" }
        : null
    );
    setRecipientEmail(existing?.recipient_email || "");
  }

  async function generateEmail() {
    if (!outreachModal) return;
    setGeneratingEmail(true);
    try {
      const resp = await fetch("/api/admin/backlinks/outreach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prospectId: outreachModal.prospect.id }),
      });
      const data = await resp.json();
      if (data.success) {
        setDraftEmail({ subject: data.subject, body: data.body });
        const newOutreach: Outreach = {
          id: data.outreachId,
          prospect_id: outreachModal.prospect.id,
          recipient_email: recipientEmail || null,
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

  async function approveAndCopy() {
    if (!outreachModal || !draftEmail) return;
    const outreach = outreachList.find((o) => o.prospect_id === outreachModal.prospect.id);
    if (outreach) {
      await fetch(`/api/admin/backlinks/outreach/${outreach.id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientEmail }),
      }).catch(() => null);
      setOutreachList((prev) =>
        prev.map((o) =>
          o.id === outreach.id ? { ...o, approved: true, recipient_email: recipientEmail || null } : o
        )
      );
    }
    await navigator.clipboard.writeText(draftEmail.body).catch(() => null);
    // Move prospect to "contacté"
    setProspects((prev) =>
      prev.map((p) => (p.id === outreachModal.prospect.id ? { ...p, statut: "contacté" } : p))
    );
    await fetch(`/api/admin/backlinks/prospects/${outreachModal.prospect.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ statut: "contacté" }),
    }).catch(() => null);
    setOutreachModal(null);
  }

  // ── Stats ──────────────────────────────────────────────────────────────────

  const stats = {
    total: prospects.length,
    decouvert: prospects.filter((p) => p.statut === "découvert").length,
    contacte: prospects.filter((p) => p.statut === "contacté").length,
    relance: prospects.filter((p) => p.statut === "relancé").length,
    obtenu: prospects.filter((p) => p.statut === "obtenu").length,
    rejete: prospects.filter((p) => p.statut === "rejeté").length,
    obtained: obtained.length,
    pendingApproval: outreachList.filter((o) => !o.approved).length,
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
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize ${
                tab === t ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {t === "kanban" ? "Kanban" : "Statistiques"}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {stats.pendingApproval > 0 && (
            <span className="px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-700 text-sm rounded-lg font-medium">
              {stats.pendingApproval} email{stats.pendingApproval > 1 ? "s" : ""} en attente d&apos;approbation
            </span>
          )}
          <button
            onClick={launchDiscovery}
            disabled={discovering}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            {discovering ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
            {discovering ? "Discovery en cours…" : "Lancer le discovery"}
          </button>
        </div>
      </div>

      {/* Discovery log */}
      {(discovering || discoveryLog.length > 0) && (
        <div className="mb-6 bg-slate-900 rounded-xl p-4 font-mono text-xs text-slate-300 max-h-40 overflow-y-auto" ref={logRef}>
          {discoveryLog.map((line, i) => (
            <div
              key={i}
              className={
                line.includes("[error]") ? "text-red-400" :
                line.includes("[success]") ? "text-emerald-400" :
                line.includes("[info]") ? "text-blue-300" : "text-slate-300"
              }
            >
              {line}
            </div>
          ))}
          {discovering && (
            <div className="flex items-center gap-1 text-slate-500 mt-1">
              <span className="animate-pulse">▋</span>
            </div>
          )}
        </div>
      )}

      {/* ── KANBAN ────────────────────────────────────────────────────────── */}
      {tab === "kanban" && (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {STATUTS.map(({ key, label, color, bg }) => {
            const columnProspects = prospects.filter((p) => p.statut === key);
            return (
              <div
                key={key}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, key)}
                className="min-h-[200px] rounded-xl bg-slate-50 border border-slate-200"
              >
                {/* Column header */}
                <div className={`px-3 py-2.5 rounded-t-xl border-b border-slate-200 ${bg}`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-bold ${color}`}>{label}</span>
                    <span className={`text-xs font-mono px-1.5 py-0.5 rounded-md ${bg} ${color} border border-current border-opacity-20`}>
                      {columnProspects.length}
                    </span>
                  </div>
                </div>

                {/* Cards */}
                <div className="p-2 space-y-2">
                  {columnProspects.map((p) => {
                    const hasEmail = outreachList.some((o) => o.prospect_id === p.id);
                    return (
                      <div
                        key={p.id}
                        draggable
                        onDragStart={() => handleDragStart(p.id)}
                        className={`bg-white rounded-lg border border-slate-200 p-3 cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md transition-shadow ${
                          dragging === p.id ? "opacity-50 scale-95" : ""
                        }`}
                      >
                        {/* Score + type */}
                        <div className="flex items-center gap-1.5 mb-2">
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${TYPE_COLORS[p.type]}`}>
                            {TYPE_LABELS[p.type]}
                          </span>
                          <span className="ml-auto text-xs font-mono font-bold text-slate-700">
                            {p.score}/10
                          </span>
                        </div>

                        {/* Domain */}
                        <p className="text-sm font-semibold text-slate-800 truncate">{p.domain}</p>

                        {/* Notes */}
                        {p.notes && (
                          <p className="text-xs text-slate-400 mt-1 line-clamp-2">{p.notes}</p>
                        )}

                        {/* Actions */}
                        <div className="flex items-center gap-1 mt-2.5">
                          <a
                            href={p.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="p-1 text-slate-400 hover:text-blue-500 transition-colors"
                            title="Voir la page"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                          <button
                            onClick={() => openOutreachModal(p)}
                            className={`ml-auto flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-colors ${
                              hasEmail
                                ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                : "bg-blue-50 text-blue-700 hover:bg-blue-100"
                            }`}
                          >
                            <Mail className="w-3 h-3" />
                            {hasEmail ? "Email rédigé" : "Rédiger"}
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

      {/* ── STATS ─────────────────────────────────────────────────────────── */}
      {tab === "stats" && (
        <div className="space-y-6">
          {/* KPI cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {[
              { label: "Total prospects", value: stats.total, icon: <Link2 className="w-5 h-5" />, color: "text-slate-700" },
              { label: "Découverts", value: stats.decouvert, icon: <Search className="w-5 h-5" />, color: "text-slate-600" },
              { label: "Contactés", value: stats.contacte, icon: <Mail className="w-5 h-5" />, color: "text-blue-600" },
              { label: "Backlinks obtenus", value: stats.obtained, icon: <CheckCircle className="w-5 h-5" />, color: "text-emerald-600" },
              { label: "Taux conversion", value: `${stats.conversionRate}%`, icon: <BarChart3 className="w-5 h-5" />, color: "text-purple-600" },
            ].map((kpi) => (
              <div key={kpi.label} className="bg-white rounded-xl border border-slate-200 p-4">
                <div className={`mb-2 ${kpi.color}`}>{kpi.icon}</div>
                <p className="text-2xl font-black text-slate-900">{kpi.value}</p>
                <p className="text-xs text-slate-400 mt-0.5">{kpi.label}</p>
              </div>
            ))}
          </div>

          {/* Funnel */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="font-bold text-slate-800 mb-4">Funnel outreach</h3>
            <div className="space-y-3">
              {STATUTS.map(({ key, label, color, bg }) => {
                const count = prospects.filter((p) => p.statut === key).length;
                const pct = stats.total > 0 ? (count / stats.total) * 100 : 0;
                return (
                  <div key={key} className="flex items-center gap-3">
                    <span className={`w-24 text-sm font-medium ${color}`}>{label}</span>
                    <div className="flex-1 bg-slate-100 rounded-full h-2.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${bg.replace("bg-", "bg-")}`}
                        style={{ width: `${pct}%`, backgroundColor: key === "obtenu" ? "#059669" : key === "rejeté" ? "#dc2626" : key === "contacté" ? "#2563eb" : key === "relancé" ? "#d97706" : "#94a3b8" }}
                      />
                    </div>
                    <span className="w-8 text-right text-sm font-mono text-slate-600">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Backlinks obtenus */}
          {obtained.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="font-bold text-slate-800 mb-4">Backlinks obtenus ({obtained.length})</h3>
              <div className="space-y-2">
                {obtained.map((o) => (
                  <div key={o.id} className="flex items-center gap-3 py-2 border-b border-slate-100 last:border-0">
                    <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                    <a href={o.backlink_url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline truncate flex-1">
                      {o.backlink_url}
                    </a>
                    {o.anchor_text && <span className="text-xs text-slate-400 shrink-0">"{o.anchor_text}"</span>}
                    {o.dr_score && <span className="text-xs font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 shrink-0">DR {o.dr_score}</span>}
                    <span className="text-xs text-slate-400 shrink-0">{o.date_obtained}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── OUTREACH MODAL ────────────────────────────────────────────────── */}
      {outreachModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <h2 className="font-bold text-slate-900">Email d&apos;outreach</h2>
                <p className="text-sm text-slate-400">{outreachModal.prospect.domain}</p>
              </div>
              <button
                onClick={() => setOutreachModal(null)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-500"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Recipient email */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">
                  Email destinataire (optionnel)
                </label>
                <input
                  type="email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  placeholder="contact@exemple.fr"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-blue-400"
                />
              </div>

              {/* Generate button */}
              <button
                onClick={generateEmail}
                disabled={generatingEmail}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-sm font-semibold rounded-xl transition-colors"
              >
                {generatingEmail ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                {draftEmail ? "Régénérer" : "Générer l'email avec l'IA"}
              </button>

              {/* Draft */}
              {draftEmail && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">Objet</label>
                    <input
                      type="text"
                      value={draftEmail.subject}
                      onChange={(e) => setDraftEmail((d) => d ? { ...d, subject: e.target.value } : d)}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-blue-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wide">Corps</label>
                    <textarea
                      value={draftEmail.body}
                      onChange={(e) => setDraftEmail((d) => d ? { ...d, body: e.target.value } : d)}
                      rows={12}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-blue-400 resize-none font-mono"
                    />
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            {draftEmail && (
              <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs text-amber-600">
                  <ChevronDown className="w-3.5 h-3.5" />
                  Validation manuelle requise avant envoi
                </div>
                <button
                  onClick={approveAndCopy}
                  className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-colors"
                >
                  <CheckCircle className="w-4 h-4" />
                  Approuver & copier
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
