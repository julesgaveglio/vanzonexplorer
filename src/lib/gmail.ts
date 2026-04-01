// src/lib/gmail.ts
// Client Gmail API — getGmailAccessToken, fetchGmailSignature, sendGmailEmail
// Utilise GMAIL_REFRESH_TOKEN + GOOGLE_GSC_CLIENT_ID + GOOGLE_GSC_CLIENT_SECRET

const GMAIL_API = "https://gmail.googleapis.com/gmail/v1";
const TOKEN_URL = "https://oauth2.googleapis.com/token";

// ── OAuth2 ────────────────────────────────────────────────────────────────────
export async function getGmailAccessToken(): Promise<string> {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id:     process.env.GOOGLE_GSC_CLIENT_ID!,
      client_secret: process.env.GOOGLE_GSC_CLIENT_SECRET!,
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
