// scripts/agents/seed-facebook-groups.ts
// Usage: npx tsx scripts/agents/seed-facebook-groups.ts
// Insère tous les groupes Facebook vanlife dans la table facebook_groups

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const GROUPS = [
  // ── Priorité 5 — Vanlife France cœur de cible ──────────────────────────────
  {
    group_name: "VAN LIFE FRANCE",
    group_url: "https://www.facebook.com/groups/vanlifefrance/",
    category: "vanlife FR",
    priority: 5,
  },
  {
    group_name: "VanLife France",
    group_url: "https://www.facebook.com/groups/549117645488541/",
    category: "vanlife FR",
    priority: 5,
  },
  {
    group_name: "Van life and road trip France",
    group_url: "https://www.facebook.com/groups/932515934982067/",
    category: "road trip FR",
    priority: 5,
  },
  // ── Priorité 4 — Van aménagé & Achat/vente ─────────────────────────────────
  {
    group_name: "Fourgon et Van Aménagé",
    group_url: "https://www.facebook.com/groups/919088842362286/",
    category: "van aménagé FR",
    priority: 4,
  },
  {
    group_name: "Le coin du Van Aménagé",
    group_url: "https://www.facebook.com/groups/1515613905305964/",
    category: "van aménagé FR",
    priority: 4,
  },
  {
    group_name: "Fourgon aménagé rencontre",
    group_url: "https://www.facebook.com/groups/1448105298687012/",
    category: "van aménagé FR",
    priority: 4,
  },
  {
    group_name: "Achat/Vente Van Aménagé et Camping-car",
    group_url: "https://www.facebook.com/groups/552387828482416/",
    category: "achat vente van",
    priority: 4,
  },
  {
    group_name: "VAN NIGHT SPOT (Yescapa community)",
    group_url: "https://www.facebook.com/groups/httpswww.yescapa.frcampingcars35446/",
    category: "vanlife FR",
    priority: 4,
  },
  // ── Priorité 3 — Communautés plus larges ───────────────────────────────────
  {
    group_name: "Construire son van aménagé",
    group_url: "https://www.facebook.com/groups/1405570892939651/",
    category: "van aménagé FR",
    priority: 3,
  },
  {
    group_name: "VanLife - Europe",
    group_url: "https://www.facebook.com/groups/vanlife.europe/",
    category: "vanlife Europe",
    priority: 3,
  },
  {
    group_name: "Vanlife pour les filles",
    group_url: "https://www.facebook.com/groups/987675458771319/",
    category: "vanlife FR",
    priority: 3,
  },
  {
    group_name: "Camping chez l'habitant (camping-car/van)",
    group_url: "https://www.facebook.com/groups/voyageurs.homecamper/",
    category: "camping voyage",
    priority: 3,
  },
];

async function seedGroups() {
  console.log(`\n🚐 Seed groupes Facebook — ${GROUPS.length} groupes\n`);

  // Vérifier les doublons (par group_url)
  const { data: existing } = await supabase
    .from("facebook_groups")
    .select("group_url");

  const existingUrls = new Set((existing ?? []).map((g: { group_url: string }) => g.group_url));
  const toInsert = GROUPS.filter((g) => !existingUrls.has(g.group_url));

  if (!toInsert.length) {
    console.log("⚠️ Tous les groupes existent déjà en base.");
    return;
  }

  const { data, error } = await supabase
    .from("facebook_groups")
    .insert(toInsert)
    .select();

  if (error) {
    console.error("❌ Erreur insertion :", error.message);
    process.exit(1);
  }

  console.log(`✅ ${data?.length ?? 0} groupes insérés :\n`);
  for (const g of data ?? []) {
    console.log(`  [P${g.priority}] ${g.group_name}`);
  }

  if (existingUrls.size > 0) {
    console.log(`\nℹ️ ${existingUrls.size} groupe(s) ignoré(s) (déjà en base)`);
  }
}

seedGroups().catch(console.error);
