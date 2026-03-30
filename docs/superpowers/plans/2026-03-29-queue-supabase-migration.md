# Article Queue — Migration Supabase + Agent Runs Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remplacer `scripts/data/article-queue.json` par une table Supabase `article_queue` avec locking transactionnel, ajouter une table `agent_runs` pour l'audit trail de chaque agent, et porter MAX_NEW_ARTICLES à 12.

**Architecture:** Un fichier client partagé `scripts/lib/queue.ts` centralise tous les accès Supabase à la queue. Chacun des 6 agents remplace son `readFile`/`writeFile` par des appels à ce client. Un script de seed importe les ~140 articles JSON existants dans Supabase. Le locking "claim atomique" est implémenté via une fonction PostgreSQL RPC pour éviter les race conditions.

**Tech Stack:** Supabase (PostgreSQL), `@supabase/supabase-js`, TypeScript/tsx, Next.js Server Actions.

---

## Chunk 1 — Schéma SQL + Clients partagés

### Task 1 : Migration SQL — tables `article_queue` et `agent_runs`

**Files:**
- Create: `supabase/migrations/20260330000001_article_queue.sql`

- [ ] **Step 1 : Créer le fichier de migration**

```sql
-- ============================================================
-- Migration : Article Queue + Agent Runs
-- 2026-03-30 — Vanzon Explorer
-- ============================================================

-- ── 1. Table article_queue ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS article_queue (
  id                  TEXT        PRIMARY KEY,         -- = slug (unique)
  slug                TEXT        NOT NULL UNIQUE,
  title               TEXT        NOT NULL,
  excerpt             TEXT        NOT NULL DEFAULT '',
  category            TEXT        NOT NULL,
  tag                 TEXT,
  read_time           TEXT        NOT NULL DEFAULT '5 min',
  target_keyword      TEXT        NOT NULL DEFAULT '',
  secondary_keywords  TEXT[]      NOT NULL DEFAULT '{}',
  target_word_count   INTEGER,
  word_count_note     TEXT,
  status              TEXT        NOT NULL DEFAULT 'pending'
                                  CHECK (status IN ('pending', 'writing', 'published', 'needs-improvement')),
  priority            INTEGER     NOT NULL DEFAULT 50,
  sanity_id           TEXT,
  published_at        TIMESTAMPTZ,
  last_seo_check      TIMESTAMPTZ,
  seo_position        INTEGER,
  search_volume       INTEGER,
  competition_level   TEXT,
  seo_score           NUMERIC,
  added_by            TEXT,
  last_optimized_at   TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER article_queue_updated_at
  BEFORE UPDATE ON article_queue
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_article_queue_status   ON article_queue (status);
CREATE INDEX IF NOT EXISTS idx_article_queue_priority ON article_queue (priority ASC, created_at ASC);

-- RLS : service_role seulement (agents server-side)
ALTER TABLE article_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all" ON article_queue
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ── 2. Fonction atomique claim_pending_article ────────────────────────────────
-- Sélectionne + verrouille atomiquement le prochain article pending (ORDER BY priority ASC)
-- Évite les race conditions si 2 agents tournent simultanément.
CREATE OR REPLACE FUNCTION claim_pending_article(p_slug TEXT DEFAULT NULL)
RETURNS SETOF article_queue
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  UPDATE article_queue
  SET status = 'writing'
  WHERE id = (
    SELECT id FROM article_queue
    WHERE
      CASE WHEN p_slug IS NOT NULL
        THEN slug = p_slug AND status IN ('pending', 'needs-improvement')
        ELSE status = 'pending'
      END
    ORDER BY priority ASC, created_at ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED
  )
  RETURNING *;
END;
$$;

-- ── 3. Table agent_runs ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS agent_runs (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_name       TEXT        NOT NULL,
  started_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at      TIMESTAMPTZ,
  status           TEXT        NOT NULL DEFAULT 'running'
                               CHECK (status IN ('running', 'success', 'error')),
  items_processed  INTEGER     NOT NULL DEFAULT 0,
  items_created    INTEGER     NOT NULL DEFAULT 0,
  error_message    TEXT,
  metadata         JSONB
);

CREATE INDEX IF NOT EXISTS idx_agent_runs_name       ON agent_runs (agent_name);
CREATE INDEX IF NOT EXISTS idx_agent_runs_started_at ON agent_runs (started_at DESC);

ALTER TABLE agent_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all" ON agent_runs
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
```

- [ ] **Step 2 : Appliquer la migration**

