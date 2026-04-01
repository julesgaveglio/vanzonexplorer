# Telegram Assistant Agent — Design Spec
**Date:** 2026-04-01
**Auteur:** Jules Gaveglio
**Statut:** Approuvé

---

## Objectif

Transformer le bot Telegram existant en un assistant conversationnel capable de comprendre des commandes en langage naturel et d'exécuter des actions (envoyer des emails, consulter les réservations, etc.). Architecture extensible : chaque nouvelle capacité s'ajoute sans modifier le cœur du système.

---

## Contexte existant

- Bot Telegram déjà configuré (`TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`)
- Webhook existant : `/api/telegram/webhook/route.ts` — gère les `callback_query` Facebook avec `callback_data = "posted:<uuid>"` et `"skip:<uuid>"` (ne pas casser)
- Groq disponible (`GROQ_API_KEY`) — llama-3.3-70b-versatile
- Resend disponible mais **non utilisé ici** — on envoie via Gmail API directement
- Table `road_trip_requests` : `id`, `prenom`, `email`, `region`, `duree`, `status` (`pending|sent|error`)
- Email Jules : `jules@vanzonexplorer.com` (alias "Send As" sur `vanzonexplorer@gmail.com`)

---

## Architecture

### Fichiers créés

```
src/
  lib/
    telegram-assistant/
      intent.ts          — Groq parse le message → { action, params }
      router.ts          — dispatche vers le bon handler
      actions/
        index.ts         — registre des actions
        send-email.ts    — handler "envoie un email à X"
    gmail.ts             — client Gmail API (token, signature, envoi)

  app/api/telegram/
    webhook/route.ts     — MODIFIÉ : routing message/callback vers assistant
```

### Fichier Supabase

```
supabase/migrations/20260401000002_telegram_pending_actions.sql
```

---

## Composants

### 1. Webhook Router (modifié)

`/api/telegram/webhook/route.ts` devient un thin router :

```
POST /api/telegram/webhook
  ├── callback_query.data = "posted:<uuid>" ou "skip:<uuid>"  → handleFacebookCallback() [existant, inchangé]
  ├── callback_query.data starts with "asst:"                 → handleAssistantCallback()
  └── message.text                                            → handleAssistantMessage()
```

**Règle de routing Facebook :** `action === "posted" || action === "skip"` (correspondance exacte sur le premier segment avant `:`). Les callbacks `asst:*` utilisent le préfixe `"asst:"` pour éviter toute collision.

Sécurité : header `X-Telegram-Bot-Api-Secret-Token` vérifié (existant).
Tous les callbacks Telegram (Facebook et assistant) appellent `answerCallbackQuery` pour dismisser le spinner.

### 2. handleAssistantMessage — ordre de traitement

```
handleAssistantMessage(message, chatId):
  1. Vérifier telegram_pending_actions WHERE chat_id = chatId AND state = 'awaiting_edit' AND expires_at > NOW()
     → Si trouvé : traiter le message comme nouveau corps d'email (skip Groq intent)
     → Mettre à jour payload.body, passer state à 'awaiting_confirmation', renvoyer aperçu

  2. Vérifier telegram_pending_actions WHERE chat_id = chatId AND state = 'awaiting_selection' AND expires_at > NOW()
     → Si trouvé : traiter le message comme sélection manuelle (fallback texte) — cas rare

  3. Sinon : passer le message à l'Intent Parser (Groq)
```

**Important :** le check pending actions PRÉCÈDE toujours l'appel Groq pour éviter que le texte de l'email modifié soit parsé comme une commande.

### 3. Intent Parser (`intent.ts`)

- Modèle : Groq `llama-3.3-70b-versatile`
- Input : message texte + liste des actions disponibles (injectée depuis le registre)
- Output validé par Zod : `{ action: string, params: Record<string, string> }`
- Fallback sur parse error : `{ action: "unknown", params: {}, fallback_message: "Je n'ai pas compris 🤷" }`

**System prompt dynamique** construit depuis `ACTIONS[key].description` — Groq découvre automatiquement les nouvelles capacités au fur et à mesure qu'elles sont ajoutées au registre.

Exemples :
```
"envoie un email à Séverine pour son retour road trip"
→ { action: "send_email", params: { prenom: "Séverine", email_type: "road_trip_feedback" } }

"c'est quoi ma prochaine résa ?"
→ { action: "get_next_reservation", params: {} }

"blabla incohérent"
→ { action: "unknown", params: {} }
```

### 4. Action Registry (`actions/index.ts`)

