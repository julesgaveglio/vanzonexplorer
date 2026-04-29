# Vanzon Memory Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permettre à Jules d'envoyer des notes vocales depuis Telegram qui sont transcrites, catégorisées par Groq, confirmées, puis sauvegardées en Supabase (requêtable par l'agent Telegram + blog writer) et synchronisées vers Obsidian via un script local.

**Architecture:** Les vocaux Telegram arrivent au webhook déjà transcrit par Groq Whisper → `handleVoiceMemory()` prend le relais (remplace `handleAssistantMessage` pour les vocaux) → Groq catégorise et formate → aperçu avec boutons → sauvegarde Supabase. L'Obsidian sync est un script local séparé. L'agent Telegram gagne un outil `search_memory`. Le blog writer injecte les notes pertinentes avant génération.

**Tech Stack:** TypeScript, Next.js 14 App Router, Supabase, Groq SDK (`groq-sdk`), `tsx` pour les scripts CLI

**Spec:** `docs/superpowers/specs/2026-04-02-vanzon-memory-design.md`

---

## Chunk 1: Types + Migration Supabase

**Files:**
- Create: `src/lib/vanzon-memory/types.ts`
- Create: `supabase/migrations/20260402000001_vanzon_memory.sql`

---

### Task 1: Créer les types partagés

**Files:**
- Create: `src/lib/vanzon-memory/types.ts`

- [ ] **Step 1: Créer `types.ts`**

```typescript
// src/lib/vanzon-memory/types.ts

export interface MemorySavePayload {
  action_type:   "memory_save";
  transcript:    string;       // transcription brute Whisper — conservée pour le flow Modifier
  obsidian_file: string;       // chemin relatif ex: "vans/🚐 Yoni.md"
  category:      string;       // ex: "vans", "blog", "equipe"
  title:         string;       // titre court généré par Groq
  content:       string;       // markdown formaté prêt à appender
  tags:          string[];
}

export interface MemoryNote {
  id:                 string;
  category:           string;
  obsidian_file:      string;
  title:              string;
  content:            string;
  source:             string;
  tags:               string[];
  obsidian_synced_at: string | null;
  created_at:         string;
}

export interface CategorizerResult {
  category:      string;
  obsidian_file: string;
  title:         string;
  content:       string;
  tags:          string[];
}
```

- [ ] **Step 2: Vérifier la compilation TypeScript**

```bash
cd /Users/julesgaveglio/vanzon-website-claude-code
npx tsc --noEmit --skipLibCheck 2>&1 | head -20
```
Attendu : pas d'erreur sur le nouveau fichier.

- [ ] **Step 3: Commit**

```bash
git add src/lib/vanzon-memory/types.ts
git commit -m "feat(memory): types MemorySavePayload, MemoryNote, CategorizerResult"
```

---

### Task 2: Migration Supabase — table `vanzon_memory`

**Files:**
- Create: `supabase/migrations/20260402000001_vanzon_memory.sql`

- [ ] **Step 1: Créer le fichier de migration**

```sql
-- supabase/migrations/20260402000001_vanzon_memory.sql
-- Table de mémoire interne Vanzon — notes vocales Telegram

CREATE TABLE IF NOT EXISTS vanzon_memory (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category           TEXT NOT NULL,
  obsidian_file      TEXT NOT NULL,
  title              TEXT NOT NULL,
  content            TEXT NOT NULL,
  source             TEXT NOT NULL DEFAULT 'telegram_voice',
  tags               TEXT[] NOT NULL DEFAULT '{}',
  -- Colonne générée pour le full-text search multi-champs (requis par Supabase JS .textSearch())
  -- Le client Supabase JS ne supporte pas les expressions SQL comme argument de colonne
  fts_vector         TSVECTOR GENERATED ALWAYS AS (
    to_tsvector('french', title || ' ' || content || ' ' || array_to_string(tags, ' '))
  ) STORED,
  obsidian_synced_at TIMESTAMPTZ,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS vanzon_memory_category_idx
  ON vanzon_memory(category);

CREATE INDEX IF NOT EXISTS vanzon_memory_created_idx
  ON vanzon_memory(created_at DESC);

CREATE INDEX IF NOT EXISTS vanzon_memory_sync_idx
  ON vanzon_memory(obsidian_synced_at)
  WHERE obsidian_synced_at IS NULL;

-- Index GIN sur la colonne générée fts_vector
CREATE INDEX IF NOT EXISTS vanzon_memory_fts_idx
  ON vanzon_memory USING gin(fts_vector);

-- État 'awaiting_memory_edit' ajouté aux états valides de telegram_pending_actions
-- (états existants : awaiting_confirmation | awaiting_edit | awaiting_selection)
COMMENT ON TABLE vanzon_memory IS 'Mémoire interne Vanzon — notes vocales catégorisées par Groq';
```

- [ ] **Step 2: Appliquer la migration via Supabase Dashboard**

Aller dans Supabase Dashboard → SQL Editor → coller et exécuter le contenu de la migration.
Vérifier que la table `vanzon_memory` apparaît dans Table Editor.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260402000001_vanzon_memory.sql
git commit -m "feat(memory): migration Supabase table vanzon_memory avec index FTS"
```

---

## Chunk 2: Categorizer + Handler

**Files:**
- Create: `src/lib/vanzon-memory/categorizer.ts`
- Create: `src/lib/vanzon-memory/handler.ts`

---

### Task 3: Categorizer — prompt Groq pour catégorisation

**Files:**
- Create: `src/lib/vanzon-memory/categorizer.ts`

- [ ] **Step 1: Créer `categorizer.ts`**

```typescript
// src/lib/vanzon-memory/categorizer.ts
// Appelle Groq pour catégoriser une transcription vocale et la formater en markdown.