```bash
# Option A — Supabase CLI (si local)
supabase db push

# Option B — Supabase Studio SQL Editor (coller le SQL directement)
# Aller sur https://supabase.com/dashboard → SQL Editor → Paste → Run
```

Expected: tables `article_queue` et `agent_runs` créées, fonction `claim_pending_article` disponible.

- [ ] **Step 3 : Commit**

```bash
git add supabase/migrations/20260330000001_article_queue.sql
git commit -m "feat(db): add article_queue + agent_runs tables with claim_pending_article RPC"
```

---

### Task 2 : Client partagé `scripts/lib/queue.ts`

**Files:**
- Create: `scripts/lib/queue.ts`

Ce fichier est **la seule source de vérité** pour tous les accès à `article_queue`. Tous les agents importent depuis ici.

- [ ] **Step 1 : Créer `scripts/lib/queue.ts`**

```typescript
/**
 * scripts/lib/queue.ts
 *
 * Shared Supabase client for article_queue table.
 * All agents use this — never read/write article-queue.json directly.
 *
 * Required env vars:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from "@supabase/supabase-js";

// ── Types ─────────────────────────────────────────────────────────────────────

export type ArticleStatus = "pending" | "writing" | "published" | "needs-improvement";

export interface ArticleQueueItem {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  tag: string | null;
  readTime: string;
  targetKeyword: string;
  secondaryKeywords: string[];
  targetWordCount?: number;
  wordCountNote?: string;
  status: ArticleStatus;
  priority: number;
  sanityId: string | null;
  publishedAt: string | null;
  lastSeoCheck: string | null;
  seoPosition: number | null;
  searchVolume?: number;
  competitionLevel?: string;
  seoScore?: number;
  addedBy?: string;
  lastOptimizedAt?: string | null;
  createdAt?: string;
}

// ── Supabase client (service_role — server only) ──────────────────────────────

function getClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  return createClient(url, key, { auth: { persistSession: false } });
}

// ── Row mappers (snake_case DB ↔ camelCase TS) ────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function rowToItem(row: Record<string, any>): ArticleQueueItem {
  return {
    id:               row.id,
    slug:             row.slug,
    title:            row.title,
    excerpt:          row.excerpt ?? "",
    category:         row.category,
    tag:              row.tag ?? null,
    readTime:         row.read_time ?? "5 min",
    targetKeyword:    row.target_keyword ?? "",
    secondaryKeywords: row.secondary_keywords ?? [],
    targetWordCount:  row.target_word_count ?? undefined,
    wordCountNote:    row.word_count_note ?? undefined,
    status:           row.status as ArticleStatus,
    priority:         row.priority ?? 50,
    sanityId:         row.sanity_id ?? null,
    publishedAt:      row.published_at ?? null,
    lastSeoCheck:     row.last_seo_check ?? null,
    seoPosition:      row.seo_position ?? null,
    searchVolume:     row.search_volume ?? undefined,
    competitionLevel: row.competition_level ?? undefined,
    seoScore:         row.seo_score ?? undefined,
    addedBy:          row.added_by ?? undefined,
    lastOptimizedAt:  row.last_optimized_at ?? null,
    createdAt:        row.created_at ?? undefined,
  };
}

function itemToRow(item: Partial<ArticleQueueItem>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (item.id               !== undefined) row.id                = item.id;
  if (item.slug             !== undefined) row.slug              = item.slug;
  if (item.title            !== undefined) row.title             = item.title;
  if (item.excerpt          !== undefined) row.excerpt           = item.excerpt;
  if (item.category         !== undefined) row.category          = item.category;
  if (item.tag              !== undefined) row.tag               = item.tag;
  if (item.readTime         !== undefined) row.read_time         = item.readTime;
  if (item.targetKeyword    !== undefined) row.target_keyword    = item.targetKeyword;
  if (item.secondaryKeywords !== undefined) row.secondary_keywords = item.secondaryKeywords;
  if (item.targetWordCount  !== undefined) row.target_word_count = item.targetWordCount;
  if (item.wordCountNote    !== undefined) row.word_count_note   = item.wordCountNote;
  if (item.status           !== undefined) row.status            = item.status;
  if (item.priority         !== undefined) row.priority          = item.priority;
  if (item.sanityId         !== undefined) row.sanity_id         = item.sanityId;
  if (item.publishedAt      !== undefined) row.published_at      = item.publishedAt;
  if (item.lastSeoCheck     !== undefined) row.last_seo_check    = item.lastSeoCheck;
  if (item.seoPosition      !== undefined) row.seo_position      = item.seoPosition;
  if (item.searchVolume     !== undefined) row.search_volume     = item.searchVolume;
  if (item.competitionLevel !== undefined) row.competition_level = item.competitionLevel;
  if (item.seoScore         !== undefined) row.seo_score         = item.seoScore;
  if (item.addedBy          !== undefined) row.added_by          = item.addedBy;
  if (item.lastOptimizedAt  !== undefined) row.last_optimized_at = item.lastOptimizedAt;
  return row;
}

// ── Public API ────────────────────────────────────────────────────────────────

/** Récupère toute la queue, optionnellement filtrée par status. */
export async function getQueueItems(filter?: { status?: ArticleStatus }): Promise<ArticleQueueItem[]> {
  const sb = getClient();
  let query = sb.from("article_queue").select("*").order("priority", { ascending: true }).order("created_at", { ascending: true });
  if (filter?.status) query = query.eq("status", filter.status);
  const { data, error } = await query;
  if (error) throw new Error(`getQueueItems: ${error.message}`);
  return (data ?? []).map(rowToItem);
}

/** Récupère un article par id/slug. */
export async function getQueueItem(id: string): Promise<ArticleQueueItem | null> {
  const sb = getClient();
  const { data, error } = await sb.from("article_queue").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(`getQueueItem: ${error.message}`);
  return data ? rowToItem(data) : null;
}

/**
 * Réclame atomiquement le prochain article pending (ou un article précis par slug).
 * Utilise SELECT FOR UPDATE SKIP LOCKED pour le locking.
 * Retourne null si rien de disponible.
 */
export async function claimPendingArticle(slug?: string): Promise<ArticleQueueItem | null> {
  const sb = getClient();
  const { data, error } = await sb.rpc("claim_pending_article", { p_slug: slug ?? null });
  if (error) throw new Error(`claimPendingArticle: ${error.message}`);
  const rows = data as Record<string, unknown>[] | null;
  return rows && rows.length > 0 ? rowToItem(rows[0]) : null;
}

/** Met à jour des champs spécifiques d'un article. */
export async function updateQueueItem(id: string, updates: Partial<ArticleQueueItem>): Promise<void> {
  const sb = getClient();
  const row = itemToRow(updates);
  if (Object.keys(row).length === 0) return;
  const { error } = await sb.from("article_queue").update(row).eq("id", id);
  if (error) throw new Error(`updateQueueItem(${id}): ${error.message}`);
}

/** Insère un nouvel article (ignore si id déjà présent). */
export async function insertQueueItem(item: ArticleQueueItem): Promise<{ inserted: boolean }> {
  const sb = getClient();
  const row = itemToRow(item);
  const { error } = await sb.from("article_queue").insert(row);
  if (error) {
    // duplicate key = already exists, not a real error
    if (error.code === "23505") return { inserted: false };
    throw new Error(`insertQueueItem(${item.id}): ${error.message}`);
  }
  return { inserted: true };
}

/** Supprime un article de la queue. */
export async function deleteQueueItem(id: string): Promise<void> {
  const sb = getClient();
  const { error } = await sb.from("article_queue").delete().eq("id", id);
  if (error) throw new Error(`deleteQueueItem(${id}): ${error.message}`);
}

/** Vérifie si un article existe déjà (par id ou keyword). */
export async function itemExists(opts: { id?: string; targetKeyword?: string }): Promise<boolean> {
  const sb = getClient();
  let query = sb.from("article_queue").select("id", { count: "exact", head: true });
  if (opts.id)            query = query.eq("id", opts.id);
  else if (opts.targetKeyword) query = query.ilike("target_keyword", opts.targetKeyword);
  else return false;
  const { count, error } = await query;
  if (error) throw new Error(`itemExists: ${error.message}`);
  return (count ?? 0) > 0;
}
```

