"use client";

import { useState, useEffect } from "react";
import { Prospect } from "../actions";
import { STATUS_COLORS, STATUS_LABELS } from "./statusConstants";

interface Props {
  open: boolean;
  prospect: Prospect | null;
  onClose: () => void;
  onGenerated: (id: string, subject: string, body: string) => void;
}

export default function EmailModal({ open, prospect, onClose, onGenerated }: Props) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  useEffect(() => {
    if (prospect) {
      setSubject(prospect.generated_subject ?? "");
      setBody(prospect.generated_email ?? "");
    }
  }, [prospect]);

  if (!open || !prospect) return null;

  async function handleGenerate() {
    if (!prospect) return;
    setIsGenerating(true);
    try {
      const response = await fetch("/api/admin/club/prospect/generate-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prospectId: prospect.id }),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Erreur serveur' }));
        console.error('[EmailModal] generate error:', err);
        return;
      }
      const data = await response.json();
      if (data.subject) setSubject(data.subject);
      if (data.body) setBody(data.body);
    } catch (err) {
      console.error("Erreur génération email:", err);
    } finally {
      setIsGenerating(false);
    }
  }

  function handleOpenContact() {
    onGenerated(prospect!.id, subject, body);
  }

  const recipientEmails = prospect.contacts.map(c => c.email).filter(Boolean);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-slate-800">
              Email pour <span className="text-violet-600">{prospect.name}</span>
            </h2>
            <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_COLORS[prospect.status].bg} ${STATUS_COLORS[prospect.status].text}`}>
              {STATUS_LABELS[prospect.status]}
            </span>
          </div>
          <button onClick={onClose} aria-label="Fermer" className="text-slate-400 hover:text-slate-600 text-xl font-light leading-none">×</button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          {/* Generate button */}
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: "linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)" }}
          >
            {isGenerating ? "Génération en cours..." : "Générer avec l'IA"}
          </button>

          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Objet</label>
            <input
              type="text"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="Objet de l'email..."
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-300"
            />
          </div>

          {/* Body */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Corps</label>
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder="Corps de l'email..."
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-300 resize-y min-h-64"
            />
          </div>

          {/* Recipients */}
          {(recipientEmails.length > 0 || prospect.emails.length > 0) && (
            <div>
              <div className="text-sm font-medium text-slate-700 mb-2">Destinataires</div>
              <div className="flex flex-wrap gap-2">
                {recipientEmails.map(email => (
                  <span key={email} className="inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full bg-violet-50 text-violet-700">
                    {email}
                  </span>
                ))}
                {prospect.contacts.length === 0 && prospect.emails.map(email => (
                  <span key={email} className="inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
                    {email}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            Fermer
          </button>
          <button
            onClick={handleOpenContact}
            disabled={!subject && !body}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: "linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)" }}
          >
            Préparer l'envoi →
          </button>
        </div>
      </div>
    </div>
  );
}
