# Telegram Assistant Agent — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transformer le bot Telegram existant en assistant conversationnel qui comprend le langage naturel, envoie des emails via Gmail API avec signature automatique, et supporte une confirmation/modification avant envoi.

**Architecture:** Webhook existant étendu avec un thin router (Facebook callbacks inchangés), intent parser Groq, registre d'actions extensible, client Gmail API, et table Supabase pour les actions en attente de confirmation.

**Tech Stack:** Next.js 14 App Router, Groq (llama-3.3-70b), Gmail API (OAuth2), Supabase, Telegram Bot API, Zod

**Spec:** `docs/superpowers/specs/2026-04-01-telegram-assistant-design.md`

---

## Chunk 1: Infrastructure

### Task 1 : Migration Supabase — telegram_pending_actions

**Files:**
- Create: `supabase/migrations/20260401000003_telegram_pending_actions.sql`

- [ ] **Créer le fichier de migration**

```sql
-- supabase/migrations/20260401000003_telegram_pending_actions.sql
CREATE TABLE IF NOT EXISTS telegram_pending_actions (
  id          TEXT PRIMARY KEY,
  chat_id     BIGINT NOT NULL,
  action      TEXT NOT NULL,
  state       TEXT NOT NULL DEFAULT 'awaiting_confirmation',
  payload     JSONB NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  expires_at  TIMESTAMPTZ DEFAULT NOW() + INTERVAL '10 minutes'
);

CREATE INDEX IF NOT EXISTS idx_telegram_pending_chat
  ON telegram_pending_actions(chat_id);

COMMENT ON TABLE telegram_pending_actions IS
  'Actions Telegram en attente de confirmation (TTL 10 min). States: awaiting_confirmation | awaiting_edit | awaiting_selection';
```

- [ ] **Appliquer la migration** via le dashboard Supabase (SQL editor) ou :

```bash
npx supabase db push
```

- [ ] **Vérifier** dans Supabase Studio que la table existe avec les colonnes et l'index.

- [ ] **Commit**

```bash
git add supabase/migrations/20260401000003_telegram_pending_actions.sql
git commit -m "feat(db): table telegram_pending_actions — pending actions TTL 10min"
```

---

### Task 2 : Client Gmail API

**Files:**
- Create: `src/lib/gmail.ts`

- [ ] **Créer `src/lib/gmail.ts`**

```typescript
// src/lib/gmail.ts
// Client Gmail API — getAccessToken, fetchSignature, sendEmail
// Utilise GMAIL_REFRESH_TOKEN + GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET

const GMAIL_API = "https://gmail.googleapis.com/gmail/v1";
const TOKEN_URL = "https://oauth2.googleapis.com/token";

// ── OAuth2 ────────────────────────────────────────────────────────────────────
export async function getGmailAccessToken(): Promise<string> {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id:     process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: process.env.GMAIL_REFRESH_TOKEN!,
      grant_type:    "refresh_token",
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`[gmail] token exchange failed: ${err}`);
  }
  const data = await res.json() as { access_token: string };
  return data.access_token;
}

// ── Signature ─────────────────────────────────────────────────────────────────
export async function fetchGmailSignature(sendAsEmail: string): Promise<string> {
  try {
    const token = await getGmailAccessToken();
    const res = await fetch(
      `${GMAIL_API}/users/me/settings/sendAs/${encodeURIComponent(sendAsEmail)}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!res.ok) return "";
    const data = await res.json() as { signature?: string };
    return data.signature ?? "";
  } catch {
    return "";
  }
}

// ── Envoi email ───────────────────────────────────────────────────────────────
interface SendEmailOptions {
  to:        string;
  subject:   string;
  htmlBody:  string;
  signature: string; // HTML — vide si non configurée
}

