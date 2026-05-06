"use client";

import { useState, useEffect } from "react";

interface Campaign {
  id: string;
  name: string;
  subject: string;
  body_html: string;
  created_at: string;
  sends_count: number;
  last_sent: string | null;
}

export default function AdsEmailClient() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formName, setFormName] = useState("");
  const [formSubject, setFormSubject] = useState("");
  const [formHtml, setFormHtml] = useState("");
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const fetchCampaigns = () => {
    setLoading(true);
    fetch("/api/ads/emails")
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
    await fetch("/api/ads/emails", {
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Emails</h1>
          <p className="text-sm text-slate-500 mt-1">
            {campaigns.length} campagne{campaigns.length > 1 ? "s" : ""} — suivi
            des envois
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 text-sm font-semibold text-white bg-slate-900 rounded-xl hover:bg-slate-700 transition-colors"
        >
          + Nouvelle campagne
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <h3 className="font-semibold text-slate-900">
            Nouvelle campagne email
          </h3>
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">
              Nom de la campagne
            </label>
            <input
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="Ex: Email général Book"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">
              Objet de l&apos;email
            </label>
            <input
              type="text"
              value={formSubject}
              onChange={(e) => setFormSubject(e.target.value)}
              placeholder="Ex: 30min pour parler van ?"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">
              Contenu HTML (utilise {`{{firstname}}`} pour le prénom)
            </label>
            <textarea
              value={formHtml}
              onChange={(e) => setFormHtml(e.target.value)}
              rows={8}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/30 resize-none"
              placeholder="<p>Salut {{firstname}},</p>..."
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              disabled={saving || !formName.trim()}
              className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-xl hover:bg-blue-500 disabled:opacity-50 transition-colors"
            >
              {saving ? "..." : "Créer"}
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
          <svg
            className="animate-spin h-6 w-6 text-blue-500"
            viewBox="0 0 24 24"
          >
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="3"
              fill="none"
              strokeDasharray="30 70"
            />
          </svg>
        </div>
      ) : campaigns.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center text-slate-400 text-sm">
          Aucune campagne email
        </div>
      ) : (
        <div className="space-y-3">
          {campaigns.map((c) => (
            <div
              key={c.id}
              className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm"
            >
              <button
                onClick={() =>
                  setExpanded(expanded === c.id ? null : c.id)
                }
                className="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors text-left"
              >
                <div>
                  <p className="font-semibold text-slate-900">{c.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Objet : {c.subject}
                  </p>
                </div>
                <div className="flex items-center gap-4 flex-shrink-0">
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-900">
                      {c.sends_count}
                    </p>
                    <p className="text-[10px] text-slate-400">envois</p>
                  </div>
                  {c.last_sent && (
                    <div className="text-right hidden sm:block">
                      <p className="text-xs text-slate-500">
                        {new Date(c.last_sent).toLocaleDateString("fr-FR", {
                          day: "numeric",
                          month: "short",
                        })}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        dernier envoi
                      </p>
                    </div>
                  )}
                  <svg
                    className={`w-4 h-4 text-slate-400 transition-transform ${expanded === c.id ? "rotate-180" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </button>

              {expanded === c.id && (
                <div className="border-t border-slate-100 px-5 py-4">
                  <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
                    Aperçu
                  </p>
                  <div
                    className="bg-slate-50 rounded-xl p-4 text-sm max-h-60 overflow-y-auto"
                    dangerouslySetInnerHTML={{
                      __html: c.body_html.replace(
                        /\{\{firstname\}\}/g,
                        "<b>[Prénom]</b>"
                      ),
                    }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