import Groq from "groq-sdk";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import type { CategorizerResult } from "./types";

const KNOWN_CATEGORIES = [
  { category: "vans",      description: "Maintenance, défauts, astuces techniques sur Yoni ou Xalbat", files: ["🚐 Yoni.md", "🚐 Xalbat.md"] },
  { category: "anecdotes", description: "Moments marquants, histoires avec les locataires", files: [] },
  { category: "blog",      description: "Idées d'articles, angles, opinions tranchées à publier", files: ["✍️ Angles & Sujets Blog.md"] },
  { category: "equipe",    description: "Méthodes de travail, leçons de Jules", files: ["👤 Jules.md"] },
  { category: "histoire",  description: "Milestones Vanzon, chronologie de l'entreprise", files: [] },
  { category: "territoire",description: "Spots, routes, recommandations Pays Basque", files: ["🗺️ Pays Basque.md"] },
  { category: "vision",    description: "Idées business, tarifs, modèle économique, valeurs, partenariats", files: ["💡 Business Model & Revenus.md"] },
];

/**
 * Récupère les catégories/fichiers déjà créés dynamiquement en Supabase.
 * Complète les catégories initiales connues.
 */
async function fetchExistingCategories(): Promise<{ category: string; obsidian_file: string }[]> {
  try {
    const supabase = createSupabaseAdmin();
    const { data } = await supabase
      .from("vanzon_memory")
      .select("category, obsidian_file")
      .order("created_at", { ascending: false });
    return data ?? [];
  } catch {
    return [];
  }
}

/**
 * Catégorise une transcription vocale et retourne la note formatée.
 * @param transcript  Texte brut de la transcription Whisper
 * @param correction  Optionnel — instruction de correction de Jules (flow Modifier)
 */
export async function categorizeMemory(
  transcript: string,
  correction?: string
): Promise<CategorizerResult> {
  const existing = await fetchExistingCategories();

  // Construire le contexte des fichiers existants (dédupliqués)
  const existingContext = existing.length > 0
    ? "\n\nFichiers déjà créés en mémoire :\n" +
      [...new Map(existing.map(e => [e.obsidian_file, e])).values()]
        .map(e => `- ${e.category}/${e.obsidian_file}`)
        .join("\n")
    : "";

  const knownContext = KNOWN_CATEGORIES
    .map(c => `- **${c.category}/** : ${c.description}${c.files.length ? ` (fichiers existants: ${c.files.join(", ")})` : ""}`)
    .join("\n");

  const today = new Date().toISOString().split("T")[0];

  const systemPrompt =
    `Tu es l'agent mémoire de Vanzon Explorer, une entreprise de location de vans aménagés au Pays Basque fondée par Jules Gaveglio.` +
    `\n\nTu reçois une transcription vocale et dois la catégoriser dans la base de connaissance Vanzon (dossiers Obsidian).` +
    `\n\nCatégories connues :\n${knownContext}${existingContext}` +
    `\n\nRègles :` +
    `\n- Choisis la catégorie la plus pertinente parmi celles connues` +
    `\n- Si le sujet est genuinement nouveau (ex: recettes, formation, partenaires), crée une nouvelle catégorie et un nouveau fichier` +
    `\n- obsidian_file = chemin relatif dans la catégorie, ex: "🚐 Yoni.md" (conserve les emojis des fichiers existants)` +
    `\n- Pour un nouveau fichier, choisis un nom clair sans emoji (sauf si cohérent avec la convention existante)` +
    `\n- content = note formatée en markdown, 2-4 phrases concises, à la troisième personne ou impersonnelle` +
    `\n- tags = 2-4 mots-clés en minuscule sans #` +
    `\n- title = titre court en français (5-8 mots max)` +
    `\n- La date du jour est : ${today}` +
    `\n\nRéponds UNIQUEMENT avec un JSON valide, aucun texte autour.`;

  const userPrompt = correction
    ? `Transcription originale : "${transcript}"\n\nInstruction de correction : "${correction}"\n\nGénère le JSON mis à jour.`
    : `Transcription : "${transcript}"\n\nGénère le JSON de catégorisation.`;

  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });
  const completion = await groq.chat.completions.create({
    model:           "llama-3.3-70b-versatile",
    response_format: { type: "json_object" },
    temperature:     0.3,
    max_tokens:      500,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user",   content: userPrompt },
    ],
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";
  const parsed = JSON.parse(raw) as {
    category?:      string;
    obsidian_file?: string;
    title?:         string;
    content?:       string;
    tags?:          string[];
  };

  return {
    category:      parsed.category      ?? "vision",
    obsidian_file: parsed.obsidian_file ?? "notes.md",
    title:         parsed.title         ?? "Note sans titre",
    content:       parsed.content       ?? transcript,
    tags:          Array.isArray(parsed.tags) ? parsed.tags : [],
  };
}
```

- [ ] **Step 2: Vérifier la compilation**

```bash
npx tsc --noEmit --skipLibCheck 2>&1 | grep "vanzon-memory"
```
Attendu : aucune erreur.

- [ ] **Step 3: Commit**

```bash
git add src/lib/vanzon-memory/categorizer.ts
git commit -m "feat(memory): categorizer Groq — catégorisation dynamique des notes vocales"
```

---

### Task 4: Handler — vocal → aperçu Telegram

**Files:**
- Create: `src/lib/vanzon-memory/handler.ts`

- [ ] **Step 1: Créer `handler.ts`**

```typescript
// src/lib/vanzon-memory/handler.ts
// Reçoit une transcription vocale, catégorise avec Groq, insère pending_action,
// et envoie un aperçu Telegram avec boutons Sauvegarder / Modifier / Annuler.

