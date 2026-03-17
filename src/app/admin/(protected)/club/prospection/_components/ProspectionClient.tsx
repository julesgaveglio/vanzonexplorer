"use client";

import { useState, useRef, useEffect } from "react";
import {
  Prospect,
  ProspectStatus,
  ContactEntry,
  updateProspectStatus,
  bulkInsertProspects,
  upsertProspect,
  deleteProspect,
  getProspects,
} from "../actions";
import { STATUS_COLORS, STATUS_LABELS } from "./statusConstants";
import DiscoverModal, { ProspectCandidate } from "./DiscoverModal";
import EnrichModal from "./EnrichModal";
import EmailModal from "./EmailModal";
import ContactModal from "./ContactModal";

const ALL_STATUSES: ProspectStatus[] = [
  "a_traiter","enrichi","email_genere","contacte","relance",
  "en_discussion","accepte","refuse","a_revoir",
];

// Triage intelligent : les plus actionnables en premier
const STATUS_PRIORITY: Record<ProspectStatus, number> = {
  email_genere:  1, // email prêt → envoyer maintenant
  en_discussion: 2, // deal actif → suivre
  relance:       3, // relance à envoyer
  enrichi:       4, // à contacter → générer email
  a_traiter:     5, // à enrichir
  contacte:      6, // en attente réponse
  a_revoir:      7, // différé
  accepte:       8, // fermé — gagné
  refuse:        9, // fermé — perdu
};

const CATEGORIES = ["froid","énergie","chauffage","sanitaire","extérieur","accessoires","distributeur","tendance"];

const CATEGORY_COLORS: Record<string, string> = {
  froid:        "bg-sky-100 text-sky-700",
  énergie:      "bg-yellow-100 text-yellow-700",
  chauffage:    "bg-orange-100 text-orange-700",
  sanitaire:    "bg-teal-100 text-teal-700",
  extérieur:    "bg-green-100 text-green-700",
  accessoires:  "bg-slate-100 text-slate-600",
  distributeur: "bg-violet-100 text-violet-700",
  tendance:     "bg-pink-100 text-pink-700",
};

interface Props {
  initialProspects: Prospect[];
}

