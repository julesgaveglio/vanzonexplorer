# Telegram General Agent — Design Spec
**Date:** 2026-04-01
**Auteur:** Jules Gaveglio
**Statut:** Approuvé

---

## Objectif

Transformer l'assistant Telegram existant (send_email uniquement) en un agent général avec :
1. **Groq tool-calling** — Groq décide lui-même quels outils appeler (remplace intent+registry)
2. **Connaissance Supabase** — accès en lecture à road_trip_requests, profiles, prospects
3. **Lecture Gmail** — lister/chercher des emails reçus, répondre directement depuis Telegram
4. **Mémoire des emails** — chaque email validé par Jules est sauvegardé et réinjecté comme exemple few-shot dans les futures générations

---

## Architecture

### Avant

```
message → parseIntent (Groq JSON) → ACTIONS[action].handler()
```

### Après

```
message → runAgent() → Groq + 7 outils définis → execute tools → Groq formule réponse → Telegram
```

---

## Fichiers

### Créés

```
src/lib/telegram-assistant/
  agent.ts                    — Boucle Groq tool-calling (remplace intent.ts)
  email-memory.ts             — Save/fetch few-shot examples
  tools/
    definitions.ts            — 7 outils au format Groq function calling
    executors.ts              — Dispatch + exécution des outils
    gmail-reader.ts           — listRecentEmails, getEmailById

src/lib/gmail.ts              — Ajout replyGmailEmail()

supabase/migrations/
  20260401000004_telegram_email_memory.sql

scripts/get-gmail-token.ts    — Scope gmail.readonly ajouté
```

### Modifiés

```
src/lib/telegram-assistant/
  router.ts                   — handleAssistantMessage → runAgent()
                                handleAssistantCallback → handle reply_email + save memory
  actions/send-email.ts       — Fix status filter (tous statuts), inject examples, save memory
```

### Supprimés

```
src/lib/telegram-assistant/intent.ts       — remplacé par agent.ts
src/lib/telegram-assistant/actions/index.ts — remplacé par tools/
```

---

## Les 7 outils

| Nom | Source | Description |
|---|---|---|
| `search_road_trips` | Supabase | Prénom/statut/région — tous statuts, pas juste `sent` |
| `get_road_trip_stats` | Supabase | Total, envoyés, en attente, taux de succès |
| `search_profiles` | Supabase | Membres club ou utilisateurs par prénom/plan |
| `search_prospects` | Supabase | CRM partenaires par nom/statut |
| `send_email_to_road_tripper` | Gmail | Déclenche flow preview existant (confirm/modifier) |
| `list_recent_emails` | Gmail | Liste/cherche emails reçus dans Gmail |
| `reply_to_email` | Gmail | Génère réponse → preview → confirm → envoie avec headers thread |

---

## Boucle agent (agent.ts)

```
runAgent(message, chatId):
  messages = [system_prompt, { role: user, content: message }]
  for turn in range(4):  // max 4 tours (list_emails → reply_to_email → réponse finale nécessite 3 appels Groq)
    response = groq.chat.completions.create(model, messages, tools, tool_choice=auto)
    if finish_reason == "stop":
      send Groq text to Telegram
      return
    for tool_call in response.tool_calls:
      result = executeTool(tool_call.name, tool_call.args, chatId)
    messages += [assistant_msg, ...tool_results]
    if hasEmailPreview: return  // aperçu déjà envoyé
```

---

## Flow "Répondre à un email"

```
Jules : "réponds à l'email de Sophie"
  ↓
Groq → list_recent_emails(query: "from:Sophie")
  ↓
Groq → reply_to_email(message_id: "...", context: "...")
  ↓
Exécuteur :
  1. getEmailById → sujet, expéditeur, corps, thread_id, Message-ID
  2. getEmailExamples('gmail_reply', 3) → few-shot
  3. Groq génère corps de réponse avec exemples
  4. fetchGmailSignature("jules@vanzonexplorer.com")
  5. INSERT telegram_pending_actions { action_type: 'gmail_reply', to, subject, body, signature, in_reply_to, references, thread_id }
  6. sendTelegram aperçu + boutons [✅ Envoyer] [✏️ Modifier]
  ↓
Jules confirme → replyGmailEmail() avec headers In-Reply-To + References + threadId
  ↓
saveEmailToMemory({ action_type: 'gmail_reply', ... })
  ↓
✅ Réponse envoyée dans le thread Gmail original
```

---

## Mémoire des emails (table `telegram_email_memory`)

```sql
CREATE TABLE telegram_email_memory (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_type TEXT NOT NULL,   -- 'road_trip_feedback' | 'gmail_reply'
  context     JSONB NOT NULL,  -- { region, duree } ou { from, subject_original }
  subject     TEXT NOT NULL,
  body        TEXT NOT NULL,   -- corps HTML approuvé
  approved_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Injection few-shot :** avant chaque génération Groq, `getEmailExamples(action_type, 3)` récupère les 3 derniers exemples approuvés et les injecte dans le system prompt. Plus Jules confirme d'emails, plus le style se personnalise automatiquement.

---

## Gmail scopes requis

Le `GMAIL_REFRESH_TOKEN` actuel a : `gmail.send` + `gmail.settings.basic`

Nouveau token requis avec : `gmail.send` + `gmail.settings.basic` + **`gmail.readonly`**

→ Régénérer via `npx tsx scripts/get-gmail-token.ts` après la mise à jour du script.

---

## Payload `telegram_pending_actions` étendu

```typescript
// road_trip_feedback (existant)
payload: { action_type: 'road_trip_feedback', to, subject, body, signature, prenom, region, duree }

// gmail_reply (nouveau)
payload: { action_type: 'gmail_reply', to, subject, body, signature, in_reply_to, references, thread_id }
```

`handleAssistantCallback` vérifie `payload.action_type` pour choisir `sendGmailEmail` vs `replyGmailEmail`.

---

## Gestion des erreurs

| Cas | Comportement |
|---|---|
| Aucun email trouvé | Groq répond "Aucun email trouvé avec ces critères" |
| Gmail API rate limit | "❌ Erreur Gmail, réessaie 🔄" |
| Groq timeout | Fallback "⚠️ Je n'ai pas pu terminer la tâche. Réessaie." |
| Token expiré | getGmailAccessToken() refresh automatique |
| Mémoire vide | Email généré sans exemples (comportement initial) |
