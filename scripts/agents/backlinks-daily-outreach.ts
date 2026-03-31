#!/usr/bin/env tsx
/**
 * backlinks-daily-outreach.ts — Prise de contact backlink automatique (1/jour)
 * Usage: npx tsx scripts/agents/backlinks-daily-outreach.ts
 * Déclenché par GitHub Actions chaque jour à 9h UTC (hors week-end)
 *
 * Actions :
 * 1. Sélectionne le meilleur prospect "découvert" (score max, pas encore contacté)
 * 2. Génère l'email via Hunter.io + Jina + Groq (appel API /admin/backlinks/outreach)
 * 3. Envoie via Resend si un email a été trouvé
 * 4. Envoie un récap à jules@vanzonexplorer.com
 */

import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { notifyTelegram } from "../lib/telegram";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://vanzonexplorer.com";
const ADMIN_EMAIL = "jules@vanzonexplorer.com";

// ── Supabase ───────────────────────────────────────────────────────────────────

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ── Resend — initialisé dans main() pour éviter un crash au démarrage si la clé est absente

// ── Helpers ────────────────────────────────────────────────────────────────────

function log(msg: string) {
  console.log(`[${new Date().toISOString()}] ${msg}`);
}

async function callApi(path: string, body: Record<string, unknown>) {
  const resp = await fetch(`${SITE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return resp.json();
}

// ── Sélection du prospect ──────────────────────────────────────────────────────

async function selectBestProspect() {
  // Prospects découverts non encore contactés (pas d'entrée dans backlink_outreach)
  const { data: prospects } = await supabase
    .from("backlink_prospects")
    .select("id, domain, score, type, notes")
    .eq("statut", "découvert")
    .order("score", { ascending: false })
    .limit(20);

  if (!prospects || prospects.length === 0) return null;

  // Exclure ceux qui ont déjà un outreach (draft ou envoyé)
  const { data: existing } = await supabase
    .from("backlink_outreach")
    .select("prospect_id");

  const contactedIds = new Set((existing ?? []).map((o: { prospect_id: string }) => o.prospect_id));

  const candidate = prospects.find((p: { id: string }) => !contactedIds.has(p.id));
  return candidate ?? null;
}

// ── Main ───────────────────────────────────────────────────────────────────────

async function main() {
  log("=== Agent Backlinks Daily Outreach ===");

  if (!process.env.RESEND_API_KEY) {
    log("❌ RESEND_API_KEY manquant — configure ce secret dans GitHub Actions (Settings → Secrets).");
    await notifyTelegram("❌ <b>Backlinks Daily</b> — RESEND_API_KEY manquant dans les secrets GitHub.");
    process.exit(1);
  }
  const resend = new Resend(process.env.RESEND_API_KEY);

  // 1. Sélectionner le meilleur prospect
  const prospect = await selectBestProspect();

  if (!prospect) {
    log("Aucun prospect disponible — arrêt.");
    await resend.emails.send({
      from: `Jules — Vanzon Explorer <${ADMIN_EMAIL}>`,
      to: [ADMIN_EMAIL],
      replyTo: ADMIN_EMAIL,
      subject: "Backlinks Daily — aucun prospect disponible",
      text: "L'agent backlinks quotidien n'a trouvé aucun prospect \"découvert\" à contacter. Lance un nouveau discovery depuis /admin/backlinks.",
    });
    await notifyTelegram("⚠️ <b>Backlinks Daily</b> — Aucun prospect disponible. Lance un nouveau discovery sur /admin/backlinks.");
    return;
  }

  log(`Prospect sélectionné : ${prospect.domain} (score ${prospect.score}/10)`);

  // 2. Générer l'email (discovery + Groq)
  log("Génération de l'email en cours…");
  const genData = await callApi("/api/admin/backlinks/outreach", {
    prospectId: prospect.id,
  });

  if (!genData.success) {
    log(`Erreur génération : ${genData.error}`);
    await resend.emails.send({
      from: `Jules — Vanzon Explorer <${ADMIN_EMAIL}>`,
      to: [ADMIN_EMAIL],
      replyTo: ADMIN_EMAIL,
      subject: `Backlinks Daily — erreur pour ${prospect.domain}`,
      text: `Impossible de générer l'email pour ${prospect.domain}.\n\nErreur : ${genData.error}`,
    });
    await notifyTelegram(`❌ <b>Backlinks Daily</b> — Erreur génération email pour <b>${prospect.domain}</b>\n${genData.error}`);
    return;
  }

  const { outreachId, subject, body: emailBody, emailDiscovery } = genData;

  log(`Email généré. Email trouvé : ${emailDiscovery?.email ?? "aucun"}`);

  // 3. Envoyer si un email destinataire a été trouvé
  if (!emailDiscovery?.email) {
    log("Aucun email trouvé — email enregistré en draft uniquement.");
    await resend.emails.send({
      from: `Jules — Vanzon Explorer <${ADMIN_EMAIL}>`,
      to: [ADMIN_EMAIL],
      replyTo: ADMIN_EMAIL,
      subject: `Backlinks Daily — draft créé sans email (${prospect.domain})`,
      text: [
        `L'agent a créé un draft pour ${prospect.domain} mais n'a pas trouvé d'email destinataire.`,
        ``,
        `➡ Complète-le manuellement sur /admin/backlinks`,
        ``,
        `Objet préparé : ${subject}`,
        `---`,
        emailBody,
      ].join("\n"),
    });
    await notifyTelegram(`📝 <b>Backlinks Daily</b> — Draft créé pour <b>${prospect.domain}</b> (score ${prospect.score}/10) mais aucun email trouvé.\n➡ À compléter manuellement sur /admin/backlinks`);
    return;
  }

  log(`Envoi vers ${emailDiscovery.email}…`);
  const sendData = await callApi(`/api/admin/backlinks/outreach/${outreachId}/send`, {
    recipientEmail: emailDiscovery.email,
    subject,
    emailBody,
  });

  if (!sendData.success) {
    log(`Erreur envoi : ${sendData.error}`);
    await resend.emails.send({
      from: `Jules — Vanzon Explorer <${ADMIN_EMAIL}>`,
      to: [ADMIN_EMAIL],
      replyTo: ADMIN_EMAIL,
      subject: `Backlinks Daily — erreur envoi vers ${prospect.domain}`,
      text: `Email généré mais non envoyé pour ${prospect.domain}.\n\nErreur : ${sendData.error}`,
    });
    await notifyTelegram(`❌ <b>Backlinks Daily</b> — Email généré mais non envoyé pour <b>${prospect.domain}</b>\n${sendData.error}`);
    return;
  }

  log(`✅ Email envoyé à ${emailDiscovery.email} (${prospect.domain})`);

  // 4. Récap admin
  await resend.emails.send({
    from: `Jules — Vanzon Explorer <${ADMIN_EMAIL}>`,
    to: [ADMIN_EMAIL],
    replyTo: ADMIN_EMAIL,
    subject: `✅ Backlinks Daily — email envoyé à ${prospect.domain}`,
    html: `
<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, sans-serif; font-size: 14px; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h2 style="color: #059669;">✅ Prise de contact backlink envoyée</h2>
  <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
    <tr><td style="padding: 6px 0; color: #666; width: 140px;">Domaine</td><td style="font-weight: bold;">${prospect.domain}</td></tr>
    <tr><td style="padding: 6px 0; color: #666;">Type</td><td>${prospect.type}</td></tr>
    <tr><td style="padding: 6px 0; color: #666;">Score</td><td>${prospect.score}/10</td></tr>
    <tr><td style="padding: 6px 0; color: #666;">Envoyé à</td><td>${emailDiscovery.email}</td></tr>
    <tr><td style="padding: 6px 0; color: #666;">Objet</td><td>${subject}</td></tr>
  </table>
  <div style="background: #f8f9fa; border-radius: 8px; padding: 16px; font-size: 13px; white-space: pre-wrap; line-height: 1.6;">${emailBody}</div>
  <p style="margin-top: 20px; font-size: 12px; color: #999;">
    Voir tous les prospects → <a href="https://vanzonexplorer.com/admin/backlinks">vanzonexplorer.com/admin/backlinks</a>
  </p>
</body>
</html>`,
  });

  log("=== Terminé ===");
  await notifyTelegram(`✅ <b>Backlinks Daily</b> — Email envoyé à ${emailDiscovery.email}\n📌 Domaine : <b>${prospect.domain}</b> · Score ${prospect.score}/10\n📎 Objet : ${subject}`);
}

main().catch((err) => {
  console.error("Erreur fatale :", err);
  process.exit(1);
});