```typescript
interface ActionDef {
  description: string        // injecté dans le prompt Groq
  handler: ActionHandler
}

type ActionHandler = (params: Record<string, string>, chatId: number) => Promise<void>

const ACTIONS: Record<string, ActionDef> = {
  send_email: { description: "...", handler: sendEmailHandler },
  // get_next_reservation: { ... }  ← ajout futur : 1 fichier + 1 ligne
}
```

### 5. send_email Handler (`actions/send-email.ts`)

**Requête Supabase :** `status = 'sent'` uniquement — on ne relance que les utilisateurs qui ont reçu leur itinéraire (les `pending` et `error` n'ont pas encore eu d'expérience à évaluer).

**Flow :**

```
1. Extraire prenom des params
2. SELECT * FROM road_trip_requests WHERE prenom ILIKE $1 AND status='sent' ORDER BY created_at DESC

3a. 0 résultat
    → répondre "Séverine introuvable dans les road trips 🤷"

3b. 2+ résultats
    → Stocker pending_action { state: 'awaiting_selection', payload: { candidates: [...] } }
    → Envoyer boutons inline : "Séverine Dupont — Bretagne (5j, 15 mars)" / "Séverine Martin — Corse (7j, 2 mars)"
    → Callback "asst:select:<pendingId>:<index>" → handleAssistantCallback() sélectionne le bon candidat
      puis continue le flow à l'étape 4

3c. 1 résultat
    → continuer

4. Groq génère le corps de l'email (prénom, région, durée, ton chaleureux mais professionnel)
5. Gmail API → fetchSignature("jules@vanzonexplorer.com")
   → Si signature vide : ne rien ajouter (pas de ligne blanche parasite)
6. Générer pendingId = nanoid(10) (ex: "xK9mPqR2aT")
   callback_data = "asst:confirm:<pendingId>" = 22 chars max ✓ (< 64 bytes Telegram)
7. Stocker pending_action { id: pendingId, state: 'awaiting_confirmation', payload: { to, subject, body, prenom } }
8. Envoyer aperçu Telegram avec boutons inline
```

**Format aperçu :**
```
📧 Aperçu de l'email
─────────────────────
À : severine@xxx.com
Objet : Votre road trip en Bretagne — votre avis compte

Bonjour Séverine,

[corps généré par Groq]

[signature Gmail si non vide]
─────────────────────
[✅ Envoyer]  [✏️ Modifier]
```

Callbacks :
- `asst:confirm:<pendingId>` → envoyer l'email
- `asst:edit:<pendingId>` → déclencher le flow modification

### 6. Flow "Modifier"

1. Jules clique **✏️ Modifier** (`asst:edit:<pendingId>`)
2. `handleAssistantCallback()` :
   - Récupère le pending_action
   - Passe state à `awaiting_edit`
   - Envoie le corps brut en texte + `reply_markup: { force_reply: true, selective: true }`
3. Telegram ouvre automatiquement la barre de réponse
4. Jules modifie → envoie
5. `handleAssistantMessage()` détecte `awaiting_edit` (check avant Groq — cf. §2)
6. Met à jour `payload.body`, repasse state à `awaiting_confirmation`
7. Renvoie un nouvel aperçu avec `[✅ Envoyer] [✏️ Modifier]`

### 7. Flow "Envoyer"

1. Jules clique **✅ Envoyer** (`asst:confirm:<pendingId>`)
2. `handleAssistantCallback()` :
   - Récupère le pending_action (vérifie `expires_at > NOW()`)
   - Si expiré → "Demande expirée (10 min), recommence 🔄"
   - Sinon → Gmail API envoie
3. Supprime le pending_action
4. Bot répond : `✅ Email envoyé à severine@xxx.com`

### 8. Gmail API Client (`gmail.ts`)

```typescript
getAccessToken(): Promise<string>
// POST https://oauth2.googleapis.com/token avec GMAIL_REFRESH_TOKEN → access_token

fetchSignature(sendAsEmail: string): Promise<string>
// GET https://gmail.googleapis.com/gmail/v1/users/me/settings/sendAs/{sendAsEmail}
// Retourne champ "signature" (HTML) — retourne "" si vide

sendEmail(opts: { to, subject, htmlBody, signature }): Promise<void>
// Corps final = htmlBody + (signature ? "\n\n" + signature : "")
// Construit MIME message base64url → POST https://gmail.googleapis.com/gmail/v1/users/me/messages/send
// Envoie depuis jules@vanzonexplorer.com via l'alias "Send As"
```

---

## Table Supabase