import { createSupabaseAdmin } from "@/lib/supabase/server";
import { categorizeMemory } from "./categorizer";
import type { MemorySavePayload } from "./types";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;

async function tgSend(chatId: number, text: string, extra?: object) {
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML", ...extra }),
  });
}

export async function handleVoiceMemory(
  transcript: string,
  chatId:     number
): Promise<void> {
  await tgSend(chatId, "🧠 Catégorisation en cours...");

  let result;
  try {
    result = await categorizeMemory(transcript);
  } catch (err) {
    console.error("[memory] categorize error:", err);
    await tgSend(chatId, "⚠️ Catégorisation échouée. Réessaie ou envoie une note texte.");
    return;
  }

  const payload: MemorySavePayload = {
    action_type:   "memory_save",
    transcript,
    obsidian_file: result.obsidian_file,
    category:      result.category,
    title:         result.title,
    content:       result.content,
    tags:          result.tags,
  };

  const supabase   = createSupabaseAdmin();
  const pendingId  = crypto.randomUUID().replace(/-/g, "").slice(0, 10);
  const expiresAt  = new Date(Date.now() + 60 * 60 * 1000).toISOString();

  const { error } = await supabase.from("telegram_pending_actions").insert({
    id:         pendingId,
    chat_id:    chatId,
    action:     "memory_save",
    state:      "awaiting_confirmation",
    expires_at: expiresAt,
    payload,
  });

  if (error) {
    console.error("[memory] insert pending_action error:", error);
    await tgSend(chatId, "❌ Erreur sauvegarde. Réessaie 🔄");
    return;
  }

  const tagsDisplay = result.tags.map(t => `#${t}`).join(" ");

  // HTML-escape le contenu markdown pour éviter les tags HTML parasites dans <code>
  const htmlEscape = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const preview =
    `🎙️ <b>Note vocale transcrite</b>\n\n` +
    `📝 <b>Transcription :</b>\n<i>"${htmlEscape(transcript.slice(0, 300))}${transcript.length > 300 ? "…" : ""}"</i>\n\n` +
    `📂 <b>Destination :</b> ${result.category}/${result.obsidian_file}\n` +
    `🏷️ <b>Tags :</b> ${tagsDisplay || "(aucun)"}\n\n` +
    `✍️ <b>Note formatée :</b>\n` +
    `<code>## 📝 ${new Date().toISOString().split("T")[0]}\n` +
    `${htmlEscape(result.content)}\n` +
    `Tags : ${htmlEscape(tagsDisplay)}</code>`;

  await tgSend(chatId, preview, {
    reply_markup: {
      inline_keyboard: [[
        { text: "✅ Sauvegarder", callback_data: `asst:confirm:${pendingId}` },
        { text: "✏️ Modifier",   callback_data: `asst:edit:${pendingId}`    },
        { text: "❌ Annuler",    callback_data: `asst:cancel:${pendingId}`  },
      ]],
    },
  });
}
```

- [ ] **Step 2: Vérifier la compilation**

```bash
npx tsc --noEmit --skipLibCheck 2>&1 | grep "vanzon-memory"
```
Attendu : aucune erreur.

- [ ] **Step 3: Commit**

```bash
git add src/lib/vanzon-memory/handler.ts
git commit -m "feat(memory): handler handleVoiceMemory — aperçu Telegram + pending_action"
```

---

## Chunk 3: Writer + Search

**Files:**
- Create: `src/lib/vanzon-memory/writer.ts`
- Create: `src/lib/vanzon-memory/search.ts`

---

### Task 5: Writer — sauvegarde Supabase

**Files:**
- Create: `src/lib/vanzon-memory/writer.ts`

- [ ] **Step 1: Créer `writer.ts`**

```typescript
// src/lib/vanzon-memory/writer.ts
// Sauvegarde une note mémoire dans Supabase vanzon_memory.
// Appelé depuis router.ts après confirmation Telegram.
// Note : pas d'écriture Obsidian ici (Vercel serverless) — voir memory-obsidian-sync.ts

import { createSupabaseAdmin } from "@/lib/supabase/server";
import type { MemorySavePayload } from "./types";

export async function saveMemoryNote(payload: MemorySavePayload): Promise<void> {
  const supabase = createSupabaseAdmin();

  const { error } = await supabase.from("vanzon_memory").insert({
    category:      payload.category,
    obsidian_file: payload.obsidian_file,
    title:         payload.title,
    content:       payload.content,
    source:        "telegram_voice",
    tags:          payload.tags,
  });

  if (error) {
    throw new Error(`[memory writer] Supabase insert failed: ${error.message}`);
  }
}
```

- [ ] **Step 2: Vérifier la compilation**

```bash
npx tsc --noEmit --skipLibCheck 2>&1 | grep "vanzon-memory"
```
Attendu : aucune erreur.

- [ ] **Step 3: Commit**

```bash
git add src/lib/vanzon-memory/writer.ts
git commit -m "feat(memory): writer saveMemoryNote — INSERT Supabase vanzon_memory"
```

---

### Task 6: Search — full-text search Supabase

**Files:**
- Create: `src/lib/vanzon-memory/search.ts`

- [ ] **Step 1: Créer `search.ts`**

```typescript
// src/lib/vanzon-memory/search.ts
// Full-text search dans la mémoire Vanzon.
// Compatible tsx CLI (pas de fs ni de modules Next.js-only).

