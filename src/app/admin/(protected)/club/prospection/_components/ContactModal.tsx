"use client";

import { useState, useEffect } from "react";
import { Prospect, updateProspectStatus, addContactHistory } from "../actions";

interface Props {
  open: boolean;
  prospect: Prospect | null;
  subject: string;
  body: string;
  onClose: () => void;
  onMarkedContacted: (id: string) => void;
}

export default function ContactModal({ open, prospect, subject, body, onClose, onMarkedContacted }: Props) {
  const [to, setTo] = useState("");
  const [cc, setCc] = useState("");
  const [editSubject, setEditSubject] = useState(subject);
  const [editBody, setEditBody] = useState(body);
  const [isMarking, setIsMarking] = useState(false);

  useEffect(() => {
    if (prospect) {
      const primaryEmail =
        prospect.contacts[0]?.email ||
        prospect.emails[0] ||
        "";
      setTo(primaryEmail);
      setCc("");
    }
    setEditSubject(subject);
    setEditBody(body);
  }, [prospect, subject, body]);

  if (!open || !prospect) return null;

  function handleOpenGmail() {
    if (!to.trim()) return;
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&tf=1&to=${encodeURIComponent(to)}&cc=${encodeURIComponent(cc)}&su=${encodeURIComponent(editSubject)}&body=${encodeURIComponent(editBody)}`;
    window.open(gmailUrl, "_blank");
  }

  async function handleMarkContacted() {
    if (!prospect) return;
    setIsMarking(true);
    try {
      const statusResult = await updateProspectStatus(prospect.id, "contacte");
      if (!statusResult.success) {
        console.error("Erreur mise à jour statut:", statusResult);
      }
      const historyResult = await addContactHistory(prospect.id, {
        date: new Date().toISOString(),
        action: "Email envoyé",
        notes: `Objet: ${editSubject}`,
      });
      if (!historyResult.success) {
        console.error("Erreur ajout historique contact:", historyResult);
      }
      if (statusResult.success && historyResult.success) {
        onMarkedContacted(prospect.id);
      }
      onClose();
    } catch (err) {
      console.error("Erreur marquage contacté:", err);
    } finally {
      setIsMarking(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-800">
            Contacter — <span className="text-violet-600">{prospect.name}</span>
          </h2>
          <button onClick={onClose} aria-label="Fermer" className="text-slate-400 hover:text-slate-600 text-xl font-light leading-none">×</button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {/* To */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">À</label>
            <input
              type="email"
              value={to}
              onChange={e => setTo(e.target.value)}
              placeholder="destinataire@exemple.com"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-300"
            />
          </div>

          {/* CC */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">CC</label>
            <input
              type="text"
              value={cc}
              onChange={e => setCc(e.target.value)}
              placeholder="cc@exemple.com"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-300"
            />
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Objet</label>
            <input
              type="text"
              value={editSubject}
              onChange={e => setEditSubject(e.target.value)}
              placeholder="Objet de l'email..."
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-300"
            />
          </div>

          {/* Body */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Corps</label>
            <textarea
              value={editBody}
              onChange={e => setEditBody(e.target.value)}
              placeholder="Corps de l'email..."
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-300 resize-y min-h-48"
            />
          </div>

          {/* Other contacts hint */}
          {prospect.contacts.length > 1 && (
            <div className="text-xs text-slate-400">
              Autres contacts :{" "}
              {prospect.contacts.slice(1).map(c => c.email).filter(Boolean).join(", ")}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex justify-between items-center">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            Fermer
          </button>
          <div className="flex gap-3">
            <button
              onClick={handleOpenGmail}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold border-2 border-violet-300 text-violet-700 hover:bg-violet-50 transition-colors"
            >
              Ouvrir Gmail
            </button>
            <button
              onClick={handleMarkContacted}
              disabled={isMarking}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: "linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)" }}
            >
              {isMarking ? "Enregistrement..." : "Marquer comme contacté"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
