// src/lib/telegram-assistant/tools/strategic-context.ts
// Lit les fichiers stratégiques de la Vanzon Memory Database pour l'agent Telegram.

import fs from "fs";
import path from "path";

const STRATEGY_DIR = path.join(
  process.cwd(),
  "Vanzon Memory Database",
  "🔒 INTERNE",
  "strategie"
);

const STRATEGY_FILES = [
  "📊 État du Projet — Avril 2026.md",
  "💰 Business Model & Objectif Thaïlande.md",
  "🏪 Marketplace — Vision & MVP.md",
  "🔍 SEO — Infrastructure de trafic.md",
];

/**
 * Lit le contexte stratégique complet ou filtré par domaine.
 * @param focus - Domaine spécifique ou vide pour tout
 */
export function readStrategicContext(focus?: string): string {
  const sections: string[] = [];

  // Mapping focus → fichiers pertinents
  const focusMap: Record<string, string[]> = {
    marketplace: [
      "📊 État du Projet — Avril 2026.md",
      "🏪 Marketplace — Vision & MVP.md",
    ],
    seo: [
      "📊 État du Projet — Avril 2026.md",
      "🔍 SEO — Infrastructure de trafic.md",
    ],
    formation: [
      "📊 État du Projet — Avril 2026.md",
      "💰 Business Model & Objectif Thaïlande.md",
    ],
    flotte: [
      "📊 État du Projet — Avril 2026.md",
      "💰 Business Model & Objectif Thaïlande.md",
    ],
    revenus: [
      "📊 État du Projet — Avril 2026.md",
      "💰 Business Model & Objectif Thaïlande.md",
    ],
  };

  const filesToRead = focus && focusMap[focus.toLowerCase()]
    ? focusMap[focus.toLowerCase()]
    : STRATEGY_FILES;

  for (const fileName of filesToRead) {
    const filePath = path.join(STRATEGY_DIR, fileName);
    try {
      const content = fs.readFileSync(filePath, "utf-8");
      sections.push(`--- ${fileName} ---\n${content}`);
    } catch {
      sections.push(`--- ${fileName} ---\n[Fichier non trouvé]`);
    }
  }

  return sections.join("\n\n");
}