import { createClient } from "@supabase/supabase-js";
import type { MemoryNote } from "./types";

// Créer le client Supabase manuellement pour compatibilité tsx CLI
// (createSupabaseAdmin() utilise next/headers — non disponible hors Next.js)
function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key);
}

export interface SearchMemoryParams {
  query:       string;
  category?:   string;
  after_date?: string;  // ISO date string ex: "2026-03-01"
  limit?:      number;
}

export async function searchVanzonMemory(params: SearchMemoryParams): Promise<MemoryNote[]> {
  const { query, category, after_date, limit = 5 } = params;
  const supabase = getSupabaseClient();

  // Préparer la query FTS : remplacer les espaces par & pour AND, échapper les caractères spéciaux
  const ftsQuery = query
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map(w => w.replace(/[^a-zA-ZÀ-ÿ0-9]/g, ""))
    .filter(Boolean)
    .join(" & ");

  let dbQuery = supabase
    .from("vanzon_memory")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (ftsQuery) {
    // Cible la colonne générée fts_vector (TSVECTOR STORED) définie dans la migration
    // Le client Supabase JS ne supporte pas les expressions SQL comme nom de colonne
    dbQuery = dbQuery.textSearch("fts_vector", ftsQuery, { config: "french" });
  }

  if (category) {
    dbQuery = dbQuery.eq("category", category);
  }

  if (after_date) {
    dbQuery = dbQuery.gte("created_at", after_date);
  }

  const { data, error } = await dbQuery;

  if (error) {
    console.error("[memory search] error:", error);
    return [];
  }

  return (data ?? []) as MemoryNote[];
}
```

- [ ] **Step 2: Vérifier la compilation**

```bash
npx tsc --noEmit --skipLibCheck 2>&1 | grep "vanzon-memory"
```
Attendu : aucune erreur.

- [ ] **Step 3: Commit**

```bash
git add src/lib/vanzon-memory/search.ts
git commit -m "feat(memory): search searchVanzonMemory — full-text Supabase, compatible tsx CLI"
```

---

## Chunk 4: Modifications router.ts + webhook

**Files:**
- Modify: `src/lib/telegram-assistant/router.ts`
- Modify: `src/app/api/telegram/webhook/route.ts`

---

### Task 7: Router — awaiting_memory_edit + cancel + confirm branch

**Files:**
- Modify: `src/lib/telegram-assistant/router.ts`

- [ ] **Step 1: Ajouter l'import des modules mémoire en haut de router.ts**

Ajouter après les imports existants (ligne ~9) :

```typescript
import { saveMemoryNote } from "@/lib/vanzon-memory/writer";
import { categorizeMemory } from "@/lib/vanzon-memory/categorizer";
import type { MemorySavePayload } from "@/lib/vanzon-memory/types";
```

- [ ] **Step 2: Ajouter le check `awaiting_memory_edit` dans `handleAssistantMessage`**

Insérer en position 0, AVANT le check `awaiting_edit` existant (avant la ligne `const { data: editAction }` ~ligne 44) :

```typescript
  // 0. Vérifier awaiting_memory_edit — AVANT awaiting_edit ET awaiting_selection
  const { data: memEditAction } = await supabase
    .from("telegram_pending_actions")
    .select("*")
    .eq("chat_id", chatId)
    .eq("state", "awaiting_memory_edit")
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  if (memEditAction) {
    const payload = memEditAction.payload as MemorySavePayload;
    let updated;
    try {
      updated = await categorizeMemory(payload.transcript, text);
    } catch {
      await tgSend(chatId, "⚠️ Catégorisation échouée. Réessaie.");
      return;
    }
    const newPayload: MemorySavePayload = { ...payload, ...updated };
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    await supabase
      .from("telegram_pending_actions")
      .update({ state: "awaiting_confirmation", payload: newPayload, expires_at: expiresAt })
      .eq("id", memEditAction.id as string);

    const tagsDisplay = updated.tags.map((t: string) => `#${t}`).join(" ");
    const preview =
      `🎙️ <b>Note mise à jour</b>\n\n` +
      `📂 <b>Destination :</b> ${updated.category}/${updated.obsidian_file}\n` +
      `🏷️ <b>Tags :</b> ${tagsDisplay || "(aucun)"}\n\n` +
      `✍️ <b>Note formatée :</b>\n` +
      `<code>## 📝 ${new Date().toISOString().split("T")[0]}\n${updated.content}\nTags : ${tagsDisplay}</code>`;

    const pendingId = memEditAction.id as string;
    await tgSend(chatId, preview, {
      reply_markup: {
        inline_keyboard: [[
          { text: "✅ Sauvegarder", callback_data: `asst:confirm:${pendingId}` },
          { text: "✏️ Modifier",   callback_data: `asst:edit:${pendingId}`    },
          { text: "❌ Annuler",    callback_data: `asst:cancel:${pendingId}`  },
        ]],
      },
    });
    return;
  }
