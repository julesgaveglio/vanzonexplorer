#!/usr/bin/env tsx
/**
 * strategic-review-daily.ts — Agent Review Stratégique Quotidien
 * Usage: npx tsx scripts/agents/strategic-review-daily.ts
 * Cron: Tous les jours à 7h Paris (5h UTC)
 *
 * Pipeline :
 *   1. Collecte contexte (git log 24h, stats Supabase, état projet)
 *   2. Lit les tâches Todoist actuelles du projet Vanzon Explorer
 *   3. Envoie tout à Groq → analyse + 5 nouvelles tâches priorisées
 *   4. Nettoie les vieilles tâches Todoist, crée les nouvelles
 *   5. Notification Telegram récap
 */

import { createClient } from "@supabase/supabase-js";
import Groq from "groq-sdk";
import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import { notifyTelegram } from "../lib/telegram";

// ── Config ─────────────────────────────────────────────────────────────────────
const TODOIST_API_BASE = "https://api.todoist.com/api/v1";
const TODOIST_PROJECT_NAME = "Vanzon Explorer";
const MAX_TASKS = 5;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function log(msg: string) {
  console.log(`[${new Date().toISOString()}] ${msg}`);
}

// ── Groq helper avec multi-key fallback ────────────────────────────────────────
function getGroqClient(): Groq {
  const keys = [
    process.env.GROQ_API_KEY,
    process.env.GROQ_API_KEY_2,
    process.env.GROQ_API_KEY_3,
  ].filter(Boolean) as string[];
  const key = keys[Math.floor(Math.random() * keys.length)];
  return new Groq({ apiKey: key });
}

// ── Todoist API helpers ────────────────────────────────────────────────────────
const todoistHeaders = () => ({
  Authorization: `Bearer ${process.env.TODOIST_API_KEY}`,
  "Content-Type": "application/json",
});

interface TodoistProject {
  id: string;
  name: string;
}

interface TodoistTask {
  id: string;
  content: string;
  description: string;
  priority: number;
  due: { date: string; string: string } | null;
  created_at: string;
  is_completed: boolean;
}

async function todoistGet<T>(endpoint: string): Promise<T> {
  const resp = await fetch(`${TODOIST_API_BASE}${endpoint}`, {
    headers: todoistHeaders(),
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Todoist GET ${endpoint}: ${resp.status} ${text}`);
  }
  return resp.json();
}

async function todoistPost<T>(endpoint: string, body: Record<string, unknown>): Promise<T> {
  const resp = await fetch(`${TODOIST_API_BASE}${endpoint}`, {
    method: "POST",
    headers: todoistHeaders(),
    body: JSON.stringify(body),
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Todoist POST ${endpoint}: ${resp.status} ${text}`);
  }
  return resp.json();
}

async function todoistDelete(endpoint: string): Promise<void> {
  const resp = await fetch(`${TODOIST_API_BASE}${endpoint}`, {
    method: "DELETE",
    headers: todoistHeaders(),
  });
  if (!resp.ok && resp.status !== 204) {
    const text = await resp.text();
    throw new Error(`Todoist DELETE ${endpoint}: ${resp.status} ${text}`);
  }
}