```sql
CREATE TABLE telegram_pending_actions (
  id          TEXT PRIMARY KEY,           -- nanoid(10), ex: "xK9mPqR2aT"
  chat_id     BIGINT NOT NULL,
  action      TEXT NOT NULL,              -- 'send_email' | ...
  state       TEXT NOT NULL DEFAULT 'awaiting_confirmation',
              -- 'awaiting_confirmation' | 'awaiting_edit' | 'awaiting_selection'
  payload     JSONB NOT NULL DEFAULT '{}',
              -- send_email: { to, subject, body, prenom, region, duree }
              -- awaiting_selection: { candidates: [{ prenom, email, region, duree, created_at }] }
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  expires_at  TIMESTAMPTZ DEFAULT NOW() + INTERVAL '10 minutes'
);

CREATE INDEX idx_telegram_pending_chat ON telegram_pending_actions(chat_id);
```

Nettoyage passif : les actions expirées sont ignorées (filtre `expires_at > NOW()`). Cleanup optionnel : `DELETE FROM telegram_pending_actions WHERE expires_at < NOW()` exécuté au début de chaque requête webhook (volume faible, usage personnel).

---

## Variables d'environnement

| Variable | Description | Statut |
|---|---|---|
| `TELEGRAM_BOT_TOKEN` | Token bot | Existant |
| `TELEGRAM_CHAT_ID` | Chat ID Jules | Existant |
| `TELEGRAM_WEBHOOK_SECRET` | Sécurité webhook | Existant |
| `GROQ_API_KEY` | Intent parsing + génération email | Existant |
| `GOOGLE_CLIENT_ID` | OAuth client (partager avec GSC) | Existant (`GOOGLE_GSC_CLIENT_ID`) |
| `GOOGLE_CLIENT_SECRET` | OAuth client (partager avec GSC) | Existant (`GOOGLE_GSC_CLIENT_SECRET`) |
| `GMAIL_REFRESH_TOKEN` | Token OAuth2 avec scopes Gmail | **À créer** |

### ⚠️ Impact sur GSC — token à régénérer

Le refresh token GSC actuel (`GOOGLE_GSC_REFRESH_TOKEN`) est scopé uniquement sur `webmasters.readonly`. Pour Gmail, il faut un token avec les scopes additionnels `gmail.send` + `gmail.settings.basic`.

**Option recommandée :** un seul flow OAuth2 avec tous les scopes combinés :
```
https://www.googleapis.com/auth/webmasters.readonly
https://www.googleapis.com/auth/gmail.send
https://www.googleapis.com/auth/gmail.settings.basic
```
→ Le refresh token unique remplace `GOOGLE_GSC_REFRESH_TOKEN` et sert aussi pour Gmail.
→ Pendant la transition (5 min), le dashboard GSC affichera une erreur d'auth.

**Alternative :** deux tokens séparés (`GOOGLE_GSC_REFRESH_TOKEN` inchangé + nouveau `GMAIL_REFRESH_TOKEN`) — zéro impact GSC mais deux flows OAuth à maintenir.

### Obtenir GMAIL_REFRESH_TOKEN

1. Google Cloud Console → OAuth consent screen → ajouter les scopes Gmail
2. Lancer flow OAuth2 avec `vanzonexplorer@gmail.com`
3. Copier refresh token → `.env.local` + Vercel env vars

---

## Gestion des erreurs

| Cas | Comportement bot |
|---|---|
| Prénom introuvable | "X introuvable dans les road trips 🤷" |
| Plusieurs personnes | Boutons inline avec les options (nom + région + date) |
| Pending action expirée | "Demande expirée (10 min), recommence 🔄" |
| Groq timeout / JSON invalide | "Erreur IA, réessaie 🔄" (fallback Zod) |
| Gmail API fail | "Erreur envoi email, réessaie 🔄" |
| Action inconnue | Message fallback depuis Groq |
| Signature Gmail vide | Email envoyé sans signature (pas de ligne blanche) |

---

## Extensibilité — Exemple ajout futur

```typescript
// actions/get-next-reservation.ts
export const getNextReservationAction: ActionDef = {
  description: "Donne la prochaine réservation de van (locataire, dates, van)",
  handler: async (params, chatId) => {
    // SELECT * FROM reservations WHERE ...
    // notifyTelegram(chatId, ...)
  }
}

// actions/index.ts — ajouter une ligne :
get_next_reservation: getNextReservationAction,
// Groq découvre automatiquement la nouvelle capacité
```

---

## Périmètre v1

**Inclus :**
- `send_email` → road_trip_feedback (recherche par prénom, génération Groq, signature Gmail, confirm/modifier/envoyer)
- Désambiguïsation si plusieurs personnes avec le même prénom
- Mémoire de contexte court (pending actions Supabase, TTL 10 min)
- Modifier avec force_reply Telegram

**Exclu (futur) :**
- `get_next_reservation`, `get_stats`, `publish_article`
- Mémoire longue (historique de conversation)
