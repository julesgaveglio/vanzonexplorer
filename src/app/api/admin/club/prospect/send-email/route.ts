import { NextRequest } from "next/server";

const SENDER_EMAIL = "jules@vanzonexplorer.com";
const SENDER_NAME = "Jules - Vanzon Explorer"; // ASCII only in From header

async function getGmailAccessToken(): Promise<string> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_GSC_CLIENT_ID!,
      client_secret: process.env.GOOGLE_GSC_CLIENT_SECRET!,
      refresh_token: process.env.GOOGLE_GMAIL_REFRESH_TOKEN!,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) throw new Error(`OAuth token error: ${await res.text()}`);
  const data = await res.json();
  return data.access_token as string;
}

// Fetch the official Gmail signature for the sender alias
async function getGmailSignature(accessToken: string): Promise<string> {
  try {
    const res = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/settings/sendAs/${encodeURIComponent(SENDER_EMAIL)}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (!res.ok) return "";
    const data = await res.json();
    // signature is HTML
    return (data.signature as string) ?? "";
  } catch {
    return "";
  }
}

// Convert plain text to HTML and append Gmail signature
function buildHtmlBody(plainText: string, signature: string): string {
  const htmlBody = plainText
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br>");

  const signatureBlock = signature
    ? `<br><br><div class="gmail_signature">${signature}</div>`
    : "";

  return `<div style="font-family:Arial,sans-serif;font-size:14px;color:#333;line-height:1.6;">${htmlBody}</div>${signatureBlock}`;
}

// RFC 2047 encode a header value containing non-ASCII characters
function encodeHeader(value: string): string {
  // Only encode if non-ASCII chars present
  if (/^[\x00-\x7F]*$/.test(value)) return value;
  return `=?UTF-8?B?${Buffer.from(value, "utf-8").toString("base64")}?=`;
}

// Build MIME multipart/alternative message and base64url-encode it
function buildRawMessage({
  to,
  cc,
  subject,
  plainBody,
  htmlBody,
}: {
  to: string;
  cc: string[];
  subject: string;
  plainBody: string;
  htmlBody: string;
}): string {
  const boundary = `==vanzon_${Date.now()}`;
  const from = `${SENDER_NAME} <${SENDER_EMAIL}>`;

  const lines: string[] = [
    `From: ${from}`,
    `To: ${to}`,
  ];
  if (cc.length > 0) lines.push(`Cc: ${cc.join(", ")}`);
  lines.push(`Subject: ${encodeHeader(subject)}`);
  lines.push(`MIME-Version: 1.0`);
  lines.push(`Content-Type: multipart/alternative; boundary="${boundary}"`);
  lines.push("");
  // Plain text part
  lines.push(`--${boundary}`);
  lines.push(`Content-Type: text/plain; charset=UTF-8`);
  lines.push(`Content-Transfer-Encoding: base64`);
  lines.push("");
  lines.push(Buffer.from(plainBody, "utf-8").toString("base64"));
  lines.push("");
  // HTML part (with signature)
  lines.push(`--${boundary}`);
  lines.push(`Content-Type: text/html; charset=UTF-8`);
  lines.push(`Content-Transfer-Encoding: base64`);
  lines.push("");
  lines.push(Buffer.from(htmlBody, "utf-8").toString("base64"));
  lines.push("");
  lines.push(`--${boundary}--`);

  const raw = lines.join("\r\n");
  return Buffer.from(raw)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export async function POST(req: NextRequest) {
  const { prospectId, to, cc, subject, body } = await req.json();

  if (!prospectId || !to || !subject || !body) {
    return Response.json(
      { success: false, error: "Champs requis manquants (prospectId, to, subject, body)" },
      { status: 400 }
    );
  }

  if (!process.env.GOOGLE_GMAIL_REFRESH_TOKEN) {
    return Response.json(
      { success: false, error: "GOOGLE_GMAIL_REFRESH_TOKEN non configuré.", setupRequired: true },
      { status: 503 }
    );
  }

  try {
    const accessToken = await getGmailAccessToken();

    // Fetch real Gmail signature for jules@vanzonexplorer.com
    const signature = await getGmailSignature(accessToken);

    const rawMessage = buildRawMessage({
      to,
      cc: Array.isArray(cc) ? cc : [],
      subject,
      plainBody: body,
      htmlBody: buildHtmlBody(body, signature),
    });

    const gmailRes = await fetch(
      "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ raw: rawMessage }),
      }
    );

    if (!gmailRes.ok) {
      const errText = await gmailRes.text();
      if (errText.includes("Invalid From") || errText.includes("alias")) {
        return Response.json(
          {
            success: false,
            error:
              "Ajoute jules@vanzonexplorer.com comme alias vérifié dans Gmail → Paramètres → Comptes → Envoyer des e-mails en tant que.",
          },
          { status: 400 }
        );
      }
      return Response.json({ success: false, error: `Gmail API: ${errText}` }, { status: 500 });
    }

    const result = await gmailRes.json();
    return Response.json({ success: true, messageId: result.id });
  } catch (error) {
    return Response.json(
      { success: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