// ── Phase 1 : Collecte de contexte ─────────────────────────────────────────────
async function collectContext(): Promise<string> {
  log("Phase 1 : Collecte de contexte...");

  // 1a. Git log dernières 24h
  let gitLog = "Aucun commit récent";
  try {
    gitLog = execSync(
      'git log --since="24 hours ago" --oneline --no-decorate',
      { encoding: "utf-8", timeout: 10000 }
    ).trim();
    if (!gitLog) gitLog = "Aucun commit dans les dernières 24h";
  } catch {
    gitLog = "Erreur lecture git log";
  }

  // 1b. Stats Supabase
  const stats: Record<string, number | string> = {};

  const { count: articlesCount } = await supabase
    .from("article_queue")
    .select("*", { count: "exact", head: true })
    .eq("status", "published");
  stats.articles_publiés = articlesCount ?? 0;

  const { count: backlinkProspects } = await supabase
    .from("backlink_prospects")
    .select("*", { count: "exact", head: true });
  stats.backlink_prospects_total = backlinkProspects ?? 0;

  const { count: backlinkContacted } = await supabase
    .from("backlink_prospects")
    .select("*", { count: "exact", head: true })
    .eq("status", "contacté");
  stats.backlink_contactés = backlinkContacted ?? 0;

  const { count: backlinkObtained } = await supabase
    .from("backlink_prospects")
    .select("*", { count: "exact", head: true })
    .eq("status", "obtenu");
  stats.backlink_obtenus = backlinkObtained ?? 0;

  const { count: marketplaceLeads } = await supabase
    .from("marketplace_leads")
    .select("*", { count: "exact", head: true });
  stats.marketplace_leads = marketplaceLeads ?? 0;

  const { count: clubMembers } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("plan", "club_member");
  stats.club_membres = clubMembers ?? 0;

  const { count: roadTrips } = await supabase
    .from("road_trip_requests")
    .select("*", { count: "exact", head: true });
  stats.road_trips_générés = roadTrips ?? 0;

  // 1c. État du projet
  let etatProjet = "";
  const etatPath = path.resolve(
    __dirname,
    "../../Vanzon Memory Database/🔒 INTERNE/strategie/📊 État du Projet — Avril 2026.md"
  );
  try {
    etatProjet = fs.readFileSync(etatPath, "utf-8");
  } catch {
    etatProjet = "Fichier état projet non trouvé";
  }

  const statsStr = Object.entries(stats)
    .map(([k, v]) => `- ${k}: ${v}`)
    .join("\n");

  return `## Commits dernières 24h
${gitLog}

## Stats Supabase (temps réel)
${statsStr}

## État du Projet
${etatProjet}`;
}

// ── Phase 2 : Todoist — get/create project ─────────────────────────────────────
async function getOrCreateProject(): Promise<string> {
  log("Phase 2 : Connexion Todoist...");

  const data = await todoistGet<{ results: TodoistProject[] }>("/projects");
  const existing = data.results.find(
    (p) => p.name === TODOIST_PROJECT_NAME
  );

  if (existing) {
    log(`Projet Todoist trouvé : ${existing.id}`);
    return existing.id;
  }

  const created = await todoistPost<TodoistProject>("/projects", {
    name: TODOIST_PROJECT_NAME,
    color: "blue",
  });
  log(`Projet Todoist créé : ${created.id}`);
  return created.id;
}

async function getProjectTasks(projectId: string): Promise<TodoistTask[]> {
  const data = await todoistGet<{ results: TodoistTask[] }>(
    `/tasks?project_id=${projectId}`
  );
  return data.results;
}

// ── Phase 3 : Groq Strategic Analysis ──────────────────────────────────────────
interface GroqTaskRecommendation {
  content: string;
  description: string;
  priority: number; // 1-4 (4 = urgent)
  due_string: string;
}

interface GroqAnalysis {
  review: string;
  tasks_to_delete: string[]; // task IDs to remove
  new_tasks: GroqTaskRecommendation[];
}

async function analyzeWithGroq(
  context: string,
  currentTasks: TodoistTask[]
): Promise<GroqAnalysis> {
  log("Phase 3 : Analyse Groq...");

  const tasksStr = currentTasks.length > 0
    ? currentTasks
        .map(
          (t) =>
            `- [ID:${t.id}] ${t.content} (priorité:${t.priority}, due:${t.due?.date ?? "aucune"}, créé:${t.created_at})`
        )
        .join("\n")
    : "Aucune tâche existante";

  const today = new Date().toISOString().split("T")[0];

  const prompt = `Tu es le Directeur Stratégique de Vanzon Explorer — un conseiller brutal et honnête.

OBJECTIF GLOBAL : 2 000€/mois net → expatriation Thaïlande fin 2027.

DATE DU JOUR : ${today}

CONTEXTE ACTUEL :
${context}

TÂCHES TODOIST EXISTANTES :
${tasksStr}

MISSION :
1. Fais une review de 3-5 lignes de ce qui a avancé (ou pas) dans les dernières 24h.
2. Parmi les tâches existantes, identifie celles qui sont obsolètes, terminées, ou plus pertinentes. Donne leurs IDs dans tasks_to_delete.
3. Crée exactement ${MAX_TASKS} nouvelles tâches pour AUJOURD'HUI et les prochains jours, ordonnées par impact réel sur l'objectif 2000€/mois.

RÈGLES POUR LES TÂCHES :
- Chaque tâche doit être ACTIONNABLE et CONCRÈTE (pas "réfléchir à", mais "faire X")
- Priorité Todoist : 4=urgent, 3=haute, 2=normale, 1=basse
- due_string en langage naturel : "today", "tomorrow", "monday", etc.
- La description contient le POURQUOI et le COMMENT (2-3 lignes max)
- Ne PAS créer de tâches liées à Mario/formation (contrat non signé, on n'y touche pas)
- Focus : marketplace, SEO, backlinks, optimisation revenus location, Club

RÉPONDS UNIQUEMENT en JSON valide, sans markdown :
{
  "review": "...",
  "tasks_to_delete": ["id1", "id2"],
  "new_tasks": [
    {
      "content": "Titre tâche",
      "description": "Pourquoi + comment",
      "priority": 4,
      "due_string": "today"
    }
  ]
}`;

  const groq = getGroqClient();
  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.3,
    max_tokens: 2000,
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";

  // Extract JSON from response (handle potential markdown wrapping)
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error(`Groq n'a pas retourné de JSON valide: ${raw.slice(0, 200)}`);

  return JSON.parse(jsonMatch[0]) as GroqAnalysis;
}

