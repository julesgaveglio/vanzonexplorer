# Facebook Outreach — Telegram Bot Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Système de posting Facebook semi-automatisé piloté par Telegram — le bot envoie chaque jour le message du jour avec le groupe cible, Jules copie-colle et confirme via bouton Telegram.

**Architecture:** Supabase stocke groupes + templates + planning. Un GitHub Actions cron appelle `/api/telegram/send-daily` chaque soir à 18h. L'API route envoie le message Telegram avec le texte prêt. Un webhook `/api/telegram/webhook` gère les boutons "Posté ✅" / "Reporter ⏭".

**Tech Stack:** Next.js 14 App Router, Supabase (service_role), Telegram Bot API (fetch natif, pas de lib), GitHub Actions cron, TypeScript strict.

---

## Fichiers à créer / modifier

```
supabase/migrations/20260324000001_facebook_outreach.sql   ← nouvelles tables
scripts/agents/generate-facebook-schedule.ts               ← algo scheduling
src/app/api/telegram/webhook/route.ts                      ← callbacks boutons
src/app/api/telegram/send-daily/route.ts                   ← envoi quotidien (appelé par cron)
src/app/api/admin/facebook-outreach/groups/route.ts        ← CRUD groupes
src/app/api/admin/facebook-outreach/schedule/route.ts      ← lecture planning
src/app/api/admin/facebook-outreach/posts/route.ts         ← historique posts
src/app/admin/(protected)/agents/facebook-outreach/page.tsx ← dashboard admin
.github/workflows/facebook-daily.yml                       ← cron 18h
```

**Variables d'env à ajouter dans `.env.local` et Vercel :**
```
TELEGRAM_BOT_TOKEN=      # créé via @BotFather
TELEGRAM_CHAT_ID=        # ton ID personnel (via @userinfobot)
TELEGRAM_WEBHOOK_SECRET= # string aléatoire pour sécuriser le webhook
```

---

## Chunk 1 : Base de données

### Task 1 : Migration Supabase

**Files:**
- Create: `supabase/migrations/20260324000001_facebook_outreach.sql`

- [ ] **Créer le fichier de migration**

