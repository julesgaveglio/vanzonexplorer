import type { ProspectStatus } from "../actions";

export const STATUS_COLORS: Record<ProspectStatus, { bg: string; text: string }> = {
  a_traiter:     { bg: "bg-slate-100",  text: "text-slate-600" },
  enrichi:       { bg: "bg-blue-50",    text: "text-blue-700" },
  email_genere:  { bg: "bg-violet-50",  text: "text-violet-700" },
  contacte:      { bg: "bg-amber-50",   text: "text-amber-700" },
  relance:       { bg: "bg-orange-50",  text: "text-orange-700" },
  en_discussion: { bg: "bg-cyan-50",    text: "text-cyan-700" },
  accepte:       { bg: "bg-emerald-50", text: "text-emerald-700" },
  refuse:        { bg: "bg-red-50",     text: "text-red-600" },
  a_revoir:      { bg: "bg-yellow-50",  text: "text-yellow-700" },
};

export const STATUS_LABELS: Record<ProspectStatus, string> = {
  a_traiter:     "À traiter",
  enrichi:       "Enrichi",
  email_genere:  "Email généré",
  contacte:      "Contacté",
  relance:       "Relance",
  en_discussion: "En discussion",
  accepte:       "Accepté",
  refuse:        "Refusé",
  a_revoir:      "À revoir",
};
