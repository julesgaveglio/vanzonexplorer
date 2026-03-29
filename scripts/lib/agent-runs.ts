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