```sql
-- supabase/migrations/20260324000001_facebook_outreach.sql

-- ── Templates (5 messages, stockés en BDD pour édition depuis dashboard) ─────
CREATE TABLE IF NOT EXISTS facebook_templates (
  id        INTEGER PRIMARY KEY CHECK (id BETWEEN 1 AND 5),
  label     TEXT NOT NULL,
  content   TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ── Groupes Facebook cibles ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS facebook_groups (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_name   TEXT NOT NULL,
  group_url    TEXT NOT NULL,
  member_count INTEGER,
  category     TEXT NOT NULL DEFAULT 'van aménagé FR',
  priority     INTEGER NOT NULL DEFAULT 3 CHECK (priority BETWEEN 1 AND 5),
  is_active    BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);

-- ── Historique des posts envoyés ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS facebook_outreach_posts (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id            UUID NOT NULL REFERENCES facebook_groups(id) ON DELETE CASCADE,
  template_id         INTEGER NOT NULL REFERENCES facebook_templates(id),
  message_content     TEXT NOT NULL,
  status              TEXT NOT NULL DEFAULT 'sent'
                      CHECK (status IN ('sent', 'skipped', 'removed')),
  telegram_message_id INTEGER,
  posted_at           TIMESTAMPTZ DEFAULT now(),
  created_at          TIMESTAMPTZ DEFAULT now()
);

-- ── Planning (posts à venir) ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS facebook_outreach_schedule (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id       UUID NOT NULL REFERENCES facebook_groups(id) ON DELETE CASCADE,
  template_id    INTEGER NOT NULL REFERENCES facebook_templates(id),
  scheduled_for  DATE NOT NULL,
  status         TEXT NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending', 'sent', 'skipped', 'failed')),
  telegram_message_id INTEGER,
  created_at     TIMESTAMPTZ DEFAULT now(),
  updated_at     TIMESTAMPTZ DEFAULT now()
);

-- ── RLS (admin only via service_role) ────────────────────────────────────────
ALTER TABLE facebook_templates         ENABLE ROW LEVEL SECURITY;
ALTER TABLE facebook_groups            ENABLE ROW LEVEL SECURITY;
ALTER TABLE facebook_outreach_posts    ENABLE ROW LEVEL SECURITY;
ALTER TABLE facebook_outreach_schedule ENABLE ROW LEVEL SECURITY;

-- ── Index ─────────────────────────────────────────────────────────────────────
CREATE INDEX idx_fb_schedule_date   ON facebook_outreach_schedule(scheduled_for);
CREATE INDEX idx_fb_schedule_status ON facebook_outreach_schedule(status);
CREATE INDEX idx_fb_posts_group     ON facebook_outreach_posts(group_id);
CREATE INDEX idx_fb_posts_date      ON facebook_outreach_posts(posted_at DESC);
CREATE INDEX idx_fb_groups_active   ON facebook_groups(is_active);

-- ── Seed templates ────────────────────────────────────────────────────────────
INSERT INTO facebook_templates (id, label, content) VALUES
(1, 'Problème résolu', 'Hey la commu 👋

Petite question : vous galérez aussi à planifier vos road trips en van ? Genre passer 3h sur Google Maps à checker les spots, les distances, ce qu''il y a à voir...

J''ai bidouillé un truc pour me simplifier la vie (gratuit) : tu balances ta destination + tes envies et boom, itinéraire complet par email.

Si certains veulent tester et me dire si c''est utile ou pas : https://www.vanzonexplorer.com/road-trip-personnalise?utm_source=facebook&utm_medium=organic&utm_campaign=groups_outreach&utm_content=template_1

(Cherche surtout des vrais retours pour améliorer le délire)'),
(2, 'Beta-testeurs', 'Salut à tous 🚐

Je développe actuellement un générateur d''itinéraires en van (IA + base de données de spots) et je cherche des beta-testeurs pour me dire ce qui manque.

L''idée : destination + durée + type de voyage → itinéraire personnalisé envoyé par email.

C''est 100% gratuit, j''ai juste besoin de retours honnêtes de vanlifers pour peaufiner l''outil.

Dispo ici si ça vous tente : https://www.vanzonexplorer.com/road-trip-personnalise?utm_source=facebook&utm_medium=organic&utm_campaign=groups_outreach&utm_content=template_2

Merci d''avance 🙏'),
(3, 'Side-project', 'Hello la team 👋

Vanlifer depuis 2 ans, j''en avais marre de perdre des heures à préparer mes road trips... du coup j''ai créé un petit outil perso que je viens de mettre en ligne.

Tu rentres ta destination, combien de temps tu as, ce que tu kiffs (nature, surf, culture, etc.) et l''outil te génère un itinéraire adapté. Tout est gratuit.

Si vous avez 2 minutes pour tester et me dire ce qui pourrait être amélioré, ce serait top : https://www.vanzonexplorer.com/road-trip-personnalise?utm_source=facebook&utm_medium=organic&utm_campaign=groups_outreach&utm_content=template_3

Vos retours sont précieux 🙏'),
(4, 'Question + solution', 'Question pour la commu 🤔

Comment vous préparez vos road trips ? Vous utilisez quoi comme outils/apps ?

J''ai développé un truc qui pourrait vous intéresser : un générateur d''itinéraires automatique selon votre destination/durée/envies. Gratuit et perso, ça me fait gagner pas mal de temps.

Je cherche des retours pour voir ce qui manque : https://www.vanzonexplorer.com/road-trip-personnalise?utm_source=facebook&utm_medium=organic&utm_campaign=groups_outreach&utm_content=template_4

D''ailleurs, vous utilisez quoi vous actuellement pour planifier ?'),
(5, 'Retour d''expérience', 'Petite découverte à partager 🚐

Après avoir passé un week-end entier à organiser mon dernier trip dans les Pyrénées (pour finalement louper les meilleurs spots 😅), je me suis dit qu''il fallait une meilleure solution.

J''ai monté un outil qui génère des road trips personnalisés en van : tu donnes ta destination + tes critères, et t''as un itinéraire complet en 1 minute par email.

C''est gratuit et en test, donc si vous voulez l''essayer et me dire ce qui manque : https://www.vanzonexplorer.com/road-trip-personnalise?utm_source=facebook&utm_medium=organic&utm_campaign=groups_outreach&utm_content=template_5

Cherche vraiment des retours constructifs 🙏');
```

- [ ] **Appliquer la migration**
```bash
# Via Supabase Dashboard → SQL Editor → coller le contenu et exécuter
# OU via CLI :
npx supabase db push
```

- [ ] **Vérifier les tables créées** dans Supabase Dashboard → Table Editor

