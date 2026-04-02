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
