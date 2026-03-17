import { NextRequest } from "next/server";

// Gmail API direct send via OAuth2
// Requires GOOGLE_GMAIL_REFRESH_TOKEN env var with gmail.send scope
// Use existing GOOGLE_GSC_CLIENT_ID + GOOGLE_GSC_CLIENT_SECRET

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

// Build RFC 2822 message and base64url-encode it
function buildRawMessage({
  to,
  cc,
  subject,
  body,
  from,
}: {
  to: string;
  cc: string[];
  subject: string;
  body: string;
  from: string;
}): string {
  const lines: string[] = [
    `From: ${from}`,
    `To: ${to}`,
  ];
  if (cc.length > 0) lines.push(`Cc: ${cc.join(", ")}`);
  lines.push(`Subject: ${subject}`);
  lines.push(`MIME-Version: 1.0`);
  lines.push(`Content-Type: text/plain; charset=UTF-8`);
  lines.push(`Content-Transfer-Encoding: quoted-printable`);
  lines.push("");
  lines.push(body);

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

  // Check if Gmail credentials are configured
  if (!process.env.GOOGLE_GMAIL_REFRESH_TOKEN) {
    return Response.json(
      {
        success: false,
        error: "GOOGLE_GMAIL_REFRESH_TOKEN non configuré. Voir instructions setup Gmail API.",
        setupRequired: true,
      },
      { status: 503 }
    );
  }

  try {
    const accessToken = await getGmailAccessToken();

    const rawMessage = buildRawMessage({
      from: "Jules Gaveglio <gavegliojules@gmail.com>",
      to,
      cc: Array.isArray(cc) ? cc : [],
      subject,
      body,
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
      const err = await gmailRes.text();
      return Response.json(
        { success: false, error: `Gmail API error: ${err}` },
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