- [ ] **Commit**
```bash
git add supabase/migrations/20260324000001_facebook_outreach.sql
git commit -m "feat(db): tables facebook outreach — groups, templates, posts, schedule"
```

---

## Chunk 2 : Script de scheduling

### Task 2 : Algorithme de planning

**Files:**
- Create: `scripts/agents/generate-facebook-schedule.ts`

**Fréquence choisie :** 1 post tous les 4 jours (≈ 7-8 posts/mois en rotation sur les groupes). Chaque groupe reçoit 1 post max toutes les 4 semaines.

- [ ] **Créer le script**

```typescript
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
```

- [ ] **Tester le script (sans groupes en BDD → doit afficher erreur propre)**
```bash
npx tsx scripts/agents/generate-facebook-schedule.ts --days 28
# Attendu: "❌ Pas de groupes actifs"
```

- [ ] **Ajouter 2-3 groupes de test dans Supabase** (Table Editor → facebook_groups)

- [ ] **Retester — doit générer le planning**
```bash
npx tsx scripts/agents/generate-facebook-schedule.ts --days 28
# Attendu: "✅ N posts planifiés" avec dates et groupes
```

- [ ] **Commit**
```bash
git add scripts/agents/generate-facebook-schedule.ts
git commit -m "feat(facebook): script generate-schedule avec algo rotation templates + cooldown 28j"
```

---

## Chunk 3 : Telegram Bot

### Task 3 : Configuration du bot

- [ ] **Créer le bot Telegram**
  1. Ouvrir Telegram → chercher `@BotFather`
  2. `/newbot` → nom : "Vanzon Explorer Bot" → username : `vanzon_explorer_bot`
  3. Copier le token dans `.env.local` : `TELEGRAM_BOT_TOKEN=xxxx`

- [ ] **Récupérer ton Chat ID**
  1. Chercher `@userinfobot` sur Telegram → `/start`
  2. Copier l'ID dans `.env.local` : `TELEGRAM_CHAT_ID=xxxx`

- [ ] **Générer un secret webhook**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Copier dans `.env.local` : `TELEGRAM_WEBHOOK_SECRET=xxxx`

- [ ] **Ajouter ces 3 variables dans Vercel** (Settings → Environment Variables)

### Task 4 : Route webhook (callbacks boutons)

**Files:**
- Create: `src/app/api/telegram/webhook/route.ts`

- [ ] **Créer le webhook**

```typescript
// src/app/api/telegram/webhook/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET!;

async function sendTelegram(chatId: string, text: string) {
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
  });
}

async function answerCallback(callbackQueryId: string, text: string) {
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ callback_query_id: callbackQueryId, text }),
  });
}

export async function POST(req: NextRequest) {
  // Vérifier le secret
  const secret = req.headers.get("X-Telegram-Bot-Api-Secret-Token");
  if (secret !== WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json() as {
    callback_query?: {
      id: string;
      from: { id: number };
      data?: string;
      message?: { message_id: number; chat: { id: number } };
    };
  };

  const cb = body.callback_query;
  if (!cb?.data) return NextResponse.json({ ok: true });

  const [action, scheduleId] = cb.data.split(":");
  const chatId = String(cb.message?.chat.id ?? cb.from.id);

  await answerCallback(cb.id, action === "posted" ? "✅ Enregistré !" : "⏭ Reporté");

  const supabase = createSupabaseAdmin();

  if (action === "posted") {
    // 1. Récupérer le slot planifié
    const { data: slot } = await supabase
      .from("facebook_outreach_schedule")
      .select("group_id, template_id, facebook_templates(content)")
      .eq("id", scheduleId)
      .single() as { data: {
        group_id: string;
        template_id: number;
        facebook_templates: { content: string } | null;
      } | null };

    if (slot) {
      // 2. Marquer le slot comme envoyé
      await supabase
        .from("facebook_outreach_schedule")
        .update({ status: "sent", updated_at: new Date().toISOString() })
        .eq("id", scheduleId);

      // 3. Créer l'entrée historique
      await supabase.from("facebook_outreach_posts").insert({
        group_id: slot.group_id,
        template_id: slot.template_id,
        message_content: slot.facebook_templates?.content ?? "",
        status: "sent",
        telegram_message_id: cb.message?.message_id ?? null,
        posted_at: new Date().toISOString(),
      });
    }

    await sendTelegram(chatId, "✅ Post enregistré dans l'historique !");

  } else if (action === "skip") {
    // Reporter au lendemain
    const { data: slot } = await supabase
      .from("facebook_outreach_schedule")
      .select("scheduled_for")
      .eq("id", scheduleId)
      .single();

    if (slot) {
      const next = new Date(slot.scheduled_for);
      next.setDate(next.getDate() + 1);
      await supabase
        .from("facebook_outreach_schedule")
        .update({
          scheduled_for: next.toISOString().split("T")[0],
          updated_at: new Date().toISOString(),
        })
        .eq("id", scheduleId);
    }

    await sendTelegram(chatId, "⏭ Reporté au lendemain.");
  }

  return NextResponse.json({ ok: true });
}
```

