import { NextRequest } from "next/server";

// Gmail API direct send via OAuth2
// Sends from jules@vanzonexplorer.com (must be a verified Send As alias in Gmail,
// or re-authorize with OAuth credentials for the Workspace account directly)

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
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OAuth token error: ${err}`);
  }
  const data = await res.json();
  return data.access_token as string;
}

const SIGNATURE_HTML = `
<br><br>
<table style="font-family:Arial,sans-serif;font-size:13px;color:#333;border-collapse:collapse;">
  <tr>
    <td style="padding-right:16px;border-right:2px solid #7C3AED;vertical-align:middle;">
      <strong style="font-size:14px;color:#1a1a1a;">Jules Gaveglio</strong><br>
      <span style="color:#7C3AED;font-size:12px;">Vanzon Explorer</span><br>
      <span style="color:#888;font-size:11px;">Fondateur</span>
    </td>
    <td style="padding-left:16px;vertical-align:middle;font-size:12px;color:#666;line-height:1.6;">
      📧 <a href="mailto:jules@vanzonexplorer.com" style="color:#7C3AED;text-decoration:none;">jules@vanzonexplorer.com</a><br>
      🌐 <a href="https://www.vanzonexplorer.com" style="color:#7C3AED;text-decoration:none;">vanzonexplorer.com</a><br>
      📍 Pays Basque, France
    </td>
  </tr>
</table>
`;

// Convert plain text body to HTML and append signature
function buildHtmlBody(plainText: string): string {
  const htmlBody = plainText
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br>");
  return `<div style="font-family:Arial,sans-serif;font-size:14px;color:#333;line-height:1.6;">${htmlBody}</div>${SIGNATURE_HTML}`;
}

// Build MIME multipart message (plain text + HTML) and base64url-encode it
function buildRawMessage({
  to,
  cc,
  subject,
  plainBody,
  htmlBody,
  from,
}: {
  to: string;
  cc: string[];
  subject: string;
  plainBody: string;
  htmlBody: string;
  from: string;
}): string {
  const boundary = "==vanzon_boundary_" + Date.now();

  const lines: string[] = [
    `From: ${from}`,
    `To: ${to}`,
  ];
  if (cc.length > 0) lines.push(`Cc: ${cc.join(", ")}`);
  lines.push(`Subject: =?UTF-8?B?${Buffer.from(subject).toString("base64")}?=`);
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
  // HTML part
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
      {
        success: false,
        error: "GOOGLE_GMAIL_REFRESH_TOKEN non configuré.",
        setupRequired: true,
      },
      { status: 503 }
    );
  }

  try {
    const accessToken = await getGmailAccessToken();

    const rawMessage = buildRawMessage({
      from: "Jules — Vanzon Explorer <jules@vanzonexplorer.com>",
      to,
      cc: Array.isArray(cc) ? cc : [],
      subject,
      plainBody: body,
      htmlBody: buildHtmlBody(body),
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
      // If rejected because of the From alias, give a clear explanation
      if (errText.includes("Invalid From header") || errText.includes("alias")) {
        return Response.json(
          {
            success: false,
            error:
              "Pour envoyer depuis jules@vanzonexplorer.com, ajoute cette adresse comme alias vérifié dans les paramètres Gmail de gavegliojules@gmail.com (Paramètres → Comptes → Envoyer des e-mails en tant que).",
          },
          { status: 400 }
        );
      }
      return Response.json(
        { success: false, error: `Gmail API error: ${errText}` },
        { status: 500 }
      );
    }

    const result = await gmailRes.json();
    return Response.json({ success: true, messageId: result.id });
  } catch (error) {
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
