"use client";

import { useState, useEffect } from "react";

const COLORS = [
  "#0F172A", "#B9945F", "#10B981", "#3B82F6", "#EF4444",
  "#8B5CF6", "#EC4899", "#6366F1", "#14B8A6", "#F97316",
];

interface Campaign {
  id: string;
  name: string;
  subject: string;
  body_html: string;
  color: string | null;
  created_at: string;
  sends_count: number;
  last_sent: string | null;
}

export default function SigmaEmailClient() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formName, setFormName] = useState("");
  const [formSubject, setFormSubject] = useState("");
  const [formHtml, setFormHtml] = useState("");
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editSubject, setEditSubject] = useState("");
  const [editHtml, setEditHtml] = useState("");
  const [editColor, setEditColor] = useState("#B9945F");
  const [editSaving, setEditSaving] = useState(false);

  const fetchCampaigns = () => {
    setLoading(true);
    fetch("/api/sigma/emails")
      .then((r) => r.json())
      .then((json) => setCampaigns(json.campaigns ?? []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const handleCreate = async () => {
    if (!formName.trim() || !formSubject.trim() || !formHtml.trim()) return;
    setSaving(true);
    await fetch("/api/sigma/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: formName.trim(),
        subject: formSubject.trim(),
        body_html: formHtml.trim(),
      }),
    });
    setSaving(false);
    setShowForm(false);
    setFormName("");
    setFormSubject("");
    setFormHtml("");
    fetchCampaigns();
  };

  const startEdit = (c: Campaign) => {
    setEditing(c.id);
    setEditName(c.name);
    setEditSubject(c.subject);
    setEditHtml(c.body_html);
    setEditColor(c.color || "#B9945F");
    setExpanded(c.id);
  };

  const handleSaveEdit = async (id: string) => {
    setEditSaving(true);
    await fetch("/api/sigma/emails", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id,
        name: editName.trim(),
        subject: editSubject.trim(),
        body_html: editHtml.trim(),
        color: editColor,
      }),
    });
    setEditSaving(false);
    setEditing(null);
    fetchCampaigns();
  };

  const inputCls = "w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#B9945F]/30";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Emails</h1>
          <p className="text-sm text-slate-500 mt-1">
            {campaigns.length} campagne{campaigns.length > 1 ? "s" : ""} — suivi des envois
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 text-sm font-semibold text-white bg-[#B9945F] rounded-xl hover:opacity-90 transition-colors"
        >
          + Nouvelle campagne
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
          <h3 className="font-semibold text-slate-900">Nouvelle campagne email</h3>
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">Nom de la campagne</label>
            <input
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="Ex: Relance J+7"
              className={inputCls}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">Objet de l&apos;email</label>
            <input
              type="text"
              value={formSubject}
              onChange={(e) => setFormSubject(e.target.value)}
              placeholder="Ex: Votre projet immobilier"
              className={inputCls}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">
              Contenu HTML (utilise {`{{firstname}}`} pour le prenom)
            </label>
            <textarea
              value={formHtml}
              onChange={(e) => setFormHtml(e.target.value)}
              rows={8}
              className={`${inputCls} font-mono resize-none`}
              placeholder="<p>Bonjour {{firstname}},</p>..."
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              disabled={saving || !formName.trim()}
              className="px-4 py-2 text-sm font-semibold text-white bg-[#B9945F] rounded-xl hover:opacity-90 disabled:opacity-50 transition-colors"
            >
              {saving ? "..." : "Creer"}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2 text-sm text-slate-500 hover:text-slate-700"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* Campaigns list */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#B9945F]" />
        </div>
      ) : campaigns.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center text-slate-400 text-sm">
          Aucune campagne email
        </div>
      ) : (
        <div className="space-y-3">
          {campaigns.map((c) => {
            const isExpanded = expanded === c.id;
            const isEditing = editing === c.id;

            return (
              <div key={c.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                {/* Header */}
                <div className="px-5 py-4 flex items-center justify-between">
                  <button
                    onClick={() => setExpanded(isExpanded ? null : c.id)}
                    className="flex-1 text-left hover:opacity-80 transition-opacity"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: c.color || "#B9945F" }} />
                      <p className="font-semibold text-slate-900">{c.name}</p>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">Objet : {c.subject}</p>
                  </button>
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <div className="text-right">
                      <p className="text-sm font-bold text-slate-900">{c.sends_count}</p>
                      <p className="text-[10px] text-slate-400">envois</p>
                    </div>
                    {c.last_sent && (
                      <div className="text-right hidden sm:block">
                        <p className="text-xs text-slate-500">
                          {new Date(c.last_sent).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                        </p>
                        <p className="text-[10px] text-slate-400">dernier envoi</p>
                      </div>
                    )}
                    <button
                      onClick={() => isEditing ? setEditing(null) : startEdit(c)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                        isEditing ? "bg-slate-100 text-slate-600" : "text-[#B9945F] hover:bg-[#B9945F]/10"
                      }`}
                    >
                      {isEditing ? "Annuler" : "Modifier"}
                    </button>
                    <svg
                      className={`w-4 h-4 text-slate-400 transition-transform cursor-pointer ${isExpanded ? "rotate-180" : ""}`}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"
                      onClick={() => setExpanded(isExpanded ? null : c.id)}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>

                {/* Expanded */}
                {isExpanded && (
                  <div className="border-t border-slate-100 px-5 py-4">
                    {isEditing ? (
                      <div className="space-y-4">
                        <div>
                          <label className="text-xs font-medium text-slate-500 mb-1 block">Nom</label>
                          <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className={inputCls} />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-slate-500 mb-1 block">Objet</label>
                          <input type="text" value={editSubject} onChange={(e) => setEditSubject(e.target.value)} className={inputCls} />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-slate-500 mb-1 block">Couleur</label>
                          <div className="flex gap-2">
                            {COLORS.map((color) => (
                              <button
                                key={color}
                                onClick={() => setEditColor(color)}
                                className={`w-7 h-7 rounded-full transition-all ${editColor === color ? "ring-2 ring-offset-2 ring-slate-400 scale-110" : "hover:scale-110"}`}
                                style={{ backgroundColor: color }}
                              />
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-slate-500 mb-1 block">Contenu HTML</label>
                          <textarea
                            value={editHtml}
                            onChange={(e) => setEditHtml(e.target.value)}
                            rows={12}
                            className={`${inputCls} font-mono resize-y`}
                          />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Apercu</p>
                          <div
                            className="bg-white border border-slate-200 rounded-xl p-5 text-sm"
                            style={{ lineHeight: "1.7" }}
                            dangerouslySetInnerHTML={{ __html: editHtml.replace(/\{\{firstname\}\}/g, "<b>[Prenom]</b>") }}
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSaveEdit(c.id)}
                            disabled={editSaving}
                            className="px-4 py-2 text-sm font-semibold text-white bg-[#B9945F] rounded-xl hover:opacity-90 disabled:opacity-50 transition-colors"
                          >
                            {editSaving ? "Enregistrement..." : "Enregistrer"}
                          </button>
                          <button onClick={() => setEditing(null)} className="px-4 py-2 text-sm text-slate-500 hover:text-slate-700">
                            Annuler
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Apercu</p>
                        <div
                          className="bg-slate-50 rounded-xl p-5 text-sm"
                          style={{ lineHeight: "1.7" }}
                          dangerouslySetInnerHTML={{ __html: c.body_html.replace(/\{\{firstname\}\}/g, "<b>[Prenom]</b>") }}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
