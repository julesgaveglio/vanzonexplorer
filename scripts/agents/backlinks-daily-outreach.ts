#!/usr/bin/env tsx
/**
 * backlinks-daily-outreach.ts — Agent backlink automatique complet
 * Usage: npx tsx scripts/agents/backlinks-daily-outreach.ts
 * Cron: Mar-Ven à 9h30 Paris (7h30 UTC)
 *
 * 4 phases :
 *   1. Détection des réponses (Gmail thread → Groq sentiment)
 *   2. Relance automatique J+4 (follow-up dans le même thread)
 *   3. Outreach 5 nouveaux prospects/jour
 *   4. Notification Telegram récap
 */

import { createClient } from "@supabase/supabase-js";
import Groq from "groq-sdk";
import {
  getGmailAccessToken,
  sendViaGmail,
  getGmailLabelId,
  applyGmailLabel,
  getThreadMessages,
  getMessageHeader,
} from "../../src/lib/gmail/client";
import { discoverEmails } from "../../src/lib/email-discovery";
import { notifyTelegram } from "../lib/telegram";

// ── Config ─────────────────────────────────────────────────────────────────────
const MAX_NEW_SENDS = 5;
const FOLLOW_UP_DELAY_DAYS = 4;
const MAX_FOLLOW_UPS = 1;
const BACKLINKS_LABEL = "BACKLINKS";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function log(msg: string) {
  console.log(`[${new Date().toISOString()}] ${msg}`);
}

// ── Groq helper avec multi-key fallback ────────────────────────────────────────
function getGroqClient(): Groq {
  const keys = [
    process.env.GROQ_API_KEY,
    process.env.GROQ_API_KEY_2,
    process.env.GROQ_API_KEY_3,
  ].filter(Boolean) as string[];
  const key = keys[Math.floor(Math.random() * keys.length)];
  return new Groq({ apiKey: key });
}

// ══════════════════════════════════════════════════════════════════════════════
// PHASE 1 — Détection des réponses
// ══════════════════════════════════════════════════════════════════════════════

interface ReplyResult {
  prospectDomain: string;
  sentiment: string;
  snippet: string;
}

async function checkReplies(accessToken: string): Promise<ReplyResult[]> {
  log("═══ Phase 1 : Détection des réponses ═══");

  const { data: pending } = await supabase
    .from("backlink_outreach")
    .select("id, prospect_id, gmail_thread_id, recipient_email, backlink_prospects(domain)")
    .not("sent_at", "is", null)
    .not("gmail_thread_id", "is", null)
    .is("reply_detected_at", null);

  if (!pending || pending.length === 0) {
    log("  Aucun thread à vérifier.");
    return [];
  }

  log(`  ${pending.length} threads à vérifier`);
  const results: ReplyResult[] = [];

  for (const outreach of pending) {
    try {
      const messages = await getThreadMessages(accessToken, outreach.gmail_thread_id);

      // Un thread avec plus de messages que nos envois = réponse reçue
      // On cherche un message qui ne vient pas de jules@vanzonexplorer.com
      const replyMsg = messages.find(
        (m) => !m.from.includes("jules@vanzonexplorer.com") && !m.from.includes("vanzonexplorer")
      );

      if (!replyMsg) continue;

      const outreachWithProspect = outreach as typeof outreach & { backlink_prospects?: { domain: string } };
      log(`  📩 Réponse détectée pour ${outreachWithProspect.backlink_prospects?.domain}`);

      // Analyser le sentiment avec Groq
      const groq = getGroqClient();
      const analysis = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "user",
            content: `Analyse cette réponse à un email de prise de contact pour un partenariat web.
Réponds avec UN SEUL mot : POSITIF, NEGATIF, ou NEUTRE.

- POSITIF = intéressé, accepte, veut en discuter, demande plus d'infos
- NEGATIF = refuse, pas intéressé, demande de ne plus contacter
- NEUTRE = réponse automatique, absent, hors sujet

Réponse à analyser :
"""
${replyMsg.bodyText.substring(0, 1000)}
"""`,
          },
        ],
        temperature: 0,
        max_tokens: 10,
      });

      const rawSentiment = analysis.choices[0]?.message?.content?.trim().toUpperCase() ?? "NEUTRE";
      const sentiment = rawSentiment.includes("POSITIF")
        ? "positif"
        : rawSentiment.includes("NEGATIF")
          ? "negatif"
          : "neutre";

      // Mettre à jour l'outreach
      await supabase
        .from("backlink_outreach")
        .update({
          reply_body: replyMsg.bodyText.substring(0, 2000),
          reply_sentiment: sentiment,
          reply_detected_at: new Date().toISOString(),
        })
        .eq("id", outreach.id);

      // Mettre à jour le statut du prospect
      const newStatus = sentiment === "positif" ? "obtenu" : sentiment === "negatif" ? "rejeté" : "contacté";
      if (newStatus !== "contacté") {
        await supabase
          .from("backlink_prospects")
          .update({ statut: newStatus })
          .eq("id", outreach.prospect_id);
      }

      const domain = outreachWithProspect.backlink_prospects?.domain ?? "?";
      results.push({ prospectDomain: domain, sentiment, snippet: replyMsg.snippet });
      log(`    → ${sentiment} (${replyMsg.snippet.substring(0, 60)}...)`);
    } catch (err) {
      log(`  ⚠️ Erreur thread ${outreach.gmail_thread_id}: ${(err as Error).message}`);
    }
  }

  return results;
}

