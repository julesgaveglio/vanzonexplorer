# Telegram Smart Email Reply — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permettre à Jules d'envoyer un prompt naturel ("Répond au dernier email de Cody Van, modifications acceptées") et recevoir immédiatement un aperçu email sur Telegram, sans avoir à spécifier un message_id.

**Architecture:** Ajout d'un outil Groq `smart_reply_to_email` qui cherche l'email par nom expéditeur, lit le thread si nécessaire, et génère la réponse en un seul appel. Un cron nightly analyse les emails envoyés manuellement depuis Gmail pour enrichir la mémoire few-shot automatiquement.

**Tech Stack:** Next.js 14 App Router, Groq (llama-3.3-70b-versatile), Gmail API, Supabase, Vercel Cron

---

## Chunk 1 : Outil `smart_reply_to_email`

### Fichiers

- Modify: `src/lib/telegram-assistant/tools/gmail-reader.ts` — ajouter `getThreadMessages()`
- Modify: `src/lib/telegram-assistant/tools/definitions.ts` — ajouter définition `smart_reply_to_email`
- Modify: `src/lib/telegram-assistant/tools/executors.ts` — ajouter executor `smartReplyToEmail()` + le câbler dans le switch

---

### Task 1 : Ajouter `getThreadMessages` dans gmail-reader.ts

**Fichiers :** Modify `src/lib/telegram-assistant/tools/gmail-reader.ts`

- [ ] **1.1 — Ajouter l'interface `ThreadMessage`**

À la fin des interfaces existantes (après `EmailFull`), ajouter :

```typescript
export interface ThreadMessage {
  from:    string;
  date:    string;
  body:    string; // plain text, tronqué à 400 chars
}
```

- [ ] **1.2 — Implémenter `getThreadMessages`**

Ajouter la fonction après `getEmailById` :

```typescript
/**
 * Récupère les derniers messages d'un thread Gmail.
 * @param threadId  ID du thread Gmail
 * @param max       Nombre max de messages à retourner (défaut 3)
 */
export async function getThreadMessages(
  threadId: string,
  max = 3
): Promise<ThreadMessage[]> {
  const token = await getGmailAccessToken();

  const res = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/threads/${threadId}?format=full`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const data = await res.json() as {
    messages?: Array<{
      payload: GmailPayload & { headers: Array<{ name: string; value: string }> };
    }>;
  };

  const messages = data.messages ?? [];
  // Prendre les `max` derniers messages (hors dernier = email courant déjà lu)
  const slice = messages.slice(-max);

  // Exclure le dernier message du thread (= l'email courant, déjà lu en entier séparément)
  const withoutCurrent = slice.length > 1 ? slice.slice(0, -1) : [];

  return withoutCurrent.map((msg) => {
    const headers = msg.payload.headers ?? [];
    const body    = extractPlainText(msg.payload);
    return {
      from: getHeader(headers, "From"),
      date: getHeader(headers, "Date"),
      body: body.slice(0, 400),
    };
  });
}
```

- [ ] **1.3 — Vérifier la compilation TypeScript**

```bash
npx tsc --noEmit 2>&1 | head -30
```

Expected : aucune erreur sur `gmail-reader.ts`.

---

### Task 2 : Ajouter la définition `smart_reply_to_email` dans definitions.ts

**Fichiers :** Modify `src/lib/telegram-assistant/tools/definitions.ts`

- [ ] **2.1 — Insérer la définition dans le tableau `TOOL_DEFINITIONS`**

Ajouter AVANT la définition `reply_to_email` (pour que Groq la voie en premier) :

```typescript
  {
    type: "function",
    function: {
      name: "smart_reply_to_email",
      description:
        "Recherche intelligemment un email par nom ou email de l'expéditeur et génère une réponse " +
        "en tenant compte du fil de conversation. " +
        "À préférer à reply_to_email pour tous les cas où Jules dit 'réponds à [nom]' ou 'dernier email de [nom]'. " +
        "Exemple : 'Réponds au dernier email de Cody Van, dis que les modifications sont ok'.",
      parameters: {
        type: "object",
        properties: {
          sender_hint: {
            type: "string",
            description:
              "Nom ou email partiel de l'expéditeur (ex: 'Cody Van', 'stephanie', 'cosyvan@gmail.com'). " +
              "Recherche case-insensitive dans le champ From des 10 derniers emails.",
          },
          context_instructions: {
            type: "string",
            description:
              "Ce que Jules veut communiquer dans la réponse. " +
              "Ex: 'modifications proposées acceptables, répondre aux questions', 'dire que je suis dispo mardi'.",
          },
          subject_hint: {
            type: "string",
            description:
              "Mot-clé optionnel dans le sujet pour affiner si plusieurs emails du même expéditeur. " +
              "Ex: 'modifications', 'devis', 'partenariat'.",
          },
        },
        required: ["sender_hint", "context_instructions"],
      },
    },
  },
