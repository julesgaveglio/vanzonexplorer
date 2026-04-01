# Telegram General Agent — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transformer l'assistant Telegram en agent général avec Groq tool-calling, accès Supabase en lecture, lecture/réponse Gmail, et mémoire d'emails few-shot.

**Architecture:** On remplace le système intent+registry par une boucle Groq tool-calling native. L'agent dispose de 7 outils (Supabase + Gmail). Chaque email validé est sauvegardé en base pour améliorer progressivement le style des futures générations.

**Tech Stack:** Next.js 14, Groq (llama-3.3-70b-versatile, tool_calling), Gmail API (OAuth2, gmail.readonly), Supabase (createSupabaseAdmin), Zod

**Spec:** `docs/superpowers/specs/2026-04-01-telegram-general-agent-design.md`

---

## Chunk 1: Infrastructure

### Task 1 : Migration Supabase — telegram_email_memory

**Files:**
- Create: `supabase/migrations/20260401000004_telegram_email_memory.sql`

- [ ] **Créer le fichier de migration**

```sql
-- supabase/migrations/20260401000004_telegram_email_memory.sql
CREATE TABLE IF NOT EXISTS telegram_email_memory (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_type TEXT NOT NULL,
  context     JSONB NOT NULL DEFAULT '{}',
  subject     TEXT NOT NULL,
  body        TEXT NOT NULL,
  approved_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_memory_type
  ON telegram_email_memory(action_type, approved_at DESC);

COMMENT ON TABLE telegram_email_memory IS
  'Emails approuvés par Jules — few-shot examples pour améliorer la génération Groq. action_type: road_trip_feedback | gmail_reply';
```

- [ ] **Appliquer la migration** via Supabase Dashboard → SQL Editor

- [ ] **Commit**

```bash
git add supabase/migrations/20260401000004_telegram_email_memory.sql
git commit -m "feat(db): table telegram_email_memory — few-shot email memory"
```

---

### Task 2 : Module email-memory

**Files:**
- Create: `src/lib/telegram-assistant/email-memory.ts`

- [ ] **Créer `src/lib/telegram-assistant/email-memory.ts`**

```typescript
// src/lib/telegram-assistant/email-memory.ts
// Sauvegarde et récupère des emails approuvés comme exemples few-shot pour Groq.

import { createSupabaseAdmin } from "@/lib/supabase/server";

export interface EmailExample {
  action_type: string;
  context:     Record<string, unknown>;
  subject:     string;
  body:        string;
}

// Sauvegarde un email approuvé en mémoire
export async function saveEmailToMemory(example: EmailExample): Promise<void> {
  try {
    const supabase = createSupabaseAdmin();
    await supabase.from("telegram_email_memory").insert({
      action_type: example.action_type,
      context:     example.context,
      subject:     example.subject,
      body:        example.body,
    });
  } catch (err) {
    // Non-bloquant : la mémoire est best-effort
    console.error("[email-memory] save failed:", err);
  }
}

// Récupère les N derniers exemples approuvés du même type pour injection few-shot
export async function getEmailExamples(
  actionType: string,
  limit = 3
): Promise<EmailExample[]> {
  try {
    const supabase = createSupabaseAdmin();
    const { data } = await supabase
      .from("telegram_email_memory")
      .select("action_type, context, subject, body")
      .eq("action_type", actionType)
      .order("approved_at", { ascending: false })
      .limit(limit);
    return (data ?? []) as EmailExample[];
  } catch {
    return [];
  }
}

// Formate les exemples pour injection dans un prompt Groq
export function formatExamplesForPrompt(examples: EmailExample[]): string {
  if (examples.length === 0) return "";
  return (
    "\n\nExemples d'emails que Jules a déjà approuvés (utilise-les comme référence de style et de ton) :\n" +
    examples
      .map(
        (e, i) =>
          `\n--- Exemple ${i + 1} ---\nObjet : ${e.subject}\nCorps :\n${e.body
            .replace(/<p>/g, "")
            .replace(/<\/p>/g, "\n")
            .replace(/<[^>]+>/g, "")
            .trim()}`
      )
      .join("\n")
  );
}
```

- [ ] **Vérifier TypeScript**

```bash
npx tsc --noEmit 2>&1 | grep email-memory
```

Attendu : aucune erreur.

- [ ] **Commit**

```bash
git add src/lib/telegram-assistant/email-memory.ts
git commit -m "feat(assistant): email-memory — few-shot save/fetch/format"
```

---

### Task 3 : Gmail Reader

**Files:**
- Create: `src/lib/telegram-assistant/tools/gmail-reader.ts`

- [ ] **Créer `src/lib/telegram-assistant/tools/gmail-reader.ts`**

