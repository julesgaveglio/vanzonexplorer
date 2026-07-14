// Types canoniques pour Closer Coach (partagés API <-> UI <-> script de sync).
// Contenu textuel en français (transcripts en français).

export type ClosingOutcome = "signe" | "perdu" | "a_suivre" | "indetermine";

export interface ClosingCriterion {
  nom: string; // ex: "Découverte / diagnostic"
  note: number; // 0 à 10
  commentaire: string; // pourquoi cette note, avec preuve
}

// La "fiche" : contexte concret extrait de l'appel (qui, situation, chiffres).
// Sert à ranger la donnée dans la mémoire Obsidian et à la retrouver plus tard.
export interface ClosingContext {
  prenom: string | null;
  nom: string | null;
  age: number | null;
  ville: string | null;
  region: string | null;
  pays: string | null;
  metier: string | null;
  situation: string | null; // résumé de la situation perso/pro
  projet: string | null; // ce qu'il veut faire (voyage / business / location)
  objectif_business: boolean | null; // true = intention business, false = perso
  budget_vehicule: string | null;
  budget_amenagement: string | null;
  // D'où vient le prospect (attribution marketing, déduite du transcript).
  acquisition: {
    canal: string | null; // "Meta Ads" | "Google Ads" | "SEO / Google organique" | "Facebook (organique)" | "Instagram" | "TikTok" | "Bouche-à-oreille" | "Autre" | "Inconnu"
    type: "payant" | "organique" | "inconnu" | null;
    detail: string | null; // précision
    indice: string | null; // verbatim/indice du transcript qui le justifie
  } | null;
  canal: string | null; // canal de contact : WhatsApp, téléphone...
  statut: string | null; // signé | perdu | en réflexion | à suivre
  resultat: string | null; // résultat en une ligne
  offre_proposee: string | null;
  montant: string | null; // montant discuté / payé
  objections: string[];
  signaux_achat: string[];
  chiffres_cles: string[];
  verbatims: string[]; // citations importantes
  next_steps: string[];
  resume: string | null; // 2-3 phrases de synthèse du prospect
}

export interface ClosingAnalysis {
  verdict: {
    outcome: ClosingOutcome;
    score: number; // 0 à 100
    resume: string; // une phrase franche
  };
  criteres: ClosingCriterion[];
  points_forts: { point: string; extrait: string }[];
  points_faibles: { point: string; extrait: string; impact: string }[];
  occasions_manquees: {
    moment: string;
    ce_qui_s_est_passe: string;
    meilleur_move: string;
    exemple_phrase: string;
  }[];
  objections: {
    objection: string;
    ta_reponse: string;
    note: "bien" | "moyen" | "rate";
    mieux: string;
  }[];
  ratio_parole: { estimation: string; verdict: string };
  // Corrections de phrases prioritaires — le cœur du feedback : ce qui compte vraiment.
  corrections: {
    tu_as_dit: string; // verbatim EXACT du closer, copié du transcript
    erreur: string; // le pattern/thème de l'erreur, en quelques mots
    dis_plutot: string; // la phrase exacte de remplacement
    pourquoi: string; // pourquoi ça change le résultat (une ligne)
  }[];
  reformulations?: { tu_as_dit: string; dis_plutot: string; pourquoi: string }[]; // legacy (anciennes analyses)
  priorites: string[];
  exercices: string[];
}

// Ligne stockée en base (table closing_analyses) — source de vérité.
export interface ClosingAnalysisRow {
  id: string;
  title: string | null;
  prospect: string | null;
  closer: string | null;
  call_date: string | null; // YYYY-MM-DD
  ville: string | null;
  statut: string | null;
  transcript: string;
  analysis: ClosingAnalysis;
  context: ClosingContext | null;
  score: number | null;
  closing_call_id: string | null; // lien vers la réservation Calendly (closing_calls)
  created_at: string;
}
