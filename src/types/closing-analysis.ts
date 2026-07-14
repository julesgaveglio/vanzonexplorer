// Type canonique du retour d'analyse de closing (partagé API <-> UI).
// Le contenu textuel est en français (transcripts en français).

export type ClosingOutcome = "signe" | "perdu" | "a_suivre" | "indetermine";

export interface ClosingCriterion {
  nom: string; // ex: "Découverte / diagnostic"
  note: number; // 0 à 10
  commentaire: string; // pourquoi cette note, avec preuve
}

export interface ClosingAnalysis {
  verdict: {
    outcome: ClosingOutcome;
    score: number; // 0 à 100, note globale honnête
    resume: string; // une phrase franche : ce qui a fait gagner/perdre l'appel
  };
  criteres: ClosingCriterion[];
  points_forts: { point: string; extrait: string }[];
  points_faibles: { point: string; extrait: string; impact: string }[];
  occasions_manquees: {
    moment: string; // à quel moment de l'appel
    ce_qui_s_est_passe: string;
    meilleur_move: string;
    exemple_phrase: string; // phrase exacte à dire la prochaine fois
  }[];
  objections: {
    objection: string; // l'objection réellement soulevée
    ta_reponse: string; // comment le closer a répondu
    note: "bien" | "moyen" | "rate";
    mieux: string; // meilleure réponse + exemple
  }[];
  ratio_parole: {
    estimation: string; // ex: "~70% closer / 30% prospect"
    verdict: string; // trop, pas assez, idéal
  };
  reformulations: {
    tu_as_dit: string; // citation du transcript
    dis_plutot: string; // meilleure formulation
    pourquoi: string;
  }[];
  priorites: string[]; // les 3 chantiers prioritaires, du plus impactant au moins
  exercices: string[]; // drills concrets pour progresser
}

// Ligne stockée en base (table closing_analyses)
export interface ClosingAnalysisRow {
  id: string;
  title: string | null;
  prospect: string | null;
  transcript: string;
  analysis: ClosingAnalysis;
  score: number | null;
  created_at: string;
}
