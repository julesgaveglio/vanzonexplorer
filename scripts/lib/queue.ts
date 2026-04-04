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

import { getSupabaseClient } from "./supabase";
import type { ArticleQueueItem, ArticleStatus } from "../../src/types/article-queue";

// Re-export for consumers that import from this module
export type { ArticleQueueItem, ArticleStatus } from "../../src/types/article-queue";

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
    lastLinkCheck:    row.last_link_check ?? null,
    pillarSlug:       row.pillar_slug ?? undefined,
    clusterTopic:     row.cluster_topic ?? undefined,
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
  if (item.lastLinkCheck    !== undefined) row.last_link_check   = item.lastLinkCheck;
  if (item.pillarSlug       !== undefined) row.pillar_slug       = item.pillarSlug;
  if (item.clusterTopic     !== undefined) row.cluster_topic     = item.clusterTopic;
  return row;
}

// ── Public API ────────────────────────────────────────────────────────────────

/** Récupère toute la queue, optionnellement filtrée par status. */
export async function getQueueItems(filter?: { status?: ArticleStatus }): Promise<ArticleQueueItem[]> {
  const sb = getSupabaseClient();
  let query = sb.from("article_queue").select("*").order("priority", { ascending: true }).order("created_at", { ascending: true });
  if (filter?.status) query = query.eq("status", filter.status);
  const { data, error } = await query;
  if (error) throw new Error(`getQueueItems: ${error.message}`);
  return (data ?? []).map(rowToItem);
}

/** Récupère un article par id/slug. */
export async function getQueueItem(id: string): Promise<ArticleQueueItem | null> {
  const sb = getSupabaseClient();
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
  const sb = getSupabaseClient();
  const { data, error } = await sb.rpc("claim_pending_article", { p_slug: slug ?? null });
  if (error) throw new Error(`claimPendingArticle: ${error.message}`);
  const rows = data as Record<string, unknown>[] | null;
  return rows && rows.length > 0 ? rowToItem(rows[0]) : null;
}

/** Met à jour des champs spécifiques d'un article. */
export async function updateQueueItem(id: string, updates: Partial<ArticleQueueItem>): Promise<void> {
  const sb = getSupabaseClient();
  const row = itemToRow(updates);
  if (Object.keys(row).length === 0) return;
  const { error } = await sb.from("article_queue").update(row).eq("id", id);
  if (error) throw new Error(`updateQueueItem(${id}): ${error.message}`);
}

/** Insère un nouvel article (ignore si id déjà présent). */
export async function insertQueueItem(item: ArticleQueueItem): Promise<{ inserted: boolean }> {
  const sb = getSupabaseClient();
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
  const sb = getSupabaseClient();
  const { error } = await sb.from("article_queue").delete().eq("id", id);
  if (error) throw new Error(`deleteQueueItem(${id}): ${error.message}`);
}

/** Vérifie si un article existe déjà (par id ou keyword). */
export async function itemExists(opts: { id?: string; targetKeyword?: string }): Promise<boolean> {
  const sb = getSupabaseClient();
  let query = sb.from("article_queue").select("id", { count: "exact", head: true });
  if (opts.id)            query = query.eq("id", opts.id);
  else if (opts.targetKeyword) query = query.ilike("target_keyword", opts.targetKeyword);
  else return false;
  const { count, error } = await query;
  if (error) throw new Error(`itemExists: ${error.message}`);
  return (count ?? 0) > 0;
}