// ── Phase 4 : Appliquer les changements Todoist ────────────────────────────────
async function applyTodoistChanges(
  projectId: string,
  analysis: GroqAnalysis
): Promise<{ deleted: number; created: number }> {
  log("Phase 4 : Mise à jour Todoist...");

  // 4a. Supprimer les tâches obsolètes
  let deleted = 0;
  for (const taskId of analysis.tasks_to_delete) {
    try {
      await todoistDelete(`/tasks/${taskId}`);
      deleted++;
      log(`  Tâche supprimée : ${taskId}`);
    } catch (err) {
      log(`  Erreur suppression ${taskId}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  // 4b. Créer les nouvelles tâches
  let created = 0;
  for (const task of analysis.new_tasks) {
    try {
      await todoistPost("/tasks", {
        content: task.content,
        description: task.description,
        project_id: projectId,
        priority: task.priority,
        due_string: task.due_string,
      });
      created++;
      log(`  Tâche créée : ${task.content}`);
    } catch (err) {
      log(`  Erreur création tâche: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return { deleted, created };
}

// ── Phase 5 : Notification Telegram ────────────────────────────────────────────
function buildTelegramRecap(
  analysis: GroqAnalysis,
  stats: { deleted: number; created: number }
): string {
  const tasksList = analysis.new_tasks
    .map((t, i) => {
      const prioMap: Record<number, string> = { 4: "[!!!]", 3: "[!!]", 2: "[!]", 1: "[-]" };
      const prio = prioMap[t.priority] ?? "[-]";
      return `${i + 1}. ${prio} ${t.content} (${t.due_string})`;
    })
    .join("\n");

  return `<b>Strategic Review - ${new Date().toLocaleDateString("fr-FR")}</b>

<b>Review :</b>
${analysis.review}

<b>Todoist :</b>
${stats.deleted} taches supprimees
${stats.created} nouvelles taches

<b>Priorites du jour :</b>
${tasksList}`;
}

// ── Main ───────────────────────────────────────────────────────────────────────
async function main() {
  log("=== Strategic Review Daily — Démarrage ===");

  if (!process.env.TODOIST_API_KEY) {
    throw new Error("TODOIST_API_KEY manquante");
  }

  // Phase 1: Collecter le contexte
  const context = await collectContext();
  log(`Contexte collecté (${context.length} chars)`);

  // Phase 2: Todoist project + existing tasks
  const projectId = await getOrCreateProject();
  const currentTasks = await getProjectTasks(projectId);
  log(`${currentTasks.length} tâches existantes dans Todoist`);

  // Phase 3: Groq analysis
  const analysis = await analyzeWithGroq(context, currentTasks);
  log(`Groq : ${analysis.tasks_to_delete.length} à supprimer, ${analysis.new_tasks.length} à créer`);

  // Phase 4: Apply changes
  const stats = await applyTodoistChanges(projectId, analysis);

  // Phase 5: Telegram notification
  const recap = buildTelegramRecap(analysis, stats);
  await notifyTelegram(recap);

  log("=== Strategic Review Daily — Terminé ===");
}

main().catch((err) => {
  console.error("Erreur fatale:", err);
  notifyTelegram(`❌ Strategic Review Daily échoué : ${err instanceof Error ? err.message : String(err)}`)
    .finally(() => process.exit(1));
});