// ══════════════════════════════════════════════════════════════════════════════
// PHASE 2 — Relances automatiques (J+4)
// ══════════════════════════════════════════════════════════════════════════════

interface FollowUpResult {
  domain: string;
  email: string;
}

async function sendFollowUps(accessToken: string, labelId: string | null): Promise<FollowUpResult[]> {
  log("═══ Phase 2 : Relances J+4 ═══");

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - FOLLOW_UP_DELAY_DAYS);

  const { data: eligible } = await supabase
    .from("backlink_outreach")
    .select("id, prospect_id, recipient_email, email_subject, gmail_thread_id, gmail_message_id, follow_up_count, backlink_prospects(domain)")
    .not("sent_at", "is", null)
    .not("gmail_thread_id", "is", null)
    .is("reply_detected_at", null)
    .lt("sent_at", cutoff.toISOString())
    .lt("follow_up_count", MAX_FOLLOW_UPS);

  if (!eligible || eligible.length === 0) {
    log("  Aucune relance à envoyer.");
    return [];
  }

  log(`  ${eligible.length} prospect(s) éligible(s) à une relance`);
  const results: FollowUpResult[] = [];

  for (const outreach of eligible) {
    try {
      const outreachWithProspect2 = outreach as typeof outreach & { backlink_prospects?: { domain: string } };
      const domain = outreachWithProspect2.backlink_prospects?.domain ?? "?";

      // Récupérer le Message-ID original pour In-Reply-To
      let originalMessageId = "";
      if (outreach.gmail_message_id) {
        originalMessageId = await getMessageHeader(accessToken, outreach.gmail_message_id, "Message-ID");
      }

      const followUpBody = `Bonjour,

Je me permets de revenir vers vous suite à mon précédent message au sujet d'une collaboration entre nos deux sites.

Je serais ravi d'en discuter si l'idée vous intéresse. N'hésitez pas à me répondre directement.

Bonne journée,
Jules`;

      const result = await sendViaGmail({
        to: outreach.recipient_email,
        subject: `Re: ${outreach.email_subject}`,
        textBody: followUpBody,
        threadId: outreach.gmail_thread_id,
        inReplyTo: originalMessageId || undefined,
        references: originalMessageId || undefined,
      });

      // Appliquer le label BACKLINKS
      if (labelId) {
        await applyGmailLabel(accessToken, result.messageId, labelId).catch(() => {});
      }

      // Mettre à jour la DB
      await supabase
        .from("backlink_outreach")
        .update({
          follow_up_count: (outreach.follow_up_count || 0) + 1,
          last_follow_up_at: new Date().toISOString(),
        })
        .eq("id", outreach.id);

      await supabase
        .from("backlink_prospects")
        .update({ statut: "relancé" })
        .eq("id", outreach.prospect_id);

      results.push({ domain, email: outreach.recipient_email });
      log(`  ✅ Relance envoyée : ${domain} → ${outreach.recipient_email}`);
    } catch (err) {
      log(`  ❌ Erreur relance : ${(err as Error).message}`);
    }

    await new Promise((r) => setTimeout(r, 3000));
  }

  return results;
}