export async function sendGmailEmail(opts: SendEmailOptions): Promise<void> {
  const { to, subject, htmlBody, signature } = opts;

  // Encode subject en UTF-8 base64 pour les caractères non-ASCII
  const subjectEncoded = `=?utf-8?B?${Buffer.from(subject).toString("base64")}?=`;

  // Corps final : body + signature séparée par <br><br> si non vide
  const fullHtml = signature
    ? `${htmlBody}<br><br>${signature}`
    : htmlBody;

  // RFC 2822 MIME message
  const mime = [
    `From: Jules - Vanzon Explorer <jules@vanzonexplorer.com>`,
    `To: ${to}`,
    `Subject: ${subjectEncoded}`,
    `MIME-Version: 1.0`,
    `Content-Type: text/html; charset=utf-8`,
    ``,
    fullHtml,
  ].join("\r\n");

  const raw = Buffer.from(mime).toString("base64url");

  const token = await getGmailAccessToken();
  const res = await fetch(`${GMAIL_API}/users/me/messages/send`, {
    method:  "POST",
    headers: {
      Authorization:  `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ raw }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`[gmail] send failed: ${err}`);
  }
}
```

- [ ] **Vérifier TypeScript**

```bash
npx tsc --noEmit 2>&1 | grep gmail
```

Attendu : aucune erreur.

- [ ] **Commit**

```bash
git add src/lib/gmail.ts
git commit -m "feat(gmail): client OAuth2 — getAccessToken, fetchSignature, sendEmail"
```

---

### Task 3 : Script one-shot — obtenir GMAIL_REFRESH_TOKEN

**Files:**
- Create: `scripts/get-gmail-token.ts` *(script one-shot, ne pas inclure dans registry)*

- [ ] **Créer `scripts/get-gmail-token.ts`**

```typescript
// scripts/get-gmail-token.ts
// Script one-shot pour obtenir le refresh token Gmail.
// Usage : npx tsx scripts/get-gmail-token.ts
// Pré-requis : GOOGLE_CLIENT_ID et GOOGLE_CLIENT_SECRET dans .env.local
// Scopes requis : gmail.send + gmail.settings.basic

import * as http from "http";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const CLIENT_ID     = process.env.GOOGLE_CLIENT_ID!;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
const REDIRECT_URI  = "http://localhost:3333/callback";

const SCOPES = [
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/gmail.settings.basic",
].join(" ");

const authUrl =
  `https://accounts.google.com/o/oauth2/v2/auth` +
  `?client_id=${CLIENT_ID}` +
  `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
  `&response_type=code` +
  `&scope=${encodeURIComponent(SCOPES)}` +
  `&access_type=offline` +
  `&prompt=consent`;

console.log("\n🔗 Ouvre cette URL dans ton navigateur :\n");
console.log(authUrl);
console.log("\nEn attente du callback sur http://localhost:3333...\n");

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url!, "http://localhost:3333");
  const code = url.searchParams.get("code");
  if (!code) { res.end("No code"); return; }

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id:     CLIENT_ID,
      client_secret: CLIENT_SECRET,
      redirect_uri:  REDIRECT_URI,
      grant_type:    "authorization_code",
    }),
  });

  const data = await tokenRes.json() as { refresh_token?: string; error?: string };

  if (data.refresh_token) {
    console.log("\n✅ GMAIL_REFRESH_TOKEN obtenu :\n");
    console.log(data.refresh_token);
    console.log("\nAjoute-le dans .env.local et dans les variables Vercel :\n");
    console.log(`GMAIL_REFRESH_TOKEN=${data.refresh_token}\n`);
    res.end("✅ Token obtenu ! Tu peux fermer cet onglet.");
  } else {
    console.error("❌ Erreur :", data);
    res.end("❌ Erreur, voir le terminal.");
  }
  server.close();
});

server.listen(3333);
```

- [ ] **Ajouter `GMAIL_REFRESH_TOKEN` aux env vars** (une fois le token obtenu) :

```bash
# .env.local
GMAIL_REFRESH_TOKEN=<token_obtenu>
```

Et dans Vercel Dashboard → Settings → Environment Variables.

- [ ] **Commit**

```bash
git add scripts/get-gmail-token.ts
git commit -m "chore: script one-shot obtention GMAIL_REFRESH_TOKEN"
```

---

## Chunk 2: Intent Parser + Actions

### Task 4 : Intent Parser (Groq)

**Files:**
- Create: `src/lib/telegram-assistant/intent.ts`

- [ ] **Créer `src/lib/telegram-assistant/intent.ts`**

```typescript
// src/lib/telegram-assistant/intent.ts
// Parse un message Telegram en langage naturel → { action, params }
// via Groq llama-3.3-70b avec validation Zod.

import Groq from "groq-sdk";
import { z } from "zod";

const IntentSchema = z.object({
  action: z.string(),
  params: z.record(z.string()),
});

export type ParsedIntent = z.infer<typeof IntentSchema>;

export async function parseIntent(
  message: string,
  availableActions: Array<{ name: string; description: string }>
): Promise<ParsedIntent> {
  const actionsText = availableActions
    .map((a) => `- "${a.name}": ${a.description}`)
    .join("\n");

  const systemPrompt = `Tu es l'assistant de Jules Gaveglio (fondateur de Vanzon Explorer).
Tu reçois des messages en langage naturel et tu dois identifier l'action à effectuer.

Actions disponibles :
${actionsText}
- "unknown": si aucune action ne correspond

Réponds UNIQUEMENT avec du JSON valide, sans texte avant ou après :
{
  "action": "<nom_de_l_action>",
  "params": { "<clé>": "<valeur>" }
}

Exemples :
- "envoie un email à Séverine pour son retour road trip" → {"action":"send_email","params":{"prenom":"Séverine","email_type":"road_trip_feedback"}}
- "c'est quoi ma prochaine résa ?" → {"action":"get_next_reservation","params":{}}
- "bonjour" → {"action":"unknown","params":{"fallback_message":"Bonjour ! Je peux envoyer des emails ou consulter tes réservations."}}`;

  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });

  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user",   content: message },
      ],
      temperature: 0,
      max_tokens:  200,
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    const cleaned = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
    const parsed = JSON.parse(cleaned);
    return IntentSchema.parse(parsed);
  } catch {
    return { action: "unknown", params: { fallback_message: "Je n'ai pas compris 🤷 Réessaie autrement." } };
  }
}
```

- [ ] **Vérifier TypeScript**

```bash
npx tsc --noEmit 2>&1 | grep intent
```

Attendu : aucune erreur.

- [ ] **Commit**

```bash
git add src/lib/telegram-assistant/intent.ts
git commit -m "feat(assistant): intent parser Groq — langage naturel → action JSON"
```

---

### Task 5 : Action Registry + send_email handler

**Files:**
- Create: `src/lib/telegram-assistant/actions/send-email.ts`
- Create: `src/lib/telegram-assistant/actions/index.ts`

- [ ] **Créer `src/lib/telegram-assistant/actions/send-email.ts`**

```typescript
// src/lib/telegram-assistant/actions/send-email.ts
import Groq from "groq-sdk";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { fetchGmailSignature } from "@/lib/gmail";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;

// ── Helpers Telegram ──────────────────────────────────────────────────────────
async function tgSend(chatId: number, text: string, extra?: object) {
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML", ...extra }),
  });
}

// ── ID court (10 chars hex) ───────────────────────────────────────────────────
function shortId(): string {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 10);
  // ex: "f47ac10b8e" — callback_data max: "asst:confirm:f47ac10b8e" = 23 chars < 64 bytes Telegram ✓
}

// ── Génération email via Groq ─────────────────────────────────────────────────
interface EmailDraft {
  subject: string;
  body:    string; // HTML <p> uniquement
}

async function generateEmailDraft(
  prenom: string,
  region: string,
  duree:  number
): Promise<EmailDraft> {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });

  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "system",
        content: `Tu es Jules Gaveglio, fondateur de Vanzon Explorer (location de vans aménagés au Pays Basque).
Génère un email professionnel et chaleureux en français pour demander un retour sincère à ${prenom}
qui a utilisé notre outil de génération de road trip personnalisé pour ${duree} jours en ${region}.

Règles :
- Ton chaleureux et authentique, pas corporatif
- Mentionner leur road trip spécifique (région + durée)
- Demander un retour sincère et honnête sur l'outil
- 3-4 courts paragraphes maximum
- PAS de formule de politesse finale (ex: "Cordialement", "Bien à vous") — la signature est ajoutée automatiquement
- Corps en HTML avec uniquement des balises <p>

Réponds UNIQUEMENT avec du JSON valide :
{"subject": "...", "body": "<p>...</p><p>...</p>"}`,
      },
      { role: "user", content: "Génère l'email." },
    ],
    temperature: 0.7,
    max_tokens:  600,
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";
  const cleaned = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
  const data = JSON.parse(cleaned) as EmailDraft;
  return data;
}

// ── Handler principal ─────────────────────────────────────────────────────────
export async function sendEmailHandler(
  params: Record<string, string>,
  chatId: number
): Promise<void> {
  const prenom = params.prenom;
  if (!prenom) {
    await tgSend(chatId, "❓ Je n'ai pas compris à qui envoyer l'email. Précise le prénom.");
    return;
  }

  const supabase = createSupabaseAdmin();

  // 1. Chercher dans road_trip_requests (status='sent' uniquement)
  const { data: results } = await supabase
    .from("road_trip_requests")
    .select("id, prenom, email, region, duree, created_at")
    .ilike("prenom", prenom)
    .eq("status", "sent")
    .order("created_at", { ascending: false });

  const rows = results ?? [];

  // 2a. Aucun résultat
  if (rows.length === 0) {
    await tgSend(chatId, `🤷 <b>${prenom}</b> introuvable dans les road trips envoyés.`);
    return;
  }

  // 2b. Plusieurs résultats — désambiguïsation
  if (rows.length > 1) {
    try {
      const pendingId = shortId();
      await supabase.from("telegram_pending_actions").insert({
        id:      pendingId,
        chat_id: chatId,
        action:  "send_email",
        state:   "awaiting_selection",
        payload: { candidates: rows.map((r) => ({
          id: r.id, prenom: r.prenom, email: r.email,
          region: r.region, duree: r.duree, created_at: r.created_at,
        })) },
      });

      const buttons = rows.slice(0, 5).map((r, i) => [{
        text:          `${r.prenom} — ${r.region} (${r.duree}j, ${new Date(r.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })})`,
        callback_data: `asst:select:${pendingId}:${i}`,
      }]);

      await tgSend(chatId, `📋 Plusieurs <b>${prenom}</b> trouvés. Lequel ?`, {
        reply_markup: { inline_keyboard: buttons },
      });
    } catch (err) {
      console.error("[send-email] disambiguation error:", err);
      await tgSend(chatId, "❌ Erreur serveur, réessaie 🔄");
    }
    return;
  }

  // 2c. Un seul résultat — continuer directement
  await buildAndSendPreview(chatId, rows[0]);
}

// ── Construire l'aperçu et stocker la pending action ─────────────────────────
export async function buildAndSendPreview(
  chatId: number,
  row: { id: string; prenom: string; email: string; region: string; duree: number }
): Promise<void> {
  const supabase = createSupabaseAdmin();

  await tgSend(chatId, "⏳ Génération de l'email en cours...");

  try {
    // Générer le brouillon
    const draft = await generateEmailDraft(row.prenom, row.region, row.duree);

    // Récupérer la signature Gmail
    const signature = await fetchGmailSignature("jules@vanzonexplorer.com");

    // Stocker la pending action
    const pendingId = shortId();
    await supabase.from("telegram_pending_actions").insert({
      id:      pendingId,
      chat_id: chatId,
      action:  "send_email",
      state:   "awaiting_confirmation",
      payload: {
        to:        row.email,
        subject:   draft.subject,
        body:      draft.body,
        signature,
        prenom:    row.prenom,
        region:    row.region,
        duree:     row.duree,
      },
    });

    // Construire le texte d'aperçu (HTML Telegram, pas d'HTML email ici)
    const bodyPreview = draft.body
      .replace(/<[^>]+>/g, "")   // strip HTML pour aperçu Telegram
      .slice(0, 400)
      .trim();

    // Échapper les caractères HTML pour Telegram parse_mode HTML
    const escaped = bodyPreview
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    const preview =
      `📧 <b>Aperçu de l'email</b>\n` +
      `─────────────────────\n` +
      `<b>À :</b> ${row.email}\n` +
      `<b>Objet :</b> ${draft.subject}\n\n` +
      `${escaped}${bodyPreview.length >= 400 ? "…" : ""}\n\n` +
      `<i>${signature ? "[signature configurée ✓]" : "[aucune signature trouvée]"}</i>\n` +
      `─────────────────────`;

    await tgSend(chatId, preview, {
      reply_markup: {
        inline_keyboard: [[
          { text: "✅ Envoyer",   callback_data: `asst:confirm:${pendingId}` },
          { text: "✏️ Modifier", callback_data: `asst:edit:${pendingId}` },
        ]],
      },
    });
  } catch (err) {
    console.error("[send-email] error:", err);
    await tgSend(chatId, "❌ Erreur lors de la génération de l'email. Réessaie 🔄");
  }
}
```

- [ ] **Créer `src/lib/telegram-assistant/actions/index.ts`**

```typescript
// src/lib/telegram-assistant/actions/index.ts
// Registre des actions disponibles pour l'assistant Telegram.
// Ajouter une nouvelle action = 1 fichier + 1 entrée ici.

import { sendEmailHandler } from "./send-email";

export interface ActionDef {
  description: string;
  handler: (params: Record<string, string>, chatId: number) => Promise<void>;
}

export const ACTIONS: Record<string, ActionDef> = {
  send_email: {
    description:
      "Envoyer un email à un utilisateur (ex: demander un retour sur le road trip personnalisé). " +
      "Params attendus: prenom (prénom du destinataire), email_type (ex: road_trip_feedback).",
    handler: sendEmailHandler,
  },

  // ── Futures actions ─────────────────────────────────────────────────────────
  // get_next_reservation: {
  //   description: "Donner la prochaine réservation de van (locataire, dates, van).",
  //   handler: getNextReservationHandler,
  // },
};

// Liste pour injection dans le prompt Groq
export function getActionDescriptions() {
  return Object.entries(ACTIONS).map(([name, def]) => ({
    name,
    description: def.description,
  }));
}
```

- [ ] **Vérifier TypeScript**

```bash
npx tsc --noEmit 2>&1 | grep -E "send-email|actions"
```

Attendu : aucune erreur.

- [ ] **Commit**

```bash
git add src/lib/telegram-assistant/actions/
git commit -m "feat(assistant): action registry + send_email handler (Groq + Gmail + Supabase preview)"
```

---

## Chunk 3: Router + Webhook

### Task 6 : Assistant Router

**Files:**
- Create: `src/lib/telegram-assistant/router.ts`

- [ ] **Créer `src/lib/telegram-assistant/router.ts`**

```typescript
// src/lib/telegram-assistant/router.ts
// Gère les messages et callbacks de l'assistant Telegram.
// Appelé depuis le webhook uniquement si ce n'est pas un callback Facebook.

import { createSupabaseAdmin } from "@/lib/supabase/server";
import { parseIntent } from "./intent";
import { ACTIONS, getActionDescriptions } from "./actions/index";
import { buildAndSendPreview } from "./actions/send-email";
import { sendGmailEmail } from "@/lib/gmail";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;

// ── Helpers Telegram ──────────────────────────────────────────────────────────
async function tgSend(chatId: number, text: string, extra?: object) {
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML", ...extra }),
  });
}