```typescript
// src/lib/telegram-assistant/tools/gmail-reader.ts
// Lecture de la boîte Gmail de Jules via Gmail API.
// Nécessite scope gmail.readonly sur le GMAIL_REFRESH_TOKEN.

import { getGmailAccessToken } from "@/lib/gmail";

const GMAIL_API = "https://gmail.googleapis.com/gmail/v1";

export interface EmailSummary {
  id:      string;
  from:    string;
  subject: string;
  date:    string;
  snippet: string;
}

export interface EmailFull extends EmailSummary {
  body:              string; // texte brut
  thread_id:         string;
  message_id_header: string; // valeur du header Message-ID (pour In-Reply-To)
  references:        string; // valeur du header References
}

// ── Types internes Gmail API ──────────────────────────────────────────────────
interface GmailMessageHeader { name: string; value: string }
interface GmailMessagePart   { mimeType: string; body?: { data?: string }; parts?: GmailMessagePart[] }
interface GmailMessage {
  id:        string;
  threadId?: string;
  snippet?:  string;
  payload?: {
    headers?: GmailMessageHeader[];
    body?:    { data?: string };
    parts?:   GmailMessagePart[];
  };
}

function getHeader(headers: GmailMessageHeader[], name: string): string {
  return headers.find(h => h.name.toLowerCase() === name.toLowerCase())?.value ?? "";
}

function extractTextBody(msg: GmailMessage): string {
  // Cherche récursivement text/plain dans les parts
  function findPlain(parts?: GmailMessagePart[]): string | null {
    if (!parts) return null;
    for (const part of parts) {
      if (part.mimeType === "text/plain" && part.body?.data) {
        return Buffer.from(part.body.data, "base64url").toString("utf-8");
      }
      const nested = findPlain(part.parts);
      if (nested) return nested;
    }
    return null;
  }
  const fromParts = findPlain(msg.payload?.parts);
  if (fromParts) return fromParts;
  if (msg.payload?.body?.data) {
    return Buffer.from(msg.payload.body.data, "base64url").toString("utf-8");
  }
  return msg.snippet ?? "";
}

// ── API publique ──────────────────────────────────────────────────────────────
export async function listRecentEmails(
  query      = "in:inbox",
  maxResults = 5
): Promise<EmailSummary[]> {
  const token = await getGmailAccessToken();
  const q = encodeURIComponent(query);
  const res = await fetch(
    `${GMAIL_API}/users/me/messages?q=${q}&maxResults=${maxResults}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) throw new Error(`[gmail-reader] list failed: ${res.status}`);
  const data = await res.json() as { messages?: { id: string }[] };
  if (!data.messages?.length) return [];

  return Promise.all(data.messages.map(m => getEmailSummary(m.id, token)));
}