// ══════════════════════════════════════════════════════════════════════════════
// PHASE 3 — Outreach nouveaux prospects (5/jour)
// ══════════════════════════════════════════════════════════════════════════════

// Prompt outreach (copié depuis la route API pour fonctionner en standalone)
const OUTREACH_PROMPT = `Tu rédiges un email de prise de contact pour obtenir un backlink / mention vers vanzonexplorer.com.

EXEMPLE PARFAIT À IMITER (structure, ton, longueur) :
---
Bonjour E. Stierlen,

J'ai lu votre guide sur la van life en France — la partie itinéraires est particulièrement bien faite.

Je gère Vanzon Explorer, une plateforme van life basée au Pays Basque. On couvre des sujets que vous n'abordez peut-être pas encore : aménagement de van, homologation VASP, achat/revente, location — des angles qui pourraient compléter votre guide et apporter de la valeur à vos lecteurs.

Est-ce que vous seriez ouvert à une mention ou à un échange de contenu ?

Bonne journée,
Jules
---

RÈGLES STRICTES :
1. Salutation : "Bonjour [Prénom Initial. Nom]" si contact connu, sinon "Bonjour,"
2. Ligne 1 : 1 phrase qui montre que tu as LU leur contenu — cite quelque chose de SPÉCIFIQUE (article, rubrique, sujet). Jamais générique.
3. Ligne 2 : "Je gère Vanzon Explorer, une plateforme van life basée au Pays Basque." + 1 phrase sur ce qu'on couvre qui pourrait compléter LEUR contenu.
4. Ligne 3 : 1 question simple et directe — "Seriez-vous ouvert à une mention ?" ou "Est-ce qu'un échange de contenu vous intéresserait ?"
5. Signature : "Bonne journée,\\nJules"
6. Maximum 5 phrases au total (hors salutation et signature)
7. AUCUN mot en gras, AUCUNE liste, AUCUN titre
8. Jamais le mot "backlink", "SEO", "lien entrant", "netlinking"
9. Ton : direct, humain, entre collègues — pas un commercial, pas un robot`;

interface OutreachSendResult {
  domain: string;
  email: string;
  subject: string;
  score: number;
}

