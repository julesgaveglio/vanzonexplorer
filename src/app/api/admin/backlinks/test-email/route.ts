import { NextRequest, NextResponse } from "next/server";
import { sendViaGmail, isGmailConfigured } from "@/lib/gmail/client";
import { requireAdmin } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const check = await requireAdmin();
  if (check instanceof NextResponse) return check;

  if (!isGmailConfigured()) {
    return Response.json({ success: false, error: "Gmail API non configurée" }, { status: 500 });
  }

  const body = await req.json().catch(() => ({}));
  const { to, subject, textBody } = body as {
    to?: string;
    subject?: string;
    textBody?: string;
  };

  if (!to || !subject || !textBody) {
    return Response.json({ success: false, error: "to, subject et textBody requis" }, { status: 400 });
  }

  try {
    const { messageId, threadId } = await sendViaGmail({ to, subject, textBody });
    return Response.json({ success: true, messageId, threadId, sentTo: to });
  } catch (error) {
    return Response.json(
      { success: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
