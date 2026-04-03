// src/lib/telegram-assistant/tools/gmail-reader.ts
// Lecture des emails Gmail : liste et détail.

import { getGmailAccessToken } from "@/lib/gmail";

export interface EmailSummary {
  id:       string;
  from:     string;
  subject:  string;
  date:     string;
  snippet:  string;
}

export interface EmailFull extends EmailSummary {
  body:              string;
  thread_id:         string;
  message_id_header: string;  // valeur du header Message-ID (pour In-Reply-To)
  references:        string;  // valeur du header References
}

export interface ThreadMessage {
  from:    string;
  date:    string;
  body:    string; // plain text, tronqué à 400 chars
}

// ── Helpers ────────────────────────────────────────────────────────────────────

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

interface GmailPayload {
  mimeType?: string;
  body?:     { data?: string };
  parts?:    GmailPayload[];
  headers?:  Array<{ name: string; value: string }>;
}

// ── API ────────────────────────────────────────────────────────────────────────

/**
 * Liste les emails récents (inbox) correspondant à la query Gmail.
 * @param query  ex: "from:sophie" | "subject:road trip" | "" (tous)
 * @param maxResults  max 10
 */
export async function listRecentEmails(
  query      = "",
  maxResults = 5
): Promise<EmailSummary[]> {
  const token = await getGmailAccessToken();

  const params = new URLSearchParams({
    q:          query || "in:inbox",
    maxResults: String(Math.min(maxResults, 10)),
  });

  const listRes = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages?${params}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const listData = await listRes.json() as { messages?: Array<{ id: string }> };
  const messages = listData.messages ?? [];

  const summaries = await Promise.all(
    messages.map(async (msg) => {
      const metaRes = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const meta = await metaRes.json() as {
        id: string;
        snippet: string;
        payload: { headers: Array<{ name: string; value: string }> };
      };
      return {
        id:      meta.id,
        from:    getHeader(meta.payload.headers, "From"),
        subject: getHeader(meta.payload.headers, "Subject"),
        date:    getHeader(meta.payload.headers, "Date"),
        snippet: meta.snippet ?? "",
      };
    })
  );

  return summaries;
}

/**
 * Récupère le contenu complet d'un email par son ID.
 */
export async function getEmailById(messageId: string): Promise<EmailFull> {
  const token = await getGmailAccessToken();

  const res = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=full`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const data = await res.json() as {
    id:        string;
    threadId:  string;
    snippet:   string;
    payload:   GmailPayload & { headers: Array<{ name: string; value: string }> };
  };

  const headers  = data.payload.headers ?? [];
  const bodyText = extractPlainText(data.payload);

  return {
    id:                data.id,
    from:              getHeader(headers, "From"),
    subject:           getHeader(headers, "Subject"),
    date:              getHeader(headers, "Date"),
    snippet:           data.snippet ?? "",
    body:              bodyText,
    thread_id:         data.threadId,
    message_id_header: getHeader(headers, "Message-ID"),
    references:        getHeader(headers, "References"),
  };
}

/**
 * Récupère les derniers messages d'un thread Gmail.
 * @param threadId  ID du thread Gmail
 * @param max       Nombre max de messages à retourner (défaut 3)
 */
export async function getThreadMessages(
  threadId: string,
  max = 3
): Promise<ThreadMessage[]> {
  const THREAD_BODY_PREVIEW_CHARS = 400; // token budget per message for LLM prompts
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
  // Fetch max+1 to account for excluding the current email (last message in thread)
  const slice = messages.slice(-(max + 1));

  // Exclure le dernier message du thread (= l'email courant, déjà lu en entier séparément)
  const withoutCurrent = slice.length > 1 ? slice.slice(0, -1) : [];

  return withoutCurrent.map((msg) => {
    const headers = msg.payload.headers ?? [];
    const body    = extractPlainText(msg.payload);
    return {
      from: getHeader(headers, "From"),
      date: getHeader(headers, "Date"),
      body: body.slice(0, THREAD_BODY_PREVIEW_CHARS),
    };
  });
}