async function sendNewOutreach(accessToken: string, labelId: string | null): Promise<{
  sent: OutreachSendResult[];
  skipped: Array<{ domain: string; reason: string }>;
}> {
  log("═══ Phase 3 : Outreach nouveaux prospects ═══");

  // Sélectionner les meilleurs prospects "découvert" sans outreach existant
  const { data: prospects } = await supabase
    .from("backlink_prospects")
    .select("id, domain, url, type, score, notes")
    .eq("statut", "découvert")
    .order("score", { ascending: false })
    .limit(15);

  if (!prospects || prospects.length === 0) {
    log("  Aucun prospect disponible.");
    return { sent: [], skipped: [] };
  }

  // Exclure ceux qui ont déjà un outreach
  const { data: existing } = await supabase
    .from("backlink_outreach")
    .select("prospect_id");

  const alreadyTried = new Set((existing ?? []).map((o: { prospect_id: string }) => o.prospect_id));
  const candidates = prospects.filter((p) => !alreadyTried.has(p.id));

  log(`  ${candidates.length} candidat(s) disponible(s)`);

  const sent: OutreachSendResult[] = [];
  const skipped: Array<{ domain: string; reason: string }> = [];

  for (const p of candidates) {
    if (sent.length >= MAX_NEW_SENDS) break;

    log(`  🎯 ${p.domain} (score ${p.score}/10, type: ${p.type})`);

    try {
      // 1. Découvrir l'email
      const discovery = await discoverEmails(`https://${p.domain}`, {
        context: "outreach SEO backlink — blog / forum / site voyage van life France",
      });

      if (!discovery.bestEmail) {
        log(`    📝 Aucun email trouvé`);
        skipped.push({ domain: p.domain, reason: "aucun email trouvé" });

        // Sauvegarder le draft sans email
        await supabase.from("backlink_outreach").insert({
          prospect_id: p.id,
          recipient_email: null,
          email_subject: `Collaboration — ${p.domain}`,
          email_body: "(email non généré — pas de destinataire)",
          template_type: p.type === "forum" ? "forum" : p.type === "partenaire" ? "partenaire" : "blog",
          approved: false,
        });
        continue;
      }

      // 2. Scrape le contenu pour personnalisation
      let targetPageContent = "";
      try {
        const url = p.url || `https://${p.domain}`;
        const res = await fetch(`https://r.jina.ai/${url}`, {
          headers: {
            Authorization: `Bearer ${process.env.JINA_API_KEY}`,
            Accept: "text/plain",
            "X-Return-Format": "markdown",
            "X-Timeout": "12",
          },
          signal: AbortSignal.timeout(15000),
        });
        if (res.ok) targetPageContent = (await res.text()).substring(0, 2000);
      } catch { /* non-bloquant */ }

      // 3. Générer l'email personnalisé
      const INVALID_NAMES = ["—", "non spécifié", "inconnu", "unknown", "n/a", "na", "contact", "admin", "webmaster", "info"];
      const bestContact = discovery.contacts.sort((a, b) => (a.priority || 99) - (b.priority || 99))[0];
      const rawName = bestContact?.name?.trim() ?? "";
      const contactName = rawName && !INVALID_NAMES.includes(rawName.toLowerCase()) ? rawName : null;
      const salutation = contactName
        ? (() => {
            const parts = contactName.trim().split(" ");
            if (parts.length >= 2) return `${parts[0].charAt(0).toUpperCase()}. ${parts.slice(1).join(" ")}`;
            return parts[0];
          })()
        : null;

      const groq = getGroqClient();
      const groqResponse = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "user",
            content: `${OUTREACH_PROMPT}

SITE CIBLE :
- Domaine : ${p.domain}
- URL page cible : ${p.url}
- Type : ${p.type}
- Notes sur le site : ${p.notes || "—"}
${salutation ? "- Salutation : Bonjour " + salutation + "," : "- Pas de contact identifié — commencer par Bonjour,"}

CONTENU DU SITE (extrait) :
${targetPageContent || "(non disponible — imagine le contenu d'après le domaine et les notes)"}

Format OBLIGATOIRE :
###OBJET###
[Objet : 5-7 mots max, sans "RE:", sans emoji, naturel]
###CORPS###
[Email complet]
###FIN###`,
          },
        ],
        temperature: 0.75,
        max_tokens: 400,
      });

      const rawContent = groqResponse.choices[0]?.message?.content || "";
      const subjectMatch = rawContent.match(/###OBJET###\s*([\s\S]*?)\s*###CORPS###/);
      const bodyMatch = rawContent.match(/###CORPS###\s*([\s\S]*?)\s*###FIN###/);

      const subject = subjectMatch?.[1]?.trim() ?? `Collaboration vanzonexplorer.com — ${p.domain}`;
      const emailBody = bodyMatch?.[1]?.trim() ?? rawContent.replace(/###\w+###/g, "").trim();

      if (!emailBody) {
        skipped.push({ domain: p.domain, reason: "génération email échouée" });
        continue;
      }

      // 4. Envoyer via Gmail
      const sendResult = await sendViaGmail({
        to: discovery.bestEmail,
        subject,
        textBody: emailBody,
      });

      // 5. Appliquer le label BACKLINKS
      if (labelId) {
        await applyGmailLabel(accessToken, sendResult.messageId, labelId).catch(() => {});
      }

      // 6. Sauvegarder en DB
      await supabase.from("backlink_outreach").insert({
        prospect_id: p.id,
        recipient_email: discovery.bestEmail,
        email_subject: subject,
        email_body: emailBody,
        template_type: p.type === "forum" ? "forum" : p.type === "partenaire" ? "partenaire" : "blog",
        approved: true,
        sent_at: new Date().toISOString(),
        gmail_message_id: sendResult.messageId,
        gmail_thread_id: sendResult.threadId,
      });

      // 7. Passer le prospect en "contacté"
      await supabase
        .from("backlink_prospects")
        .update({ statut: "contacté" })
        .eq("id", p.id);

      sent.push({ domain: p.domain, email: discovery.bestEmail, subject, score: p.score });
      log(`    ✅ Envoyé à ${discovery.bestEmail}`);
    } catch (err) {
      log(`    ❌ Erreur : ${(err as Error).message}`);
      skipped.push({ domain: p.domain, reason: (err as Error).message });
    }

    // Pause entre chaque envoi
    await new Promise((r) => setTimeout(r, 3000));
  }

  return { sent, skipped };
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN
// ══════════════════════════════════════════════════════════════════════════════

async function main() {
  log("=== Backlinks Daily Outreach — 5 emails/jour + relances + replies ===");

  // Authentification Gmail et récupérer le label BACKLINKS
  const accessToken = await getGmailAccessToken();
  const labelId = await getGmailLabelId(accessToken, BACKLINKS_LABEL);
  if (!labelId) {
    log(`⚠️ Label "${BACKLINKS_LABEL}" introuvable dans Gmail — les emails ne seront pas labellisés.`);
  }

  // Phase 1 — Réponses
  const replies = await checkReplies(accessToken);

  // Phase 2 — Relances
  const followUps = await sendFollowUps(accessToken, labelId);

  // Phase 3 — Nouveaux outreach
  const { sent, skipped } = await sendNewOutreach(accessToken, labelId);

  // Phase 4 — Notification Telegram
  const lines: string[] = ["📬 <b>Backlinks Daily</b>"];
  lines.push("");

  if (replies.length > 0) {
    lines.push(`📩 <b>${replies.length} réponse(s) détectée(s)</b>`);
    for (const r of replies) {
      const emoji = r.sentiment === "positif" ? "✅" : r.sentiment === "negatif" ? "❌" : "🔵";
      lines.push(`  ${emoji} ${r.prospectDomain} — ${r.sentiment}`);
    }
    lines.push("");
  }

  if (followUps.length > 0) {
    lines.push(`🔄 <b>${followUps.length} relance(s) envoyée(s)</b>`);
    for (const f of followUps) lines.push(`  → ${f.domain} (${f.email})`);
    lines.push("");
  }

  lines.push(`📤 <b>${sent.length}/${MAX_NEW_SENDS} nouveau(x) email(s)</b>`);
  if (sent.length > 0) {
    for (const s of sent) lines.push(`  ✅ ${s.domain} · ${s.email} (${s.score}/10)`);
  }

  if (skipped.length > 0) {
    lines.push("");
    lines.push(`⏭ Ignorés : ${skipped.map((s) => s.domain).join(", ")}`);
  }

  lines.push("");
  lines.push(`📊 <a href="https://vanzonexplorer.com/admin/backlinks">Kanban</a>`);

  await notifyTelegram(lines.join("\n"));

  log(`=== Terminé — ${sent.length} envoyé(s), ${followUps.length} relancé(s), ${replies.length} réponse(s) ===`);
}

main().catch(async (err) => {
  const msg = (err as Error).message ?? String(err);
  console.error("[backlinks-daily] FATAL:", msg);
  await notifyTelegram(`❌ <b>Backlinks Daily</b> — Erreur fatale :\n${msg}`).catch(() => {});
  process.exit(1);
});
