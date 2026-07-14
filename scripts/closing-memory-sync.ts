#!/usr/bin/env tsx
/**
 * closing-memory-sync.ts
 *
 * Pont entre la source de vérité (table Supabase `closing_analyses`, alimentée par
 * l'app Closer Coach) et la mémoire Obsidian (`Vanzon Memory Database`).
 * Vercel ne peut pas écrire dans le vault local → ce script le matérialise en local.
 *
 * Deux sens :
 *   EXPORT  Supabase → Obsidian : (ré)génère un dossier par prospect
 *           (📝 Transcript brut / 📋 Résumé / 🎯 Axes d'amélioration) + l'index.
 *   IMPORT  Obsidian → Supabase : lit les anciens transcrits téléchargés dans le
 *           vault, les analyse via Claude (analyzeClosingTranscript) et les insère
 *           en base → ils apparaissent alors dans l'historique de l'app.
 *
 * Usage :
 *   npx tsx scripts/closing-memory-sync.ts            # import PUIS export (défaut)
 *   npx tsx scripts/closing-memory-sync.ts --export   # export seul
 *   npx tsx scripts/closing-memory-sync.ts --import    # import seul
 *   npx tsx scripts/closing-memory-sync.ts --dry-run   # n'écrit rien, log seulement
 *
 * Env requis : NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY (import).
 */

import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import fs from "fs";
import path from "path";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { analyzeClosingTranscript, transcriptHash } from "@/lib/closing/analyze";
import type { ClosingAnalysis, ClosingAnalysisRow, ClosingContext } from "@/types/closing-analysis";

const PROJECT_ROOT = path.resolve(path.dirname(__filename), "..");
const CALLS_DIR = path.join(
  PROJECT_ROOT,
  "Vanzon Memory Database",
  "🔒 INTERNE",
  "Van Business Academy",
  "Closing Calls",
);
const INDEX_FILE = path.join(CALLS_DIR, "📊 Index Closing Calls.md");

const T_START = "<!-- TRANSCRIPT:START -->";
const T_END = "<!-- TRANSCRIPT:END -->";

