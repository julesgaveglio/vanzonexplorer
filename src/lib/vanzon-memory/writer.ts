// src/lib/vanzon-memory/writer.ts
// Sauvegarde une note mémoire dans Supabase + GitHub (Obsidian).
// Appelé depuis router.ts après confirmation Telegram.

import { createSupabaseAdmin } from "@/lib/supabase/server";
import { writeNoteToGitHub } from "./github-writer";
import type { MemorySavePayload } from "./types";

export async function saveMemoryNote(payload: MemorySavePayload): Promise<void> {
  const supabase = createSupabaseAdmin();
  const now = new Date().toISOString();

  // 1. Supabase
  const { error } = await supabase.from("vanzon_memory").insert({
    category:      payload.category,
    obsidian_file: payload.obsidian_file,
    title:         payload.title,
    content:       payload.content,
    transcript:    payload.transcript,
    source:        "telegram_voice",
    tags:          payload.tags,
    obsidian_synced_at: now, // Marqué comme synché car on écrit direct dans GitHub
  });

  if (error) {
    throw new Error(`[memory writer] Supabase insert failed: ${error.message}`);
  }

  // 2. GitHub → Obsidian (non-bloquant, on ne fait pas échouer si GitHub fail)
  try {
    await writeNoteToGitHub({
      category:      payload.category,
      obsidian_file: payload.obsidian_file,
      title:         payload.title,
      content:       payload.content,
      transcript:    payload.transcript,
      tags:          payload.tags,
      created_at:    now,
    });
  } catch (err) {
    console.error("[memory writer] GitHub write failed (note saved in Supabase):", err);
  }
}
