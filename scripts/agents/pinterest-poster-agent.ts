#!/usr/bin/env tsx
/**
 * pinterest-poster-agent.ts — Phase 2 (skeleton)
 *
 * Publie des pins depuis la content_queue vers Pinterest.
 * Requiert un compte Pinterest Standard (write access).
 *
 * Actuellement désactivé — compte en Trial (read-only).
 * Activer après upgrade en définissant PINTEREST_WRITE_ENABLED=true.
 *
 * Usage:
 *   npx tsx scripts/agents/pinterest-poster-agent.ts
 */

// ── Guard write access ─────────────────────────────────────────────────────────

const WRITE_ACCESS_ENABLED = !!process.env.PINTEREST_WRITE_ENABLED;

if (!WRITE_ACCESS_ENABLED) {
  console.log("⚠️  Pinterest write access not available (Trial).");
  console.log("    Set PINTEREST_WRITE_ENABLED=true after upgrading to Standard account.");
  process.exit(0);
}

// ── Interfaces (Phase 2) ───────────────────────────────────────────────────────

interface QueueItem {
  id: string;
  title: string;
  description: string;
  destination_url: string;
  board_name: string;
  image_url: string | null;
  target_keyword: string;
}

interface PinterestCreatePinRequest {
  title: string;
  description: string;
  link: string;
  board_id: string;
  media_source?: {
    source_type: "image_url";
    url: string;
  };
}

// ── Main (Phase 2 skeleton) ────────────────────────────────────────────────────

async function main() {
  console.log("📌 Agent Pinterest Poster — Phase 2");

  // TODO Phase 2: implémenter le posting
  // 1. Fetch items approved depuis pinterest_content_queue
  // 2. Résoudre board_name → board_id via API Pinterest
  // 3. POST /pins pour chaque item approuvé
  // 4. Update status → 'published' dans pinterest_content_queue
  // 5. Insert dans pinterest_pins_created
  // 6. Notifier Telegram

  console.log("Phase 2 non encore implémentée — skeleton prêt.");
}

main().catch((err) => {
  console.error("❌", err instanceof Error ? err.message : String(err));
  process.exit(1);
});

// ── Types exports pour future utilisation ─────────────────────────────────────
export type { QueueItem, PinterestCreatePinRequest };