- [ ] **Step 2 : Commit**

```bash
git add scripts/lib/queue.ts
git commit -m "feat(agents): add shared Supabase queue client with atomic claim"
```

---

### Task 3 : Client partagé `scripts/lib/agent-runs.ts`

**Files:**
- Create: `scripts/lib/agent-runs.ts`

- [ ] **Step 1 : Créer `scripts/lib/agent-runs.ts`**

```typescript
/**
 * scripts/lib/agent-runs.ts
 *
 * Audit trail for agent executions.
 * Each agent calls startRun() at the beginning, finishRun() at the end.
 */

import { createClient } from "@supabase/supabase-js";

function getClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  return createClient(url, key, { auth: { persistSession: false } });
}

export interface RunResult {
  status: "success" | "error";
  itemsProcessed?: number;
  itemsCreated?: number;
  error?: string;
  metadata?: Record<string, unknown>;
}

/** Démarre un run. Retourne l'id du run à passer à finishRun(). */
export async function startRun(
  agentName: string,
  metadata?: Record<string, unknown>
): Promise<string> {
  try {
    const sb = getClient();
    const { data, error } = await sb
      .from("agent_runs")
      .insert({ agent_name: agentName, status: "running", metadata })
      .select("id")
      .single();
    if (error) throw error;
    return (data as { id: string }).id;
  } catch {
    // Ne jamais bloquer l'agent si l'audit échoue
    return "no-op";
  }
}

/** Termine un run avec son résultat. */
export async function finishRun(runId: string, result: RunResult): Promise<void> {
  if (runId === "no-op") return;
  try {
    const sb = getClient();
    await sb.from("agent_runs").update({
      finished_at:     new Date().toISOString(),
      status:          result.status,
      items_processed: result.itemsProcessed ?? 0,
      items_created:   result.itemsCreated ?? 0,
      error_message:   result.error ?? null,
      ...(result.metadata ? { metadata: result.metadata } : {}),
    }).eq("id", runId);
  } catch {
    // Non-fatal
  }
}
```

