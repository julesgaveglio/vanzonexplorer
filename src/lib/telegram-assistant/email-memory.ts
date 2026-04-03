// src/lib/telegram-assistant/email-memory.ts
// Mémoire few-shot des emails approuvés par Jules.
// Chaque email confirmé est sauvegardé et réinjecté comme exemple dans les futures générations.

import { createSupabaseAdmin } from "@/lib/supabase/server";

export interface EmailMemoryExample {
  action_type: string;
  context:     Record<string, string>;
  subject:     string;
  body:        string;
  message_id?: string; // Pour déduplication (cron only)
  source?:     string; // "telegram" | "gmail_sent"
}

/**
 * Sauvegarde un email approuvé dans la mémoire few-shot.
 * Opération best-effort : les erreurs sont loggées mais n'interrompent pas le flow.
 */
export async function saveEmailToMemory(example: EmailMemoryExample): Promise<void> {
  try {
    const supabase = createSupabaseAdmin();
    await supabase.from("telegram_email_memory").insert({
      action_type: example.action_type,
      context:     example.context,
      subject:     example.subject,
      body:        example.body,
      ...(example.message_id ? { message_id: example.message_id } : {}),
      source:      example.source ?? "telegram",
    });
  } catch (err) {
    console.error("[email-memory] saveEmailToMemory error:", err);
  }
}

/**
 * Récupère les N derniers exemples approuvés par type d'action.
 */
export async function getEmailExamples(
  actionType: string,
  limit = 3
): Promise<EmailMemoryExample[]> {
  try {
    const supabase = createSupabaseAdmin();
    const { data, error } = await supabase
      .from("telegram_email_memory")
      .select("action_type, context, subject, body")
      .eq("action_type", actionType)
      .order("approved_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data ?? []) as EmailMemoryExample[];
  } catch (err) {
    console.error("[email-memory] getEmailExamples error:", err);
    return [];
  }
}

/**
 * Formate les exemples pour injection dans un system prompt Groq.
 */
export function formatExamplesForPrompt(examples: EmailMemoryExample[]): string {
  if (examples.length === 0) return "";

  const lines = examples.map((ex, i) => {
    const ctx = Object.entries(ex.context)
      .map(([k, v]) => `${k}=${v}`)
      .join(", ");
    return `--- Exemple ${i + 1} (${ctx}) ---\nSujet : ${ex.subject}\n${ex.body}`;
  });

  return `\n\nExemples d'emails approuvés par Jules :\n\n${lines.join("\n\n")}`;
}