### Task 5 : Route d'envoi quotidien (appelée par le cron)

**Files:**
- Create: `src/app/api/telegram/send-daily/route.ts`

- [ ] **Créer la route**

```typescript
// src/app/api/telegram/send-daily/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID!;
const CRON_SECRET = process.env.CRON_SECRET!; // même secret que les autres crons

async function sendTelegramWithButtons(
  text: string,
  buttons: Array<Array<{ text: string; callback_data: string }>>
) {
  const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: CHAT_ID,
      text,
      parse_mode: "HTML",
      reply_markup: { inline_keyboard: buttons },
    }),
  });
  return res.json();
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");
  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createSupabaseAdmin();
  const today = new Date().toISOString().split("T")[0];

  // Récupérer les posts du jour
  const { data: slots, error } = await supabase
    .from("facebook_outreach_schedule")
    .select(`
      id,
      template_id,
      facebook_groups(group_name, group_url),
      facebook_templates(content)
    `)
    .eq("scheduled_for", today)
    .eq("status", "pending") as {
      data: Array<{
        id: string;
        template_id: number;
        facebook_groups: { group_name: string; group_url: string } | null;
        facebook_templates: { content: string } | null;
      }> | null;
      error: unknown;
    };

  if (error || !slots?.length) {
    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: "📅 Aucun post Facebook prévu aujourd'hui.",
      }),
    });
    return NextResponse.json({ sent: 0 });
  }

  for (const slot of slots) {
    const group = slot.facebook_groups;
    const template = slot.facebook_templates;
    if (!group || !template) continue;

    const messageText = template.content.replace(
      /utm_content=template_\d/,
      `utm_content=template_${slot.template_id}`
    );

    const text =
      `📣 <b>Post Facebook du jour</b> — Template ${slot.template_id}\n\n` +
      `<b>Groupe :</b> ${group.group_name}\n` +
      `<b>URL :</b> ${group.group_url}\n\n` +
      `<b>Message à copier-coller :</b>\n\n` +
      `<code>${messageText}</code>`;

    await sendTelegramWithButtons(text, [[
      { text: "✅ Posté !", callback_data: `posted:${slot.id}` },
      { text: "⏭ Reporter", callback_data: `skip:${slot.id}` },
    ]]);
  }

  return NextResponse.json({ sent: slots.length });
}
```

- [ ] **Enregistrer le webhook Telegram** (à faire une seule fois après déploiement)
```bash
curl -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://vanzonexplorer.com/api/telegram/webhook",
    "secret_token": "'${TELEGRAM_WEBHOOK_SECRET}'"
  }'
# Attendu: {"ok":true,"result":true}
```

- [ ] **Commit**
```bash
git add src/app/api/telegram/
git commit -m "feat(telegram): webhook callbacks + route send-daily avec inline buttons"
```

---

## Chunk 4 : Cron GitHub Actions

### Task 6 : Workflow cron 18h

**Files:**
- Create: `.github/workflows/facebook-daily.yml`

- [ ] **Créer le workflow**

```yaml
# .github/workflows/facebook-daily.yml
name: Facebook Daily Reminder

on:
  schedule:
    - cron: '0 17 * * 1-5'   # 18h Paris (UTC+1) du lundi au vendredi
  workflow_dispatch:           # déclenchement manuel possible

jobs:
  send-daily:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger send-daily API
        run: |
          curl -X POST https://vanzonexplorer.com/api/telegram/send-daily \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
            -H "Content-Type: application/json" \
            --fail-with-body
```

- [ ] **Vérifier que `CRON_SECRET` existe dans GitHub Secrets** (Settings → Secrets → Actions)