async function getEmailSummary(messageId: string, token: string): Promise<EmailSummary> {
  const res = await fetch(
    `${GMAIL_API}/users/me/messages/${messageId}?format=metadata` +
    `&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const msg = await res.json() as GmailMessage;
  const h = msg.payload?.headers ?? [];
  return {
    id:      messageId,
    from:    getHeader(h, "From"),
    subject: getHeader(h, "Subject"),
    date:    getHeader(h, "Date"),
    snippet: msg.snippet ?? "",
  };
}

export async function getEmailById(messageId: string): Promise<EmailFull> {
  const token = await getGmailAccessToken();
  const res = await fetch(
    `${GMAIL_API}/users/me/messages/${messageId}?format=full`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) throw new Error(`[gmail-reader] get failed: ${res.status}`);
  const msg = await res.json() as GmailMessage;
  const h = msg.payload?.headers ?? [];
  return {
    id:                messageId,
    from:              getHeader(h, "From"),
    subject:           getHeader(h, "Subject"),
    date:              getHeader(h, "Date"),
    snippet:           msg.snippet ?? "",
    body:              extractTextBody(msg),
    thread_id:         msg.threadId ?? "",
    message_id_header: getHeader(h, "Message-ID"),
    references:        getHeader(h, "References"),
  };
}
```

- [ ] **Vérifier TypeScript**

```bash
npx tsc --noEmit 2>&1 | grep gmail-reader
```

Attendu : aucune erreur.

- [ ] **Commit**

```bash
git add src/lib/telegram-assistant/tools/gmail-reader.ts
git commit -m "feat(assistant): gmail-reader — listRecentEmails, getEmailById"
```

---

### Task 4 : replyGmailEmail + scope gmail.readonly

**Files:**
- Modify: `src/lib/gmail.ts`
- Modify: `scripts/get-gmail-token.ts`

- [ ] **Ajouter `replyGmailEmail` dans `src/lib/gmail.ts`**

Ajouter à la fin du fichier existant (après `sendGmailEmail`) :

```typescript
// ── Réponse email (avec headers de threading) ─────────────────────────────────
export interface ReplyEmailOptions {
  to:          string;
  subject:     string;  // doit commencer par "Re: "
  htmlBody:    string;
  signature:   string;
  in_reply_to: string;  // valeur du header Message-ID original
  references:  string;  // valeur du header References original
  thread_id:   string;  // Gmail thread ID pour threading côté Gmail
}

export async function replyGmailEmail(opts: ReplyEmailOptions): Promise<void> {
  const { to, subject, htmlBody, signature, in_reply_to, references, thread_id } = opts;

  const subjectEncoded = `=?utf-8?B?${Buffer.from(subject).toString("base64")}?=`;
  const fullHtml = signature ? `${htmlBody}<br><br>${signature}` : htmlBody;

  // References combinées : références existantes + message original
  const newReferences = references
    ? `${references} ${in_reply_to}`
    : in_reply_to;

  const mime = [
    `From: Jules - Vanzon Explorer <jules@vanzonexplorer.com>`,
    `To: ${to}`,
    `Subject: ${subjectEncoded}`,
    `In-Reply-To: ${in_reply_to}`,
    `References: ${newReferences}`,
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
    // threadId assure que la réponse s'insère dans le thread Gmail existant
    body: JSON.stringify({ raw, threadId: thread_id }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`[gmail] reply failed: ${err}`);
  }
}
```

- [ ] **Mettre à jour `scripts/get-gmail-token.ts`** — ajouter scope `gmail.readonly`

Modifier le tableau `SCOPES` :

```typescript
const SCOPES = [
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/gmail.settings.basic",
  "https://www.googleapis.com/auth/gmail.readonly",    // ← nouveau
].join(" ");
```

- [ ] **Vérifier TypeScript**

```bash
npx tsc --noEmit 2>&1 | grep gmail
```

Attendu : aucune erreur.

- [ ] **Régénérer le GMAIL_REFRESH_TOKEN** (nécessaire pour le scope readonly) :

```bash
npx tsx scripts/get-gmail-token.ts
```

Ouvrir l'URL dans le navigateur, autoriser, copier le nouveau token.
Mettre à jour `.env.local` ET Vercel Dashboard → Settings → Environment Variables → `GMAIL_REFRESH_TOKEN`.

- [ ] **Commit**

```bash
git add src/lib/gmail.ts scripts/get-gmail-token.ts
git commit -m "feat(gmail): replyGmailEmail avec headers threading + scope readonly"
```

---

## Chunk 2: Système d'outils

> ⚠️ **Prérequis avant Tasks 5-7 :** le `GMAIL_REFRESH_TOKEN` doit avoir le scope `gmail.readonly`. Compléter Task 4 (régénération token) et mettre à jour `.env.local` AVANT de tester tout outil Gmail. Sans ça, `listRecentEmails` et `getEmailById` retourneront 403.

### Task 5 : Tool Definitions

**Files:**
- Create: `src/lib/telegram-assistant/tools/definitions.ts`

- [ ] **Créer `src/lib/telegram-assistant/tools/definitions.ts`**

```typescript
// src/lib/telegram-assistant/tools/definitions.ts
// Définitions des 7 outils au format Groq function calling.
// Groq utilise ces schémas pour décider quels outils appeler et avec quels paramètres.

import type Groq from "groq-sdk";

export const TOOLS: Groq.Chat.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "search_road_trips",
      description:
        "Cherche des demandes de road trip personnalisé dans la base de données. " +
        "Utilise quand Jules demande des infos sur un utilisateur (ex: 'cherche Verins', 'combien de road trips en Bretagne ?'). " +
        "Cherche dans tous les statuts par défaut.",
      parameters: {
        type: "object",
        properties: {
          prenom: {
            type: "string",
            description: "Prénom de la personne (recherche insensible à la casse, partielle)",
          },
          status: {
            type: "string",
            enum: ["pending", "sent", "error", "all"],
            description: "Filtre par statut. 'all' = tous. Défaut: 'all'",
          },
          region: {
            type: "string",
            description: "Région du road trip (ex: 'Bretagne', 'Corse')",
          },
          limit: {
            type: "number",
            description: "Nombre max de résultats. Défaut: 10",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_road_trip_stats",
      description:
        "Retourne les statistiques globales des road trips : total, envoyés, en attente, erreurs, taux de succès.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "search_profiles",
      description:
        "Cherche des profils utilisateurs du site (membres du Club Privé ou utilisateurs gratuits).",
      parameters: {
        type: "object",
        properties: {
          prenom: { type: "string", description: "Prénom (recherche partielle)" },
          plan: {
            type: "string",
            enum: ["free", "club_member", "formation_buyer"],
            description: "Filtre par plan",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_prospects",
      description:
        "Cherche des prospects dans le CRM de prospection partenaires (marques, fabricants).",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Nom de la marque/entreprise" },
          status: {
            type: "string",
            description:
              "Statut du prospect (a_traiter, enrichi, email_genere, contacte, en_discussion, accepte, refuse)",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "send_email_to_road_tripper",
      description:
        "Génère un email de retour d'expérience pour quelqu'un qui a fait un road trip personnalisé, " +
        "et affiche un aperçu à Jules avec [Envoyer] [Modifier] avant d'envoyer quoi que ce soit. " +
        "Utilise quand Jules dit 'envoie un email à X' ou 'demande un retour à Y'.",
      parameters: {
        type: "object",
        required: ["prenom"],
        properties: {
          prenom: {
            type: "string",
            description: "Prénom du destinataire (cherche dans tous les statuts)",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_recent_emails",
      description:
        "Liste ou cherche des emails reçus dans la boîte Gmail de Jules. " +
        "Retourne : expéditeur, sujet, date, extrait. " +
        "Utilise quand Jules dit 'montre-moi mes derniers emails', 'cherche un email de Sophie', etc.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description:
              "Requête Gmail (ex: 'from:sophie', 'subject:van', 'is:unread', 'in:inbox'). Défaut: 'in:inbox'",
          },
          max_results: {
            type: "number",
            description: "Nombre d'emails à retourner. Défaut: 5",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "reply_to_email",
      description:
        "Génère une réponse à un email Gmail reçu et affiche un aperçu avec [Envoyer] [Modifier]. " +
        "La réponse s'insère dans le thread original. " +
        "Utilise après list_recent_emails quand Jules dit 'réponds à celui-là' ou 'réponds à cet email'.",
      parameters: {
        type: "object",
        required: ["message_id"],
        properties: {
          message_id: {
            type: "string",
            description: "ID Gmail du message auquel répondre (obtenu via list_recent_emails)",
          },
          context: {
            type: "string",
            description:
              "Instructions supplémentaires pour orienter la réponse (optionnel). Ex: 'infos sur le van Xalbat'",
          },
        },
      },
    },
  },
];
```

- [ ] **Vérifier TypeScript**

```bash
npx tsc --noEmit 2>&1 | grep definitions
```

- [ ] **Commit**

```bash
git add src/lib/telegram-assistant/tools/definitions.ts
git commit -m "feat(assistant): tool definitions — 7 outils Groq function calling"
```

---

### Task 6 : Tool Executors

**Files:**
- Create: `src/lib/telegram-assistant/tools/executors.ts`

- [ ] **Créer `src/lib/telegram-assistant/tools/executors.ts`**

```typescript
// src/lib/telegram-assistant/tools/executors.ts
// Exécute les appels d'outils demandés par Groq.
// Chaque fonction retourne une string JSON envoyée à Groq comme résultat d'outil.

import { createSupabaseAdmin } from "@/lib/supabase/server";
import { listRecentEmails, getEmailById } from "./gmail-reader";
import { fetchGmailSignature } from "@/lib/gmail";
import { sendEmailHandler } from "../actions/send-email";
import { getEmailExamples, formatExamplesForPrompt } from "../email-memory";
import Groq from "groq-sdk";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;

async function tgSend(chatId: number, text: string, extra?: object) {
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML", ...extra }),
  });
}

function shortId(): string {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 10);
}

// ── Dispatcher principal ──────────────────────────────────────────────────────
export async function executeTool(
  name:   string,
  args:   Record<string, unknown>,
  chatId: number
): Promise<string> {
  try {
    switch (name) {
      case "search_road_trips":       return await searchRoadTrips(args);
      case "get_road_trip_stats":     return await getRoadTripStats();
      case "search_profiles":         return await searchProfiles(args);
      case "search_prospects":        return await searchProspects(args);
      case "send_email_to_road_tripper": return await sendEmailToRoadTripper(args, chatId);
      case "list_recent_emails":      return await listRecentEmailsTool(args);
      case "reply_to_email":          return await replyToEmailTool(args, chatId);
      default: return JSON.stringify({ error: `Outil inconnu: ${name}` });
    }
  } catch (err) {
    console.error(`[executor] ${name} error:`, err);
    return JSON.stringify({ error: String(err) });
  }
}

// ── search_road_trips ─────────────────────────────────────────────────────────
async function searchRoadTrips(args: Record<string, unknown>): Promise<string> {
  const supabase = createSupabaseAdmin();
  const prenom  = args.prenom  as string | undefined;
  const status  = args.status  as string | undefined;
  const region  = args.region  as string | undefined;
  const limit   = (args.limit  as number | undefined) ?? 10;

  let query = supabase
    .from("road_trip_requests")
    .select("id, prenom, email, region, duree, status, created_at, sent_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (prenom)               query = query.ilike("prenom", `%${prenom}%`);
  if (status && status !== "all") query = query.eq("status", status);
  if (region)               query = query.ilike("region", `%${region}%`);

  const { data, error } = await query;
  if (error) return JSON.stringify({ error: error.message });
  return JSON.stringify({ count: data?.length ?? 0, results: data ?? [] });
}

// ── get_road_trip_stats ───────────────────────────────────────────────────────
async function getRoadTripStats(): Promise<string> {
  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("road_trip_requests")
    .select("status");
  if (error) return JSON.stringify({ error: error.message });

  const rows = data ?? [];
  const total   = rows.length;
  const sent    = rows.filter(r => r.status === "sent").length;
  const pending = rows.filter(r => r.status === "pending").length;
  const errors  = rows.filter(r => r.status === "error").length;

  return JSON.stringify({
    total,
    sent,
    pending,
    errors,
    success_rate: total > 0 ? `${Math.round((sent / total) * 100)}%` : "0%",
  });
}

// ── search_profiles ───────────────────────────────────────────────────────────
async function searchProfiles(args: Record<string, unknown>): Promise<string> {
  const supabase = createSupabaseAdmin();
  const prenom = args.prenom as string | undefined;
  const plan   = args.plan   as string | undefined;

  let query = supabase
    .from("profiles")
    .select("id, full_name, plan, created_at")
    .order("created_at", { ascending: false })
    .limit(10);

  if (prenom) query = query.ilike("full_name", `%${prenom}%`);
  if (plan)   query = query.eq("plan", plan);

  const { data, error } = await query;
  if (error) return JSON.stringify({ error: error.message });
  return JSON.stringify({ count: data?.length ?? 0, results: data ?? [] });
}

// ── search_prospects ──────────────────────────────────────────────────────────
async function searchProspects(args: Record<string, unknown>): Promise<string> {
  const supabase = createSupabaseAdmin();
  const name   = args.name   as string | undefined;
  const status = args.status as string | undefined;

  let query = supabase
    .from("prospects")
    .select("id, name, website, category, status, strategic_interest, relevance_score")
    .order("relevance_score", { ascending: false })
    .limit(10);

  if (name)   query = query.ilike("name", `%${name}%`);
  if (status) query = query.eq("status", status);

  const { data, error } = await query;
  if (error) return JSON.stringify({ error: error.message });
  return JSON.stringify({ count: data?.length ?? 0, results: data ?? [] });
}

// ── send_email_to_road_tripper ────────────────────────────────────────────────
async function sendEmailToRoadTripper(
  args:   Record<string, unknown>,
  chatId: number
): Promise<string> {
  const prenom = args.prenom as string;
  // Délègue au handler existant qui fait toute la logique (recherche + génération + preview)
  await sendEmailHandler({ prenom }, chatId);
  return JSON.stringify({
    status: "preview_sent",
    message: "Aperçu de l'email envoyé à Jules. Il peut confirmer ou modifier.",
  });
}

// ── list_recent_emails ────────────────────────────────────────────────────────
async function listRecentEmailsTool(args: Record<string, unknown>): Promise<string> {
  const query      = (args.query      as string | undefined) ?? "in:inbox";
  const maxResults = (args.max_results as number | undefined) ?? 5;
  const emails = await listRecentEmails(query, maxResults);
  return JSON.stringify({ count: emails.length, emails });
}

// ── reply_to_email ────────────────────────────────────────────────────────────
async function replyToEmailTool(
  args:   Record<string, unknown>,
  chatId: number
): Promise<string> {
  const messageId = args.message_id as string;
  const context   = (args.context   as string | undefined) ?? "";

  await tgSend(chatId, "⏳ Génération de la réponse en cours...");

  // Récupérer l'email original complet
  const original = await getEmailById(messageId);

  // Récupérer des exemples few-shot
  const examples    = await getEmailExamples("gmail_reply", 3);
  const examplesStr = formatExamplesForPrompt(examples);

  // Générer la réponse avec Groq
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });
  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "system",
        content:
          `Tu es Jules Gaveglio, fondateur de Vanzon Explorer (vans aménagés, Pays Basque).` +
          `\nTu réponds à un email reçu de : ${original.from}` +
          `\nSujet original : ${original.subject}` +
          `\nContenu original :\n${original.body.slice(0, 1000)}` +
          (context ? `\n\nInstructions supplémentaires : ${context}` : "") +
          `\n\nRègles :` +
          `\n- Ton chaleureux et authentique, pas corporatif` +
          `\n- Réponse directe et utile` +
          `\n- 2-3 paragraphes maximum` +
          `\n- PAS de formule de politesse finale — la signature est ajoutée automatiquement` +
          `\n- Corps en HTML avec uniquement des balises <p>` +
          `\n- PAS de "Re:" dans l'objet, juste le texte de la réponse` +
          examplesStr +
          `\n\nRéponds UNIQUEMENT avec du JSON valide :` +
          `\n{"subject": "Re: ${original.subject}", "body": "<p>...</p>"}`,
      },
      { role: "user", content: "Génère la réponse." },
    ],
    temperature: 0.7,
    max_tokens: 600,
  });

  const raw     = completion.choices[0]?.message?.content ?? "{}";
  const cleaned = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
  const draft   = JSON.parse(cleaned) as { subject: string; body: string };

  // Récupérer signature
  const signature = await fetchGmailSignature("jules@vanzonexplorer.com");

  // Stocker la pending action
  const supabase  = createSupabaseAdmin();
  const pendingId = shortId();
  await supabase.from("telegram_pending_actions").insert({
    id:      pendingId,
    chat_id: chatId,
    action:  "reply_email",
    state:   "awaiting_confirmation",
    payload: {
      action_type:  "gmail_reply",
      to:           original.from,
      subject:      draft.subject,
      body:         draft.body,
      signature,
      in_reply_to:  original.message_id_header,
      references:   original.references,
      thread_id:    original.thread_id,
      context:      {
        from:             original.from,
        subject_original: original.subject,
      },
    },
  });

  // Aperçu Telegram
  const bodyPreview = draft.body
    .replace(/<[^>]+>/g, "")
    .slice(0, 400)
    .trim();
  const escaped = bodyPreview
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  const preview =
    `📧 <b>Aperçu de la réponse</b>\n` +
    `─────────────────────\n` +
    `<b>À :</b> ${original.from}\n` +
    `<b>Objet :</b> ${draft.subject}\n\n` +
    `${escaped}${bodyPreview.length >= 400 ? "…" : ""}\n\n` +
    `<i>${signature ? "[signature configurée ✓]" : "[aucune signature]"}</i>\n` +
    `─────────────────────`;

  await tgSend(chatId, preview, {
    reply_markup: {
      inline_keyboard: [[
        { text: "✅ Envoyer",   callback_data: `asst:confirm:${pendingId}` },
        { text: "✏️ Modifier", callback_data: `asst:edit:${pendingId}` },
      ]],
    },
  });

  return JSON.stringify({
    status: "preview_sent",
    to:     original.from,
    subject: draft.subject,
  });
}
```

- [ ] **Vérifier TypeScript**

```bash
npx tsc --noEmit 2>&1 | grep executors
```

Attendu : aucune erreur.

- [ ] **Commit**

```bash
git add src/lib/telegram-assistant/tools/executors.ts
git commit -m "feat(assistant): tool executors — 7 outils Supabase + Gmail"
```

---

## Chunk 3: Agent + Intégration

### Task 7 : Agent Loop (Groq tool-calling)

**Files:**
- Create: `src/lib/telegram-assistant/agent.ts`

- [ ] **Créer `src/lib/telegram-assistant/agent.ts`**

```typescript
// src/lib/telegram-assistant/agent.ts
// Boucle principale de l'agent Telegram avec Groq tool-calling natif.
// Remplace le système intent+registry de l'ancienne architecture.