- [ ] **Step 2 : Commit**

```bash
git add scripts/lib/agent-runs.ts
git commit -m "feat(agents): add agent_runs audit trail client"
```

---

### Task 4 : Script de seed — importer le JSON existant dans Supabase

**Files:**
- Create: `scripts/seed-queue.ts`

Ce script est **one-shot** : il importe les ~140 articles de `article-queue.json` dans Supabase. À exécuter une seule fois après la migration SQL.

- [ ] **Step 1 : Créer `scripts/seed-queue.ts`**

```typescript
#!/usr/bin/env tsx
/**
 * seed-queue.ts — One-time migration from article-queue.json to Supabase.
 * Run once: npx tsx scripts/seed-queue.ts
 */

import path from "path";
import fs from "fs/promises";
import { insertQueueItem } from "./lib/queue";
import type { ArticleQueueItem } from "./lib/queue";

const QUEUE_FILE = path.resolve(path.dirname(__filename), "data/article-queue.json");

async function main() {
  const raw = await fs.readFile(QUEUE_FILE, "utf-8");
  const items = JSON.parse(raw) as ArticleQueueItem[];
  console.log(`🌱 Seeding ${items.length} articles into Supabase article_queue...\n`);

  let inserted = 0;
  let skipped = 0;

  for (const item of items) {
    try {
      const result = await insertQueueItem(item);
      if (result.inserted) {
        console.log(`  ✓ ${item.slug}`);
        inserted++;
      } else {
        console.log(`  ~ ${item.slug} (already exists)`);
        skipped++;
      }
    } catch (err) {
      console.error(`  ✗ ${item.slug}: ${(err as Error).message}`);
    }
  }

  console.log(`\n✅ Done: ${inserted} inserted, ${skipped} skipped`);
}

main().catch((err) => { console.error(err); process.exit(1); });
```

- [ ] **Step 2 : Exécuter le seed**

```bash
npx tsx scripts/seed-queue.ts
```

Expected output: `✅ Done: 140 inserted, 0 skipped`

- [ ] **Step 3 : Commit**

```bash
git add scripts/seed-queue.ts
git commit -m "feat(agents): add one-time queue seed script (JSON → Supabase)"
```

---

## Chunk 2 — Migration des 6 agents

> Pattern commun à chaque agent :
> 1. Remplacer `import fs from "fs/promises"` + `QUEUE_FILE` + `readQueue()` + `updateQueue()` par `import { ... } from "../lib/queue"`
> 2. Ajouter `import { startRun, finishRun } from "../lib/agent-runs"` dans main()
> 3. Supprimer la constante `QUEUE_FILE`

---

### Task 5 : Migrer `blog-writer-agent.ts`

**Files:**
- Modify: `scripts/agents/blog-writer-agent.ts`

C'est l'agent le plus critique — il utilise le locking atomique.

- [ ] **Step 1 : Remplacer les imports queue**

