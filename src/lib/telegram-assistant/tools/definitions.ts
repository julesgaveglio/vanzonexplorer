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
        "Envoie un email de demande de retour road trip à un voyageur. " +
        "Affiche un aperçu Telegram avec boutons Envoyer/Modifier avant d'envoyer. " +
        "Utilise quand Jules dit 'demande un retour à [prénom]', 'feedback road trip', ou donne un email direct.",
      parameters: {
        type: "object",
        properties: {
          prenom: {
            type: "string",
            description: "Prénom du voyageur",
          },
          email: {
            type: "string",
            description: "Adresse email du voyageur si fournie directement dans le message",
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
      name: "smart_reply_to_email",
      description:
        "Recherche intelligemment un email par nom ou email de l'expéditeur et génère une réponse " +
        "en tenant compte du fil de conversation. " +
        "À préférer à reply_to_email pour tous les cas où Jules dit 'réponds à [nom]' ou 'dernier email de [nom]'. " +
        "Exemple : 'Réponds au dernier email de Cody Van, dis que les modifications sont ok'.",
      parameters: {
        type: "object",
        properties: {
          sender_hint: {
            type: "string",
            description:
              "Nom ou email partiel de l'expéditeur (ex: 'Cody Van', 'stephanie', 'cosyvan@gmail.com'). " +
              "Recherche case-insensitive dans le champ From des 10 derniers emails.",
          },
          context_instructions: {
            type: "string",
            description:
              "Ce que Jules veut communiquer dans la réponse. " +
              "Ex: 'modifications proposées acceptables, répondre aux questions', 'dire que je suis dispo mardi'.",
          },
          subject_hint: {
            type: "string",
            description:
              "Mot-clé optionnel dans le sujet pour affiner si plusieurs emails du même expéditeur. " +
              "Ex: 'modifications', 'devis', 'partenariat'.",
          },
        },
        required: ["sender_hint", "context_instructions"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "reply_to_email",
      description:
        "Génère une réponse à un email via son ID exact. " +
        "Utilise smart_reply_to_email à la place si tu connais le nom de l'expéditeur. " +
        "Utilise reply_to_email uniquement si tu as déjà un message_id via list_recent_emails.",
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
  {
    type: "function",
    function: {
      name: "search_memory",
      description:
        "Recherche dans la mémoire interne Vanzon. " +
        "Utilise quand Jules demande de retrouver une note, une leçon apprise, une astuce ou une idée. " +
        "Exemples : 'qu\\'est-ce que j\\'ai noté sur Yoni ?', 'rappelle-moi les leçons sur l\\'aménagement'.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Texte libre de recherche (ex: 'frigo Yoni', 'méthode aménagement Elio')",
          },
          category: {
            type: "string",
            description: "Filtrer par catégorie (ex: 'vans', 'blog', 'equipe') — optionnel",
          },
          after_date: {
            type: "string",
            description: "Filtrer les notes après cette date ISO (ex: '2026-03-01') — optionnel",
          },
          limit: {
            type: "number",
            description: "Nombre max de résultats (défaut 5)",
          },
        },
        required: ["query"],
      },
    },
  },
];