```

- [ ] **2.2 — Mettre à jour la description de `reply_to_email`**

Modifier la description existante de `reply_to_email` pour clarifier qu'il est secondaire :

```typescript
      description:
        "Génère une réponse à un email via son ID exact. " +
        "Utilise smart_reply_to_email à la place si tu connais le nom de l'expéditeur. " +
        "Utilise reply_to_email uniquement si tu as déjà un message_id via list_recent_emails.",
```

- [ ] **2.3 — Vérifier la compilation**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected : aucune erreur.

---

### Task 3 : Implémenter l'executor `smartReplyToEmail` dans executors.ts

**Fichiers :** Modify `src/lib/telegram-assistant/tools/executors.ts`

- [ ] **3.1 — Ajouter l'import de `getThreadMessages`**

Modifier la ligne d'import existante :

```typescript
// Avant :
import { listRecentEmails, getEmailById } from "./gmail-reader";

// Après :
import { listRecentEmails, getEmailById, getThreadMessages } from "./gmail-reader";
```

- [ ] **3.2 — Câbler dans le switch dispatcher**

Dans la fonction `executeTool`, ajouter le case avant `reply_to_email` :

```typescript
      case "smart_reply_to_email":      return await smartReplyToEmail(args, chatId);
```

- [ ] **3.3 — Implémenter `smartReplyToEmail`**

Ajouter la fonction après `listRecentEmailsTool` :

```typescript
// ── smart_reply_to_email ──────────────────────────────────────────────────────
async function smartReplyToEmail(
  args:   Record<string, unknown>,
  chatId: number
): Promise<string> {
  const senderHint   = (args.sender_hint          as string).toLowerCase();
  const contextInstr = (args.context_instructions as string) ?? "";
  const subjectHint  = (args.subject_hint         as string | undefined)?.toLowerCase();

  await tgSend(chatId, "🔍 Recherche de l'email en cours...");

  // 1. Fetch 10 derniers emails inbox
  const emails = await listRecentEmails("in:inbox", 10);

  // 2. Scoring : trouver l'email qui matche sender_hint
  let candidates = emails.filter((e) =>
    e.from.toLowerCase().includes(senderHint) ||
    e.subject.toLowerCase().includes(senderHint)
  );

  // Affiner avec subject_hint si fourni et plusieurs candidats
  // (si 1 seul candidat, on le garde même sans subject_hint — évite les faux négatifs)
  if (subjectHint && candidates.length > 1) {
    const refined = candidates.filter((e) =>
      e.subject.toLowerCase().includes(subjectHint)
    );
    if (refined.length > 0) candidates = refined;
  }

  // Cas no-match
  if (candidates.length === 0) {
    return JSON.stringify({
      error: `Aucun email trouvé pour "${args.sender_hint}". Précise le nom complet ou l'adresse email.`,
    });
  }

  // Prendre le plus récent (premier dans la liste Gmail = le plus récent)
  const matched = candidates[0];

  await tgSend(chatId, `📧 Email trouvé : <b>${matched.subject}</b>\n⏳ Génération de la réponse...`);

  // 3. Récupérer l'email complet
  const original = await getEmailById(matched.id);

  // 4. Thread context si c'est une réponse
  let threadContext = "";
  if (original.references && original.references.trim().length > 0) {
    try {
      // getThreadMessages exclut déjà le dernier message (l'email courant)
      const thread = await getThreadMessages(original.thread_id, 3);
      if (thread.length > 0) {
        threadContext =
          "\n\nHistorique de la conversation :\n" +
          thread.map((m) =>
            `--- De : ${m.from} (${m.date}) ---\n${m.body}`
          ).join("\n\n");
      }
    } catch {
      // Thread optionnel — on continue sans
    }
  }

  // 5. Few-shot examples (0 si base vide — géré gracieusement)
  const examples    = await getEmailExamples("gmail_reply", 3);
  const examplesStr = formatExamplesForPrompt(examples);

  // 6. Générer la réponse
  const { content: raw } = await groqWithFallback({
    model: "llama-3.3-70b-versatile",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          `Tu es Jules Gaveglio, fondateur de Vanzon Explorer (vans aménagés, Pays Basque).` +
          `\nTu réponds à un email reçu de : ${original.from}` +
          `\nSujet original : ${original.subject}` +
          `\nContenu original :\n${original.body.slice(0, 1000)}` +
          threadContext +
          `\n\nInstructions de Jules : ${contextInstr}` +
          `\n\nRègles :` +
          `\n- Ton chaleureux et authentique, pas corporatif` +
          `\n- Réponse directe et utile, 2-3 paragraphes max` +
          `\n- PAS de formule de politesse finale (signature ajoutée automatiquement)` +
          `\n- Corps en HTML avec uniquement des balises <p>` +
          examplesStr,
      },
      {
        role: "user",
        content: `Génère la réponse. JSON: {"subject": "Re: ${original.subject}", "body": "<p>...</p>"}`,
      },
    ],
    temperature: 0.7,
    max_tokens:  600,
  });

  const draft = JSON.parse(raw) as { subject: string; body: string };

  // 7. Signature + pending action + aperçu Telegram (identique à replyToEmailTool)
  const signature = await fetchGmailSignature("jules@vanzonexplorer.com");
  const supabase  = createSupabaseAdmin();
  const pendingId = shortId();

  await supabase.from("telegram_pending_actions").insert({
    id:         pendingId,
    chat_id:    chatId,
    action:     "reply_email",
    state:      "awaiting_confirmation",
    expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    payload: {
      action_type:  "gmail_reply",
      to:           original.from,
      subject:      draft.subject,
      body:         draft.body,
      signature,
      in_reply_to:  original.message_id_header,
      references:   original.references,
      thread_id:    original.thread_id,
      context: {
        from:             original.from,
        subject_original: original.subject,
      },
    },
  });

  // Formater l'aperçu
  const bodyFull = draft.body
    .replace(/<\/p>/gi, "\n").replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .split("\n").map((l: string) => l.trim()).filter((l: string) => l.length > 0)
    .join("\n").replace(/\n{3,}/g, "\n\n").trim();
  const MAX_BODY    = 3800;
  const bodyDisplay = bodyFull.length > MAX_BODY ? bodyFull.slice(0, MAX_BODY) + "\n…" : bodyFull;
  const escaped     = bodyDisplay
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const preview =
    `📧 <b>Aperçu de la réponse</b>\n` +
    `─────────────────────\n` +
    `<b>À :</b> ${original.from}\n` +
    `<b>Objet :</b> ${draft.subject}\n` +
    `─────────────────────\n\n` +
    `${escaped}\n\n` +
    `<i>${signature ? "[signature configurée ✓]" : "[aucune signature]"}</i>\n` +
    `─────────────────────`;

  await tgSend(chatId, preview, {
    reply_markup: {
      inline_keyboard: [[
        { text: "✅ Envoyer",    callback_data: `asst:confirm:${pendingId}` },
        { text: "✏️ Modifier", callback_data: `asst:edit:${pendingId}` },
      ]],
    },
  });

  return JSON.stringify({ status: "preview_sent", to: original.from, subject: draft.subject });
}
```

- [ ] **3.4 — Vérifier la compilation TypeScript**

```bash
npx tsc --noEmit 2>&1 | head -30
```

Expected : aucune erreur.

- [ ] **3.5 — Commit Chunk 1**

```bash
git add src/lib/telegram-assistant/tools/gmail-reader.ts \
        src/lib/telegram-assistant/tools/definitions.ts \
        src/lib/telegram-assistant/tools/executors.ts