```

- [ ] **Step 3: Ajouter la branche `memory_save` dans `handleAssistantCallback` → confirm**

Dans le bloc `if (type === "confirm")` (ligne ~137), insérer AVANT la branche `gmail_reply` existante :

```typescript
    // Branch memory_save — AVANT gmail_reply
    if (actionType === "memory_save") {
      try {
        await saveMemoryNote(payload as unknown as MemorySavePayload);
        await supabase.from("telegram_pending_actions").delete().eq("id", pendingId);
        await tgSend(chatId, `✅ Noté dans <b>${(payload as Record<string,string>).category}</b> › ${(payload as Record<string,string>).obsidian_file}`);
      } catch (err) {
        console.error("[router] memory confirm error:", err);
        await tgSend(chatId, "❌ Erreur sauvegarde. Réessaie 🔄");
      }
      return;
    }
```

- [ ] **Step 4: Remplacer le bloc `if (type === "edit")` entier (lignes ~176-197)**

Le bloc existant gère seulement les emails. Le remplacer par la version complète avec branche memory :

```typescript
  // ── asst:edit ────────────────────────────────────────────────────────────
  if (type === "edit") {
    if (actionType === "memory_save") {
      // Memory edit → awaiting_memory_edit (TTL 60 min)
      await supabase
        .from("telegram_pending_actions")
        .update({
          state:      "awaiting_memory_edit",
          expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        })
        .eq("id", pendingId);
      await tgSend(chatId, "✏️ Envoie ta correction en texte libre (ex: \"change la destination vers anecdotes\")");
      return;
    }

    // Email edit → awaiting_edit (TTL 10 min) — comportement existant inchangé
    await supabase
      .from("telegram_pending_actions")
      .update({
        state:      "awaiting_edit",
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      })
      .eq("id", pendingId);

    const bodyText = (payload.body as string)
      .replace(/<p>/g,   "")
      .replace(/<\/p>/g, "\n")
      .replace(/<[^>]+>/g, "")
      .trim();

    await tgSend(
      chatId,
      `✏️ Modifie le texte ci-dessous et renvoie-le moi :\n\n${bodyText}`,
      { reply_markup: { force_reply: true, selective: true } }
    );
    return;
  }
```

- [ ] **Step 5: Ajouter le type `cancel` dans `handleAssistantCallback`**

Après le bloc `if (type === "select" ...)` (ligne ~215), avant `await tgSend(chatId, "❓ Action inconnue.")` :

```typescript
  // ── asst:cancel ──────────────────────────────────────────────────────────
  if (type === "cancel") {
    await supabase.from("telegram_pending_actions").delete().eq("id", pendingId);
    await tgSend(chatId, "❌ Note annulée.");
    return;
  }
```

- [ ] **Step 6: Corriger la chaîne d'expiration ligne 129**

Remplacer :
```typescript
await tgSend(chatId, "⏱ Demande expirée (10 min). Recommence 🔄");
```
Par :
```typescript
await tgSend(chatId, "⏱ Demande expirée. Recommence 🔄");
```

- [ ] **Step 6b: Renuméroter les commentaires de `handleAssistantMessage`**

Après l'insertion du bloc `// 0.`, les commentaires existants `// 1.` (awaiting_edit) et `// 2.` (awaiting_selection) deviennent `// 1.` et `// 2.` — ils restent corrects. Vérifier que `// 3.` devant `await runAgent(text, chatId)` est mis à jour en `// 3. Agent Groq tool-calling` si besoin.

- [ ] **Step 7: Vérifier la compilation**

```bash
npx tsc --noEmit --skipLibCheck 2>&1 | head -30
```
Attendu : aucune erreur TypeScript.

- [ ] **Step 8: Commit**

```bash
git add src/lib/telegram-assistant/router.ts
git commit -m "feat(memory): router — awaiting_memory_edit, cancel, confirm memory_save branch"
```

---

### Task 8: Webhook — voice → handleVoiceMemory

**Files:**
- Modify: `src/app/api/telegram/webhook/route.ts`

- [ ] **Step 1: Ajouter l'import de `handleVoiceMemory`**

Ajouter après les imports existants :

```typescript
import { handleVoiceMemory } from "@/lib/vanzon-memory/handler";
```

- [ ] **Step 2: Modifier le bloc voice dans la fonction POST**

Remplacer le bloc voice existant (lignes ~90-103) :

```typescript
// Avant :
  if (body.message?.voice) {
    const chatId = body.message.chat.id;
    try {
      await sendTelegram(String(chatId), "🎙 Transcription en cours...");
      const transcript = await transcribeVoice(body.message.voice.file_id);
      await sendTelegram(String(chatId), `🎙 <i>${transcript}</i>`);
      await handleAssistantMessage(transcript, chatId);
    } catch (err) {
      console.error("[webhook] voice transcription error:", err);
      await sendTelegram(String(chatId), "❌ Impossible de transcrire le message vocal. Réessaie ou envoie un texte.");
    }
    return NextResponse.json({ ok: true });
  }
```

```typescript
// Après :
  if (body.message?.voice) {
    const chatId = body.message.chat.id;
    try {
      await sendTelegram(String(chatId), "🎙 Transcription en cours...");
      const transcript = await transcribeVoice(body.message.voice.file_id);
      await handleVoiceMemory(transcript, chatId);
    } catch (err) {
      console.error("[webhook] voice error:", err);
      await sendTelegram(String(chatId), "❌ Impossible de traiter le message vocal. Réessaie ou envoie un texte.");
    }
    return NextResponse.json({ ok: true });
  }
```

