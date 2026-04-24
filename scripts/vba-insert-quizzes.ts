/**
 * VBA — Insert quiz lessons into Supabase
 *
 * Usage: npx tsx scripts/vba-insert-quizzes.ts
 *
 * Reads quiz markdown files from the Vanzon Memory Database,
 * parses questions, and inserts them as lessons in vba_lessons.
 */

import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";
import { config } from "dotenv";

// Load .env.local
config({ path: path.resolve(__dirname, "../.env.local") });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const QUIZ_DIR =
  "/Users/julesgaveglio/vanzon-website-claude-code/Vanzon Memory Database/🔒 INTERNE/formation/Van Business Academy/Quiz";

// ── Types ──────────────────────────────────────────────────────────────────

interface QuizQuestion {
  question: string;
  options: string[];
  correct: number[];
}

// ── Parsing ────────────────────────────────────────────────────────────────

function parseQuizFile(content: string): QuizQuestion[] {
  const questions: QuizQuestion[] = [];

  // Split by ## Q... or ## Question... to get each question block
  const blocks = content.split(/## (?:Q\d+[\.\s]|Question\s*\d+)/);

  for (const block of blocks) {
    if (!block.trim()) continue;

    const lines = block.split("\n").filter((l) => l.trim());

    // First non-empty line is the question text (may start with "— Title\n**question**" or just "question")
    let questionText = "";
    for (const line of lines) {
      const trimmed = line.replace(/^\*\*/, "").replace(/\*\*$/, "").trim();
      if (trimmed && !trimmed.startsWith("-") && !trimmed.startsWith("**R") && trimmed.length > 10) {
        questionText = trimmed;
        break;
      }
    }
    if (!questionText) continue;

    // Extract options: lines matching A), B), C), D), E) with optional "- " prefix
    const options: string[] = [];
    const optionRegex = /^[-\s]*([A-E])\)\s*(.+)/;

    for (const line of lines) {
      const match = line.trim().match(optionRegex);
      if (match) {
        options.push(match[2].trim());
      }
    }

    if (options.length === 0) continue;

    // Extract the answer line: **Réponse : X** or **Reponse : A, B, C**
    const answerLine = lines.find((l) => /\*\*R[eé]ponse/i.test(l));
    if (!answerLine) continue;

    // Parse correct answers from the answer line
    // Match letters A-E after "Réponse :" or "Reponse :"
    const answerMatch = answerLine.match(/R[eé]ponse\s*:\s*([A-E](?:\s*,\s*[A-E])*)/i);
    if (!answerMatch) continue;

    const letterToIndex: Record<string, number> = {
      A: 0,
      B: 1,
      C: 2,
      D: 3,
      E: 4,
    };

    const correctLetters = answerMatch[1].split(",").map((s) => s.trim());
    const correct = correctLetters
      .map((letter) => letterToIndex[letter])
      .filter((idx) => idx !== undefined);

    questions.push({
      question: questionText,
      options,
      correct,
    });
  }

  return questions;
}

function extractModuleNumber(filename: string): number | null {
  const match = filename.match(/Module\s*(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

// ── Main ───────────────────────────────────────────────────────────────────

async function main() {
  console.log("🧩 VBA Quiz Insert — Starting\n");

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("❌ Missing SUPABASE env vars");
    process.exit(1);
  }

  // Read quiz files
  const quizFiles = fs
    .readdirSync(QUIZ_DIR)
    .filter((f) => f.endsWith(".md"))
    .sort();

  console.log(`📂 Found ${quizFiles.length} quiz files\n`);

  // Fetch all modules
  const { data: modules, error: modError } = await supabase
    .from("vba_modules")
    .select("id, title, order")
    .order("order");

  if (modError || !modules) {
    console.error("❌ Failed to fetch modules:", modError);
    process.exit(1);
  }

  console.log(`📦 Found ${modules.length} modules in Supabase\n`);

  let inserted = 0;
  let skipped = 0;

  for (const filename of quizFiles) {
    const moduleNum = extractModuleNumber(filename);
    if (moduleNum === null) {
      console.log(`⚠️  Skipping ${filename} — cannot extract module number`);
      skipped++;
      continue;
    }

    // Find matching module by order
    const module = modules.find((m) => m.order === moduleNum);
    if (!module) {
      console.log(`⚠️  Skipping ${filename} — no module with order=${moduleNum}`);
      skipped++;
      continue;
    }

    console.log(`── ${filename}`);
    console.log(`   → Module: ${module.title} (order=${module.order})`);

    // Parse quiz
    const content = fs.readFileSync(path.join(QUIZ_DIR, filename), "utf-8");
    const questions = parseQuizFile(content);

    if (questions.length === 0) {
      console.log(`   ⚠️  No questions parsed — skipping`);
      skipped++;
      continue;
    }

    console.log(`   📝 Parsed ${questions.length} questions`);

    // Get max order of existing lessons in this module
    const { data: existingLessons, error: lessonsError } = await supabase
      .from("vba_lessons")
      .select("order, slug")
      .eq("module_id", module.id)
      .order("order", { ascending: false })
      .limit(1);

    if (lessonsError) {
      console.error(`   ❌ Failed to fetch lessons:`, lessonsError);
      continue;
    }

    // Check if quiz already exists
    const { data: existingQuiz } = await supabase
      .from("vba_lessons")
      .select("id")
      .eq("module_id", module.id)
      .eq("slug", "quiz")
      .limit(1);

    if (existingQuiz && existingQuiz.length > 0) {
      console.log(`   ⏭️  Quiz already exists for this module — skipping`);
      skipped++;
      continue;
    }

    const maxOrder = existingLessons?.[0]?.order ?? 0;
    const newOrder = maxOrder + 1;

    // Build description with QUIZ: prefix + JSON
    const description = "QUIZ:" + JSON.stringify(questions);

    // Insert lesson
    const { error: insertError } = await supabase.from("vba_lessons").insert({
      module_id: module.id,
      title: "Quiz",
      slug: "quiz",
      bunny_video_id: null,
      bunny_library_id: null,
      description,
      order: newOrder,
      is_published: true,
    });

    if (insertError) {
      console.error(`   ❌ Insert error:`, insertError);
      continue;
    }

    console.log(`   ✅ Inserted quiz as lesson #${newOrder}`);
    inserted++;
  }

  console.log(`\n🎉 Done! Inserted: ${inserted}, Skipped: ${skipped}`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