git commit -m "feat(telegram): outil smart_reply_to_email — recherche intelligente + thread context"
```

---

## Chunk 2 : Cron nightly de style learning

### Fichiers

- Create: `supabase/migrations/20260403000001_email_memory_dedup.sql` — colonnes `message_id` + `source`
- Modify: `src/lib/telegram-assistant/email-memory.ts` — étendre l'interface `EmailMemoryExample`
- Create: `src/app/api/cron/gmail-style-learning/route.ts` — route cron avec auth
- Create/Modify: `vercel.json` — cron schedule

---

### Task 4 : Migration Supabase

**Fichiers :** Create `supabase/migrations/20260403000001_email_memory_dedup.sql`

- [ ] **4.1 — Créer le fichier de migration**

```sql
-- Ajout déduplication et traçabilité source pour telegram_email_memory
ALTER TABLE telegram_email_memory
  ADD COLUMN IF NOT EXISTS message_id TEXT,
  ADD COLUMN IF NOT EXISTS source     TEXT DEFAULT 'telegram';

-- Contrainte unique sur message_id (nullable — les anciennes lignes restent sans valeur)
CREATE UNIQUE INDEX IF NOT EXISTS idx_email_memory_message_id
  ON telegram_email_memory(message_id)
  WHERE message_id IS NOT NULL;
