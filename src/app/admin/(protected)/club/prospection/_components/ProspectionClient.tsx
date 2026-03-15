"use client";

import { useState } from "react";
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

const CATEGORIES = ["froid","énergie","chauffage","sanitaire","extérieur","accessoires","distributeur","tendance"];

interface Props {
  initialProspects: Prospect[];
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

  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  // Stats
  const total = prospects.length;
  const enrichis = prospects.filter(p => p.status === "enrichi").length;
  const contactes = prospects.filter(p => p.status === "contacte").length;
  const enDiscussion = prospects.filter(p => p.status === "en_discussion").length;
  const acceptes = prospects.filter(p => p.status === "accepte").length;

  // Filtered prospects
  const filtered = prospects.filter(p => {
    if (search && !p.name.toLowerCase().includes(search.toLowerCase()) &&
        !(p.description ?? "").toLowerCase().includes(search.toLowerCase())) return false;
    if (filterCategory && p.category !== filterCategory) return false;
    if (filterStatus && p.status !== filterStatus) return false;
    if (filterCountry) {
      if (filterCountry === "France" && p.country !== "France") return false;
      if (filterCountry === "other" && p.country === "France") return false;
    }
    return true;
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
    if (!confirm("Supprimer ce prospect ?")) return;
    const result = await deleteProspect(id);
    if (!result.success) {
      console.error('[ProspectionClient] handleDelete failed:', result);
      return;
    }
    setProspects(prev => prev.filter(p => p.id !== id));
  }

  function formatDate(dateStr: string | null) {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "2-digit" });
  }

  function getScoreBadge(score: number) {
    if (score >= 80) return "bg-emerald-50 text-emerald-700";
    if (score >= 60) return "bg-blue-50 text-blue-700";
    return "bg-slate-100 text-slate-600";
  }

  return (
    <div className="space-y-6">
      {/* Stats bar */}
      <div className="grid grid-cols-5 gap-4">
        {[
          { label: "Total", value: total },
          { label: "Enrichis", value: enrichis },
          { label: "Contactés", value: contactes },
          { label: "En discussion", value: enDiscussion },
          { label: "Acceptés", value: acceptes },
        ].map(stat => (
          <div key={stat.label} className="bg-white rounded-2xl shadow-sm border border-slate-100 px-5 py-4">
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

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3 text-left">Type / Catégorie</th>
              <th className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3 text-left">Nom</th>
              <th className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3 text-left">Score</th>
              <th className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3 text-left">Emails / Contacts</th>
              <th className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3 text-left">Statut</th>
              <th className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3 text-left">Dernier contact</th>
              <th className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-slate-400 text-sm">
                  Aucun prospect ne correspond aux filtres sélectionnés
                </td>
              </tr>
            ) : (
              filtered.map(p => (
                <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="text-xs text-slate-500">{p.type ?? "—"}</div>
                    <div className="text-xs font-medium text-slate-700">{p.category ?? "—"}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm font-semibold text-slate-800">{p.name}</div>
                    {p.website && (
                      <a href={p.website} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-violet-500 hover:underline truncate max-w-[180px] block">
                        {p.website.replace(/^https?:\/\//, "")}
                      </a>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full ${getScoreBadge(p.relevance_score)}`}>
                      {p.relevance_score}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-xs text-slate-600">{p.emails.length} email{p.emails.length !== 1 ? "s" : ""}</div>
                    <div className="text-xs text-slate-400">{p.contacts.length} contact{p.contacts.length !== 1 ? "s" : ""}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1.5">
                      <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full w-fit ${STATUS_COLORS[p.status].bg} ${STATUS_COLORS[p.status].text}`}>
                        {STATUS_LABELS[p.status]}
                      </span>
                      <select
                        value={p.status}
                        onChange={e => handleStatusChange(p.id, e.target.value as ProspectStatus)}
                        className="text-xs px-2 py-1 rounded-lg border border-slate-200 text-slate-600 bg-white focus:outline-none focus:ring-1 focus:ring-violet-300"
                      >
                        {ALL_STATUSES.map(s => (
                          <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                        ))}
                      </select>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-500">
                    {formatDate(p.last_contact_at)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => { setEnrichTarget(p); setShowEnrichModal(true); }}
                        className="px-2.5 py-1.5 text-xs font-medium rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                      >
                        Enrichir
                      </button>
                      <button
                        onClick={() => { setEmailTarget(p); setShowEmailModal(true); }}
                        className="px-2.5 py-1.5 text-xs font-medium rounded-lg bg-violet-50 text-violet-700 hover:bg-violet-100 transition-colors"
                      >
                        Email
                      </button>
                      <div className="relative">
                        <button
                          onClick={() => setOpenDropdown(openDropdown === p.id ? null : p.id)}
                          className="px-2.5 py-1.5 text-xs font-medium rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                        >
                          ···
                        </button>
                        {openDropdown === p.id && (
                          <div className="absolute right-0 top-8 z-10 bg-white rounded-xl shadow-lg border border-slate-100 min-w-[130px] py-1">
                            <button
                              onClick={() => {
                                setOpenDropdown(null);
                                setContactTarget(p);
                                setContactSubject(p.generated_subject ?? "");
                                setContactBody(p.generated_email ?? "");
                                setShowContactModal(true);
                              }}
                              className="block w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50"
                            >
                              Contacter
                            </button>
                            <button
                              onClick={() => { setOpenDropdown(null); handleDelete(p.id); }}
                              className="block w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50"
                            >
                              Supprimer
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
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