Supprimer:
```typescript
const QUEUE_FILE = path.join(PROJECT_ROOT, "scripts/data/article-queue.json");
// ...
async function readQueue(): Promise<ArticleQueueItem[]> {
  const fs = await import("fs/promises");
  const raw = await fs.readFile(QUEUE_FILE, "utf-8");
  return JSON.parse(raw) as ArticleQueueItem[];
}
async function updateQueue(queue: ArticleQueueItem[]): Promise<void> {
  const fs = await import("fs/promises");
  await fs.writeFile(QUEUE_FILE, JSON.stringify(queue, null, 2), "utf-8");
}
```

Ajouter en tête du fichier (après les imports existants):
```typescript
import {
  claimPendingArticle,
  updateQueueItem,
  getQueueItem,
  type ArticleQueueItem,
} from "../../scripts/lib/queue";
import { startRun, finishRun } from "../../scripts/lib/agent-runs";
```

Note: le type `ArticleQueueItem` local dans le fichier peut être supprimé — il est maintenant importé depuis `queue.ts`.

- [ ] **Step 2 : Remplacer `readQueue()` + sélection de l'article**

Chercher le bloc main() qui lit la queue et sélectionne l'article. Remplacer par :

```typescript
// Avant (JSON):
const queue = await readQueue();
// ... trouver le slug cible, sélectionner l'article ...
article.status = "writing";
await updateQueue(queue);

// Après (Supabase — atomique):
const article = await claimPendingArticle(targetSlug ?? undefined);
if (!article) {
  console.log("✓ Aucun article pending disponible.");
  return;
}
```

- [ ] **Step 3 : Remplacer tous les `updateQueue(queue)` par `updateQueueItem(id, updates)`**

Chaque `await updateQueue(queue)` devient un appel ciblé, par exemple :

```typescript
// Avant:
article.status = "published";
article.sanityId = sanityDoc._id;
article.publishedAt = new Date().toISOString();
await updateQueue(queue);

// Après:
await updateQueueItem(article.id, {
  status: "published",
  sanityId: sanityDoc._id,
  publishedAt: new Date().toISOString(),
});
```

- [ ] **Step 4 : Ajouter startRun/finishRun dans main()**

```typescript
async function main() {
  const runId = await startRun("blog-writer");
  try {
    // ... logique existante ...
    await finishRun(runId, { status: "success", itemsProcessed: 1, metadata: { slug: article.slug } });
  } catch (err) {
    await finishRun(runId, { status: "error", error: (err as Error).message });
    throw err;
  }
}
```

- [ ] **Step 5 : Tester manuellement**

```bash
# Dry run — vérifier qu'il trouve bien le prochain article pending
npx tsx scripts/agents/blog-writer-agent.ts --dry-run 2>&1 | head -20
```

Expected: `[Queue] Claimed article: <slug>` sans erreur Supabase.

- [ ] **Step 6 : Commit**

```bash
git add scripts/agents/blog-writer-agent.ts
git commit -m "feat(agents): migrate blog-writer to Supabase queue with atomic claim"
```

---

### Task 6 : Migrer `keyword-researcher.ts`

**Files:**
- Modify: `scripts/agents/keyword-researcher.ts`

- [ ] **Step 1 : Remplacer les helpers queue**

Supprimer `readQueue()`, `updateQueue()`, `QUEUE_FILE`. Ajouter :

```typescript
import { getQueueItems, insertQueueItem, itemExists } from "../../scripts/lib/queue";
import { startRun, finishRun } from "../../scripts/lib/agent-runs";
```

- [ ] **Step 2 : Remplacer la logique de déduplication**

```typescript
// Avant:
const existingKeywords = new Set(queue.map((item) => item.targetKeyword.toLowerCase().trim()));
const existingSlugs = new Set(queue.map((item) => item.slug.toLowerCase().trim()));

// Après:
const queue = await getQueueItems();
const existingKeywords = new Set(queue.map((item) => item.targetKeyword.toLowerCase().trim()));
const existingSlugs = new Set(queue.map((item) => item.slug.toLowerCase().trim()));
```

- [ ] **Step 3 : Remplacer l'ajout des items**

```typescript
// Avant:
queue.push(newItem);
await updateQueue(queue);

// Après:
const { inserted } = await insertQueueItem(newItem);
if (!inserted) console.log(`  [SKIP] Déjà dans la queue: ${newItem.slug}`);
```

- [ ] **Step 4 : Ajouter startRun/finishRun**

```typescript
const runId = await startRun("keyword-researcher");
// ... logique ...
await finishRun(runId, { status: "success", itemsCreated: newArticlesCount });
```

- [ ] **Step 5 : Commit**

```bash
git add scripts/agents/keyword-researcher.ts
git commit -m "feat(agents): migrate keyword-researcher to Supabase queue"
```