```

- [ ] **4.2 — Appliquer la migration en production**

Aller sur [supabase.com](https://supabase.com) → SQL Editor → coller et exécuter le SQL ci-dessus.

- [ ] **4.3 — Vérifier**

Dans Supabase Table Editor : `telegram_email_memory` doit avoir les colonnes `message_id` et `source`.

---

### Task 5 : Étendre l'interface `EmailMemoryExample`

**Fichiers :** Modify `src/lib/telegram-assistant/email-memory.ts`

- [ ] **5.1 — Étendre l'interface**

```typescript
// Avant :
export interface EmailMemoryExample {
  action_type: string;
  context:     Record<string, string>;
  subject:     string;
  body:        string;
}

// Après :
export interface EmailMemoryExample {
  action_type: string;
  context:     Record<string, string>;
  subject:     string;
  body:        string;
  message_id?: string; // Pour déduplication (cron only)
  source?:     string; // "telegram" | "gmail_sent"
}
```

- [ ] **5.2 — Passer `message_id` et `source` à l'insert dans `saveEmailToMemory`**

```typescript
// Dans saveEmailToMemory, modifier l'insert :
await supabase.from("telegram_email_memory").insert({
  action_type: example.action_type,
  context:     example.context,
  subject:     example.subject,
  body:        example.body,
  ...(example.message_id ? { message_id: example.message_id } : {}),
  source:      example.source ?? "telegram",
});
```

- [ ] **5.3 — Vérifier la compilation**

```bash
npx tsc --noEmit 2>&1 | head -20
```

---

### Task 6 : Créer la route cron `gmail-style-learning`

**Fichiers :** Create `src/app/api/cron/gmail-style-learning/route.ts`

- [ ] **6.1 — Créer le fichier**

```typescript
// src/app/api/cron/gmail-style-learning/route.ts
// Analyse les emails envoyés manuellement par Jules pour enrichir la mémoire few-shot.

import { NextRequest, NextResponse } from "next/server";
import { getGmailAccessToken } from "@/lib/gmail";
import { saveEmailToMemory } from "@/lib/telegram-assistant/email-memory";
import { createSupabaseAdmin } from "@/lib/supabase/server";

export const maxDuration = 30;

const CRON_SECRET = process.env.CRON_SECRET!;

interface GmailPayload {
  mimeType?: string;
  body?:     { data?: string };
  parts?:    GmailPayload[];
  headers?:  Array<{ name: string; value: string }>;
}

function getHeader(headers: Array<{ name: string; value: string }>, name: string): string {
  return headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ?? "";
}

function extractPlainText(payload: GmailPayload): string {
  if (payload.mimeType === "text/plain" && payload.body?.data) {
    return Buffer.from(payload.body.data, "base64url").toString("utf-8");
  }
  if (payload.parts) {
    for (const part of payload.parts) {
      const text = extractPlainText(part);
      if (text) return text;
    }
  }
  return "";
}