// EmailCell — dropdown pour afficher tous les emails
function EmailCell({ emails, onEditFirst }: { emails: string[]; onEditFirst: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  if (emails.length === 0) {
    return (
      <span
        onClick={onEditFirst}
        className="text-xs text-slate-300 italic cursor-pointer hover:text-slate-500 px-1 py-0.5 rounded hover:bg-violet-50 transition-colors"
      >
        Aucun email
      </span>
    );
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => emails.length > 1 ? setOpen(o => !o) : onEditFirst()}
        className="flex items-center gap-1.5 w-full text-left group"
      >
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
        <span className="text-xs text-slate-700 font-medium truncate max-w-[140px]">{emails[0]}</span>
        {emails.length > 1 && (
          <span className={`flex-shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full transition-colors ${
            open ? "bg-violet-600 text-white" : "bg-violet-100 text-violet-600 group-hover:bg-violet-200"
          }`}>
            +{emails.length - 1}
          </span>
        )}
      </button>

      {open && emails.length > 1 && (
        <div className="absolute left-0 top-full mt-1 z-50 bg-white rounded-xl shadow-lg border border-slate-100 py-1 min-w-[220px] max-w-[280px]">
          <div className="px-3 py-1.5 border-b border-slate-50 mb-1">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              {emails.length} email{emails.length > 1 ? "s" : ""} trouvé{emails.length > 1 ? "s" : ""}
            </span>
          </div>
          {emails.map((email, i) => (
            <div
              key={email}
              className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-50 transition-colors group/item"
            >
              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${i === 0 ? "bg-emerald-400" : "bg-slate-300"}`} />
              <span className="text-xs text-slate-700 truncate flex-1">{email}</span>
              <button
                onClick={e => { e.stopPropagation(); navigator.clipboard.writeText(email); }}
                title="Copier"
                className="opacity-0 group-hover/item:opacity-100 transition-opacity text-slate-400 hover:text-violet-600 flex-shrink-0"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// EditableCell helper
interface EditableCellProps {
  id: string;
  field: string;
  value: string;
  className?: string;
  multiline?: boolean;
  editingCell: { id: string; field: string } | null;
  editValue: string;
  setEditValue: (v: string) => void;
  startEdit: (id: string, field: string, currentValue: string) => void;
  saveEdit: () => void;
  setEditingCell: (v: { id: string; field: string } | null) => void;
  displayNode?: React.ReactNode;
}

function EditableCell({
  id, field, value, className = "", multiline = false,
  editingCell, editValue, setEditValue, startEdit, saveEdit, setEditingCell,
  displayNode,
}: EditableCellProps) {
  const isEditing = editingCell?.id === id && editingCell?.field === field;

  if (isEditing) {
    if (multiline) {
      return (
        <textarea
          autoFocus
          rows={3}
          value={editValue}
          onChange={e => setEditValue(e.target.value)}
          onBlur={saveEdit}
          onKeyDown={e => {
            if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); saveEdit(); }
            if (e.key === "Escape") setEditingCell(null);
          }}
          className={`w-full text-xs px-1.5 py-1 border border-violet-400 rounded focus:outline-none focus:ring-1 focus:ring-violet-400 resize-none ${className}`}
        />
      );
    }
    return (
      <input
        autoFocus
        type={field === "email" ? "email" : "text"}
        value={editValue}
        onChange={e => setEditValue(e.target.value)}
        onBlur={saveEdit}
        onKeyDown={e => {
          if (e.key === "Enter") saveEdit();
          if (e.key === "Escape") setEditingCell(null);
        }}
        className={`w-full text-xs px-1.5 py-1 border border-violet-400 rounded focus:outline-none focus:ring-1 focus:ring-violet-400 ${className}`}
      />
    );
  }

  return (
    <div
      onClick={() => startEdit(id, field, value)}
      className={`cursor-pointer hover:bg-violet-50 rounded px-1 py-0.5 min-h-[22px] ${className}`}
    >
      {displayNode ?? <span className="text-xs text-slate-700">{value || <span className="text-slate-300">—</span>}</span>}
    </div>
  );
}

export default function ProspectionClient({ initialProspects }: Props) {
  const [prospects, setProspects] = useState<Prospect[]>(initialProspects);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterCountry, setFilterCountry] = useState("");

  const [showDiscoverModal, setShowDiscoverModal] = useState(false);
  const [showEnrichModal, setShowEnrichModal] = useState(false);
  const [enrichTarget, setEnrichTarget] = useState<Prospect | null>(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailTarget, setEmailTarget] = useState<Prospect | null>(null);
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactTarget, setContactTarget] = useState<Prospect | null>(null);
  const [contactSubject, setContactSubject] = useState("");
  const [contactBody, setContactBody] = useState("");

  // Inline editing state
  const [editingCell, setEditingCell] = useState<{ id: string; field: string } | null>(null);
  const [editValue, setEditValue] = useState("");

  // New brand row
  const [newBrandName, setNewBrandName] = useState("");

  // Stats
  const total = prospects.length;
  const enrichis = prospects.filter(p => p.status === "enrichi").length;
  const contactes = prospects.filter(p => p.status === "contacte").length;
  const enDiscussion = prospects.filter(p => p.status === "en_discussion").length;
  const acceptes = prospects.filter(p => p.status === "accepte").length;

  // Filtered + sorted prospects (triage intelligent par statut actionnable)
  const filtered = prospects
    .filter(p => {
      if (search && !p.name.toLowerCase().includes(search.toLowerCase()) &&
          !(p.description ?? "").toLowerCase().includes(search.toLowerCase())) return false;
      if (filterCategory && p.category !== filterCategory) return false;
      if (filterStatus && p.status !== filterStatus) return false;
      if (filterCountry) {
        if (filterCountry === "France" && p.country !== "France") return false;
        if (filterCountry === "other" && p.country === "France") return false;
      }
      return true;
    })
    .sort((a, b) => {
      const pa = STATUS_PRIORITY[a.status] ?? 99;
      const pb = STATUS_PRIORITY[b.status] ?? 99;
      if (pa !== pb) return pa - pb;
      // À égalité de statut : les plus récemment mis à jour en premier
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });

  async function handleStatusChange(id: string, newStatus: ProspectStatus) {
    const result = await updateProspectStatus(id, newStatus);
    if (!result.success) {
      console.error('[ProspectionClient] handleStatusChange failed:', result);
      return;
    }
    setProspects(prev => prev.map(p => p.id === id ? { ...p, status: newStatus } : p));
  }

  async function handleDiscoverAdd(newProspects: ProspectCandidate[]) {
    const result = await bulkInsertProspects(newProspects.map(p => ({ ...p, name: p.name })));
    if (result.success) {
      const updated = await getProspects();
      setProspects(updated);
    }
  }

  async function handleEnrichDone(id: string, emails: string[], contacts: ContactEntry[]) {
    await upsertProspect({ id, name: prospects.find(p => p.id === id)?.name ?? "", emails, contacts, status: "enrichi" });
    setProspects(prev => prev.map(p => p.id === id ? { ...p, emails, contacts, status: "enrichi" } : p));
  }

  function handleEmailGenerated(id: string, subject: string, body: string) {
    setProspects(prev => prev.map(p => p.id === id
      ? { ...p, generated_subject: subject, generated_email: body, status: "email_genere" }
      : p
    ));
    const prospect = prospects.find(p => p.id === id);
    if (prospect) {
      setContactTarget({ ...prospect, generated_subject: subject, generated_email: body, status: "email_genere" });
      setContactSubject(subject);
      setContactBody(body);
      setShowEmailModal(false);
      setShowContactModal(true);
    }
  }

  function handleMarkedContacted(id: string) {
    setProspects(prev => prev.map(p => p.id === id
      ? { ...p, status: "contacte", last_contact_at: new Date().toISOString() }
      : p
    ));
  }

  async function handleDelete(id: string) {
    const result = await deleteProspect(id);
    if (!result.success) {
      console.error('[ProspectionClient] handleDelete failed:', result);
      return;
    }
    setProspects(prev => prev.filter(p => p.id !== id));
  }

  function startEdit(id: string, field: string, currentValue: string) {
    if (editingCell) {
      saveEdit();
    }
    setEditingCell({ id, field });
    setEditValue(currentValue);
  }

  async function saveEdit() {
    if (!editingCell) return;
    const { id, field } = editingCell;
    const prospect = prospects.find(p => p.id === id);
    if (!prospect) { setEditingCell(null); return; }

    const updateData: Partial<Prospect> & { name: string } = { id, name: prospect.name };

    if (field === "name") updateData.name = editValue;
    else if (field === "website") updateData.website = editValue;
    else if (field === "description") updateData.description = editValue;
    else if (field === "category") updateData.category = editValue;
    else if (field === "email") {
      const newEmails = editValue.trim()
        ? [editValue.trim(), ...prospect.emails.filter(e => e !== editValue.trim())].slice(0, 5)
        : prospect.emails;
      updateData.emails = newEmails;
    }
    else if (field === "internal_notes") updateData.internal_notes = editValue;

    const result = await upsertProspect(updateData);
    if (result.success) {
      const updated: Partial<Prospect> = {};
      if (field === "name") updated.name = editValue;
      else if (field === "website") updated.website = editValue;
      else if (field === "description") updated.description = editValue;
      else if (field === "category") updated.category = editValue;
      else if (field === "email") updated.emails = updateData.emails!;
      else if (field === "internal_notes") updated.internal_notes = editValue;
      setProspects(prev => prev.map(p => p.id === id ? { ...p, ...updated } : p));
    }
    setEditingCell(null);
  }

  async function handleCategoryChange(id: string, newCategory: string) {
    const prospect = prospects.find(p => p.id === id);
    if (!prospect) return;
    const result = await upsertProspect({ id, name: prospect.name, category: newCategory });
    if (result.success) {
      setProspects(prev => prev.map(p => p.id === id ? { ...p, category: newCategory } : p));
    }
    setEditingCell(null);
  }

  async function handleAddBrand() {
    if (!newBrandName.trim()) return;
    const result = await upsertProspect({ name: newBrandName.trim() });
    if (result.success) {
      const updated = await getProspects();
      setProspects(updated);
      setNewBrandName("");
    }
  }

  const editableCellProps = { editingCell, editValue, setEditValue, startEdit, saveEdit, setEditingCell };

  return (
    <div className="space-y-6">
      {/* Stats bar — horizontally scrollable on mobile */}
      <div className="flex gap-3 overflow-x-auto pb-1 -mx-2 px-2">
        {[
          { label: "Total", value: total },
          { label: "Enrichis", value: enrichis },
          { label: "Contactés", value: contactes },
          { label: "En discussion", value: enDiscussion },
          { label: "Acceptés", value: acceptes },
        ].map(stat => (
          <div key={stat.label} className="flex-shrink-0 bg-white rounded-2xl shadow-sm border border-slate-100 px-5 py-4 min-w-[100px]">
            <div className="text-3xl font-bold text-slate-800">{stat.value}</div>
            <div className="text-sm text-slate-500 mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 items-center">
        <input
          type="text"
          placeholder="Rechercher une marque..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 min-w-48 px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-violet-300"
        />
        <select
          value={filterCategory}
          onChange={e => setFilterCategory(e.target.value)}
          className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-violet-300"
        >
          <option value="">Toutes catégories</option>
          {CATEGORIES.map(c => (
            <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-violet-300"
        >
          <option value="">Tous statuts</option>
          {ALL_STATUSES.map(s => (
            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
          ))}
        </select>
        <select
          value={filterCountry}
          onChange={e => setFilterCountry(e.target.value)}
          className="px-3 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-violet-300"
        >
          <option value="">Tous pays</option>
          <option value="France">France</option>
          <option value="other">Autres</option>
        </select>
        <button
          onClick={() => setShowDiscoverModal(true)}
          className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
          style={{ background: "linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)" }}
        >
          Découvrir des marques
        </button>
      </div>

      {/* Desktop table — hidden on mobile */}
      <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-3 py-3 w-28">Catégorie</th>
              <th className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-3 py-3">Nom / Site</th>
              <th className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-3 py-3 w-44">Email</th>
              <th className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-3 py-3">Description</th>
              <th className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-3 py-3 w-36">Statut</th>
              <th className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-3 py-3 w-32">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-slate-400 text-sm">
                  Aucun prospect ne correspond aux filtres sélectionnés
                </td>
              </tr>
            ) : (
              filtered.map(p => (
                <tr key={p.id} className="hover:bg-slate-50/60 transition-colors group">
                  {/* Catégorie */}
                  <td className="px-3 py-2">
                    {editingCell?.id === p.id && editingCell.field === "category" ? (
                      <select
                        autoFocus
                        value={editValue}
                        onChange={e => { setEditValue(e.target.value); handleCategoryChange(p.id, e.target.value); }}
                        onBlur={() => setEditingCell(null)}
                        className="text-xs px-1.5 py-1 border border-violet-400 rounded focus:outline-none w-full"
                      >
                        <option value="">—</option>
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    ) : (
                      <div
                        onClick={() => startEdit(p.id, "category", p.category ?? "")}
                        className="cursor-pointer"
                      >
                        {p.category ? (
                          <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${CATEGORY_COLORS[p.category] ?? "bg-slate-100 text-slate-600"}`}>
                            {p.category}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-300 hover:text-slate-500">—</span>
                        )}
                      </div>
                    )}
                  </td>

                  {/* Nom / Site */}
                  <td className="px-3 py-2 min-w-[150px] max-w-[200px]">
                    <EditableCell
                      id={p.id} field="name" value={p.name}
                      {...editableCellProps}
                      displayNode={<span className="text-sm font-semibold text-slate-800">{p.name}</span>}
                    />
                    <EditableCell
                      id={p.id} field="website" value={p.website ?? ""}
                      {...editableCellProps}
                      displayNode={
                        p.website ? (
                          <a
                            href={p.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={e => e.stopPropagation()}
                            className="text-xs text-violet-500 hover:underline truncate block max-w-[180px]"
                          >
                            {p.website.replace(/^https?:\/\//, "")}
                          </a>
                        ) : (
                          <span className="text-xs text-slate-300">Ajouter un site...</span>
                        )
                      }
                    />
                  </td>

                  {/* Email */}
                  <td className="px-3 py-2 min-w-[160px] max-w-[200px]">
                    <EmailCell
                      emails={p.emails}
                      onEditFirst={() => startEdit(p.id, "email", p.emails[0] ?? "")}
                    />
                    {editingCell?.id === p.id && editingCell.field === "email" && (
                      <input
                        autoFocus
                        type="email"
                        value={editValue}
                        onChange={e => setEditValue(e.target.value)}
                        onBlur={saveEdit}
                        onKeyDown={e => {
                          if (e.key === "Enter") saveEdit();
                          if (e.key === "Escape") setEditingCell(null);
                        }}
                        className="mt-1 w-full text-xs px-1.5 py-1 border border-violet-400 rounded focus:outline-none focus:ring-1 focus:ring-violet-400"
                      />
                    )}
                  </td>

                  {/* Description */}
                  <td className="px-3 py-2 max-w-[240px]">
                    <EditableCell
                      id={p.id} field="description" value={p.description ?? ""}
                      multiline
                      {...editableCellProps}
                      displayNode={
                        p.description ? (
                          <span className="text-xs text-slate-600 line-clamp-2">
                            {p.description.length > 80 ? p.description.slice(0, 80) + "…" : p.description}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-300">Ajouter une description...</span>
                        )
                      }
                    />
                  </td>

                  {/* Statut */}
                  <td className="px-3 py-2">
                    <select
                      value={p.status}
                      onChange={e => handleStatusChange(p.id, e.target.value as ProspectStatus)}
                      className={`text-xs px-2 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-violet-300 w-full ${STATUS_COLORS[p.status].bg} ${STATUS_COLORS[p.status].text} font-medium`}
                    >
                      {ALL_STATUSES.map(s => (
                        <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                      ))}
                    </select>
                  </td>

                  {/* Actions */}
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1">
                      <button
                        title="Enrichir"
                        onClick={() => { setEnrichTarget(p); setShowEnrichModal(true); }}
                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors text-sm"
                      >
                        🔍
                      </button>
                      <button
                        title="Générer un email"
                        onClick={() => { setEmailTarget(p); setShowEmailModal(true); }}
                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-violet-50 text-violet-700 hover:bg-violet-100 transition-colors text-sm"
                      >
                        ✉
                      </button>
                      <button
                        title="Contacter"
                        onClick={() => {
                          setContactTarget(p);
                          setContactSubject(p.generated_subject ?? "");
                          setContactBody(p.generated_email ?? "");
                          setShowContactModal(true);
                        }}
                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors text-sm"
                      >
                        →
                      </button>
                      <button
                        title="Supprimer"
                        onClick={() => handleDelete(p.id)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors text-sm"
                      >
                        ×
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}

            {/* Add new brand row */}
            <tr className="border-t border-slate-100 bg-slate-50/50">
              <td colSpan={6} className="px-3 py-2">
                <form
                  onSubmit={e => { e.preventDefault(); handleAddBrand(); }}
                  className="flex items-center gap-2"
                >
                  <input
                    type="text"
                    placeholder="Nom de la marque..."
                    value={newBrandName}
                    onChange={e => setNewBrandName(e.target.value)}
                    className="flex-1 text-sm px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-300 bg-white"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 text-sm font-semibold rounded-lg text-white"
                    style={{ background: "linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)" }}
                  >
                    + Ajouter
                  </button>
                </form>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Mobile card list — shown only on small screens */}
      <div className="md:hidden space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center text-slate-400 text-sm py-10">
            Aucun prospect ne correspond aux filtres sélectionnés
          </div>
        ) : (
          filtered.map(p => (
            <div key={p.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 space-y-3">
              {/* Header row: category + status */}
              <div className="flex items-center justify-between gap-2">
                <div>
                  {p.category ? (
                    <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${CATEGORY_COLORS[p.category] ?? "bg-slate-100 text-slate-600"}`}>
                      {p.category}
                    </span>
                  ) : (
                    <span className="text-xs text-slate-300">Catégorie —</span>
                  )}
                </div>
                <select
                  value={p.status}
                  onChange={e => handleStatusChange(p.id, e.target.value as ProspectStatus)}
                  className={`text-xs px-2 py-1 rounded-lg border border-slate-200 focus:outline-none ${STATUS_COLORS[p.status].bg} ${STATUS_COLORS[p.status].text} font-medium`}
                >
                  {ALL_STATUSES.map(s => (
                    <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                  ))}
                </select>
              </div>

              {/* Name */}
              <div>
                <EditableCell
                  id={p.id} field="name" value={p.name}
                  {...editableCellProps}
                  className="font-semibold"
                  displayNode={<span className="text-base font-semibold text-slate-800">{p.name}</span>}
                />
              </div>

              {/* Website */}
              <div className="flex items-start gap-1.5">
                <span className="text-slate-400 text-sm mt-0.5">🌐</span>
                <div className="flex-1 min-w-0">
                  <EditableCell
                    id={p.id} field="website" value={p.website ?? ""}
                    {...editableCellProps}
                    displayNode={
                      p.website ? (
                        <a href={p.website} target="_blank" rel="noopener noreferrer"
                          onClick={e => e.stopPropagation()}
                          className="text-xs text-violet-500 hover:underline truncate block">
                          {p.website.replace(/^https?:\/\//, "")}
                        </a>
                      ) : (
                        <span className="text-xs text-slate-300">Ajouter un site...</span>
                      )
                    }
                  />
                </div>
              </div>

              {/* Email */}
              <div className="flex items-start gap-1.5">
                <span className="text-slate-400 text-sm mt-0.5">✉</span>
                <div className="flex-1 min-w-0">
                  <EmailCell
                    emails={p.emails}
                    onEditFirst={() => startEdit(p.id, "email", p.emails[0] ?? "")}
                  />
                  {editingCell?.id === p.id && editingCell.field === "email" && (
                    <input
                      autoFocus
                      type="email"
                      value={editValue}
                      onChange={e => setEditValue(e.target.value)}
                      onBlur={saveEdit}
                      onKeyDown={e => {
                        if (e.key === "Enter") saveEdit();
                        if (e.key === "Escape") setEditingCell(null);
                      }}
                      className="mt-1 w-full text-xs px-1.5 py-1 border border-violet-400 rounded focus:outline-none focus:ring-1 focus:ring-violet-400"
                    />
                  )}
                </div>
              </div>

              {/* Description */}
              <div className="flex items-start gap-1.5">
                <span className="text-slate-400 text-sm mt-0.5">📝</span>
                <div className="flex-1 min-w-0">
                  <EditableCell
                    id={p.id} field="description" value={p.description ?? ""}
                    multiline
                    {...editableCellProps}
                    displayNode={
                      p.description ? (
                        <span className="text-xs text-slate-600 line-clamp-3">{p.description}</span>
                      ) : (
                        <span className="text-xs text-slate-300">Ajouter une description...</span>
                      )
                    }
                  />
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => { setEnrichTarget(p); setShowEnrichModal(true); }}
                  className="flex-1 py-1.5 text-xs font-medium rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                >
                  🔍 Enrichir
                </button>
                <button
                  onClick={() => { setEmailTarget(p); setShowEmailModal(true); }}
                  className="flex-1 py-1.5 text-xs font-medium rounded-lg bg-violet-50 text-violet-700 hover:bg-violet-100 transition-colors"
                >
                  ✉ Email
                </button>
                <button
                  onClick={() => {
                    setContactTarget(p);
                    setContactSubject(p.generated_subject ?? "");
                    setContactBody(p.generated_email ?? "");
                    setShowContactModal(true);
                  }}
                  className="flex-1 py-1.5 text-xs font-medium rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                >
                  → Contacter
                </button>
                <button
                  onClick={() => handleDelete(p.id)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors text-lg leading-none"
                >
                  ×
                </button>
              </div>
            </div>
          ))
        )}

        {/* Mobile: add new brand */}
        <form
          onSubmit={e => { e.preventDefault(); handleAddBrand(); }}
          className="flex items-center gap-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-3"
        >
          <input
            type="text"
            placeholder="Nom de la marque..."
            value={newBrandName}
            onChange={e => setNewBrandName(e.target.value)}
            className="flex-1 text-sm px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-300"
          />
          <button
            type="submit"
            className="px-3 py-2 text-sm font-semibold rounded-lg text-white whitespace-nowrap"
            style={{ background: "linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)" }}
          >
            + Ajouter
          </button>
        </form>
      </div>

      {/* Modals */}
      <DiscoverModal
        open={showDiscoverModal}
        onClose={() => setShowDiscoverModal(false)}
        onAdd={handleDiscoverAdd}
      />
      <EnrichModal
        open={showEnrichModal}
        prospect={enrichTarget}
        onClose={() => { setShowEnrichModal(false); setEnrichTarget(null); }}
        onDone={handleEnrichDone}
      />
      <EmailModal
        open={showEmailModal}
        prospect={emailTarget}
        onClose={() => { setShowEmailModal(false); setEmailTarget(null); }}
        onGenerated={handleEmailGenerated}
      />
      <ContactModal
        open={showContactModal}
        prospect={contactTarget}
        subject={contactSubject}
        body={contactBody}
        onClose={() => { setShowContactModal(false); setContactTarget(null); }}
        onMarkedContacted={handleMarkedContacted}
      />
    </div>
  );
}
