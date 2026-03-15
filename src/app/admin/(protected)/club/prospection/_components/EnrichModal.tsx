"use client";

import { useState, useRef, useEffect } from "react";
import { Prospect, ContactEntry } from "../actions";

interface Props {
  open: boolean;
  prospect: Prospect | null;
  onClose: () => void;
  onDone: (id: string, emails: string[], contacts: ContactEntry[]) => void;
}

export default function EnrichModal({ open, prospect, onClose, onDone }: Props) {
  const [isEnriching, setIsEnriching] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [emails, setEmails] = useState<string[]>([]);
  const [contacts, setContacts] = useState<ContactEntry[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const logsEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (prospect) {
      setEmails(prospect.emails ?? []);
      setContacts(prospect.contacts ?? []);
      setLogs([]);
    }
  }, [prospect]);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  useEffect(() => {
    if (!open) {
      abortRef.current?.abort();
    }
    return () => {
      abortRef.current?.abort();
    };
  }, [open]);

  if (!open || !prospect) return null;

  async function handleEnrich() {
    if (!prospect) return;
    setIsEnriching(true);
    setLogs([]);

    abortRef.current = new AbortController();

    try {
      const response = await fetch("/api/admin/club/prospect/enrich", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prospectId: prospect.id, website: prospect.website }),
        signal: abortRef.current.signal,
      });

      if (!response.ok) {
        setLogs(prev => [...prev, `Erreur HTTP ${response.status}`]);
        setIsEnriching(false);
        return;
      }
      if (!response.body) {
        setLogs(prev => [...prev, 'Pas de flux SSE disponible']);
        setIsEnriching(false);
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value);
        const lines = text.split("\n").filter(l => l.startsWith("data: "));
        for (const line of lines) {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.type === "log") setLogs(prev => [...prev, data.message]);
            if (data.type === "emails") setEmails(data.emails);
            if (data.type === "contacts") setContacts(data.contacts);
            if (data.type === "done") setIsEnriching(false);
          } catch {
            // ignore parse errors
          }
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      setLogs(prev => [...prev, `Erreur: ${String(err)}`]);
      setIsEnriching(false);
    }
  }

  function addEmail() {
    const trimmed = newEmail.trim();
    if (trimmed && !emails.includes(trimmed)) {
      setEmails(prev => [...prev, trimmed]);
    }
    setNewEmail("");
  }

  function removeEmail(email: string) {
    setEmails(prev => prev.filter(e => e !== email));
  }

  function handleSave() {
    onDone(prospect!.id, emails, contacts);
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-800">
            Enrichir — <span className="text-violet-600">{prospect.name}</span>
          </h2>
          <button onClick={onClose} aria-label="Fermer" className="text-slate-400 hover:text-slate-600 text-xl font-light leading-none">×</button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          {/* Site */}
          {prospect.website && (
            <div className="text-sm text-slate-500">
              Site :{" "}
              <a href={prospect.website} target="_blank" rel="noopener noreferrer"
                className="text-violet-600 hover:underline">
                {prospect.website}
              </a>
            </div>
          )}

          {/* Enrich button */}
          <button
            onClick={handleEnrich}
            disabled={isEnriching}
            className="w-full py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: "linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)" }}
          >
            {isEnriching ? "Enrichissement en cours..." : "Enrichir automatiquement"}
          </button>

          {/* Logs */}
          {logs.length > 0 && (
            <div className="bg-slate-900 rounded-xl p-4 max-h-36 overflow-y-auto font-mono text-xs text-slate-300 space-y-1">
              {logs.map((log, i) => (
                <div key={i}>{log}</div>
              ))}
              <div ref={logsEndRef} />
            </div>
          )}

          {/* Emails section */}
          <div>
            <div className="text-sm font-medium text-slate-700 mb-2">
              Emails trouvés ({emails.length})
            </div>
            <div className="space-y-1.5">
              {emails.map(email => (
                <div key={email} className="flex items-center justify-between px-3 py-2 bg-slate-50 rounded-lg">
                  <span className="text-sm text-slate-700">{email}</span>
                  <button
                    onClick={() => removeEmail(email)}
                    className="text-slate-400 hover:text-red-500 text-lg leading-none ml-2"
                  >
                    ×
                  </button>
                </div>
              ))}
              {emails.length === 0 && (
                <div className="text-xs text-slate-400 px-1">Aucun email trouvé</div>
              )}
            </div>
            {/* Manual add */}
            <div className="flex gap-2 mt-2">
              <input
                type="email"
                value={newEmail}
                onChange={e => setNewEmail(e.target.value)}
                onKeyDown={e => e.key === "Enter" && addEmail()}
                placeholder="Ajouter un email manuellement"
                className="flex-1 px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-300"
              />
              <button
                onClick={addEmail}
                className="px-3 py-2 text-sm font-medium rounded-xl bg-violet-50 text-violet-700 hover:bg-violet-100 transition-colors"
              >
                Ajouter
              </button>
            </div>
          </div>

          {/* Contacts section */}
          {contacts.length > 0 && (
            <div>
              <div className="text-sm font-medium text-slate-700 mb-2">
                Contacts ({contacts.length})
              </div>
              <div className="space-y-2">
                {contacts.map((contact, i) => (
                  <div key={i} className="flex items-center gap-3 px-3 py-2.5 bg-slate-50 rounded-xl">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-800">{contact.name}</div>
                      <div className="text-xs text-slate-500">{contact.role} — {contact.email}</div>
                    </div>
                    <span className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${
                      contact.priority === 1 ? "bg-emerald-50 text-emerald-700" :
                      contact.priority === 2 ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-600"
                    }`}>
                      P{contact.priority}
                    </span>
                  </div>
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
            Annuler
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{ background: "linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)" }}
          >
            Sauvegarder
          </button>
        </div>
      </div>
    </div>
  );
}