import Groq from "groq-sdk";
import { TOOLS } from "./tools/definitions";
import { executeTool } from "./tools/executors";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;

async function tgSend(chatId: number, text: string) {
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
  });
}

const SYSTEM_PROMPT = `Tu es l'assistant personnel de Jules Gaveglio, fondateur de Vanzon Explorer (location de vans aménagés au Pays Basque, France).
Tu as accès à la base de données du site web et à sa boîte Gmail professionnelle (jules@vanzonexplorer.com).

Comportement :
- Réponds toujours en français, de manière concise et directe
- Pour les questions sur les données (road trips, membres, prospects), utilise les outils de recherche et synthétise les résultats
- Pour envoyer ou répondre à un email, utilise les outils dédiés — ils affichent toujours un aperçu avant d'envoyer
- Ne mentionne pas les IDs techniques dans tes réponses, utilise les prénoms et informations lisibles
- Si une recherche retourne 0 résultats, dis-le clairement et propose d'élargir les critères`;

export async function runAgent(message: string, chatId: number): Promise<void> {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });

  const messages: Groq.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user",   content: message },
  ];

  // Boucle agentique : max 4 tours (message → outils → outils → réponse finale)
  for (let turn = 0; turn < 4; turn++) {
    const response = await groq.chat.completions.create({
      model:        "llama-3.3-70b-versatile",
      messages,
      tools:        TOOLS,
      tool_choice:  "auto",
      temperature:  0.3,
      max_tokens:   1000,
    });

    const choice = response.choices[0];
    if (!choice) break;

    const hasToolCalls = choice.message.tool_calls?.length;

    // Groq a répondu sans appeler d'outils → réponse finale
    if (!hasToolCalls) {
      const text = choice.message.content;
      if (text) await tgSend(chatId, text);
      return;
    }

    // Groq appelle des outils — les ajouter au contexte (cast explicite, évite l'unsafe `as`)
    messages.push({
      role:       "assistant",
      content:    choice.message.content ?? null,
      tool_calls: choice.message.tool_calls,
    } as Groq.Chat.ChatCompletionAssistantMessageParam);

    let hasEmailPreview = false;

    for (const toolCall of choice.message.tool_calls!) {
      const args   = JSON.parse(toolCall.function.arguments) as Record<string, unknown>;
      const result = await executeTool(toolCall.function.name, args, chatId);

      // Ces outils envoient leur propre aperçu Telegram — pas besoin de réponse supplémentaire
      if (
        toolCall.function.name === "send_email_to_road_tripper" ||
        toolCall.function.name === "reply_to_email"
      ) {
        hasEmailPreview = true;
      }

      messages.push({
        role:         "tool",
        tool_call_id: toolCall.id,
        content:      result,
      });
    }

    // Un aperçu email a été envoyé — Groq n'a pas besoin d'envoyer un message de plus
    if (hasEmailPreview) return;
  }

  // Sécurité : si on sort de la boucle sans réponse
  await tgSend(chatId, "⚠️ Je n'ai pas pu terminer. Réessaie.");
}
```

- [ ] **Vérifier TypeScript**

```bash
npx tsc --noEmit 2>&1 | grep "agent\."
```

Attendu : aucune erreur.

- [ ] **Commit**

```bash
git add src/lib/telegram-assistant/agent.ts
git commit -m "feat(assistant): agent loop — Groq tool-calling natif, 4 tours max"
```

---

### Task 8 : Mise à jour du router + confirm reply_email + mémoire

**Files:**
- Modify: `src/lib/telegram-assistant/router.ts`

- [ ] **Réécrire `src/lib/telegram-assistant/router.ts`**

```typescript
// src/lib/telegram-assistant/router.ts
// Gère les messages et callbacks de l'assistant Telegram.
// handleAssistantMessage → runAgent() (nouveau)
// handleAssistantCallback → confirm/edit/select, supporte road_trip_feedback + gmail_reply

