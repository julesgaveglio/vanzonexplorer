# Vanzon Memory — Design Spec
**Date :** 2026-04-02
**Auteur :** Jules Gaveglio
**Statut :** Approuvé

---

## Objectif

Créer un système de mémoire interne Vanzon alimenté par des notes vocales envoyées depuis Telegram. Les notes sont transcrites, catégorisées par Groq, prévisualisées, puis sauvegardées dans :
1. **Supabase** (`vanzon_memory`) — source de vérité, requêtable par l'agent Telegram et le blog writer (fonctionne depuis Vercel)
2. **Obsidian** (`Vanzon DataBase 'Obs'/`) — synchronisation via un script local, pour la lisibilité humaine et le graph view

**Convention UX claire :**
- **Vocal Telegram** → toujours mémoire (flow direct, pas d'ambiguïté)
- **Texte Telegram** → agent assistant (recherche mémoire, road trips, emails, etc.)

---

## Contrainte d'environnement

Le webhook Telegram tourne sur **Vercel** (serverless) — il est impossible d'écrire directement dans un dossier local Obsidian depuis la production. Architecture en conséquence :

- **Webhook (Vercel)** → Supabase uniquement
- **Obsidian sync** → script local `scripts/agents/memory-obsidian-sync.ts`, à lancer manuellement ou via cron local

---

## Architecture

### Flux vocal → mémoire

```
Telegram vocal
      ↓
webhook/route.ts (déjà existant)
  → transcribeVoice() via Groq Whisper (déjà implémenté)
  → transcript: string
  → handleVoiceMemory(transcript, chatId)   ← remplace handleAssistantMessage pour les vocaux
      ↓
vanzon-memory/handler.ts
  1. Fetche les catégories existantes depuis Supabase (table vanzon_memory, DISTINCT category)
     + liste statique de fallback (vans, anecdotes, blog, equipe, histoire, territoire, vision)
  2. Groq LLM → catégorise + choisit fichier cible + formate en markdown
  3. INSERT telegram_pending_actions { action_type: 'memory_save', state: 'awaiting_confirmation', expires_at: +60min, ... }
  4. Envoie aperçu Telegram avec boutons [✅ Sauvegarder] [✏️ Modifier] [❌ Annuler]
      ↓
Jules confirme → handleAssistantCallback → type='confirm', actionType='memory_save'
      ↓
vanzon-memory/writer.ts → INSERT vanzon_memory Supabase
      ↓
Confirmation Telegram "✅ Noté dans [catégorie] > [fichier]"
```

### Flux texte → recherche mémoire (inchangé)

```
"rappelle-moi ce que j'ai noté sur Yoni"
      ↓
handleAssistantMessage → agent.ts → Groq → search_memory tool
      ↓
vanzon-memory/search.ts → full-text search Supabase
      ↓
Groq formule réponse → Telegram
```

### Flux sync Obsidian (local uniquement)

```
npx tsx scripts/agents/memory-obsidian-sync.ts
  → lit toutes les notes vanzon_memory Supabase non encore synchées
  → appende dans les fichiers Obsidian (Vanzon DataBase 'Obs'/)
  → marque obsidian_synced_at dans Supabase
```

---

## Modification webhook/route.ts

```typescript
import { handleVoiceMemory } from "@/lib/vanzon-memory/handler";

// Avant :
await handleAssistantMessage(transcript, chatId);

// Après :
await handleVoiceMemory(transcript, chatId);
```

La ligne `await sendTelegram(String(chatId), `🎙 <i>${transcript}</i>`)` est supprimée — la transcription est déjà incluse dans l'aperçu envoyé par `handler.ts`.

---

## Nouveaux fichiers

```
src/lib/vanzon-memory/
  handler.ts     — reçoit transcript string → catégorisation → aperçu Telegram → pending_action
  writer.ts      — INSERT Supabase vanzon_memory (appelé depuis router.ts confirm)
  categorizer.ts — prompt Groq : catégorie + fichier cible + markdown formaté
  search.ts      — searchVanzonMemory() — full-text Supabase (agent + blog writer)
  types.ts       — interfaces MemoryNote, MemorySavePayload

scripts/agents/memory-obsidian-sync.ts — sync Supabase → Obsidian (local uniquement)
```

## Fichiers modifiés

```
src/app/api/telegram/webhook/route.ts           — voice → handleVoiceMemory() au lieu de handleAssistantMessage()
src/lib/telegram-assistant/router.ts
  handleAssistantMessage                         — +vérification état 'awaiting_memory_edit' en position 0,
                                                   AVANT le check 'awaiting_edit' ET AVANT 'awaiting_selection'
  handleAssistantCallback confirm branch         — +branch actionType === 'memory_save' AVANT la branche gmail_reply → writer.ts
  handleAssistantCallback edit branch            — +branch actionType === 'memory_save' → état 'awaiting_memory_edit'
  handleAssistantCallback                        — +type === 'cancel' → DELETE pending_action + "❌ Note annulée."
  handleAssistantCallback ligne 129              — mettre à jour la chaîne expirée :
                                                   "⏱ Demande expirée (10 min). Recommence 🔄"
                                                   → "⏱ Demande expirée. Recommence 🔄"
src/lib/telegram-assistant/tools/definitions.ts — +outil search_memory
src/lib/telegram-assistant/tools/executors.ts   — +executor search_memory
scripts/agents/blog-writer-agent.ts             — injection mémoire pertinente avant génération
supabase/migrations/YYYYMMDD_vanzon_memory.sql  — table vanzon_memory + colonne obsidian_synced_at
```

---

## Modèle de données

### Table Supabase `vanzon_memory`

```sql
CREATE TABLE vanzon_memory (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category           TEXT NOT NULL,       -- ex: 'vans', 'blog', 'equipe', ou toute nouvelle catégorie créée dynamiquement
  obsidian_file      TEXT NOT NULL,       -- chemin relatif dans Vanzon DataBase 'Obs'/ ex: 'vans/🚐 Yoni.md'
  title              TEXT NOT NULL,       -- titre court généré par Groq
  content            TEXT NOT NULL,       -- contenu markdown de la note
  source             TEXT DEFAULT 'telegram_voice',
  tags               TEXT[],              -- mots-clés extraits par Groq
  obsidian_synced_at TIMESTAMPTZ,         -- NULL = pas encore synchée vers Obsidian
  created_at         TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX vanzon_memory_category_idx ON vanzon_memory(category);
CREATE INDEX vanzon_memory_created_idx  ON vanzon_memory(created_at DESC);
CREATE INDEX vanzon_memory_sync_idx     ON vanzon_memory(obsidian_synced_at) WHERE obsidian_synced_at IS NULL;

-- FTS : array_to_string requis pour TEXT[] (incompatible directement avec to_tsvector)
CREATE INDEX vanzon_memory_fts_idx ON vanzon_memory
  USING gin(to_tsvector('french',
    title || ' ' || content || ' ' || array_to_string(tags, ' ')
  ));
```

### Payload `telegram_pending_actions` (action_type: 'memory_save')

```typescript
{
  action_type:    'memory_save',
  transcript:     string,             // transcription brute originale — nécessaire pour le flow Modifier
  obsidian_file:  'vans/🚐 Yoni.md', // chemin cible dans Obsidian (avec emojis si présents)
  category:       'vans',
  title:          'Traces de rouille dans le frigo',
  content:        string,             // markdown formaté prêt à appender
  tags:           string[]
}
```

**TTL :** 60 minutes. La chaîne `"⏱ Demande expirée (10 min). Recommence 🔄"` dans `router.ts` (ligne 129) doit être mise à jour en `"⏱ Demande expirée. Recommence 🔄"` pour ne pas afficher une durée incorrecte.

---

## Catégorisation dynamique (categorizer.ts)

Groq reçoit :
1. La transcription complète
2. Les **catégories existantes** lues depuis Supabase (`DISTINCT category, obsidian_file` depuis `vanzon_memory`) — les nouvelles catégories créées dynamiquement sont donc toujours reconnues
3. Une liste de catégories initiales connues + descriptions (fallback si table vide)

Groq peut :
- **Appender** dans un fichier existant (`obsidian_file` déjà connu)
- **Créer un nouveau fichier** dans une catégorie existante
- **Créer une nouvelle catégorie + fichier** si le sujet est genuinement nouveau (ex: "recettes", "formation", "partenaires")

**Catégories initiales** (injectées dans le prompt comme contexte) :

| Catégorie | Fichiers typiques | Exemples de notes |
|---|---|---|
| `vans` | 🚐 Yoni.md, 🚐 Xalbat.md | Maintenance, défauts, astuces techniques |
| `anecdotes` | libre | Moments marquants, histoires locataires |
| `blog` | ✍️ Angles & Sujets Blog.md | Idées d'articles, angles, opinions |
| `equipe` | 👤 Jules.md, 👤 Elio.md | Méthodes de travail, leçons collaboratives |
| `histoire` | libre | Milestones Vanzon, chronologie |
| `territoire` | 🗺️ Pays Basque.md | Spots, routes, recommandations |
| `vision` | 💡 Business Model & Revenus.md | Idées business, tarifs, modèle économique, valeurs |

> Note : les noms de fichiers avec emojis sont préservés tels quels dans `obsidian_file`. Le script de sync utilise ce chemin exact pour écrire dans Obsidian.

---

## Flow de confirmation Telegram

**Aperçu envoyé à Jules :**
```
🎙️ Note vocale transcrite

📝 Transcription :
"[texte brut Whisper]"

📂 Destination : vans/🚐 Yoni.md
🏷️ Tags : #frigo #maintenance #état-des-lieux-retour

✍️ Note formatée :
---
## 📝 2026-04-02
Vérifier le frigo lors de l'état des lieux retour — des boîtes
oubliées provoquent des traces de rouille.
**Tags :** #frigo #maintenance #état-des-lieux-retour
---

[✅ Sauvegarder] [✏️ Modifier] [❌ Annuler]
```

**Callback data des boutons :**
- `asst:confirm:<pendingId>` — flow confirm existant, branche sur `actionType === 'memory_save'`
- `asst:edit:<pendingId>` — flow edit, branche sur `actionType === 'memory_save'` → état `'awaiting_memory_edit'`
- `asst:cancel:<pendingId>` — **nouveau type** dans `handleAssistantCallback` : DELETE pending_action + "❌ Note annulée."

---

## Flux "Modifier" dans router.ts

État `'awaiting_memory_edit'` distinct de `'awaiting_edit'` (email).

### Dans handleAssistantCallback, branche edit

```typescript
if (type === "edit") {
  if (actionType === "memory_save") {
    // Memory edit → awaiting_memory_edit
    await supabase.from("telegram_pending_actions")
      .update({ state: "awaiting_memory_edit", expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString() })
      .eq("id", pendingId);
    await tgSend(chatId, "✏️ Envoie ta correction en texte libre (ex: \"change la destination vers anecdotes\")");
  } else {
    // Email edit → awaiting_edit (comportement existant inchangé)
    await supabase.from("telegram_pending_actions")
      .update({ state: "awaiting_edit", expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString() })
      .eq("id", pendingId);
    // ... affiche le corps email existant
  }
}
```

### Dans handleAssistantMessage, avant le check awaiting_edit existant

```typescript
// 0. Vérifier awaiting_memory_edit (AVANT awaiting_edit pour éviter collision)
const { data: memEditAction } = await supabase
  .from("telegram_pending_actions")
  .select("*")
  .eq("chat_id", chatId)
  .eq("state", "awaiting_memory_edit")
  .gt("expires_at", new Date().toISOString())
  .maybeSingle();

if (memEditAction) {
  const payload = memEditAction.payload as MemorySavePayload;
  // Re-catégoriser avec la transcription originale + correction Jules
  const updated = await categorizeMemory(payload.transcript, text /* correction */);
  await supabase.from("telegram_pending_actions")
    .update({ state: "awaiting_confirmation", payload: { ...payload, ...updated }, expires_at: ... })
    .eq("id", memEditAction.id);
  // Renvoyer l'aperçu avec les mêmes boutons
  return;
}

// 1. Vérifier awaiting_edit (email — état exact : 'awaiting_edit')
// ... code existant inchangé
```

### Dans handleAssistantCallback, branche confirm

```typescript
if (type === "confirm") {
  if (actionType === "memory_save") {
    // Nouveau branch — sauvegarder en Supabase
    await saveMemoryNote(payload as MemorySavePayload);
    await supabase.from("telegram_pending_actions").delete().eq("id", pendingId);
    await tgSend(chatId, `✅ Noté dans <b>${payload.category}</b> › ${payload.obsidian_file}`);
    return;
  }
  // ... branches email existantes inchangées
}
```

---

## Outil `search_memory` (agent Telegram)

```typescript
{
  name: "search_memory",
  description: "Recherche dans la mémoire interne Vanzon. Utilise quand Jules demande de retrouver une note, une leçon, une idée ou une astuce.",
  parameters: {
    query:      string,       // texte libre
    category?:  string,       // filtrer par catégorie (optionnel)
    after_date?: string,      // ISO date pour filtrer par période (optionnel)
    limit?:     number        // défaut 5
  }
}
```

Implémentation dans `search.ts` : full-text search Supabase via `to_tsquery('french', ...)`, filtre optionnel `created_at >= after_date`.

---

## Script sync Obsidian (local uniquement)

`scripts/agents/memory-obsidian-sync.ts` :
1. `SELECT * FROM vanzon_memory WHERE obsidian_synced_at IS NULL ORDER BY created_at`
2. Pour chaque note : appende dans `Vanzon DataBase 'Obs'/<obsidian_file>` (crée dossier/fichier si inexistant via `fs.mkdirSync(path, { recursive: true })`)
3. Met à jour `obsidian_synced_at = NOW()` dans Supabase
4. Log : "✅ [n] notes synchronisées vers Obsidian"

**Format d'append :**
```markdown
---

## 📝 2026-04-02

[contenu de la note]

**Tags :** #frigo #maintenance #état-des-lieux-retour
```

Si le fichier n'existe pas :
```markdown
# [Titre du fichier]

> Créé automatiquement par l'agent mémoire Vanzon — 2026-04-02

---
```

**Path resolution :** utilise `path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..", "Vanzon DataBase 'Obs'")` — même pattern que les autres scripts agents du projet.

---

## Intégration blog writer

```typescript
// scripts/agents/blog-writer-agent.ts
import { searchVanzonMemory } from "../../src/lib/vanzon-memory/search";

const memories = await searchVanzonMemory({ query: articleKeywords, limit: 5 });

if (memories.length > 0) {
  systemPrompt += `\n\n💡 Mémoire Vanzon pertinente :\n` +
    memories.map(m => `- **${m.title}** : ${m.content}`).join('\n');
}
```

> Note : `search.ts` ne doit pas importer `fs` ni de modules Next.js-only — uniquement Supabase client. Cela garantit la compatibilité avec le runtime tsx CLI.

---

## Gestion des erreurs

| Cas | Comportement |
|---|---|
| Groq timeout sur catégorisation | "⚠️ Catégorisation échouée. Réessaie ou envoie une note texte." |
| Supabase INSERT échoue | "❌ Erreur sauvegarde. Réessaie 🔄" |
| pending_action expiré (> 60 min) | "⏱ Demande expirée. Recommence 🔄" |
| `asst:cancel` reçu | DELETE pending_action + "❌ Note annulée." |
| Sync Obsidian : dossier inexistant | `fs.mkdirSync(path, { recursive: true })` avant writeFile |

---

## Variables d'environnement requises

Aucune nouvelle variable — `GROQ_API_KEY` et `TELEGRAM_BOT_TOKEN` sont déjà configurés. Supabase (`SUPABASE_SERVICE_ROLE_KEY`) est déjà configuré.
