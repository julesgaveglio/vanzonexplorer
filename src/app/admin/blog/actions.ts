"use server";

import { readFile, writeFile } from "fs/promises";
import path from "path";
import { revalidatePath } from "next/cache";
import { spawn } from "child_process";

const QUEUE_FILE = path.resolve(process.cwd(), "scripts/data/article-queue.json");

interface ArticleQueueItem {
  id: string;
  slug: string;
  status: string;
  [key: string]: unknown;
}

export async function deleteFromQueue(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const raw = await readFile(QUEUE_FILE, "utf-8");
    const queue: ArticleQueueItem[] = JSON.parse(raw);
    const filtered = queue.filter((a) => a.id !== id);
    if (filtered.length === queue.length) {
      return { success: false, error: "Article non trouvé" };
    }
    await writeFile(QUEUE_FILE, JSON.stringify(filtered, null, 2), "utf-8");
    revalidatePath("/admin/blog");
    return { success: true };
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
}

export async function triggerPublish(slug: string): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    // Set status to "writing" immediately
    const raw = await readFile(QUEUE_FILE, "utf-8");
    const queue: ArticleQueueItem[] = JSON.parse(raw);
    const article = queue.find((a) => a.slug === slug);
    if (!article) {
      return { success: false, error: "Article non trouvé dans la queue" };
    }
    article.status = "writing";
    await writeFile(QUEUE_FILE, JSON.stringify(queue, null, 2), "utf-8");
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