async function tgAnswer(callbackQueryId: string, text = "") {
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ callback_query_id: callbackQueryId, text }),
  });
}

// ── Nettoyage des actions expirées ────────────────────────────────────────────
async function cleanExpired(supabase: ReturnType<typeof createSupabaseAdmin>) {
  await supabase
    .from("telegram_pending_actions")
    .delete()
    .lt("expires_at", new Date().toISOString());
}

// ── handleAssistantMessage ────────────────────────────────────────────────────
export async function handleAssistantMessage(
  text:   string,
  chatId: number
): Promise<void> {
  const supabase = createSupabaseAdmin();
  await cleanExpired(supabase);

  // 1. Vérifier awaiting_edit AVANT de passer à Groq
  const { data: editAction } = await supabase
    .from("telegram_pending_actions")
    .select("*")
    .eq("chat_id", chatId)
    .eq("state", "awaiting_edit")
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  if (editAction) {
    // Traiter le message comme le nouveau corps de l'email
    const payload = editAction.payload as Record<string, string>;
    payload.body = text
      .split("\n")
      .map((line) => `<p>${line}</p>`)
      .join("");

    await supabase
      .from("telegram_pending_actions")
      .update({
        state:      "awaiting_confirmation",
        payload,
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      })
      .eq("id", editAction.id);

    // Renvoyer l'aperçu mis à jour
    const bodyPreview = text.slice(0, 400).trim();
    const preview =
      `📧 <b>Email mis à jour — Aperçu</b>\n` +
      `─────────────────────\n` +
      `<b>À :</b> ${payload.to}\n` +
      `<b>Objet :</b> ${payload.subject}\n\n` +
      `${bodyPreview}${bodyPreview.length >= 400 ? "…" : ""}\n` +
      `─────────────────────`;

    await tgSend(chatId, preview, {
      reply_markup: {
        inline_keyboard: [[
          { text: "✅ Envoyer",   callback_data: `asst:confirm:${editAction.id}` },
          { text: "✏️ Modifier", callback_data: `asst:edit:${editAction.id}` },
        ]],
      },
    });
    return;
  }

  // 2. Vérifier awaiting_selection (cas rare : texte à la place d'un bouton)
  const { data: selAction } = await supabase
    .from("telegram_pending_actions")
    .select("*")
    .eq("chat_id", chatId)
    .eq("state", "awaiting_selection")
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  if (selAction) {
    await tgSend(chatId, "👆 Clique sur l'un des boutons ci-dessus pour sélectionner la personne.");
    return;
  }

  // 3. Intent parser Groq
  const intent = await parseIntent(text, getActionDescriptions());

  if (intent.action === "unknown") {
    const msg = intent.params.fallback_message ?? "Je n'ai pas compris 🤷 Réessaie autrement.";
    await tgSend(chatId, msg);
    return;
  }

  const actionDef = ACTIONS[intent.action];
  if (!actionDef) {
    await tgSend(chatId, `⚠️ Action "<b>${intent.action}</b>" non implémentée.`);
    return;
  }

  await actionDef.handler(intent.params, chatId);
}

