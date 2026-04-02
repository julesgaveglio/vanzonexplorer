// src/app/api/admin/seo/drafts/send-email/route.ts
// Envoie une sélection d'articles par email via Gmail API
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { getGmailAccessToken } from "@/lib/gmail";

const GMAIL_API = "https://gmail.googleapis.com/gmail/v1";

function articleSection(article: { title: string; html_content: string; target_url?: string }, index: number): string {
  return `
  <div style="margin-bottom:48px;padding-bottom:48px;border-bottom:1px solid #e5e7eb;">
    <div style="display:inline-block;background:#f3f4f6;color:#6b7280;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;padding:4px 10px;border-radius:4px;margin-bottom:12px;">Article ${index + 1}</div>
    ${article.target_url ? `<div style="font-size:12px;color:#9ca3af;margin-bottom:16px;">Backlink cible : <a href="${article.target_url}" style="color:#3b82f6;">${article.target_url}</a></div>` : ""}
    <div style="font-family:Georgia,serif;font-size:16px;line-height:1.8;color:#1f2937;">
      ${article.html_content}
    </div>
  </div>`;
}

export async function POST(req: NextRequest) {
  const { ids, to } = await req.json() as { ids: string[]; to: string };

  if (!ids?.length || !to) {
    return NextResponse.json({ error: "ids et to sont requis" }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();
  const { data: articles, error } = await supabase
    .from("draft_articles")
    .select("id, title, html_content, target_url")
    .in("id", ids);

  if (error || !articles?.length) {
    return NextResponse.json({ error: "Articles introuvables" }, { status: 404 });
  }

  const date = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  const subject = articles.length === 1
    ? `Article : ${articles[0].title}`
    : `${articles.length} Articles — Vanzon Explorer (${date})`;

  const htmlBody = `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:'Inter',Arial,sans-serif;">
  <div style="max-width:720px;margin:0 auto;padding:40px 20px;">

    <!-- Header -->
    <div style="background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:28px 32px;margin-bottom:32px;">
      <div style="font-size:11px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#6b7280;margin-bottom:8px;">VANZON EXPLORER · ARTICLES</div>
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#111827;">
        ${articles.length === 1 ? articles[0].title : `${articles.length} articles prêts à publier`}
      </h1>
      <p style="margin:0;font-size:13px;color:#9ca3af;">Généré le ${date} · ${articles.length} article${articles.length > 1 ? "s" : ""}</p>
    </div>

    <!-- Articles -->
    <div style="background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:32px;">
      ${articles.map((a, i) => articleSection(a, i)).join("")}
    </div>

    <!-- Footer -->
    <div style="text-align:center;padding:24px 0;font-size:12px;color:#9ca3af;">
      Vanzon Explorer · <a href="https://vanzonexplorer.com" style="color:#6b7280;">vanzonexplorer.com</a>
    </div>
  </div>
</body>
</html>`;

  const subjectEncoded = `=?utf-8?B?${Buffer.from(subject).toString("base64")}?=`;
  const mime = [
    `From: Jules - Vanzon Explorer <jules@vanzonexplorer.com>`,
    `To: ${to}`,
    `Subject: ${subjectEncoded}`,
    `MIME-Version: 1.0`,
    `Content-Type: text/html; charset=utf-8`,
    ``,
    htmlBody,
  ].join("\r\n");

  const raw = Buffer.from(mime).toString("base64url");
  const token = await getGmailAccessToken();

  const res = await fetch(`${GMAIL_API}/users/me/messages/send`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ raw }),
  });

  if (!res.ok) {
    const err = await res.text();
    return NextResponse.json({ error: err }, { status: 500 });
  }

  const data = await res.json() as { id: string };
  return NextResponse.json({ ok: true, messageId: data.id });
}