- [ ] **Step 3: Vérifier que `handleAssistantMessage` est toujours importé** (utilisé pour les messages texte)

```bash
grep "handleAssistantMessage" src/app/api/telegram/webhook/route.ts
```
Attendu : au moins une ligne `import { handleAssistantMessage` et une ligne `await handleAssistantMessage(`.

- [ ] **Step 4: Vérifier la compilation**

```bash
npx tsc --noEmit --skipLibCheck 2>&1 | head -20
```
Attendu : aucune erreur.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/telegram/webhook/route.ts
git commit -m "feat(memory): webhook voice → handleVoiceMemory (mémoire directe)"
```

---

## Chunk 5: Outil search_memory pour l'agent Telegram

**Files:**
- Modify: `src/lib/telegram-assistant/tools/definitions.ts`
- Modify: `src/lib/telegram-assistant/tools/executors.ts`

---

### Task 9: Ajouter l'outil `search_memory` au catalogue Groq

**Files:**
- Modify: `src/lib/telegram-assistant/tools/definitions.ts`
- Modify: `src/lib/telegram-assistant/tools/executors.ts`

- [ ] **Step 1: Ajouter la définition dans `definitions.ts`**

Ajouter dans le tableau `TOOL_DEFINITIONS` après le dernier outil (`reply_to_email`), AVANT la parenthèse fermante du tableau `]` :

```typescript
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
            description: "Texte libre de recherche (ex: 'frigo Yoni', 'méthode aménagement')",
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
```

- [ ] **Step 2: Ajouter l'executor dans `executors.ts`**

Ajouter l'import en haut (après les imports existants) :

```typescript
import { searchVanzonMemory } from "@/lib/vanzon-memory/search";
```

Ajouter le case dans le switch de `executeTool`, AVANT le `default:` :

```typescript
      case "search_memory": return await searchMemoryTool(args);
```

Ajouter la fonction en bas du fichier :

```typescript
// ── search_memory ─────────────────────────────────────────────────────────────
async function searchMemoryTool(args: Record<string, unknown>): Promise<string> {
  const results = await searchVanzonMemory({
    query:      (args.query      as string)                  ?? "",
    category:   (args.category   as string | undefined),
    after_date: (args.after_date as string | undefined),
    limit:      (args.limit      as number | undefined) ?? 5,
  });

  if (results.length === 0) {
    return JSON.stringify({ count: 0, message: "Aucune note trouvée pour cette recherche." });
  }

  return JSON.stringify({
    count: results.length,
    notes: results.map(r => ({
      title:    r.title,
      category: r.category,
      content:  r.content,
      tags:     r.tags,
      date:     r.created_at.split("T")[0],
    })),
  });
}
```

- [ ] **Step 3: Vérifier la compilation**

```bash
npx tsc --noEmit --skipLibCheck 2>&1 | head -20
```
Attendu : aucune erreur.

- [ ] **Step 4: Commit**

```bash
git add src/lib/telegram-assistant/tools/definitions.ts src/lib/telegram-assistant/tools/executors.ts
git commit -m "feat(memory): outil search_memory dans l'agent Telegram Groq"
```

---

## Chunk 6: Intégrations — blog writer + sync Obsidian

**Files:**
- Modify: `scripts/agents/blog-writer-agent.ts`
- Create: `scripts/agents/memory-obsidian-sync.ts`

---

### Task 10: Intégration blog writer

**Files:**
- Modify: `scripts/agents/blog-writer-agent.ts`

- [ ] **Step 1: Ajouter l'import de `searchVanzonMemory`**

En haut du fichier, après les imports existants (après la ligne ~34) :

```typescript
import { searchVanzonMemory } from "../../src/lib/vanzon-memory/search";
```

- [ ] **Step 2: Trouver l'endroit exact d'injection**

```bash
grep -n "bodyPrompt\|memoryBlock" scripts/agents/blog-writer-agent.ts | head -10
```

`bodyPrompt` est construit à la ligne ~941 : `const bodyPrompt = \`${styleBlock}\n${memoryBlock}\n...`.
Il n'existe pas de variable `systemPrompt` dans ce fichier.

- [ ] **Step 3: Injecter les notes mémoire dans `bodyPrompt` après sa construction (ligne ~941)**

Ajouter immédiatement après la ligne `const bodyPrompt = \`${styleBlock}` :

```typescript
  // Injection mémoire Vanzon (notes vocales Supabase) — non-bloquant
  let bodyPrompt = `${styleBlock}
${memoryBlock}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
  // ... reste du bodyPrompt existant (ne pas modifier la suite)
```

**Note :** `bodyPrompt` est déclaré `const` dans le fichier existant. Pour permettre l'injection, changer `const bodyPrompt` en `let bodyPrompt` à la ligne ~941, puis ajouter l'injection après la construction complète du prompt (avant l'appel `callClaude`) :

```typescript
  // Injection des notes mémoire Supabase si pertinentes
  try {
    const memories = await searchVanzonMemory({ query: article.targetKeyword ?? article.title, limit: 5 });
    if (memories.length > 0) {
      bodyPrompt +=
        `\n\n💡 Notes internes Vanzon (réutiliser si pertinent) :\n` +
        memories.map(m => `- **${m.title}** (${m.category}) : ${m.content}`).join("\n");
    }
  } catch {
    // Non-bloquant — la mémoire est optionnelle
  }
