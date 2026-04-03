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
