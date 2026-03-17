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

// Roles that can make partnership decisions → best "To" candidates
const DECISION_ROLES = ["ceo","directeur","direction","founder","fondateur","gérant","owner","head","responsable","partenariat","partnership","business","commercial","dg","président"];
// Generic contact emails that are good for cold outreach
const GENERIC_PREFIXES = /^(contact|hello|bonjour|info|collab|partenariat|partnership|commercial|equipe|team)@/i;

function pickRecipients(prospect: Prospect): { to: string; ccList: string[] } {
  const contacts = prospect.contacts ?? [];
  const emails = prospect.emails ?? [];

  // Generic emails (good for outreach)
  const genericEmails = emails.filter(e => GENERIC_PREFIXES.test(e));

  // Best "To": priority-1 contact → decision maker contact → generic email → first email
  const p1 = contacts.find(c => c.priority === 1 && c.email);
  const decisionMaker = contacts.find(c =>
    DECISION_ROLES.some(r => (c.role ?? "").toLowerCase().includes(r)) && c.email
  );
  const toEmail =
    p1?.email ||
    decisionMaker?.email ||
    genericEmails[0] ||
    emails[0] ||
    "";

  // CC candidates: remaining contacts + generic emails not already used, deduped, max 4
  const seen = new Set([toEmail]);
  const ccCandidates: string[] = [];

  // First: other contacts by priority
  [...contacts]
    .sort((a, b) => a.priority - b.priority)
    .forEach(c => {
      if (c.email && !seen.has(c.email)) { seen.add(c.email); ccCandidates.push(c.email); }
    });

  // Then: generic emails not yet included
  genericEmails.forEach(e => {
    if (!seen.has(e)) { seen.add(e); ccCandidates.push(e); }
  });

  // Then: remaining emails
  emails.forEach(e => {
    if (!seen.has(e)) { seen.add(e); ccCandidates.push(e); }
  });

  return { to: toEmail, ccList: ccCandidates.slice(0, 4) };
}

export default function ContactModal({ open, prospect, subject, body, onClose, onMarkedContacted }: Props) {
  const [to, setTo] = useState("");
  const [ccList, setCcList] = useState<string[]>([]);
  const [editSubject, setEditSubject] = useState(subject);
  const [editBody, setEditBody] = useState(body);
  const [isMarking, setIsMarking] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ ok: boolean; message: string } | null>(null);

  useEffect(() => {
    if (prospect) {
      const { to: bestTo, ccList: bestCc } = pickRecipients(prospect);
      setTo(bestTo);
      setCcList(bestCc);
      setSendResult(null);
    }
    setEditSubject(subject || (prospect ? `Collaboration Vanzon Explorer × ${prospect.name}` : ""));
    setEditBody(body);
  }, [prospect, subject, body]);

  if (!open || !prospect) return null;

  const ccString = ccList.join(", ");

  function handleOpenGmail() {
    if (!to.trim()) return;
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&tf=1&to=${encodeURIComponent(to)}&cc=${encodeURIComponent(ccString)}&su=${encodeURIComponent(editSubject)}&body=${encodeURIComponent(editBody)}`;
    window.open(gmailUrl, "_blank");
  }

  async function handleSendDirect() {
    if (!to.trim() || !prospect) return;
    setIsSending(true);
    setSendResult(null);
    try {
      const res = await fetch("/api/admin/club/prospect/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prospectId: prospect.id,
          to,
          cc: ccList,
          subject: editSubject,
          body: editBody,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSendResult({ ok: true, message: "Email envoyé avec succès !" });
        await markContacted();
      } else {
        setSendResult({ ok: false, message: data.error ?? "Erreur lors de l'envoi" });
      }
    } catch (err) {
      setSendResult({ ok: false, message: String(err) });
    } finally {
      setIsSending(false);
    }
  }

  async function markContacted() {
    if (!prospect) return;
    await updateProspectStatus(prospect.id, "contacte");
    await addContactHistory(prospect.id, {
      date: new Date().toISOString(),
      action: "Email envoyé",
      notes: `Objet: ${editSubject}`,
    });
    onMarkedContacted(prospect.id);
  }

  async function handleMarkContacted() {
    if (!prospect) return;
    setIsMarking(true);
    try {
      await markContacted();
      onClose();
    } catch (err) {
      console.error("Erreur marquage contacté:", err);
    } finally {
      setIsMarking(false);
    }
  }

  function removeCc(email: string) {
    setCcList(prev => prev.filter(e => e !== email));
  }

  function addCc(email: string) {
    const trimmed = email.trim();
    if (trimmed && !ccList.includes(trimmed)) {
      setCcList(prev => [...prev, trimmed]);
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
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              À
              {prospect.contacts.find(c => c.email === to) && (
                <span className="ml-2 text-xs font-normal text-slate-400">
                  {prospect.contacts.find(c => c.email === to)?.name} · {prospect.contacts.find(c => c.email === to)?.role}
                </span>
              )}
            </label>
            <input
              type="email"
              value={to}
              onChange={e => setTo(e.target.value)}
              placeholder="destinataire@exemple.com"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-300"
            />
          </div>

          {/* CC — pill tags */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              CC
              <span className="ml-2 text-xs font-normal text-slate-400">{ccList.length} destinataire{ccList.length !== 1 ? "s" : ""}</span>
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {ccList.map(email => {
                const contact = prospect.contacts.find(c => c.email === email);
                return (
                  <span
                    key={email}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-violet-50 text-violet-700 border border-violet-100"
                  >
                    {contact ? `${contact.name} (${email})` : email}
                    <button
                      onClick={() => removeCc(email)}
                      className="text-violet-400 hover:text-violet-600 ml-0.5 leading-none"
                    >
                      ×
                    </button>
                  </span>
                );
              })}
            </div>
            <input
              type="email"
              placeholder="Ajouter un email en copie..."
              onKeyDown={e => {
                if (e.key === "Enter" || e.key === ",") {
                  e.preventDefault();
                  addCc((e.target as HTMLInputElement).value);
                  (e.target as HTMLInputElement).value = "";
                }
              }}
              onBlur={e => { if (e.target.value) { addCc(e.target.value); e.target.value = ""; } }}
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

          {/* Send result */}
          {sendResult && (
            <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium ${
              sendResult.ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"
            }`}>
              {sendResult.ok ? "✓" : "✗"} {sendResult.message}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex justify-between items-center flex-wrap gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            Fermer
          </button>
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={handleOpenGmail}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold border-2 border-violet-300 text-violet-700 hover:bg-violet-50 transition-colors"
            >
              Ouvrir Gmail
            </button>
            <button
              onClick={handleSendDirect}
              disabled={isSending || !to.trim()}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold border-2 border-emerald-300 text-emerald-700 hover:bg-emerald-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSending ? "Envoi..." : "Envoyer directement"}
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