const args = process.argv.slice(2);
const DRY = args.includes("--dry-run");
const doExport = args.includes("--export") || (!args.includes("--import"));
const doImport = args.includes("--import") || (!args.includes("--export"));

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Nom de dossier sûr pour un système de fichiers (garde les accents, retire les / : etc.). */
function safeName(s: string): string {
  return s.replace(/[\\/:*?"<>|]/g, "-").replace(/\s+/g, " ").trim() || "Sans nom";
}

/** Lit une clé simple du frontmatter YAML (ex: date, prospect). */
function frontmatterValue(raw: string, key: string): string | null {
  const fm = raw.match(/^---\n([\s\S]*?)\n---/);
  if (!fm) return null;
  const m = fm[1].match(new RegExp(`^${key}\\s*:\\s*(.+)$`, "m"));
  return m ? m[1].trim().replace(/^["']|["']$/g, "") || null : null;
}

/** Récupère le transcript verbatim d'un fichier .md (marqueurs prioritaires, sinon nettoyage). */
function extractTranscript(raw: string): string {
  const s = raw.indexOf(T_START);
  const e = raw.indexOf(T_END);
  if (s !== -1 && e !== -1 && e > s) {
    return raw.slice(s + T_START.length, e).trim();
  }
  // Fichiers legacy sans marqueurs : retire le frontmatter puis les lignes markdown de structure.
  let text = raw;
  const fm = text.match(/^---\n[\s\S]*?\n---\n/);
  if (fm) text = text.slice(fm[0].length);
  return text
    .split("\n")
    .filter((l) => !/^\s*(#|>)/.test(l) && l.trim() !== "---")
    .join("\n")
    .trim();
}

/** Écrit un fichier (respecte --dry-run). */
function writeFile(file: string, content: string) {
  if (DRY) {
    console.log(`  [dry] écrirait ${path.relative(PROJECT_ROOT, file)} (${content.length} c.)`);
    return;
  }
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content, "utf8");
}

// ── EXPORT : Supabase → Obsidian ─────────────────────────────────────────────

function transcriptMd(row: ClosingAnalysisRow, prospect: string): string {
  const c = row.context;
  const fm = [
    "---",
    "type: closing-transcript",
    `prospect: ${prospect}`,
    `date: ${row.call_date ?? ""}`,
    `closer: ${row.closer ?? ""}`,
    `statut: ${row.statut ?? ""}`,
    c?.ville ? `localisation: ${c.ville}` : "",
    "source: closer-app",
    "tags:",
    "  - closing-call",
    "  - vba",
    "  - prospect",
    "---",
  ]
    .filter(Boolean)
    .join("\n");

  return `${fm}

# 📝 Transcript brut — ${prospect}

> Enregistré via Closer Coach. Le texte entre les marqueurs est la source ; ne pas l'éditer à la main.

${T_START}
${row.transcript.trim()}
${T_END}
`;
}

function resumeMd(row: ClosingAnalysisRow, prospect: string): string {
  const c: ClosingContext | null = row.context;
  const acq = c?.acquisition;
  const source = acq?.canal ? `${acq.canal}${acq.type && acq.type !== "inconnu" ? ` (${acq.type})` : ""}` : "inconnue";

  const fm = [
    "---",
    "type: closing-summary",
    `prospect: ${prospect}`,
    `date: ${row.call_date ?? ""}`,
    `closer: ${row.closer ?? "Jules"}`,
    `statut: ${row.statut ?? ""}`,
    c?.resultat ? `résultat: ${c.resultat.replace(/\n/g, " ")}` : "",
    c?.age ? `âge: ${c.age}` : "",
    c?.ville ? `localisation: ${[c.ville, c.region, c.pays].filter(Boolean).join(", ")}` : "",
    c?.metier ? `métier: ${c.metier}` : "",
    c?.budget_vehicule ? `budget_véhicule: ${c.budget_vehicule}` : "",
    c?.budget_amenagement ? `budget_aménagement: ${c.budget_amenagement}` : "",
    c?.offre_proposee ? `offre_proposée: ${c.offre_proposee}` : "",
    c?.montant ? `montant: ${c.montant}` : "",
    `source: ${source}`,
    c?.canal ? `canal_contact: ${c.canal}` : "",
    typeof row.score === "number" ? `score_closing: ${row.score}` : "",
    row.closing_call_id ? `closing_call_id: ${row.closing_call_id}` : "",
    "tags:",
    "  - closing-call",
    "  - vba",
    "  - prospect",
    "---",
  ]
    .filter(Boolean)
    .join("\n");

  const chips = (label: string, items?: string[] | null) =>
    items?.length ? `\n## ${label}\n\n${items.map((i) => `- ${i}`).join("\n")}\n` : "";

  const acqBlock = acq
    ? `\n## Provenance (attribution)\n\n- **Canal** : ${acq.canal ?? "Inconnu"}${acq.type && acq.type !== "inconnu" ? ` (${acq.type})` : ""}\n${acq.detail ? `- **Détail** : ${acq.detail}\n` : ""}${acq.indice ? `- **Indice transcript** : « ${acq.indice} »\n` : ""}`
    : "";

  return `${fm}

# 📋 Résumé closing — ${prospect}

> Analyse IA (Closer Coach) — ${row.call_date ?? ""} · Closer : ${row.closer ?? "Jules"}

## Données prospect

- **Profil** : ${[prospect, c?.age ? `${c.age} ans` : "", c?.metier].filter(Boolean).join(", ") || "—"}
- **Localisation** : ${[c?.ville, c?.region, c?.pays].filter(Boolean).join(", ") || "—"}
- **Situation** : ${c?.situation ?? "—"}
- **Projet** : ${c?.projet ?? "—"}${c?.objectif_business === true ? " (intention business)" : c?.objectif_business === false ? " (perso, pas business)" : ""}
- **Budget** : ${[c?.budget_vehicule ? `${c.budget_vehicule} véhicule` : "", c?.budget_amenagement ? `${c.budget_amenagement} aménagement` : ""].filter(Boolean).join(" + ") || "—"}
- **Résultat** : ${c?.resultat ?? row.statut ?? "—"}
${acqBlock}${c?.resume ? `\n## Synthèse\n\n${c.resume}\n` : ""}${chips("Objections", c?.objections)}${chips("Signaux d'achat", c?.signaux_achat)}${chips("Chiffres clés", c?.chiffres_cles)}${chips("Verbatims", c?.verbatims)}${chips("Prochaines étapes", c?.next_steps)}
## Liens

- Transcript : [[${prospect}/📝 Transcript brut]]
- Coaching : [[${prospect}/🎯 Axes d'amélioration]]
`;
}

function coachingMd(row: ClosingAnalysisRow, prospect: string): string {
  const a: ClosingAnalysis = row.analysis;
  const v = a?.verdict;

  const section = (title: string, body: string) => (body.trim() ? `\n## ${title}\n\n${body.trim()}\n` : "");

  const priorites = a?.priorites?.length
    ? a.priorites.map((p, i) => `${i + 1}. ${p}`).join("\n")
    : "";
  const criteres = a?.criteres?.length
    ? a.criteres.map((c) => `- **${c.nom}** — ${c.note}/10 · ${c.commentaire}`).join("\n")
    : "";
  const forts = a?.points_forts?.length
    ? a.points_forts.map((p) => `- ✅ **${p.point}**${p.extrait ? `\n  > « ${p.extrait} »` : ""}`).join("\n")
    : "";
  const faibles = a?.points_faibles?.length
    ? a.points_faibles
        .map((p) => `- ❌ **${p.point}**${p.extrait ? `\n  > « ${p.extrait} »` : ""}${p.impact ? `\n  Impact : ${p.impact}` : ""}`)
        .join("\n")
    : "";
  const occasions = a?.occasions_manquees?.length
    ? a.occasions_manquees
        .map((o) => `- **${o.moment}** — ${o.ce_qui_s_est_passe}\n  → Meilleur move : ${o.meilleur_move}${o.exemple_phrase ? `\n  À dire : « ${o.exemple_phrase} »` : ""}`)
        .join("\n")
    : "";
  const objections = a?.objections?.length
    ? a.objections
        .map((o) => `- **${o.objection}** (${o.note})\n  Ta réponse : ${o.ta_reponse}\n  Mieux : ${o.mieux}`)
        .join("\n")
    : "";
  const reformulations = a?.reformulations?.length
    ? a.reformulations
        .map((r) => `- ~~« ${r.tu_as_dit} »~~ → « ${r.dis_plutot} »${r.pourquoi ? ` _(${r.pourquoi})_` : ""}`)
        .join("\n")
    : "";
  const exercices = a?.exercices?.length ? a.exercices.map((e) => `- ${e}`).join("\n") : "";
  const ratio = a?.ratio_parole?.estimation
    ? `${a.ratio_parole.estimation} — ${a.ratio_parole.verdict ?? ""}`
    : "";

  const fm = [
    "---",
    "type: closing-coaching",
    `prospect: ${prospect}`,
    `date: ${row.call_date ?? ""}`,
    typeof row.score === "number" ? `score: ${row.score}` : "",
    v?.outcome ? `outcome: ${v.outcome}` : "",
    "tags:",
    "  - closing-call",
    "  - coaching",
    "---",
  ]
    .filter(Boolean)
    .join("\n");

  return `${fm}

# 🎯 Axes d'amélioration — ${prospect}

> ${v?.resume ?? ""} ${typeof row.score === "number" ? `**Score : ${row.score}/100**` : ""}
${section("Tes 3 priorités", priorites)}${section("Rubrique détaillée", criteres)}${section("Points forts", forts)}${section("Points faibles", faibles)}${section("Occasions manquées", occasions)}${section("Traitement des objections", objections)}${section("Reformulations", reformulations)}${section("Ratio de parole", ratio)}${section("Drills à travailler", exercices)}`;
}

function buildIndex(rows: ClosingAnalysisRow[], folderOf: Map<string, string>): string {
  const lines = rows.map((r) => {
    const prospect = r.prospect || "Sans nom";
    const folder = folderOf.get(r.id)!;
    const budget = r.context?.budget_vehicule ?? "—";
    const resultat = r.context?.resultat ?? r.statut ?? "—";
    const score = typeof r.score === "number" ? `${r.score}/100` : "—";
    return `| ${prospect} | ${r.call_date ?? "—"} | ${r.statut ?? "—"} | ${budget} | ${resultat} | ${score} | [[${folder}/📋 Résumé]] |`;
  });

  return `---
type: index
category: closing-calls
updated: ${new Date().toISOString().slice(0, 10)}
description: Base de données des appels de closing VBA — transcripts, résumés IA et axes d'amélioration (généré par closing-memory-sync)
---

# 📊 Index Closing Calls — Van Business Academy

Base centralisée de tous les appels de closing. Chaque prospect a son dossier :
- \`📝 Transcript brut.md\` — transcription complète de l'appel
- \`📋 Résumé.md\` — fiche prospect + analyse IA (profil, objections, provenance, next steps)
- \`🎯 Axes d'amélioration.md\` — coaching closing personnalisé

> ⚠️ Fichier généré automatiquement par \`scripts/closing-memory-sync.ts\`. La source de vérité est la table Supabase \`closing_analyses\` (alimentée par l'app Closer Coach). Ne pas éditer à la main.

## Appels

| Prospect | Date | Statut | Budget | Résultat | Score | Dossier |
|----------|------|--------|--------|----------|-------|---------|
${lines.join("\n")}

## Comment utiliser

- **Agent IA / Boss** : chercher ici pour retrouver le contexte d'un prospect, les objections fréquentes, les patterns de closing.
- **Patterns récurrents** : croiser les axes d'amélioration pour repérer les erreurs systémiques.
- **Suivi prospect** : statut + next steps de chaque appel.
`;
}

async function exportToVault(rows: ClosingAnalysisRow[]) {
  console.log(`\n📤 EXPORT — ${rows.length} appel(s) vers le vault Obsidian`);

  // Résout un dossier unique par ligne (gère les homonymes via la date).
  const byProspect = new Map<string, ClosingAnalysisRow[]>();
  for (const r of rows) {
    const key = safeName(r.prospect || "Sans nom");
    (byProspect.get(key) ?? byProspect.set(key, []).get(key)!).push(r);
  }
  const folderOf = new Map<string, string>();
  for (const [prospect, list] of byProspect) {
    list.forEach((r) => {
      folderOf.set(r.id, list.length > 1 ? `${prospect} (${r.call_date ?? r.id.slice(0, 6)})` : prospect);
    });
  }

  for (const r of rows) {
    const prospect = r.prospect || "Sans nom";
    const folder = path.join(CALLS_DIR, folderOf.get(r.id)!);
    writeFile(path.join(folder, "📝 Transcript brut.md"), transcriptMd(r, prospect));
    writeFile(path.join(folder, "📋 Résumé.md"), resumeMd(r, prospect));
    writeFile(path.join(folder, "🎯 Axes d'amélioration.md"), coachingMd(r, prospect));
    console.log(`  ✓ ${folderOf.get(r.id)}`);
  }

  writeFile(INDEX_FILE, buildIndex(rows, folderOf));
  console.log(`  ✓ Index régénéré (${rows.length} lignes)`);
}

// ── IMPORT : Obsidian → Supabase ─────────────────────────────────────────────

async function importFromVault(existingHashes: Set<string>) {
  console.log(`\n📥 IMPORT — scan des anciens transcrits dans le vault`);
  if (!fs.existsSync(CALLS_DIR)) {
    console.log("  (aucun dossier Closing Calls)");
    return;
  }

  // Cherche tous les fichiers "📝 Transcript brut.md" dans les sous-dossiers.
  const files: string[] = [];
  for (const entry of fs.readdirSync(CALLS_DIR, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const f = path.join(CALLS_DIR, entry.name, "📝 Transcript brut.md");
    if (fs.existsSync(f)) files.push(f);
  }
  console.log(`  ${files.length} transcript(s) trouvé(s)`);

  const supabase = createSupabaseAdmin();
  let imported = 0;

  for (const file of files) {
    const raw = fs.readFileSync(file, "utf8");
    const transcript = extractTranscript(raw);
    if (transcript.length < 80) {
      console.log(`  ⏭️  ${path.basename(path.dirname(file))} — trop court, ignoré`);
      continue;
    }
    const hash = transcriptHash(transcript);
    if (existingHashes.has(hash)) continue; // déjà en base (déjà analysé) → skip

    const folder = path.basename(path.dirname(file));
    // Nom : frontmatter `prospect:` en priorité, sinon nom du dossier (sans date entre parenthèses).
    const guessedName =
      frontmatterValue(raw, "prospect") || folder.replace(/\s*\([^)]*\)\s*$/, "").trim();
    // Date réelle de l'appel : frontmatter `date:` du fichier legacy, sinon aujourd'hui.
    const fmDate = frontmatterValue(raw, "date");
    const callDate = fmDate && /^\d{4}-\d{2}-\d{2}$/.test(fmDate) ? fmDate : new Date().toISOString().slice(0, 10);

    console.log(`  🔍 Analyse de « ${folder} »…`);
    if (DRY) {
      console.log("     [dry] analyse + insert sautés");
      continue;
    }

    try {
      const { analysis, context } = await analyzeClosingTranscript({
        transcript,
        prospect: guessedName || null,
        title: `Import vault — ${folder}`,
      });
      const score = typeof analysis?.verdict?.score === "number" ? Math.round(analysis.verdict.score) : null;
      const displayProspect =
        [context?.prenom, context?.nom].filter(Boolean).join(" ").trim() || guessedName || null;

      const { error } = await supabase.from("closing_analyses").insert({
        title: `Import vault — ${folder}`,
        prospect: displayProspect,
        closer: "Jules",
        call_date: callDate,
        ville: context?.ville ?? null,
        statut: context?.statut ?? analysis?.verdict?.outcome ?? null,
        transcript,
        transcript_hash: hash,
        analysis,
        context,
        score,
      });
      if (error) {
        console.log(`     ⚠️ insert échoué : ${error.message}`);
      } else {
        existingHashes.add(hash);
        imported++;
        console.log(`     ✓ importé (${displayProspect ?? "?"}, score ${score ?? "—"})`);
      }
    } catch (e) {
      console.log(`     ⚠️ analyse échouée : ${(e as Error).message}`);
    }
  }

  console.log(`  → ${imported} nouvel(le)(s) analyse(s) importée(s)`);
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🔁 Closing memory sync", DRY ? "(dry-run)" : "");
  const supabase = createSupabaseAdmin();

  // Charge d'abord les hashes existants (pour l'import) puis toutes les lignes (pour l'export).
  const { data: existing, error: exErr } = await supabase
    .from("closing_analyses")
    .select("transcript_hash");
  if (exErr) throw new Error(`Lecture closing_analyses impossible : ${exErr.message}`);
  const hashes = new Set<string>((existing ?? []).map((r) => r.transcript_hash).filter(Boolean));

  if (doImport) await importFromVault(hashes);

  if (doExport) {
    const { data: rows, error } = await supabase
      .from("closing_analyses")
      .select("*")
      .order("call_date", { ascending: false });
    if (error) throw new Error(`Lecture closing_analyses impossible : ${error.message}`);
    await exportToVault((rows ?? []) as ClosingAnalysisRow[]);
  }

  console.log("\n✅ Sync terminé.");
}

main().catch((e) => {
  console.error("❌ Sync échoué :", e);
  process.exit(1);
});