// ── handleAssistantCallback ───────────────────────────────────────────────────
export async function handleAssistantCallback(
  callbackQueryId: string,
  data:            string,
  chatId:          number
): Promise<void> {
  const supabase = createSupabaseAdmin();
  const parts = data.split(":");
  // Format : asst:<type>:<pendingId>[:<index>]
  const type      = parts[1];
  const pendingId = parts[2];
  const index     = parts[3] !== undefined ? parseInt(parts[3], 10) : undefined;

  // Répondre immédiatement au callback (dismiss spinner)
  await tgAnswer(callbackQueryId);

  // Récupérer la pending action
  const { data: action } = await supabase
    .from("telegram_pending_actions")
    .select("*")
    .eq("id", pendingId)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  if (!action) {
    await tgSend(chatId, "⏱ Demande expirée (10 min). Recommence 🔄");
    return;
  }

  const payload = action.payload as Record<string, unknown>;

  // ── asst:confirm:<pendingId> ─────────────────────────────────────────────
  if (type === "confirm") {
    try {
      await sendGmailEmail({
        to:        payload.to as string,
        subject:   payload.subject as string,
        htmlBody:  payload.body as string,
        signature: payload.signature as string,
      });

      await supabase
        .from("telegram_pending_actions")
        .delete()
        .eq("id", pendingId);

      await tgSend(chatId, `✅ Email envoyé à <b>${payload.to}</b>`);
    } catch (err) {
      console.error("[assistant] confirm send error:", err);
      await tgSend(chatId, "❌ Erreur lors de l'envoi. Réessaie 🔄");
    }
    return;
  }

  // ── asst:edit:<pendingId> ────────────────────────────────────────────────
  if (type === "edit") {
    await supabase
      .from("telegram_pending_actions")
      .update({
        state:      "awaiting_edit",
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      })
      .eq("id", pendingId);

    // Extraire le texte brut du corps HTML pour l'édition
    const bodyText = (payload.body as string)
      .replace(/<p>/g, "")
      .replace(/<\/p>/g, "\n")
      .replace(/<[^>]+>/g, "")
      .trim();

    await tgSend(
      chatId,
      `✏️ Modifie le texte ci-dessous et renvoie-le moi :\n\n${bodyText}`,
      { reply_markup: { force_reply: true, selective: true } }
    );
    return;
  }

  // ── asst:select:<pendingId>:<index> ─────────────────────────────────────
  if (type === "select" && index !== undefined) {
    const candidates = payload.candidates as Array<{
      id: string; prenom: string; email: string; region: string; duree: number;
    }>;
    const selected = candidates[index];
    if (!selected) {
      await tgSend(chatId, "❓ Sélection invalide.");
      return;
    }

    // Supprimer la pending selection et lancer la génération
    await supabase
      .from("telegram_pending_actions")
      .delete()
      .eq("id", pendingId);

    await buildAndSendPreview(chatId, selected);
    return;
  }

  await tgSend(chatId, "❓ Action inconnue.");
}
```

- [ ] **Vérifier TypeScript**

```bash
npx tsc --noEmit 2>&1 | grep router
```

Attendu : aucune erreur.

- [ ] **Commit**

```bash
git add src/lib/telegram-assistant/router.ts
git commit -m "feat(assistant): router — handleAssistantMessage + handleAssistantCallback"
```

---

### Task 7 : Modification du webhook existant

**Files:**
- Modify: `src/app/api/telegram/webhook/route.ts`

- [ ] **Remplacer le contenu de `src/app/api/telegram/webhook/route.ts`**

```typescript
// src/app/api/telegram/webhook/route.ts
// Thin router : dispatche vers Facebook outreach ou Assistant selon le type d'événement.

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { handleAssistantMessage, handleAssistantCallback } from "@/lib/telegram-assistant/router";

