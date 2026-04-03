/**
 * Gmail API client — envoi via l'API officielle Google Gmail.
 * Les emails apparaissent dans la boîte "Envoyés" de jules@vanzonexplorer.com
 * et la signature Gmail configurée est automatiquement récupérée et ajoutée.
 *
 * Env vars requises :
 *   GOOGLE_GSC_CLIENT_ID       — OAuth2 client ID (partagé avec GSC)
 *   GOOGLE_GSC_CLIENT_SECRET   — OAuth2 client secret (partagé avec GSC)
 *   GOOGLE_GMAIL_REFRESH_TOKEN — Refresh token avec scopes : gmail.send + gmail.settings.basic
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
}): string {
  const boundary = `vanzon_${Date.now()}_boundary`;
  const textB64 = Buffer.from(options.textBody, "utf-8").toString("base64");
  const htmlB64 = Buffer.from(options.htmlBody, "utf-8").toString("base64");

  const mime = [
    `From: ${options.from}`,
    `To: ${options.to}`,
    `Subject: ${encodeSubject(options.subject)}`,
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
  textBody: string; // Corps en texte brut (généré par Groq)
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
    from: `Jules — Vanzon Explorer <${GMAIL_USER}>`,
    to: options.to,
    subject: options.subject,
    htmlBody,
    textBody,
  });

  const res = await fetch(`${GMAIL_API}/messages/send`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ raw }),
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