- [ ] **Commit et tester le workflow manuellement**
```bash
git add .github/workflows/facebook-daily.yml
git commit -m "feat(cron): workflow GitHub Actions envoi rappel Facebook 18h lun-ven"
git push origin main
# Puis GitHub → Actions → facebook-daily → Run workflow
```

---

## Chunk 5 : API routes admin

### Task 7 : CRUD groupes

**Files:**
- Create: `src/app/api/admin/facebook-outreach/groups/route.ts`

- [ ] **Créer la route**

```typescript
// src/app/api/admin/facebook-outreach/groups/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { auth, currentUser } from "@clerk/nextjs/server";

const ALLOWED = "gavegliojules@gmail.com";

async function guard() {
  const { userId } = await auth();
  if (!userId) return false;
  const user = await currentUser();
  return user?.emailAddresses?.[0]?.emailAddress === ALLOWED;
}

export async function GET() {
  if (!(await guard())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("facebook_groups")
    .select("*")
    .order("priority", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  if (!(await guard())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json() as {
    group_name: string;
    group_url: string;
    member_count?: number;
    category?: string;
    priority?: number;
  };
  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase.from("facebook_groups").insert(body).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  if (!(await guard())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id, ...updates } = await req.json() as { id: string; [k: string]: unknown };
  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("facebook_groups")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest) {
  if (!(await guard())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await req.json() as { id: string };
  const supabase = createSupabaseAdmin();
  const { error } = await supabase.from("facebook_groups").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
```

### Task 8 : Route schedule + posts history

**Files:**
- Create: `src/app/api/admin/facebook-outreach/schedule/route.ts`
- Create: `src/app/api/admin/facebook-outreach/posts/route.ts`

- [ ] **Route schedule (lecture + génération)**

```typescript
// src/app/api/admin/facebook-outreach/schedule/route.ts
import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { auth, currentUser } from "@clerk/nextjs/server";

async function guard() {
  const { userId } = await auth();
  if (!userId) return false;
  const user = await currentUser();
  return user?.emailAddresses?.[0]?.emailAddress === "gavegliojules@gmail.com";
}

export async function GET() {
  if (!(await guard())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("facebook_outreach_schedule")
    .select("*, facebook_groups(group_name, group_url), facebook_templates(label)")
    .gte("scheduled_for", new Date().toISOString().split("T")[0])
    .order("scheduled_for");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
```

- [ ] **Route posts history**

```typescript
// src/app/api/admin/facebook-outreach/posts/route.ts
import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { auth, currentUser } from "@clerk/nextjs/server";

async function guard() {
  const { userId } = await auth();
  if (!userId) return false;
  const user = await currentUser();
  return user?.emailAddresses?.[0]?.emailAddress === "gavegliojules@gmail.com";
}

export async function GET() {
  if (!(await guard())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("facebook_outreach_posts")
    .select("*, facebook_groups(group_name), facebook_templates(label)")
    .order("posted_at", { ascending: false })
    .limit(100);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
```

- [ ] **Commit**
```bash
git add src/app/api/admin/facebook-outreach/
git commit -m "feat(api): routes admin facebook-outreach — groups CRUD, schedule, posts history"
```

---

## Chunk 6 : Dashboard Admin

### Task 9 : Page `/admin/agents/facebook-outreach`

**Files:**
- Create: `src/app/admin/(protected)/agents/facebook-outreach/page.tsx`

- [ ] **Créer le dashboard**