export async function GET(req: NextRequest) {
  // Auth guard
  const auth = req.headers.get("Authorization");
  if (auth !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const token = await getGmailAccessToken();

    // Date d'hier en UTC, format Gmail "YYYY/MM/DD"
    const yesterday = new Date(Date.now() - 86400 * 1000);
    const dateStr   = `${yesterday.getUTCFullYear()}/${String(yesterday.getUTCMonth() + 1).padStart(2, "0")}/${String(yesterday.getUTCDate()).padStart(2, "0")}`;

    // Fetch emails envoyés depuis hier
    const listRes = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(`in:sent after:${dateStr}`)}&maxResults=10`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const listData = await listRes.json() as { messages?: Array<{ id: string }> };
    const messages = listData.messages ?? [];

    if (messages.length === 0) {
      return NextResponse.json({ added: 0, message: "Aucun email envoyé hier." });
    }

    // Vérifier les message_ids déjà en base
    const supabase = createSupabaseAdmin();

    let added = 0;
    let processed = 0;

    for (const msg of messages) {
      if (processed >= 5) break; // max 5 par run

      // Fetch détail complet
      const detailRes = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const detail = await detailRes.json() as {
        payload: GmailPayload & { headers: Array<{ name: string; value: string }> };
      };

      const headers    = detail.payload.headers ?? [];
      const inReplyTo  = getHeader(headers, "In-Reply-To");
      const messageId  = getHeader(headers, "Message-ID");
      const to         = getHeader(headers, "To");
      const subject    = getHeader(headers, "Subject");
      const body       = extractPlainText(detail.payload);

      // Filtrer : uniquement les vraies réponses
      if (!inReplyTo) continue;
      // Ignorer les emails sans Message-ID (impossibles à dédupliquer — évite les doublons)
      if (!messageId) continue;

      processed++;

      // Déduplication par Message-ID
      const { data: existing } = await supabase
        .from("telegram_email_memory")
        .select("id")
        .eq("message_id", messageId)
        .maybeSingle();
      if (existing) continue;

      // Sauvegarder
      await saveEmailToMemory({
        action_type: "gmail_reply",
        context:     { from: to, subject },
        subject,
        body:        body.slice(0, 800),
        message_id:  messageId || undefined,
        source:      "gmail_sent",
      });

      added++;
    }

    console.log(`[gmail-style-learning] added ${added} examples`);
    return NextResponse.json({ added });
  } catch (err) {
    console.error("[gmail-style-learning] error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
```

- [ ] **6.2 — Vérifier la compilation**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected : aucune erreur.

---

### Task 7 : Créer `vercel.json` avec le cron

**Fichiers :** Create `vercel.json` à la racine du projet

- [ ] **7.1 — Créer le fichier**

```json
{
  "crons": [
    {
      "path": "/api/cron/gmail-style-learning",
      "schedule": "0 2 * * *"
    }
  ]
}
```

- [ ] **7.2 — Vérifier que `CRON_SECRET` est défini en production**

Sur [vercel.com](https://vercel.com) → projet → Settings → Environment Variables → confirmer que `CRON_SECRET` est présent pour l'environnement Production. Sans cette variable, la route retournera 401 à chaque appel cron.

Note : Vercel ajoute automatiquement le header `Authorization: Bearer $CRON_SECRET` sur les appels cron GET.

- [ ] **7.2 — Commit Chunk 2**

```bash
git add supabase/migrations/20260403000001_email_memory_dedup.sql \
        src/lib/telegram-assistant/email-memory.ts \
        src/app/api/cron/gmail-style-learning/route.ts \
        vercel.json
git commit -m "feat(telegram): cron nightly style learning + migration dedup email memory"
```

---

## Tests manuels post-implémentation

- [ ] **Test smart_reply :** Envoyer sur Telegram `"Réponds au dernier email de [nom réel], dis que c'est ok"`
  - Expected : message "Recherche en cours..." → "Email trouvé : [sujet]..." → aperçu avec boutons ✅/✏️

- [ ] **Test no-match :** Envoyer `"Réponds à xyzinconnu@test.com"`
  - Expected : message d'erreur clair demandant de préciser

- [ ] **Test cron :** Appeler manuellement `GET /api/cron/gmail-style-learning` avec header `Authorization: Bearer [CRON_SECRET]`
  - Expected : `{ "added": N }` sans erreur

- [ ] **Push sur main → déploiement Vercel automatique**

```bash
git push origin main
```
