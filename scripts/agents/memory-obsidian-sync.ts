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
  id:            string;
  category:      string;
  obsidian_file: string;
  title:         string;
  content:       string;
  tags:          string[];
  created_at:    string;
}): Promise<void> {
  // category = dossier, obsidian_file = nom du fichier seul
  const fileDir  = path.join(OBSIDIAN_ROOT, note.category);
  const filePath = path.join(fileDir, note.obsidian_file);

  fs.mkdirSync(fileDir, { recursive: true });

  const appendBlock = buildAppendBlock(note);

  if (fs.existsSync(filePath)) {
    fs.appendFileSync(filePath, appendBlock, "utf-8");
  } else {
    const header = buildNewFileHeader(note.title, formatDate(note.created_at));
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