---

### Task 7 : Migrer `queue-builder-monthly.ts` + MAX_NEW_ARTICLES = 12

**Files:**
- Modify: `scripts/agents/queue-builder-monthly.ts`

- [ ] **Step 1 : MAX_NEW_ARTICLES → 12**

```typescript
// Avant:
const MAX_NEW_ARTICLES = 8;

// Après:
const MAX_NEW_ARTICLES = 12;
```

- [ ] **Step 2 : Remplacer helpers queue**

Même pattern que keyword-researcher :

```typescript
import { getQueueItems, insertQueueItem } from "../../scripts/lib/queue";
import { startRun, finishRun } from "../../scripts/lib/agent-runs";
```

Supprimer `QUEUE_FILE`, `readFile`, `writeFile` liés à la queue.

- [ ] **Step 3 : Remplacer la logique**

```typescript
// Avant:
const rawQueue = await fs.readFile(QUEUE_FILE, "utf-8");
const queue = JSON.parse(rawQueue) as ArticleQueueItem[];

// Après:
const queue = await getQueueItems();
```

Et pour chaque insertion :
```typescript
// Avant:
newArticles.push(newItem);
// ...
const updatedQueue = [...queue, ...newArticles];
await fs.writeFile(QUEUE_FILE, JSON.stringify(updatedQueue, null, 2));

// Après:
for (const item of newArticles) {
  const { inserted } = await insertQueueItem(item);
  if (inserted) itemsCreated++;
}
```

- [ ] **Step 4 : Ajouter startRun/finishRun**

- [ ] **Step 5 : Commit**

```bash
git add scripts/agents/queue-builder-monthly.ts
git commit -m "feat(agents): migrate queue-builder to Supabase, MAX_NEW_ARTICLES=12"
```

---

### Task 8 : Migrer `seo-checker.ts`

**Files:**
- Modify: `scripts/agents/seo-checker.ts`

- [ ] **Step 1 : Remplacer helpers queue**

```typescript
import { getQueueItems, updateQueueItem } from "../../scripts/lib/queue";
import { startRun, finishRun } from "../../scripts/lib/agent-runs";
```

- [ ] **Step 2 : Remplacer readFile/writeFile**

```typescript
// Avant:
const raw = fs.readFileSync(queueFile, "utf-8");
const queue: ArticleQueueItem[] = JSON.parse(raw);
// ...
fs.writeFileSync(queueFile, JSON.stringify(queue, null, 2));

// Après:
const queue = await getQueueItems({ status: "published" });
// (filtrer les articles publiés depuis >30 jours reste en JS)
// ...
await updateQueueItem(article.id, {
  seoPosition: position,
  lastSeoCheck: new Date().toISOString(),
  status: newStatus,
});
```

- [ ] **Step 3 : Ajouter startRun/finishRun**

- [ ] **Step 4 : Commit**

```bash
git add scripts/agents/seo-checker.ts
git commit -m "feat(agents): migrate seo-checker to Supabase queue"
```

---

### Task 9 : Migrer `article-optimizer-quarterly.ts`

**Files:**
- Modify: `scripts/agents/article-optimizer-quarterly.ts`

- [ ] **Step 1 : Remplacer helpers queue**

```typescript
import { getQueueItems, updateQueueItem } from "../../scripts/lib/queue";
import { startRun, finishRun } from "../../scripts/lib/agent-runs";
```

- [ ] **Step 2 : Remplacer readFile/writeFile**

```typescript
// Avant:
const rawQueue = await fs.readFile(QUEUE_FILE, "utf-8");
const queue: ArticleQueueItem[] = JSON.parse(rawQueue);
// ...
await fs.writeFile(QUEUE_FILE, JSON.stringify(queue, null, 2));

// Après:
const queue = await getQueueItems({ status: "published" });
// ...
await updateQueueItem(article.id, { lastOptimizedAt: new Date().toISOString() });
```

- [ ] **Step 3 : Ajouter startRun/finishRun**

- [ ] **Step 4 : Commit**

```bash
git add scripts/agents/article-optimizer-quarterly.ts
git commit -m "feat(agents): migrate article-optimizer to Supabase queue"
```

---

### Task 10 : Migrer `link-optimizer-monthly.ts`

**Files:**
- Modify: `scripts/agents/link-optimizer-monthly.ts`

- [ ] **Step 1 : Remplacer helpers queue**

```typescript
import { getQueueItems, updateQueueItem } from "../../scripts/lib/queue";
import { startRun, finishRun } from "../../scripts/lib/agent-runs";
```

