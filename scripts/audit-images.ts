#!/usr/bin/env tsx
/**
 * scripts/audit-images.ts
 * Audit des images pour le SEO — détecte les violations avant mise en production.
 *
 * Usage : npx tsx scripts/audit-images.ts
 * Retourne exit code 1 si des violations critiques sont trouvées.
 */

import fs from "fs";
import path from "path";
import { glob } from "glob";

// ── Config ────────────────────────────────────────────────────────────────────

const PUBLIC_DIRS = ["src/app/(site)", "src/components"];
const IGNORE_PATTERNS = ["node_modules", "admin", ".next", "emails"];

interface Violation {
  file: string;
  line: number;
  type: "raw-img" | "missing-alt" | "empty-alt" | "unoptimized" | "no-auto-format";
  snippet: string;
}

const SEVERITY: Record<Violation["type"], "critical" | "warning"> = {
  "raw-img": "critical",
  "missing-alt": "critical",
  "empty-alt": "warning",
  "unoptimized": "warning",
  "no-auto-format": "warning",
};

// ── Scanner ───────────────────────────────────────────────────────────────────

function scanFile(filePath: string): Violation[] {
  const violations: Violation[] = [];
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split("\n");

  // Skip admin files
  if (IGNORE_PATTERNS.some((p) => filePath.includes(p))) return [];

  lines.forEach((line, i) => {
    const lineNum = i + 1;
    const snippet = line.trim().slice(0, 100);

    // 1. Raw <img tag (not inside a comment, not eslint-disable line)
    if (/<img\s/i.test(line) && !line.includes("eslint-disable") && !line.trim().startsWith("//") && !line.trim().startsWith("*")) {
      violations.push({ file: filePath, line: lineNum, type: "raw-img", snippet });
    }

    // 2. <Image without alt or with alt=""
    if (/<Image\s/.test(line) || /^\s+src=/.test(line)) {
      if (/alt=""\s/.test(line) || /alt={""}\s/.test(line)) {
        violations.push({ file: filePath, line: lineNum, type: "empty-alt", snippet });
      }
    }

    // 3. unoptimized prop on public-facing <Image> (skip if any of the 5 preceding lines has audit-images:ok)
    const nearbyLines = lines.slice(Math.max(0, i - 5), i).join("\n");
    if (/\bunoptimized\b/.test(line) && !line.trim().startsWith("//") && !nearbyLines.includes("audit-images:ok")) {
      violations.push({ file: filePath, line: lineNum, type: "unoptimized", snippet });
    }

    // 4. Sanity CDN URL without ?auto=format (only in non-metadata contexts)
    if (
      /cdn\.sanity\.io\/images/.test(line) &&
      !/auto=format/.test(line) &&
      !/^\s*\/\//.test(line) &&
      !line.includes("SANITY_PROJECT_ID") &&
      !/^\s*\*/.test(line)
    ) {
      violations.push({ file: filePath, line: lineNum, type: "no-auto-format", snippet });
    }
  });

  return violations;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log("\n🔍 Audit images SEO — Vanzon Explorer\n");

  const files: string[] = [];
  for (const dir of PUBLIC_DIRS) {
    if (!fs.existsSync(dir)) continue;
    const found = await glob(`${dir}/**/*.tsx`, { ignore: ["**/node_modules/**", "**/admin/**"] });
    files.push(...found);
  }

  const allViolations: Violation[] = [];
  for (const file of files) {
    const v = scanFile(file);
    allViolations.push(...v);
  }

  if (allViolations.length === 0) {
    console.log("✅ Aucune violation détectée — images 20/20 !\n");
    process.exit(0);
  }

  // Group by type
  const critical = allViolations.filter((v) => SEVERITY[v.type] === "critical");
  const warnings = allViolations.filter((v) => SEVERITY[v.type] === "warning");

  if (critical.length > 0) {
    console.log(`❌ ${critical.length} violation(s) CRITIQUE(S)\n`);
    for (const v of critical) {
      const rel = path.relative(process.cwd(), v.file);
      console.log(`  [${v.type}] ${rel}:${v.line}`);
      console.log(`    → ${v.snippet}\n`);
    }
  }

  if (warnings.length > 0) {
    console.log(`⚠️  ${warnings.length} avertissement(s)\n`);
    for (const v of warnings) {
      const rel = path.relative(process.cwd(), v.file);
      console.log(`  [${v.type}] ${rel}:${v.line}`);
      console.log(`    → ${v.snippet}\n`);
    }
  }

  console.log("─────────────────────────────────────────");
  console.log(`Règles à respecter :
  • Toujours <Image> de next/image (jamais <img>)
  • Alt text descriptif obligatoire
  • URLs Sanity : ajouter ?auto=format&q=82
  • Jamais unoptimized sur les pages publiques\n`);

  if (critical.length > 0) process.exit(1);
}

main().catch(console.error);