const BOT_TOKEN      = process.env.TELEGRAM_BOT_TOKEN!;
const WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET!;

async function sendTelegram(chatId: string, text: string) {
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
  });
}

async function answerCallback(callbackQueryId: string, text: string) {
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ callback_query_id: callbackQueryId, text }),
  });
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get("X-Telegram-Bot-Api-Secret-Token");
  if (secret !== WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json() as {
    message?: {
      message_id: number;
      chat:       { id: number };
      text?:      string;
    };
    callback_query?: {
      id:       string;
      from:     { id: number };
      data?:    string;
      message?: { message_id: number; chat: { id: number } };
    };
  };

  // ── Message texte → Assistant ─────────────────────────────────────────────
  if (body.message?.text) {
    const chatId = body.message.chat.id;
    await handleAssistantMessage(body.message.text, chatId);
    return NextResponse.json({ ok: true });
  }

  // ── Callback query ─────────────────────────────────────────────────────────
  const cb = body.callback_query;
  if (!cb?.data) return NextResponse.json({ ok: true });

  const chatId  = cb.message?.chat.id ?? cb.from.id;
  const [action] = cb.data.split(":");

  // Callbacks Facebook : "posted:<uuid>" ou "skip:<uuid>"
  if (action === "posted" || action === "skip") {
    const scheduleId = cb.data.split(":")[1];
    await answerCallback(cb.id, action === "posted" ? "✅ Enregistré !" : "⏭ Reporté");

    const supabase = createSupabaseAdmin();

    if (action === "posted") {
      const { data: slot } = await supabase
        .from("facebook_outreach_schedule")
        .select("group_id, template_id, facebook_templates(content)")
        .eq("id", scheduleId)
        .single() as {
          data: {
            group_id:           string;
            template_id:        number;
            facebook_templates: { content: string } | null;
          } | null;
        };

      if (slot) {
        await supabase
          .from("facebook_outreach_schedule")
          .update({ status: "sent", updated_at: new Date().toISOString() })
          .eq("id", scheduleId);

        await supabase.from("facebook_outreach_posts").insert({
          group_id:        slot.group_id,
          template_id:     slot.template_id,
          message_content: slot.facebook_templates?.content ?? "",
          status:          "sent",
          telegram_message_id: cb.message?.message_id ?? null,
          posted_at:       new Date().toISOString(),
        });
      }

      await sendTelegram(String(chatId), "✅ Post enregistré dans l'historique !");
    } else {
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
            updated_at:    new Date().toISOString(),
          })
          .eq("id", scheduleId);
      }

      await sendTelegram(String(chatId), "⏭ Reporté au lendemain.");
    }

    return NextResponse.json({ ok: true });
  }

  // Callbacks Assistant : "asst:<type>:<pendingId>[:<index>]"
  if (action === "asst") {
    await handleAssistantCallback(cb.id, cb.data, chatId);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: true });
}
```

- [ ] **Vérifier TypeScript (build complet)**

```bash
npx tsc --noEmit
```

Attendu : aucune erreur.

- [ ] **Commit**

```bash
git add src/app/api/telegram/webhook/route.ts
git commit -m "feat(webhook): router assistant — messages texte + callbacks asst:* intégrés"
```

---

### Task 8 : Variables d'env + test end-to-end

- [ ] **Vérifier que `.env.local` contient toutes les variables requises**

```bash
grep -E "TELEGRAM_BOT_TOKEN|TELEGRAM_WEBHOOK_SECRET|GROQ_API_KEY|GMAIL_REFRESH_TOKEN|GOOGLE_CLIENT_ID|GOOGLE_CLIENT_SECRET" .env.local
```

Attendu : 6 lignes avec des valeurs.

- [ ] **Obtenir `GMAIL_REFRESH_TOKEN`** si pas encore fait :

```bash
npx tsx scripts/get-gmail-token.ts
```

Suivre les instructions dans le terminal. Copier le token dans `.env.local` et Vercel.

- [ ] **Ajouter `GMAIL_REFRESH_TOKEN` dans Vercel** :

Vercel Dashboard → Project → Settings → Environment Variables → Add :
```
GMAIL_REFRESH_TOKEN = <valeur>
```

- [ ] **Déployer**

```bash
git push origin main
```

Le deploy Vercel se déclenche automatiquement.

- [ ] **Test end-to-end depuis Telegram** :

Envoyer dans le chat Telegram :
```
envoie un email à <prénom d'un vrai road trip en base> pour avoir son retour
```

Attendu :
1. Bot répond "⏳ Génération de l'email en cours..."
2. Bot envoie l'aperçu avec `[✅ Envoyer] [✏️ Modifier]`
3. Cliquer ✏️ Modifier → Telegram ouvre la réponse avec le texte de l'email
4. Modifier et envoyer → nouvel aperçu s'affiche
5. Cliquer ✅ Envoyer → "✅ Email envoyé à xxx@xxx.com"
6. Vérifier la réception dans la boîte du destinataire (ou ton propre email pour test)

- [ ] **Test avec prénom inexistant** :

```
envoie un email à Zébulon
```

Attendu : "🤷 **Zébulon** introuvable dans les road trips envoyés."

- [ ] **Commit final**

```bash
git add .env.local  # NE PAS committer le vrai token — vérifier que .gitignore couvre .env.local
git status          # s'assurer que .env.local n'apparaît pas en staged
git commit -m "feat(assistant): telegram assistant v1 complet — send_email + confirm/modifier/envoyer"
```

---

## Résumé des fichiers

| Fichier | Statut | Rôle |
|---|---|---|
| `supabase/migrations/20260401000002_telegram_pending_actions.sql` | Créé | Table TTL 10min |
| `src/lib/gmail.ts` | Créé | OAuth2 + signature + envoi |
| `scripts/get-gmail-token.ts` | Créé | Script one-shot token |
| `src/lib/telegram-assistant/intent.ts` | Créé | Parser Groq → JSON |
| `src/lib/telegram-assistant/actions/index.ts` | Créé | Registre extensible |
| `src/lib/telegram-assistant/actions/send-email.ts` | Créé | Handler email + preview |
| `src/lib/telegram-assistant/router.ts` | Créé | handleMessage + handleCallback |
| `src/app/api/telegram/webhook/route.ts` | Modifié | Thin router (Facebook inchangé) |
