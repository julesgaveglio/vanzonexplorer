#!/usr/bin/env tsx
/**
 * backlinks-daily-outreach.ts — Prise de contact backlink automatique (3/jour)
 * Usage: npx tsx scripts/agents/backlinks-daily-outreach.ts
 * Déclenché par GitHub Actions chaque jour à 9h UTC
 *
 * Logique :
 * 1. Sélectionne les 10 meilleurs prospects "découvert" (score desc)
 *    en excluant ceux déjà dans backlink_outreach (draft ou envoyé)
 * 2. Pour chaque prospect (dans l'ordre) :
 *    a. Appel API /api/admin/backlinks/outreach → discovery email + génération draft
 *    b. Si email trouvé → appel API /send → email envoyé → statut "contacté"
 *    c. Si pas d'email → draft enregistré sans envoi → passé en statut différé
 * 3. S'arrête dès que 3 emails sont effectivement envoyés
 * 4. Notification Telegram avec récap complet
 */

import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { notifyTelegram } from "../lib/telegram";

const SITE_URL    = process.env.NEXT_PUBLIC_SITE_URL ?? "https://vanzonexplorer.com";
const ADMIN_EMAIL = "jules@vanzonexplorer.com";
const MAX_SENDS   = 3;    // emails à envoyer par jour
const MAX_TRIES   = 10;   // prospects tentés au max

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function log(msg: string) {
  console.log(`[${new Date().toISOString()}] ${msg}`);
}