- [ ] **Step 2 : Remplacer readFile (ligne 421)**

```typescript
// Avant:
const raw = await fs.readFile(QUEUE_FILE, "utf-8");
const queue = JSON.parse(raw) as ArticleQueueItem[];

// Après:
const queue = await getQueueItems({ status: "published" });
```

- [ ] **Step 3 : Remplacer writeFile (ligne 533)**

```typescript
// Avant:
await fs.writeFile(QUEUE_FILE, JSON.stringify(queue, null, 2), "utf-8");

// Après:
// link-optimizer ne modifie pas le status ni les métadonnées SEO — aucun updateQueueItem nécessaire.
// (supprimer la ligne writeFile)
```

- [ ] **Step 4 : Ajouter startRun/finishRun**

- [ ] **Step 5 : Commit**

```bash
git add scripts/agents/link-optimizer-monthly.ts
git commit -m "feat(agents): migrate link-optimizer to Supabase queue"
```

---

## Chunk 3 — Admin Panel + Nettoyage

### Task 11 : Migrer `admin/blog/page.tsx` et `actions.ts`

**Files:**
- Modify: `src/app/admin/(protected)/blog/page.tsx`
- Modify: `src/app/admin/(protected)/blog/actions.ts`

Le dashboard admin lit la queue pour afficher la liste. Les actions suppriment/déclenchent des articles.

- [ ] **Step 1 : Modifier `page.tsx` — remplacer getArticleQueue()**

```typescript
// Avant:
async function getArticleQueue(): Promise<ArticleQueueItem[]> {
  const queuePath = path.resolve(process.cwd(), "scripts/data/article-queue.json");
  const raw = await readFile(queuePath, "utf-8");
  return JSON.parse(raw) as ArticleQueueItem[];
}

// Après:
import { createSupabaseAdmin } from "@/lib/supabase/server";

async function getArticleQueue(): Promise<ArticleQueueItem[]> {
  try {
    const sb = createSupabaseAdmin();
    const { data, error } = await sb
      .from("article_queue")
      .select("*")
      .order("priority", { ascending: true })
      .order("created_at", { ascending: true });
    if (error) throw error;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data ?? []).map((row: any) => ({
      id:               row.id,
      slug:             row.slug,
      title:            row.title,
      excerpt:          row.excerpt ?? "",
      category:         row.category,
      tag:              row.tag ?? null,
      readTime:         row.read_time ?? "5 min",
      targetKeyword:    row.target_keyword ?? "",
      secondaryKeywords: row.secondary_keywords ?? [],
      targetWordCount:  row.target_word_count,
      wordCountNote:    row.word_count_note,
      status:           row.status,
      priority:         row.priority,
      sanityId:         row.sanity_id ?? null,
      publishedAt:      row.published_at ?? null,
      lastSeoCheck:     row.last_seo_check ?? null,
      seoPosition:      row.seo_position ?? null,
      searchVolume:     row.search_volume,
      competitionLevel: row.competition_level,
      seoScore:         row.seo_score,
      createdAt:        row.created_at,
    })) as ArticleQueueItem[];
  } catch {
    return [];
  }
}
```

Supprimer `import { readFile } from "fs/promises"` et `import path from "path"` si plus utilisés.

- [ ] **Step 2 : Modifier `actions.ts` — remplacer deleteFromQueue() et triggerPublish()**

```typescript
"use server";

import { revalidatePath } from "next/cache";
import { spawn } from "child_process";
import path from "path";
import { createSupabaseAdmin } from "@/lib/supabase/server";

export async function deleteFromQueue(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const sb = createSupabaseAdmin();
    const { error } = await sb.from("article_queue").delete().eq("id", id);
    if (error) return { success: false, error: error.message };
    revalidatePath("/admin/blog");
    return { success: true };
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
}

export async function triggerPublish(slug: string): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const sb = createSupabaseAdmin();
    const { error } = await sb
      .from("article_queue")
      .update({ status: "writing" })
      .eq("slug", slug);
    if (error) return { success: false, error: error.message };
    revalidatePath("/admin/blog");

    const agentPath = path.resolve(process.cwd(), "scripts/agents/blog-writer-agent.ts");
    const child = spawn("npx", ["tsx", agentPath, slug], {
      detached: true,
      stdio: "ignore",
      env: { ...process.env },
    });
    child.unref();

    return { success: true, message: `Agent démarré pour "${slug}"` };
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
}
```

- [ ] **Step 3 : TypeScript check**