import { createSupabaseAdmin } from "@/lib/supabase/server";
import { runAgent } from "./agent";
import { sendGmailEmail, replyGmailEmail } from "@/lib/gmail";
import { saveEmailToMemory } from "./email-memory";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;

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

  // 1. Vérifier awaiting_edit AVANT Groq (le texte est le nouveau corps de l'email)
  const { data: editAction } = await supabase
    .from("telegram_pending_actions")
    .select("*")
    .eq("chat_id", chatId)
    .eq("state", "awaiting_edit")
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  if (editAction) {
    const payload = editAction.payload as Record<string, string>;
    payload.body = text
      .split("\n")
      .map(line => `<p>${line}</p>`)
      .join("");

    await supabase
      .from("telegram_pending_actions")
      .update({
        state:      "awaiting_confirmation",
        payload,
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      })
      .eq("id", editAction.id as string);

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

  // 2. Vérifier awaiting_selection
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

  // 3. Agent Groq tool-calling
  await runAgent(text, chatId);
}

// ── handleAssistantCallback ───────────────────────────────────────────────────
export async function handleAssistantCallback(
  callbackQueryId: string,
  data:            string,
  chatId:          number
): Promise<void> {
  const supabase = createSupabaseAdmin();
  const parts     = data.split(":");
  const type      = parts[1];
  const pendingId = parts[2];
  const index     = parts[3] !== undefined ? parseInt(parts[3], 10) : undefined;

  await tgAnswer(callbackQueryId);

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

  const payload    = action.payload as Record<string, unknown>;
  const actionType = (payload.action_type as string) ?? "road_trip_feedback";

  // ── asst:confirm ─────────────────────────────────────────────────────────
  if (type === "confirm") {
    try {
      if (actionType === "gmail_reply") {
        await replyGmailEmail({
          to:          payload.to        as string,
          subject:     payload.subject   as string,
          htmlBody:    payload.body      as string,
          signature:   payload.signature as string,
          in_reply_to: payload.in_reply_to as string,
          references:  payload.references  as string,
          thread_id:   payload.thread_id   as string,
        });
      } else {
        await sendGmailEmail({
          to:        payload.to        as string,
          subject:   payload.subject   as string,
          htmlBody:  payload.body      as string,
          signature: payload.signature as string,
        });
      }

      // Sauvegarder en mémoire few-shot
      await saveEmailToMemory({
        action_type: actionType,
        context:     (payload.context as Record<string, unknown>) ?? {},
        subject:     payload.subject as string,
        body:        payload.body    as string,
      });

      await supabase.from("telegram_pending_actions").delete().eq("id", pendingId);
      await tgSend(chatId, `✅ Email envoyé à <b>${payload.to}</b>`);
    } catch (err) {
      console.error("[router] confirm error:", err);
      await tgSend(chatId, "❌ Erreur lors de l'envoi. Réessaie 🔄");
    }
    return;
  }

  // ── asst:edit ────────────────────────────────────────────────────────────
  if (type === "edit") {
    await supabase
      .from("telegram_pending_actions")
      .update({
        state:      "awaiting_edit",
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      })
      .eq("id", pendingId);

    const bodyText = (payload.body as string)
      .replace(/<p>/g,   "")
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

  // ── asst:select ──────────────────────────────────────────────────────────
  if (type === "select" && index !== undefined) {
    const candidates = payload.candidates as Array<{
      id: string; prenom: string; email: string; region: string; duree: number;
    }>;
    const selected = candidates[index];
    if (!selected) {
      await tgSend(chatId, "❓ Sélection invalide.");
      return;
    }
    await supabase.from("telegram_pending_actions").delete().eq("id", pendingId);

    // Importer dynamiquement pour éviter la circularité
    const { buildAndSendPreview } = await import("./actions/send-email");
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
git commit -m "feat(assistant): router — runAgent + confirm reply_email + save memory"
```

---

### Task 9 : Mise à jour send-email + injection mémoire + fix status

**Files:**
- Modify: `src/lib/telegram-assistant/actions/send-email.ts`

- [ ] **Modifier `generateEmailDraft` dans `src/lib/telegram-assistant/actions/send-email.ts`**

Remplacer la fonction `generateEmailDraft` pour injecter les exemples few-shot et chercher dans tous les statuts :

Trouver et remplacer la fonction `generateEmailDraft` :

```typescript
async function generateEmailDraft(
  prenom: string,
  region: string,
  duree:  number
): Promise<EmailDraft> {
  // Récupérer les exemples few-shot
  const { getEmailExamples, formatExamplesForPrompt } = await import("../email-memory");
  const examples    = await getEmailExamples("road_trip_feedback", 3);
  const examplesStr = formatExamplesForPrompt(examples);

  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });

  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "system",
        content:
          `Tu es Jules Gaveglio, fondateur de Vanzon Explorer (location de vans aménagés au Pays Basque).` +
          `\nGénère un email professionnel et chaleureux en français pour demander un retour sincère à ${prenom}` +
          `\nqui a utilisé notre outil de génération de road trip personnalisé pour ${duree} jours en ${region}.` +
          `\n\nRègles :` +
          `\n- Ton chaleureux et authentique, pas corporatif` +
          `\n- Mentionner leur road trip spécifique (région + durée)` +
          `\n- Demander un retour sincère et honnête sur l'outil` +
          `\n- 3-4 courts paragraphes maximum` +
          `\n- PAS de formule de politesse finale — la signature est ajoutée automatiquement` +
          `\n- Corps en HTML avec uniquement des balises <p>` +
          examplesStr +
          `\n\nRéponds UNIQUEMENT avec du JSON valide :` +
          `\n{"subject": "...", "body": "<p>...</p><p>...</p>"}`,
      },
      { role: "user", content: "Génère l'email." },
    ],
    temperature: 0.7,
    max_tokens:  600,
  });

  const raw     = completion.choices[0]?.message?.content ?? "{}";
  const cleaned = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
  const data    = JSON.parse(cleaned) as EmailDraft;
  return data;
}
```

- [ ] **Modifier la requête Supabase dans `sendEmailHandler`** pour chercher dans tous les statuts (supprimer `.eq("status", "sent")`) :

Trouver :
```typescript
    .ilike("prenom", prenom)
    .eq("status", "sent")
    .order("created_at", { ascending: false });
