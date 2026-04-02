// src/app/api/admin/seo/drafts/send-email/route.ts
// Envoie une sélection d'articles par email via Gmail API — template charte Vanzon
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { getGmailAccessToken } from "@/lib/gmail";

const GMAIL_API = "https://gmail.googleapis.com/gmail/v1";
const LOGO_URL = "https://cdn.sanity.io/images/lewexa74/production/1f483103ef15ee3549eab14ba2801d11b32a9055-313x313.png";

// ── Template article ──────────────────────────────────────────────────────────
function articleSection(
  article: { title: string; html_content: string; target_url?: string },
  index: number,
  total: number
): string {
  const isLast = index === total - 1;
  return `
  <div style="padding:40px 0;${isLast ? "" : "border-bottom:1px solid #e8ecf0;"}">
    <!-- Badge numéro -->
    <div style="margin-bottom:20px;">
      <span style="display:inline-block;background:linear-gradient(135deg,#3B82F6,#0EA5E9);color:#fff;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;padding:4px 12px;border-radius:20px;">
        Article ${index + 1}${total > 1 ? ` / ${total}` : ""}
      </span>
      ${article.target_url ? `
      <span style="display:inline-block;margin-left:8px;font-size:11px;color:#94a3b8;">
        Backlink → <a href="${article.target_url}" style="color:#3B82F6;text-decoration:none;">${article.target_url.replace("https://", "")}</a>
      </span>` : ""}
    </div>

    <!-- Contenu article avec styles inline -->
    <div style="font-family:Georgia,'Times New Roman',serif;font-size:15px;line-height:1.85;color:#1e293b;">
      ${article.html_content
        .replace(/<h1>/g, '<h1 style="font-family:\'Inter\',Arial,sans-serif;font-size:22px;font-weight:800;color:#0f172a;margin:0 0 20px;line-height:1.25;">')
        .replace(/<h2>/g, '<h2 style="font-family:\'Inter\',Arial,sans-serif;font-size:16px;font-weight:700;color:#0f172a;margin:32px 0 12px;padding-top:24px;border-top:1px solid #e2e8f0;">')
        .replace(/<h3>/g, '<h3 style="font-family:\'Inter\',Arial,sans-serif;font-size:14px;font-weight:600;color:#334155;margin:20px 0 8px;">')
        .replace(/<p>/g, '<p style="margin:0 0 16px;color:#334155;">')
        .replace(/<ul>/g, '<ul style="margin:0 0 16px;padding-left:20px;">')
        .replace(/<ol>/g, '<ol style="margin:0 0 16px;padding-left:20px;">')
        .replace(/<li>/g, '<li style="margin-bottom:6px;color:#334155;">')
        .replace(/<strong>/g, '<strong style="font-weight:600;color:#0f172a;">')
        .replace(/<a href="/g, '<a style="color:#3B82F6;text-decoration:underline;" href="')
        .replace(/<table>/g, '<table style="width:100%;border-collapse:collapse;margin:20px 0;font-family:\'Inter\',Arial,sans-serif;font-size:13px;">')
        .replace(/<th>/g, '<th style="background:#f1f5f9;padding:10px 14px;text-align:left;font-weight:600;color:#334155;border:1px solid #e2e8f0;">')
        .replace(/<td>/g, '<td style="padding:10px 14px;border:1px solid #e2e8f0;color:#475569;">')
        .replace(/<blockquote>/g, '<blockquote style="margin:20px 0;padding:16px 20px;border-left:3px solid #3B82F6;background:#eff6ff;color:#1d4ed8;font-style:italic;border-radius:0 6px 6px 0;">')
      }
    </div>
  </div>`;
}

// ── Template email complet ────────────────────────────────────────────────────
function buildEmailHtml(
  articles: { title: string; html_content: string; target_url?: string }[],
  date: string
): string {
  const isMultiple = articles.length > 1;
  const headerTitle = isMultiple
    ? `${articles.length} articles prêts à partager`
    : articles[0].title;

  return `<!DOCTYPE html>
<html lang="fr" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <title>${headerTitle}</title>
</head>
<body style="margin:0;padding:0;background:#ffffff;font-family:'Inter',Arial,Helvetica,sans-serif;-webkit-font-smoothing:antialiased;">

  <div style="max-width:600px;margin:0 auto;padding:40px 20px 60px;">

    <!-- ── LOGO ── -->
    <div style="text-align:center;margin-bottom:36px;">
      <img
        src="${LOGO_URL}"
        alt="Vanzon Explorer"
        width="40"
        height="40"
        style="display:inline-block;width:40px;height:40px;border-radius:10px;"
      />
    </div>

    <!-- ── BARRE DÉGRADÉE ── -->
    <div style="height:3px;background:linear-gradient(135deg,#3B82F6 0%,#0EA5E9 100%);border-radius:2px;margin-bottom:36px;"></div>

    <!-- ── HEADER ── -->
    <div style="margin-bottom:8px;">
      <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#94a3b8;">
        VANZON EXPLORER · ${isMultiple ? "ARTICLES" : "ARTICLE"}
      </p>
      <h1 style="margin:0 0 8px;font-size:${isMultiple ? "22px" : "20px"};font-weight:800;color:#0f172a;line-height:1.25;">
        ${headerTitle}
      </h1>
      <p style="margin:0;font-size:12px;color:#94a3b8;">
        ${date}${isMultiple ? ` · ${articles.length} articles` : ""}
      </p>
    </div>

    <!-- ── SÉPARATEUR ── -->
    <div style="height:1px;background:#e2e8f0;margin:28px 0;"></div>

    <!-- ── ARTICLES ── -->
    ${articles.map((a, i) => articleSection(a, i, articles.length)).join("")}

    <!-- ── SÉPARATEUR FOOTER ── -->
    <div style="height:1px;background:#e2e8f0;margin:32px 0 24px;"></div>

    <!-- ── FOOTER ── -->
    <div style="text-align:center;">
      <img
        src="${LOGO_URL}"
        alt="Vanzon Explorer"
        width="24"
        height="24"
        style="display:inline-block;width:24px;height:24px;border-radius:6px;opacity:0.5;vertical-align:middle;margin-right:6px;"
      />
      <span style="font-size:12px;color:#94a3b8;vertical-align:middle;">
        <a href="https://vanzonexplorer.com" style="color:#94a3b8;text-decoration:none;">vanzonexplorer.com</a>
      </span>
    </div>

  </div>
</body>
</html>`;
}

// ── Handler ───────────────────────────────────────────────────────────────────
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
    ? articles[0].title
    : `${articles.length} articles — Vanzon Explorer`;

  const htmlBody = buildEmailHtml(articles, date);

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
