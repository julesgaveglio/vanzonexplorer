# Telegram Smart Email Reply — Design Spec
**Date :** 2026-04-03
**Statut :** Validé

---

## Problème

L'outil `reply_to_email` actuel exige un `message_id` exact. L'agent doit donc faire 2 tours de boucle (list → reply), ce qui coûte des tokens et rend les prompts naturels comme "Répond au dernier email de Cody Van" maladroits.

De plus :
- Le thread complet n'est jamais lu, le contexte des échanges précédents est perdu
- Le style d'écriture de Jules n'est appris que depuis les réponses confirmées via Telegram, pas ses réponses manuelles Gmail

---

## Solution : 2 composantes

### 1. Outil `smart_reply_to_email`

**Paramètres Groq :**
- `sender_hint` (string) — nom ou email partiel, ex: "Cody Van", "stephanie", "cosyvan"
- `context_instructions` (string) — ce que Jules veut dire dans la réponse, ex: "modifications acceptées, réponse aux questions posées"
- `subject_hint` (string, optionnel) — pour lever les ambiguïtés si plusieurs emails du même expéditeur

**Paramètre `sender_hint` — scoring :**
- Comparaison lowercase du champ `From` et `Subject` de chaque email
- Si `subject_hint` est fourni : filtrer d'abord par `sender_hint`, puis scorer par `subject_hint` comme filtre secondaire (l'email doit contenir le sujet hint, sinon ignoré)
- **Cas no-match :** si aucun email ne matche `sender_hint`, retourner `{ error: "Aucun email trouvé pour '${sender_hint}'. Précise le nom ou l'adresse email." }` — Groq transmet ce message à Jules sans tenter d'envoyer quoi que ce soit.

**Description Groq de l'outil (champ `description` dans definitions.ts) :**
> "Recherche intelligemment un email par nom/email de l'expéditeur et génère une réponse en tenant compte du fil de conversation. À préférer à reply_to_email pour tous les cas où l'utilisateur demande de répondre à quelqu'un par son nom."

**Logique interne de l'executor :**

```
1. Fetch 10 derniers emails inbox Gmail (listRecentEmails existant)
2. Scoring lowercase : trouver l'email dont le From matche sender_hint
   → si subject_hint fourni : appliquer comme filtre secondaire
   → si no-match : retourner error JSON (Groq demande clarification à Jules)
3. Si email a des References headers non vides (= c'est une réponse dans un fil)
   → fetch thread via getThreadMessages(threadId, max=3)
   → chaque message du thread tronqué à 400 chars
4. Récupérer exemples few-shot depuis telegram_email_memory (0 si base vide — géré gracieusement)
5. Générer la réponse Groq :
   - System prompt : email original (tronqué à 1000 chars) + thread context + few-shot + context_instructions
   - JSON output : { subject, body }
6. Fetch signature Gmail (existant)
7. Stocker pending action dans telegram_pending_actions (existant)
8. Envoyer aperçu Telegram avec boutons ✅ Envoyer / ✏️ Modifier (existant)
```

**`getThreadMessages` — interface :**
```typescript
interface ThreadMessage {
  from:    string;
  date:    string;
  body:    string; // plain text, tronqué à 400 chars
}
// retourne ThreadMessage[] (max 3 messages, du plus ancien au plus récent)
```

**Fichiers modifiés :**
- `src/lib/telegram-assistant/tools/gmail-reader.ts` — ajouter `getThreadMessages()`
- `src/lib/telegram-assistant/tools/definitions.ts` — ajouter définition `smart_reply_to_email`
- `src/lib/telegram-assistant/tools/executors.ts` — ajouter executor `smartReplyToEmail()`

**Compatibilité :** Les outils `list_recent_emails` et `reply_to_email` restent disponibles pour les cas d'usage ponctuels.

---

### 2. Cron nightly de style learning

**Route :** `GET /api/cron/gmail-style-learning`

**Déclenchement :** cron Vercel, 1x/nuit à 02:00

**Authentification :** header `Authorization: Bearer $CRON_SECRET` requis (même pattern que les autres crons du projet). Retourner 401 si absent ou invalide.

**Logique :**

```
1. Calculer la date d'hier en UTC (new Date(Date.now() - 86400000))
   → formatter en "YYYY/MM/DD" pour la query Gmail after:
2. Fetch emails du dossier "Sent" des dernières 24h :
   query: `in:sent after:${yesterday}` — maxResults: 10
3. Pour chaque email, fetch détail complet (headers + body)
4. Filtrer : garder uniquement ceux avec header "In-Reply-To" non vide (vraies réponses)
5. Limiter à 5 emails après filtrage
6. Pour chaque email :
   - Clé de déduplication : header "Message-ID" de l'email envoyé par Jules
   - Vérifier si cette valeur existe déjà en base dans la colonne `message_id`
   - Si absent : insérer dans telegram_email_memory :
     { action_type: "gmail_reply", context: { from: destinataire, subject },
       subject, body (plain text, 800 chars max), message_id, approved_at: NOW(), source: "gmail_sent" }
7. Logger le nombre d'exemples ajoutés
```

**Extension de `saveEmailToMemory` :** la fonction et l'interface `EmailMemoryExample` sont étendues pour accepter `message_id` (optionnel) et `source` (optionnel). Le cron écrit directement en Supabase avec ces champs supplémentaires.

**Fichiers créés/modifiés :**
- `src/app/api/cron/gmail-style-learning/route.ts` — nouvelle route cron (avec guard CRON_SECRET)
- `vercel.json` — ajouter le cron `0 2 * * *`
- `src/lib/telegram-assistant/email-memory.ts` — étendre `EmailMemoryExample` avec `message_id?` et `source?`
- Supabase migration — ajouter colonnes `message_id` (text, nullable, unique) et `source` (text, nullable) à `telegram_email_memory`

---

## Flux utilisateur final

```
Jules → Telegram : "Répond au dernier email de Cody Van concernant les modifications.
                    Les modifications sont acceptables. Réponse aux questions."

Agent → smart_reply_to_email(sender_hint="Cody Van", context_instructions="...")
      → Fetch 10 emails → match "CosyVan" → email trouvé
      → Thread avec 2 messages précédents → lu
      → Groq génère réponse contextuelle
      → Aperçu envoyé sur Telegram

Jules → ✅ Envoyer
      → Email envoyé + sauvegardé en mémoire few-shot
```

---

## Tokens estimés par réponse

| Composant | Tokens ~|
|---|---|
| Email original | 300-500 |
| Thread (3 msgs) | 400-600 |
| Few-shot examples (3) | 300 |
| Context instructions | 50-100 |
| **Total input** | **~1 200** |
| **Output** | **~300** |

Économie vs flow actuel (2 tours) : ~40% de tokens en moins.

---

## Hors scope

- Envoi d'email sans confirmation (toujours un aperçu avant envoi)
- Analyse du style d'écriture sur les emails envoyés en premier (pas des réponses)
- Modification des outils `list_recent_emails` et `reply_to_email` existants
