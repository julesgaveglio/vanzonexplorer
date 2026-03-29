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

    // Spawn agent process (detached — fire and forget)
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
