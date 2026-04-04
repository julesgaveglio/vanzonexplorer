/**
 * Gmail API client — envoi via l'API officielle Google Gmail.
 * Les emails apparaissent dans la boîte "Envoyés" de jules@vanzonexplorer.com
 * et la signature Gmail configurée est automatiquement récupérée et ajoutée.
 *
 * Env vars requises :
 *   GOOGLE_GSC_CLIENT_ID       — OAuth2 client ID (partagé avec GSC)
 *   GOOGLE_GSC_CLIENT_SECRET   — OAuth2 client secret (partagé avec GSC)
 *   GOOGLE_GMAIL_REFRESH_TOKEN — Refresh token avec scopes : gmail.send + gmail.settings.basic + gmail.labels + gmail.readonly
 */

const GMAIL_USER = "jules@vanzonexplorer.com";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const GMAIL_API = "https://gmail.googleapis.com/gmail/v1/users/me";

// ── Rafraîchit l'access token via le refresh token OAuth2 ──────────────────
export async function getGmailAccessToken(): Promise<string> {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_GSC_CLIENT_ID!,
      client_secret: process.env.GOOGLE_GSC_CLIENT_SECRET!,
      refresh_token: process.env.GOOGLE_GMAIL_REFRESH_TOKEN!,
      grant_type: "refresh_token",
    }).toString(),
  });

  const data = (await res.json()) as { access_token?: string; error?: string };
  if (!res.ok || !data.access_token) {
    throw new Error(`Gmail OAuth token refresh failed: ${data.error ?? res.status}`);
  }
  return data.access_token;
}

