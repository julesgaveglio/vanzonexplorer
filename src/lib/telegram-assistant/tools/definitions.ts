// src/lib/telegram-assistant/tools/definitions.ts
// Définitions des 7 outils Groq pour l'agent Telegram général.

import type Groq from "groq-sdk";

export const TOOL_DEFINITIONS: Groq.Chat.Completions.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "search_road_trips",
      description:
        "Recherche des demandes de road trip personnalisé dans la base de données. " +
        "Tous les statuts sont recherchés (pending, sent, etc.). " +
        "Utilise cet outil quand Jules mentionne un prénom, un statut ou une région.",
      parameters: {
        type: "object",
        properties: {
          prenom: {
            type: "string",
            description: "Prénom du voyageur (recherche partielle tolérée)",
          },
          region: {
            type: "string",
            description: "Région du road trip (ex: Bretagne, Alsace)",
          },
          limit: {
            type: "number",
            description: "Nombre max de résultats (défaut 5)",
          },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_road_trip_stats",
      description:
        "Retourne les statistiques globales des road trips : total, envoyés, en attente, taux de succès.",
      parameters: {
        type: "object",
        properties: {},
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_profiles",
      description:
        "Recherche des membres ou utilisateurs dans la table profiles Supabase. " +
        "Utile pour trouver des membres du club ou vérifier un utilisateur.",
      parameters: {
        type: "object",
        properties: {
          prenom: {
            type: "string",
            description: "Prénom de l'utilisateur",
          },
          plan: {
            type: "string",
            description: "Plan de l'utilisateur (ex: club_member, free)",
          },
          limit: {
            type: "number",
            description: "Nombre max de résultats (défaut 5)",
          },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_prospects",
      description:
        "Recherche des prospects/partenaires dans le CRM Vanzon (table prospects). " +
        "Utile pour suivre la prospection partenaires.",
      parameters: {
        type: "object",
        properties: {
          nom: {
            type: "string",
            description: "Nom ou marque du prospect",
          },
          statut: {
            type: "string",
            description: "Statut du prospect (ex: à contacter, en cours, signé)",
          },
          limit: {
            type: "number",
            description: "Nombre max de résultats (défaut 5)",
          },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "send_email_to_road_tripper",
      description:
        "Déclenche la génération et l'aperçu d'un email de retour road trip pour un voyageur spécifique. " +
        "Envoie un aperçu Telegram avec boutons Confirmer/Modifier. " +
        "Utilise quand Jules dit 'envoie un email à [prénom]' ou 'feedback road trip'.",
      parameters: {
        type: "object",
        properties: {
          prenom: {
            type: "string",
            description: "Prénom du voyageur à qui envoyer l'email",
          },
        },
        required: ["prenom"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_recent_emails",
      description:
        "Liste les emails récents reçus dans Gmail. " +
        "Supporte les queries Gmail (ex: 'from:sophie', 'subject:road trip', vide = inbox récent). " +
        "Utilise quand Jules demande à voir ses emails ou à chercher un email.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Query Gmail (ex: 'from:sophie', 'subject:road trip'). Vide = inbox récent.",
          },
          max_results: {
            type: "number",
            description: "Nombre d'emails à retourner (max 10, défaut 5)",
          },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "reply_to_email",
      description:
        "Génère une réponse à un email reçu, affiche un aperçu Telegram et attend la confirmation. " +
        "Utilise après list_recent_emails pour obtenir le message_id. " +
        "Utilise quand Jules dit 'réponds à [email]' ou 'réponse à [expéditeur]'.",
      parameters: {
        type: "object",
        properties: {
          message_id: {
            type: "string",
            description: "ID Gmail du message auquel répondre (obtenu via list_recent_emails)",
          },
          context: {
            type: "string",
            description: "Instructions supplémentaires de Jules pour la réponse (ex: 'sois chaleureux', 'mentionne X')",
          },
        },
        required: ["message_id"],
      },
    },
  },
];
