// src/lib/telegram-assistant/actions/index.ts
// Registre des actions disponibles pour l'assistant Telegram.
// Ajouter une nouvelle action = 1 fichier + 1 entrée ici.

import { sendEmailHandler } from "./send-email";

export interface ActionDef {
  description: string;
  handler: (params: Record<string, string>, chatId: number) => Promise<void>;
}

export const ACTIONS: Record<string, ActionDef> = {
  send_email: {
    description:
      "Envoyer un email à un utilisateur (ex: demander un retour sur le road trip personnalisé). " +
      "Params attendus: prenom (prénom du destinataire), email_type (ex: road_trip_feedback).",
    handler: sendEmailHandler,
  },

  // ── Futures actions ─────────────────────────────────────────────────────────
  // get_next_reservation: {
  //   description: "Donner la prochaine réservation de van (locataire, dates, van).",
  //   handler: getNextReservationHandler,
  // },
};

// Liste pour injection dans le prompt Groq
export function getActionDescriptions() {
  return Object.entries(ACTIONS).map(([name, def]) => ({
    name,
    description: def.description,
  }));
}
