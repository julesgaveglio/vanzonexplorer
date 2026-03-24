// scripts/agents/generate-facebook-schedule.ts
// Usage: npx tsx scripts/agents/generate-facebook-schedule.ts [--days 28]
// Génère le planning des 4 prochaines semaines

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const DAYS_AHEAD = parseInt(process.argv[2] === "--days" ? process.argv[3] : "28");
const POST_INTERVAL_DAYS = 4; // 1 post toutes les 4 jours

async function generateSchedule() {
  console.log(`\n📅 Génération du planning — ${DAYS_AHEAD} jours\n`);

  // 1. Charger les groupes actifs
  const { data: groups, error: gErr } = await supabase
    .from("facebook_groups")
    .select("id, group_name, group_url, priority")
    .eq("is_active", true)
    .order("priority", { ascending: false });

  if (gErr || !groups?.length) {
    console.error("❌ Pas de groupes actifs :", gErr?.message ?? "aucun groupe");
    process.exit(1);
  }

  // 2. Charger les templates actifs
  const { data: templates } = await supabase
    .from("facebook_templates")
    .select("id")
    .eq("is_active", true)
    .order("id");

  if (!templates?.length) {
    console.error("❌ Pas de templates actifs");
    process.exit(1);
  }

  // 3. Charger le dernier post par groupe (pour respecter le cooldown)
  const { data: lastPosts } = await supabase
    .from("facebook_outreach_posts")
    .select("group_id, posted_at")
    .eq("status", "sent")
    .order("posted_at", { ascending: false });

  const lastPostByGroup = new Map<string, Date>();
  for (const p of lastPosts ?? []) {
    if (!lastPostByGroup.has(p.group_id)) {
      lastPostByGroup.set(p.group_id, new Date(p.posted_at));
    }
  }

  // 4. Supprimer les slots pending existants (évite doublons)
  await supabase
    .from("facebook_outreach_schedule")
    .delete()
    .eq("status", "pending");

  // 5. Algorithme : 1 slot par POST_INTERVAL_DAYS, rotation groupes + templates
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const slots: Array<{
    group_id: string;
    template_id: number;
    scheduled_for: string;
    status: string;
  }> = [];

  // File de groupes triée par priorité, puis cooldown
  const eligibleGroups = groups.filter((g) => {
    const last = lastPostByGroup.get(g.id);
    if (!last) return true;
    const daysSince = (today.getTime() - last.getTime()) / (1000 * 60 * 60 * 24);
    return daysSince >= 28; // pas de repost dans le même groupe avant 28 jours
  });

  if (!eligibleGroups.length) {
    console.log("⚠️ Aucun groupe éligible (tous postés récemment)");
    return;
  }

  let groupIndex = 0;
  let templateIndex = 0;
  let lastTemplateUsed = -1;

  const postingDays: Date[] = [];
  for (let d = 0; d < DAYS_AHEAD; d += POST_INTERVAL_DAYS) {
    const day = new Date(today);
    day.setDate(today.getDate() + d);
    // Éviter le week-end
    const dow = day.getDay();
    if (dow === 0) day.setDate(day.getDate() + 1); // dimanche → lundi
    if (dow === 6) day.setDate(day.getDate() + 2); // samedi → lundi
    postingDays.push(day);
  }

  for (const day of postingDays) {
    if (groupIndex >= eligibleGroups.length) break;

    const group = eligibleGroups[groupIndex % eligibleGroups.length];
    groupIndex++;

    // Rotation templates — jamais 2 fois le même consécutivement
    let templateId = templates[templateIndex % templates.length].id;
    if (templateId === lastTemplateUsed) {
      templateIndex++;
      templateId = templates[templateIndex % templates.length].id;
    }
    lastTemplateUsed = templateId;
    templateIndex++;

    slots.push({
      group_id: group.id,
      template_id: templateId,
      scheduled_for: day.toISOString().split("T")[0],
      status: "pending",
    });
  }

  // 6. Insérer les slots
  const { error: insErr } = await supabase
    .from("facebook_outreach_schedule")
    .insert(slots);

  if (insErr) {
    console.error("❌ Erreur insertion :", insErr.message);
    process.exit(1);
  }

  console.log(`✅ ${slots.length} posts planifiés :\n`);
  for (const s of slots) {
    const g = groups.find((x) => x.id === s.group_id);
    console.log(`  ${s.scheduled_for} — Template ${s.template_id} — ${g?.group_name}`);
  }
}

generateSchedule().catch(console.error);