```

Placer ce bloc entre `const { text: rawBody, usage: bodyUsage } = await callClaude(bodyPrompt, ...)` — non, **AVANT** cet appel.

Résumé des deux changements :
1. `const bodyPrompt` → `let bodyPrompt` (ligne ~941)
2. Bloc `try { const memories... }` inséré juste avant l'appel `callClaude(bodyPrompt, ...)`

- [ ] **Step 4: Vérifier la compilation**

```bash
npx tsc --noEmit --skipLibCheck 2>&1 | grep "blog-writer"
```
Attendu : aucune erreur.

- [ ] **Step 5: Commit**

```bash
git add scripts/agents/blog-writer-agent.ts
git commit -m "feat(memory): injection mémoire Vanzon dans le blog writer"
```

---

### Task 11: Script de sync Obsidian

**Files:**
- Create: `scripts/agents/memory-obsidian-sync.ts`

- [ ] **Step 1: Créer `memory-obsidian-sync.ts`**

```typescript
#!/usr/bin/env tsx
/**
 * memory-obsidian-sync.ts
 *
 * Synchronise les notes Supabase vanzon_memory non encore synchées
 * vers les fichiers Obsidian (Vanzon DataBase 'Obs'/).
 *
 * Usage : npx tsx scripts/agents/memory-obsidian-sync.ts
 *
 * À lancer localement uniquement (écrit dans le filesystem).
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

const __filename = fileURLToPath(import.meta.url);
const PROJECT_ROOT = path.resolve(path.dirname(__filename), "../..");
const OBSIDIAN_ROOT = path.join(PROJECT_ROOT, "Vanzon DataBase 'Obs'");

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function formatDate(isoString: string): string {
  return isoString.split("T")[0];
}

function buildAppendBlock(note: {
  title:      string;
  content:    string;
  tags:       string[];
  created_at: string;
}): string {
  const date     = formatDate(note.created_at);
  const tagsLine = note.tags.length > 0 ? `\n**Tags :** ${note.tags.map(t => `#${t}`).join(" ")}` : "";
  return `\n---\n\n## 📝 ${date}\n\n${note.content}${tagsLine}\n`;
}

function buildNewFileHeader(title: string, date: string): string {
  return `# ${title}\n\n> Créé automatiquement par l'agent mémoire Vanzon — ${date}\n\n---\n`;
}

async function syncNote(note: {
  id:           string;
  category:     string;
  obsidian_file: string;
  title:        string;
  content:      string;
  tags:         string[];
  created_at:   string;
}): Promise<void> {
  // Construire le chemin absolu du fichier Obsidian
  // obsidian_file peut être "🚐 Yoni.md" (sans sous-dossier) ou "category/file.md"
  // La convention : obsidian_file est le nom de fichier seul, category est le dossier
  const fileDir  = path.join(OBSIDIAN_ROOT, note.category);
  const filePath = path.join(fileDir, note.obsidian_file);

  // Créer le dossier si inexistant
  fs.mkdirSync(fileDir, { recursive: true });

  const appendBlock = buildAppendBlock(note);

  if (fs.existsSync(filePath)) {
    // Appender à la fin du fichier existant
    fs.appendFileSync(filePath, appendBlock, "utf-8");
  } else {
    // Créer le fichier avec un en-tête minimal
    const header  = buildNewFileHeader(note.title, formatDate(note.created_at));
    fs.writeFileSync(filePath, header + appendBlock, "utf-8");
  }

  console.log(`  ✅ ${note.category}/${note.obsidian_file}`);
}

async function main(): Promise<void> {
  console.log("🔄 Démarrage de la sync mémoire → Obsidian...\n");

  if (!fs.existsSync(OBSIDIAN_ROOT)) {
    console.error(`❌ Vault Obsidian introuvable : ${OBSIDIAN_ROOT}`);
    process.exit(1);
  }

  const supabase = getSupabase();

  const { data: notes, error } = await supabase
    .from("vanzon_memory")
    .select("id, category, obsidian_file, title, content, tags, created_at")
    .is("obsidian_synced_at", null)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("❌ Erreur Supabase :", error.message);
    process.exit(1);
  }

  if (!notes || notes.length === 0) {
    console.log("✅ Aucune note à synchroniser.");
    return;
  }

  console.log(`📦 ${notes.length} note(s) à synchroniser :\n`);

  let successCount = 0;

  for (const note of notes) {
    try {
      await syncNote(note as Parameters<typeof syncNote>[0]);

      // Marquer comme synchée
      await supabase
        .from("vanzon_memory")
        .update({ obsidian_synced_at: new Date().toISOString() })
        .eq("id", note.id);

      successCount++;
    } catch (err) {
      console.error(`  ❌ Erreur sur ${note.obsidian_file} :`, err instanceof Error ? err.message : String(err));
    }
  }

  console.log(`\n✅ ${successCount}/${notes.length} notes synchronisées vers Obsidian.`);
}

main().catch(err => {
  console.error("❌ Erreur fatale :", err);
  process.exit(1);
});
```

- [ ] **Step 2: Ajouter le script dans le registry des agents**

Ouvrir `scripts/agents/registry.json` et ajouter l'entrée en respectant le schéma des entrées existantes (champs `file`, `emoji`, `status`, `trigger`, etc.) :

```json
{
  "id": "memory-obsidian-sync",
  "name": "Sync Mémoire → Obsidian",
  "emoji": "🧠",
  "status": "active",
  "description": "Synchronise les notes vocales sauvegardées en Supabase vers les fichiers Markdown Obsidian (Vanzon DataBase 'Obs'/). À lancer localement — ne fonctionne pas sur Vercel.",
  "trigger": "manual",
  "schedule": "Manuel uniquement",
  "cronExpression": null,
  "file": "scripts/agents/memory-obsidian-sync.ts",
  "workflow": null,
  "apis": ["Supabase"],
  "output": "Fichiers Markdown dans Vanzon DataBase 'Obs'/",
  "manualCommand": "npx tsx scripts/agents/memory-obsidian-sync.ts",
  "tags": ["Mémoire", "Obsidian", "Manuel"],
  "pipeline": "Standalone"
}
```

- [ ] **Step 3: Tester le script en local (vault vide acceptable)**

```bash
npx tsx scripts/agents/memory-obsidian-sync.ts
```
Attendu : `✅ Aucune note à synchroniser.` ou liste de notes synchées si des notes existent.

- [ ] **Step 4: Commit**

```bash
git add scripts/agents/memory-obsidian-sync.ts scripts/agents/registry.json
git commit -m "feat(memory): script sync Obsidian + registry entry"
```

---

## Chunk 7: Test end-to-end + deploy

### Task 12: Build + Deploy + Test end-to-end

> **Note importante :** Le webhook Telegram pointe vers l'URL Vercel de production — les tests Telegram nécessitent un build déployé, pas le dev server local. Les étapes 1-3 (compilation) peuvent être testées en local, mais les étapes 4-10 (Telegram) nécessitent le push.

- [ ] **Step 1: Vérifier la compilation complète**

```bash
npm run build 2>&1 | tail -20
```
Attendu : `✓ Compiled successfully` sans erreurs TypeScript ou ESLint.

- [ ] **Step 2: Vérifier que le vault Obsidian est accessible (sync local)**

```bash
ls "Vanzon DataBase 'Obs'/"
```
Attendu : liste des dossiers (vans, anecdotes, blog, etc.). Si le dossier n'existe pas, le sync script échouera.

- [ ] **Step 3: Tester la sync Obsidian en local (table vide)**

```bash
npx tsx scripts/agents/memory-obsidian-sync.ts
```
Attendu : `✅ Aucune note à synchroniser.` (table vide à ce stade).

- [ ] **Step 4: Push sur main pour déployer**

```bash
git push origin main
```
Vérifier dans Vercel dashboard que le build passe sans erreur avant de continuer.

- [ ] **Step 5: Envoyer un message vocal depuis Telegram (production)**

Envoyer un vocal du type : *"Pense à vérifier le frigo de Yoni lors de l'état des lieux retour, les boîtes oubliées laissent des traces de rouille"*

Attendu :
1. Message `"🎙 Transcription en cours..."`
2. Message `"🧠 Catégorisation en cours..."`
3. Aperçu avec destination `vans/🚐 Yoni.md`, tags, note formatée, 3 boutons

- [ ] **Step 6: Tester le bouton Sauvegarder**

Cliquer sur `✅ Sauvegarder`.

Attendu : `"✅ Noté dans vans › 🚐 Yoni.md"`

Vérifier dans Supabase Dashboard → Table Editor → `vanzon_memory` : une ligne existe avec `obsidian_synced_at = NULL`.

- [ ] **Step 7: Tester la recherche depuis l'agent**

Envoyer en texte : *"qu'est-ce que j'ai noté sur Yoni ?"*

Attendu : Groq utilise l'outil `search_memory` et retourne le résumé de la note sauvegardée.

- [ ] **Step 8: Tester le bouton Modifier**

Envoyer un nouveau vocal, cliquer `✏️ Modifier`, répondre *"mets ça dans anecdotes plutôt"*.

Attendu : nouvel aperçu avec destination `anecdotes/...`, mêmes 3 boutons.

- [ ] **Step 9: Tester le bouton Annuler**

Envoyer un nouveau vocal, cliquer `❌ Annuler`.

Attendu : `"❌ Note annulée."`, aucune nouvelle ligne dans `vanzon_memory` Supabase.

- [ ] **Step 10: Tester la sync Obsidian après les notes sauvegardées**

```bash
npx tsx scripts/agents/memory-obsidian-sync.ts
```
Attendu : `✅ 1 note(s) synchronisées vers Obsidian.`

Vérifier que le contenu est apparu dans `Vanzon DataBase 'Obs'/vans/🚐 Yoni.md` (ou le fichier cible détecté par Groq).

Vérifier dans Supabase que `obsidian_synced_at` n'est plus NULL pour la note synchée.

---

## Récapitulatif des fichiers

| Fichier | Action |
|---|---|
| `src/lib/vanzon-memory/types.ts` | Créé |
| `src/lib/vanzon-memory/categorizer.ts` | Créé |
| `src/lib/vanzon-memory/handler.ts` | Créé |
| `src/lib/vanzon-memory/writer.ts` | Créé |
| `src/lib/vanzon-memory/search.ts` | Créé |
| `scripts/agents/memory-obsidian-sync.ts` | Créé |
| `supabase/migrations/20260402000001_vanzon_memory.sql` | Créé |
| `src/lib/telegram-assistant/router.ts` | Modifié |
| `src/app/api/telegram/webhook/route.ts` | Modifié |
| `src/lib/telegram-assistant/tools/definitions.ts` | Modifié |
| `src/lib/telegram-assistant/tools/executors.ts` | Modifié |
| `scripts/agents/blog-writer-agent.ts` | Modifié |
| `scripts/agents/registry.json` | Modifié |