```

Remplacer par :
```typescript
    .ilike("prenom", `%${prenom}%`)
    .order("created_at", { ascending: false });
```

- [ ] **Mettre à jour le message "introuvable"** (le texte "road trips envoyés" est désormais inexact puisqu'on cherche tous les statuts) :

Trouver :
```typescript
    await tgSend(chatId, `🤷 <b>${prenom}</b> introuvable dans les road trips envoyés.`);
```

Remplacer par :
```typescript
    await tgSend(chatId, `🤷 <b>${prenom}</b> introuvable dans les road trips.`);
```

- [ ] **Ajouter `action_type` dans le payload de `buildAndSendPreview`** pour que le router puisse différencier road_trip_feedback de gmail_reply :

Dans `buildAndSendPreview`, dans le `supabase.from("telegram_pending_actions").insert({...})`, ajouter dans payload :
```typescript
      payload: {
        action_type: "road_trip_feedback",   // ← ajouter cette ligne
        to:        row.email,
        subject:   draft.subject,
        body:      draft.body,
        signature,
        prenom:    row.prenom,
        region:    row.region,
        duree:     row.duree,
        context: {                            // ← ajouter pour la mémoire
          prenom: row.prenom,
          region: row.region,
          duree:  row.duree,
        },
      },
```

- [ ] **Vérifier TypeScript (build complet)**

```bash
npx tsc --noEmit
```

Attendu : aucune erreur.

- [ ] **Commit**

```bash
git add src/lib/telegram-assistant/actions/send-email.ts
git commit -m "feat(send-email): all statuses + few-shot injection + action_type payload"
```

---

### Task 10 : Nettoyage + déploiement

**Files:**
- Delete: `src/lib/telegram-assistant/intent.ts`
- Delete: `src/lib/telegram-assistant/actions/index.ts`

- [ ] **Supprimer les fichiers obsolètes**

```bash
git rm src/lib/telegram-assistant/intent.ts
git rm src/lib/telegram-assistant/actions/index.ts
```

- [ ] **TypeScript check final**

```bash
npx tsc --noEmit
```

Attendu : aucune erreur.

- [ ] **Commit + push**

```bash
git commit -m "chore(assistant): supprimer intent.ts + actions/index.ts — remplacés par agent.ts + tools/"
git push
```

- [ ] **Appliquer la migration Supabase** (dashboard SQL Editor) :

```sql
CREATE TABLE IF NOT EXISTS telegram_email_memory (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_type TEXT NOT NULL,
  context     JSONB NOT NULL DEFAULT '{}',
  subject     TEXT NOT NULL,
  body        TEXT NOT NULL,
  approved_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_email_memory_type
  ON telegram_email_memory(action_type, approved_at DESC);
```

- [ ] **Régénérer GMAIL_REFRESH_TOKEN** avec le scope `gmail.readonly` :

```bash
npx tsx scripts/get-gmail-token.ts
```

Mettre à jour dans `.env.local` ET Vercel Dashboard → `GMAIL_REFRESH_TOKEN`.

- [ ] **Test end-to-end depuis Telegram :**

| Test | Message | Résultat attendu |
|---|---|---|
| Stats | "combien de road trips envoyés ?" | Réponse avec chiffres |
| Recherche | "cherche Verins" | Résultat (tous statuts) |
| Email | "envoie un email à [prénom]" | Aperçu + boutons |
| Gmail lecture | "montre-moi mes 3 derniers emails" | Liste emails |
| Réponse Gmail | "réponds au dernier email" | Aperçu réponse + boutons |
| Mémoire | Confirmer 2 emails, envoyer un 3e | Style amélioré |