// ── Appel JSON à une route de l'API Next.js ────────────────────────────────────
async function callApi(path: string, body: Record<string, unknown>) {
  const res = await fetch(`${SITE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
}

// ── Sélection des prospects éligibles ─────────────────────────────────────────
interface Prospect {
  id: string;
  domain: string;
  score: number;
  type: string;
  notes: string;
}

async function selectCandidates(limit: number): Promise<Prospect[]> {
  // Tous les prospects "découvert" par score décroissant
  const { data: prospects } = await supabase
    .from("backlink_prospects")
    .select("id, domain, score, type, notes")
    .eq("statut", "découvert")
    .order("score", { ascending: false })
    .limit(limit);

  if (!prospects || prospects.length === 0) return [];

  // Exclure ceux qui ont déjà un outreach (draft ou envoyé)
  const { data: existing } = await supabase
    .from("backlink_outreach")
    .select("prospect_id");

  const alreadyTried = new Set((existing ?? []).map((o: { prospect_id: string }) => o.prospect_id));
  return (prospects as Prospect[]).filter((p) => !alreadyTried.has(p.id));
}

// ── Tentative d'outreach pour un prospect ─────────────────────────────────────
interface OutreachResult {
  sent: boolean;
  email?: string;
  subject?: string;
  reason?: string;  // si non envoyé
}

async function attemptOutreach(prospect: Prospect): Promise<OutreachResult> {
  log(`  🎯 ${prospect.domain} (score ${prospect.score}/10, type: ${prospect.type})`);

  // Étape 1 : discovery email + génération draft
  const genData = await callApi("/api/admin/backlinks/outreach", {
    prospectId: prospect.id,
  }).catch((err) => ({ success: false, error: String(err) }));

  if (!genData.success) {
    log(`    ❌ Génération échouée : ${genData.error}`);
    return { sent: false, reason: `génération : ${genData.error}` };
  }

  const { outreachId, subject, body: emailBody, emailDiscovery } = genData;

  // Étape 2 : vérifier si un email a été trouvé
  if (!emailDiscovery?.email) {
    log(`    📝 Draft créé, aucun email trouvé`);
    return { sent: false, reason: "aucun email destinataire trouvé" };
  }

  // Étape 3 : envoi
  const sendData = await callApi(`/api/admin/backlinks/outreach/${outreachId}/send`, {
    recipientEmail: emailDiscovery.email,
    subject,
    emailBody,
  }).catch((err) => ({ success: false, error: String(err) }));

  if (!sendData.success) {
    log(`    ❌ Envoi échoué : ${sendData.error}`);
    return { sent: false, reason: `envoi : ${sendData.error}` };
  }

  log(`    ✅ Envoyé à ${emailDiscovery.email}`);
  return { sent: true, email: emailDiscovery.email, subject };
}

// ── Email récap admin ──────────────────────────────────────────────────────────
async function sendAdminRecap(
  resend: Resend,
  sent: Array<{ domain: string; email: string; subject: string; score: number }>,
  skipped: Array<{ domain: string; reason: string }>
) {
  const rows = sent.map((s) => `
    <tr>
      <td style="padding:6px 0;font-weight:bold;">${s.domain}</td>
      <td style="padding:6px 0;color:#666;">${s.email}</td>
      <td style="padding:6px 0;color:#666;">${s.subject}</td>
      <td style="padding:6px 0;color:#666;">${s.score}/10</td>
    </tr>`).join("");

  const skippedHtml = skipped.length > 0
    ? `<h3 style="color:#666;margin-top:24px;">Sans envoi (${skipped.length})</h3>
       <ul>${skipped.map((s) => `<li>${s.domain} — ${s.reason}</li>`).join("")}</ul>`
    : "";

  await resend.emails.send({
    from: `Jules — Vanzon Explorer <${ADMIN_EMAIL}>`,
    to: [ADMIN_EMAIL],
    replyTo: ADMIN_EMAIL,
    subject: `✅ Backlinks Daily — ${sent.length} email(s) envoyé(s) · ${new Date().toLocaleDateString("fr-FR")}`,
    html: `
<!DOCTYPE html>
<html>
<body style="font-family:-apple-system,sans-serif;font-size:14px;color:#1a1a1a;max-width:640px;margin:0 auto;padding:20px;">
  <h2 style="color:#059669;">✅ Backlinks — ${sent.length} prise(s) de contact</h2>
  <p style="color:#666;">${new Date().toLocaleDateString("fr-FR", { weekday:"long", day:"numeric", month:"long" })}</p>
  ${sent.length > 0 ? `
  <table style="width:100%;border-collapse:collapse;margin:16px 0;">
    <thead>
      <tr style="border-bottom:2px solid #e5e7eb;">
        <th style="text-align:left;padding:6px 0;color:#374151;">Domaine</th>
        <th style="text-align:left;padding:6px 0;color:#374151;">Email</th>
        <th style="text-align:left;padding:6px 0;color:#374151;">Objet</th>
        <th style="text-align:left;padding:6px 0;color:#374151;">Score</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>` : "<p>Aucun email envoyé aujourd'hui.</p>"}
  ${skippedHtml}
  <p style="margin-top:24px;font-size:12px;color:#9ca3af;">
    <a href="https://vanzonexplorer.com/admin/backlinks">Voir le Kanban backlinks →</a>
  </p>
</body>
</html>`,
  });
}

// ── Main ───────────────────────────────────────────────────────────────────────
async function main() {
  log("=== Backlinks Daily Outreach — 3 emails/jour ===");

  if (!process.env.RESEND_API_KEY) {
    await notifyTelegram("❌ *Backlinks Daily* — RESEND_API_KEY manquant dans les secrets GitHub.");
    process.exit(1);
  }
  const resend = new Resend(process.env.RESEND_API_KEY);

  // Sélectionner les candidats
  const candidates = await selectCandidates(MAX_TRIES);

  if (candidates.length === 0) {
    log("Aucun prospect disponible.");
    await notifyTelegram("⚠️ *Backlinks Daily* — Aucun prospect \"découvert\" à contacter.\n➡ Lance le scraper sur /admin/backlinks.");
    await resend.emails.send({
      from: `Jules — Vanzon Explorer <${ADMIN_EMAIL}>`,
      to: [ADMIN_EMAIL],
      subject: "Backlinks Daily — file vide",
      text: "Aucun prospect disponible. Lance un nouveau discovery depuis /admin/backlinks.",
    });
    return;
  }

  log(`${candidates.length} prospects candidats`);

  // Boucle d'outreach — stop à MAX_SENDS envois
  const sentList: Array<{ domain: string; email: string; subject: string; score: number }> = [];
  const skippedList: Array<{ domain: string; reason: string }> = [];
  let tried = 0;

  for (const prospect of candidates) {
    if (sentList.length >= MAX_SENDS) break;
    if (tried >= MAX_TRIES) break;
    tried++;

    const result = await attemptOutreach(prospect);

    if (result.sent && result.email && result.subject) {
      sentList.push({
        domain:  prospect.domain,
        email:   result.email,
        subject: result.subject,
        score:   prospect.score,
      });
    } else {
      skippedList.push({
        domain: prospect.domain,
        reason: result.reason ?? "inconnu",
      });
    }

    // Petit délai entre chaque tentative pour ne pas surcharger l'API
    if (tried < candidates.length) await new Promise((r) => setTimeout(r, 1500));
  }

  // Email récap admin
  await sendAdminRecap(resend, sentList, skippedList);

  // Telegram
  const tgLines: string[] = [`📬 *Backlinks Daily* — ${sentList.length}/${MAX_SENDS} envoyé(s)`];
  if (sentList.length > 0) {
    tgLines.push("");
    for (const s of sentList) tgLines.push(`✅ ${s.domain} · ${s.email} (${s.score}/10)`);
  }
  if (skippedList.length > 0) {
    tgLines.push("");
    tgLines.push(`⏭ Ignorés : ${skippedList.map((s) => s.domain).join(", ")}`);
  }
  tgLines.push("\n📊 [Kanban](https://vanzonexplorer.com/admin/backlinks)");

  await notifyTelegram(tgLines.join("\n"));

  log(`=== Terminé — ${sentList.length} envoyé(s), ${skippedList.length} ignoré(s) ===`);
}

main().catch(async (err) => {
  const msg = (err as Error).message ?? String(err);
  console.error("[backlinks-daily] FATAL:", msg);
  await notifyTelegram(`❌ *Backlinks Daily* — Erreur fatale :\n${msg}`).catch(() => {});
  process.exit(1);
});