```bash
npx tsc --noEmit 2>&1 | grep -v node_modules
```

Expected: no errors.

- [ ] **Step 4 : Commit**

```bash
git add src/app/admin/(protected)/blog/page.tsx src/app/admin/(protected)/blog/actions.ts
git commit -m "feat(admin): migrate blog queue display + actions to Supabase"
```

---

### Task 12 : Ajouter Agent Runs dans le dashboard admin

**Files:**
- Modify: `src/app/admin/(protected)/blog/page.tsx`
- Modify: `src/app/admin/(protected)/blog/_components/AgentPanel.tsx`

Afficher les 10 derniers runs de chaque agent dans l'AgentPanel existant.

- [ ] **Step 1 : Ajouter getAgentRuns() dans page.tsx**

```typescript
interface AgentRunRow {
  id: string;
  agentName: string;
  startedAt: string;
  finishedAt: string | null;
  status: "running" | "success" | "error";
  itemsProcessed: number;
  itemsCreated: number;
  errorMessage: string | null;
}

async function getRecentAgentRuns(): Promise<AgentRunRow[]> {
  try {
    const sb = createSupabaseAdmin();
    const { data, error } = await sb
      .from("agent_runs")
      .select("*")
      .order("started_at", { ascending: false })
      .limit(50);
    if (error) return [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data ?? []).map((r: any) => ({
      id:             r.id,
      agentName:      r.agent_name,
      startedAt:      r.started_at,
      finishedAt:     r.finished_at ?? null,
      status:         r.status,
      itemsProcessed: r.items_processed ?? 0,
      itemsCreated:   r.items_created ?? 0,
      errorMessage:   r.error_message ?? null,
    }));
  } catch {
    return [];
  }
}
```

- [ ] **Step 2 : Passer les runs à AgentPanel**

Dans `page.tsx`, appeler `getRecentAgentRuns()` et passer les données à `<AgentPanel runs={agentRuns} />`.

Dans `AgentPanel.tsx`, ajouter une prop `runs?: AgentRunRow[]` et afficher pour chaque agent une ligne "Dernier run : X items, il y a Y min" avec un point vert/rouge selon le status.

- [ ] **Step 3 : Commit**

```bash
git add src/app/admin/(protected)/blog/page.tsx src/app/admin/(protected)/blog/_components/AgentPanel.tsx
git commit -m "feat(admin): show agent_runs history in blog dashboard"
```

---

### Task 13 : Nettoyage final

**Files:**
- Keep (archiver): `scripts/data/article-queue.json` — ne pas supprimer, garder comme backup
- Verify: aucun agent n'importe plus `fs/promises` pour la queue

- [ ] **Step 1 : Vérifier qu'aucun agent n'utilise encore QUEUE_FILE**

```bash
grep -rn "QUEUE_FILE\|article-queue.json\|readQueue\|updateQueue" scripts/agents/ --include="*.ts"
```

Expected: no matches.

- [ ] **Step 2 : Ajouter un commentaire dans article-queue.json**

Renommer en `article-queue.json.bak` ou ajouter une note dans le README pour indiquer que c'est le backup pre-migration.

- [ ] **Step 3 : TypeScript check final**

```bash
npx tsc --noEmit 2>&1 | grep -v node_modules
```

Expected: no errors.

- [ ] **Step 4 : Commit final**

```bash
git add -A
git commit -m "chore: finalize queue Supabase migration, archive JSON backup"
```

---

## Résumé des fichiers

| Fichier | Action |
|---|---|
| `supabase/migrations/20260330000001_article_queue.sql` | CREATE |
| `scripts/lib/queue.ts` | CREATE — client Supabase partagé |
| `scripts/lib/agent-runs.ts` | CREATE — audit trail |
| `scripts/seed-queue.ts` | CREATE — migration one-shot |
| `scripts/agents/blog-writer-agent.ts` | MODIFY — atomic claim |
| `scripts/agents/keyword-researcher.ts` | MODIFY |
| `scripts/agents/queue-builder-monthly.ts` | MODIFY + MAX=12 |
| `scripts/agents/seo-checker.ts` | MODIFY |
| `scripts/agents/article-optimizer-quarterly.ts` | MODIFY |
| `scripts/agents/link-optimizer-monthly.ts` | MODIFY |
| `src/app/admin/(protected)/blog/page.tsx` | MODIFY |
| `src/app/admin/(protected)/blog/actions.ts` | MODIFY |
| `src/app/admin/(protected)/blog/_components/AgentPanel.tsx` | MODIFY |