// ── Récupère la signature HTML configurée dans Gmail ───────────────────────
export async function getGmailSignature(accessToken: string): Promise<string> {
  try {
    const url = `${GMAIL_API}/settings/sendAs/${encodeURIComponent(GMAIL_USER)}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) return "";
    const data = (await res.json()) as { signature?: string };
    return data.signature ?? "";
  } catch {
    return ""; // Si la signature est inaccessible, on continue sans
  }
}

// ── Encode le sujet email selon RFC 2047 (pour les caractères non-ASCII) ───
function encodeSubject(subject: string): string {
  if (/^[\x00-\x7F]*$/.test(subject)) return subject;
  return `=?utf-8?b?${Buffer.from(subject, "utf-8").toString("base64")}?=`;
}

// ── Construit le message MIME multipart/alternative ────────────────────────
function buildMimeMessage(options: {
  from: string;
  to: string;
  subject: string;
  htmlBody: string;
  textBody: string;
  inReplyTo?: string;
  references?: string;
}): string {
  const boundary = `vanzon_${Date.now()}_boundary`;
  const textB64 = Buffer.from(options.textBody, "utf-8").toString("base64");
  const htmlB64 = Buffer.from(options.htmlBody, "utf-8").toString("base64");

  const headers = [
    `From: ${options.from}`,
    `To: ${options.to}`,
    `Subject: ${encodeSubject(options.subject)}`,
  ];
  if (options.inReplyTo) headers.push(`In-Reply-To: ${options.inReplyTo}`);
  if (options.references) headers.push(`References: ${options.references}`);

  const mime = [
    ...headers,
    "MIME-Version: 1.0",
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    "",
    `--${boundary}`,
    "Content-Type: text/plain; charset=utf-8",
    "Content-Transfer-Encoding: base64",
    "",
    textB64,
    "",
    `--${boundary}`,
    "Content-Type: text/html; charset=utf-8",
    "Content-Transfer-Encoding: base64",
    "",
    htmlB64,
    "",
    `--${boundary}--`,
  ].join("\r\n");

  // Base64url encode pour l'API Gmail
  return Buffer.from(mime)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

// ── Convertit la signature HTML en texte brut simple ──────────────────────
function signatureHtmlToText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// ── Envoi principal via Gmail API ──────────────────────────────────────────
export interface GmailSendOptions {
  to: string;
  subject: string;
  textBody: string;
  threadId?: string;
  inReplyTo?: string;
  references?: string;
}

export interface GmailSendResult {
  messageId: string;
  threadId: string;
}

export async function sendViaGmail(options: GmailSendOptions): Promise<GmailSendResult> {
  // 1. Récupérer l'access token
  const accessToken = await getGmailAccessToken();

  // 2. Récupérer la signature Gmail configurée pour jules@vanzonexplorer.com
  const signatureHtml = await getGmailSignature(accessToken);

  // 3. Construire le HTML du corps (paragraphes + signature)
  const bodyParagraphs = options.textBody
    .split("\n\n")
    .map((para) => `<p style="margin:0 0 16px 0">${para.replace(/\n/g, "<br>")}</p>`)
    .join("");

  const signatureBlock = signatureHtml
    ? `<div style="margin-top:24px;padding-top:16px;border-top:1px solid #e5e7eb;color:#6b7280;font-size:14px">${signatureHtml}</div>`
    : "";

  const htmlBody = `<!DOCTYPE html>
<html>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:15px;line-height:1.6;color:#1a1a1a;max-width:600px;margin:0 auto;padding:20px">
${bodyParagraphs}${signatureBlock}
</body>
</html>`;

  const signatureText = signatureHtml ? `\n\n--\n${signatureHtmlToText(signatureHtml)}` : "";
  const textBody = options.textBody + signatureText;

  // 4. Construire et envoyer le message MIME
  const raw = buildMimeMessage({
    from: `Vanzon Explorer <${GMAIL_USER}>`,
    to: options.to,
    subject: options.subject,
    htmlBody,
    textBody,
    inReplyTo: options.inReplyTo,
    references: options.references,
  });

  const sendPayload: Record<string, string> = { raw };
  if (options.threadId) sendPayload.threadId = options.threadId;

  const res = await fetch(`${GMAIL_API}/messages/send`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(sendPayload),
  });

  const data = (await res.json()) as { id?: string; threadId?: string; error?: { message?: string } };
  if (!res.ok) {
    throw new Error(`Gmail API send failed: ${data.error?.message ?? res.status}`);
  }

  return { messageId: data.id!, threadId: data.threadId! };
}

// ── Vérifie que les env vars Gmail sont configurées ────────────────────────
export function isGmailConfigured(): boolean {
  return !!(
    process.env.GOOGLE_GSC_CLIENT_ID &&
    process.env.GOOGLE_GSC_CLIENT_SECRET &&
    process.env.GOOGLE_GMAIL_REFRESH_TOKEN
  );
}

// ── Récupère l'ID d'un label Gmail par son nom ─────────────────────────────
export async function getGmailLabelId(
  accessToken: string,
  labelName: string
): Promise<string | null> {
  const res = await fetch(`${GMAIL_API}/labels`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return null;
  const data = (await res.json()) as {
    labels?: Array<{ id: string; name: string }>;
  };
  const label = data.labels?.find(
    (l) => l.name.toLowerCase() === labelName.toLowerCase()
  );
  return label?.id ?? null;
}

// ── Applique un label à un message Gmail ────────────────────────────────────
export async function applyGmailLabel(
  accessToken: string,
  messageId: string,
  labelId: string
): Promise<void> {
  await fetch(`${GMAIL_API}/messages/${messageId}/modify`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ addLabelIds: [labelId] }),
  });
}

// ── Récupère les messages d'un thread Gmail ─────────────────────────────────
export interface GmailThreadMessage {
  id: string;
  from: string;
  date: string;
  snippet: string;
  bodyText: string;
}

export async function getThreadMessages(
  accessToken: string,
  threadId: string
): Promise<GmailThreadMessage[]> {
  const res = await fetch(
    `${GMAIL_API}/threads/${threadId}?format=full`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!res.ok) return [];

  const data = (await res.json()) as {
    messages?: Array<{
      id: string;
      snippet: string;
      payload: {
        headers: Array<{ name: string; value: string }>;
        parts?: Array<{ mimeType: string; body: { data?: string } }>;
        body?: { data?: string };
      };
    }>;
  };

  return (data.messages ?? []).map((msg) => {
    const getHeader = (name: string) =>
      msg.payload.headers.find(
        (h) => h.name.toLowerCase() === name.toLowerCase()
      )?.value ?? "";

    // Extraire le body text depuis les parts ou le body direct
    let bodyData = "";
    if (msg.payload.parts) {
      const textPart = msg.payload.parts.find(
        (p) => p.mimeType === "text/plain"
      );
      bodyData = textPart?.body?.data ?? "";
    } else {
      bodyData = msg.payload.body?.data ?? "";
    }

    const bodyText = bodyData
      ? Buffer.from(bodyData.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf-8")
      : msg.snippet;

    return {
      id: msg.id,
      from: getHeader("From"),
      date: getHeader("Date"),
      snippet: msg.snippet,
      bodyText,
    };
  });
}

// ── Récupère le Message-ID header d'un message Gmail ────────────────────────
export async function getMessageHeader(
  accessToken: string,
  messageId: string,
  headerName: string
): Promise<string> {
  const res = await fetch(
    `${GMAIL_API}/messages/${messageId}?format=metadata&metadataHeaders=${headerName}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  if (!res.ok) return "";
  const data = (await res.json()) as {
    payload?: { headers?: Array<{ name: string; value: string }> };
  };
  return (
    data.payload?.headers?.find(
      (h) => h.name.toLowerCase() === headerName.toLowerCase()
    )?.value ?? ""
  );
}