```typescript
// src/app/admin/(protected)/agents/facebook-outreach/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Group {
  id: string;
  group_name: string;
  group_url: string;
  member_count: number | null;
  category: string;
  priority: number;
  is_active: boolean;
}

interface ScheduleSlot {
  id: string;
  scheduled_for: string;
  status: string;
  template_id: number;
  facebook_groups: { group_name: string; group_url: string } | null;
  facebook_templates: { label: string } | null;
}

interface Post {
  id: string;
  posted_at: string;
  status: string;
  template_id: number;
  facebook_groups: { group_name: string } | null;
  facebook_templates: { label: string } | null;
}

export default function FacebookOutreachPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [schedule, setSchedule] = useState<ScheduleSlot[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [newGroup, setNewGroup] = useState({ group_name: "", group_url: "", priority: 3 });
  const [generatingSchedule, setGeneratingSchedule] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetchAll();
  }, []);

  async function fetchAll() {
    setLoading(true);
    const [g, s, p] = await Promise.all([
      fetch("/api/admin/facebook-outreach/groups").then((r) => r.json()),
      fetch("/api/admin/facebook-outreach/schedule").then((r) => r.json()),
      fetch("/api/admin/facebook-outreach/posts").then((r) => r.json()),
    ]);
    setGroups(Array.isArray(g) ? g : []);
    setSchedule(Array.isArray(s) ? s : []);
    setPosts(Array.isArray(p) ? p : []);
    setLoading(false);
  }

  async function addGroup(e: React.FormEvent) {
    e.preventDefault();
    if (!newGroup.group_name || !newGroup.group_url) return;
    await fetch("/api/admin/facebook-outreach/groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newGroup),
    });
    setNewGroup({ group_name: "", group_url: "", priority: 3 });
    await fetchAll();
    setMsg("Groupe ajouté ✓");
  }

  async function toggleGroup(id: string, is_active: boolean) {
    await fetch("/api/admin/facebook-outreach/groups", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, is_active: !is_active }),
    });
    await fetchAll();
  }

  async function deleteGroup(id: string) {
    if (!confirm("Supprimer ce groupe ?")) return;
    await fetch("/api/admin/facebook-outreach/groups", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    await fetchAll();
  }

  async function runSchedule() {
    setGeneratingSchedule(true);
    setMsg("Génération du planning en cours...");
    // Lance le script via exec côté serveur — à implémenter si besoin,
    // sinon instruction manuelle dans le dashboard
    setMsg("⚠️ Lance: npx tsx scripts/agents/generate-facebook-schedule.ts");
    setGeneratingSchedule(false);
  }

  const activeGroups = groups.filter((g) => g.is_active);
  const pendingSlots = schedule.filter((s) => s.status === "pending");
  const sentPosts = posts.filter((p) => p.status === "sent");

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Facebook Outreach</h1>
          <p className="text-sm text-slate-500 mt-1">
            Bot Telegram · 1 post / 4 jours · Cooldown 28 jours par groupe
          </p>
        </div>
        <button
          onClick={runSchedule}
          disabled={generatingSchedule}
          className="bg-blue-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {generatingSchedule ? "Génération..." : "🗓 Générer le planning"}
        </button>
      </div>

      {msg && (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 text-sm px-4 py-3 rounded-lg">
          {msg}
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Groupes actifs", value: activeGroups.length },
          { label: "Posts planifiés", value: pendingSlots.length },
          { label: "Posts envoyés", value: sentPosts.length },
        ].map((k) => (
          <div key={k.label} className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="text-3xl font-black text-slate-900">{k.value}</div>
            <div className="text-sm text-slate-500 mt-1">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Ajouter groupe */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-base font-bold text-slate-900 mb-4">Ajouter un groupe</h2>
        <form onSubmit={addGroup} className="flex gap-3 flex-wrap">
          <input
            className="flex-1 min-w-48 border border-slate-200 rounded-lg px-3 py-2 text-sm"
            placeholder="Nom du groupe"
            value={newGroup.group_name}
            onChange={(e) => setNewGroup({ ...newGroup, group_name: e.target.value })}
          />
          <input
            className="flex-1 min-w-64 border border-slate-200 rounded-lg px-3 py-2 text-sm"
            placeholder="URL du groupe (facebook.com/groups/...)"
            value={newGroup.group_url}
            onChange={(e) => setNewGroup({ ...newGroup, group_url: e.target.value })}
          />
          <select
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm"
            value={newGroup.priority}
            onChange={(e) => setNewGroup({ ...newGroup, priority: parseInt(e.target.value) })}
          >
            {[1,2,3,4,5].map(n => <option key={n} value={n}>Priorité {n}</option>)}
          </select>
          <button type="submit" className="bg-slate-900 text-white text-sm font-semibold px-4 py-2 rounded-lg">
            Ajouter
          </button>
        </form>
      </div>

      {/* Liste groupes */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-900">Groupes ({groups.length})</h2>
        </div>
        {loading ? (
          <div className="p-6 text-sm text-slate-400">Chargement...</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                {["Groupe", "Priorité", "Statut", "Actions"].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {groups.map((g) => (
                <tr key={g.id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3">
                    <a href={g.group_url} target="_blank" rel="noopener noreferrer" className="font-medium text-slate-900 hover:text-blue-600">
                      {g.group_name}
                    </a>
                  </td>
                  <td className="px-4 py-3 text-slate-500">⭐ {g.priority}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      g.is_active ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"
                    }`}>
                      {g.is_active ? "Actif" : "Inactif"}
                    </span>
                  </td>
                  <td className="px-4 py-3 flex gap-2">
                    <button onClick={() => toggleGroup(g.id, g.is_active)} className="text-xs text-blue-600 hover:underline">
                      {g.is_active ? "Désactiver" : "Activer"}
                    </button>
                    <button onClick={() => deleteGroup(g.id)} className="text-xs text-red-500 hover:underline">
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))}
              {!groups.length && (
                <tr><td colSpan={4} className="px-4 py-6 text-center text-slate-400">Aucun groupe</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Planning */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-900">Planning à venir</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              {["Date", "Groupe", "Template", "Statut"].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {schedule.slice(0, 15).map((s) => (
              <tr key={s.id} className="hover:bg-slate-50/50">
                <td className="px-4 py-3 font-mono text-xs text-slate-600">{s.scheduled_for}</td>
                <td className="px-4 py-3 text-slate-900">{s.facebook_groups?.group_name ?? "—"}</td>
                <td className="px-4 py-3 text-slate-500">T{s.template_id} — {s.facebook_templates?.label}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    s.status === "pending" ? "bg-yellow-100 text-yellow-700" :
                    s.status === "sent" ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"
                  }`}>{s.status}</span>
                </td>
              </tr>
            ))}
            {!schedule.length && (
              <tr><td colSpan={4} className="px-4 py-6 text-center text-slate-400">Pas de planning — génère-le via le bouton en haut</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Historique */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-900">Historique des posts</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              {["Date", "Groupe", "Template", "Statut"].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {posts.slice(0, 20).map((p) => (
              <tr key={p.id} className="hover:bg-slate-50/50">
                <td className="px-4 py-3 font-mono text-xs text-slate-600">
                  {new Date(p.posted_at).toLocaleDateString("fr-FR")}
                </td>
                <td className="px-4 py-3 text-slate-900">{p.facebook_groups?.group_name ?? "—"}</td>
                <td className="px-4 py-3 text-slate-500">T{p.template_id} — {p.facebook_templates?.label}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                    {p.status}
                  </span>
                </td>
              </tr>
            ))}
            {!posts.length && (
              <tr><td colSpan={4} className="px-4 py-6 text-center text-slate-400">Aucun post envoyé</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

- [ ] **Vérifier TypeScript**
```bash
npx tsc --noEmit
```

- [ ] **Commit**
```bash
git add src/app/admin/(protected)/agents/facebook-outreach/
git commit -m "feat(admin): dashboard Facebook Outreach — groupes, planning, historique"
```

---

## Chunk 7 : Finalisation et mise en prod

### Task 10 : Variables d'environnement + lien nav admin

- [ ] **Ajouter dans `.env.local`**
```
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
TELEGRAM_WEBHOOK_SECRET=
```

- [ ] **Ajouter ces 3 variables dans Vercel** (Dashboard → Settings → Env vars → Production)

- [ ] **Ajouter le lien dans AdminShell** (`src/app/admin/_components/AdminShell.tsx`)
  Chercher le menu de navigation existant et ajouter :
  ```
  { href: "/admin/agents/facebook-outreach", label: "Facebook Outreach" }
  ```

- [ ] **Push + déploiement**
```bash
git add -A
git commit -m "feat: facebook outreach system complet — telegram bot + scheduling + dashboard"
git push origin main
```

- [ ] **Après déploiement : enregistrer le webhook Telegram**
```bash
curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://vanzonexplorer.com/api/telegram/webhook","secret_token":"<SECRET>"}'
```

- [ ] **Test end-to-end**
  1. Appliquer la migration Supabase
  2. Ajouter 1 groupe dans le dashboard
  3. Lancer `npx tsx scripts/agents/generate-facebook-schedule.ts --days 7`
  4. Déclencher manuellement le cron GitHub Actions
  5. Vérifier réception Telegram avec boutons
  6. Cliquer "✅ Posté" → vérifier que le post apparaît dans l'historique

---

## Ordre d'exécution recommandé

```
Chunk 1 → Chunk 2 → Chunk 3 → Chunk 4 → Chunk 5 → Chunk 6 → Chunk 7
Migration → Script → Telegram Bot → Cron → API → Dashboard → Prod
```

Chaque chunk est déployable et testable indépendamment.
