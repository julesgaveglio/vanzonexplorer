#!/usr/bin/env tsx
/**
 * road-trip-feedback-agent.ts — Email de feedback 24h après génération du road trip
 * Usage: npx tsx scripts/agents/road-trip-feedback-agent.ts
 * Déclenché par GitHub Actions toutes les heures
 *
 * Logique :
 * 1. Récupère les road trips avec status='sent', feedback_sent_at IS NULL,
 *    et sent_at entre now()-48h et now()-24h
 * 2. Vérifie que l'email n'est pas dans email_unsubscribes
 * 3. Envoie l'email de feedback via Resend
 * 4. Met à jour feedback_sent_at = now()
 * 5. Notifie par Telegram
 */

import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { notifyTelegram } from "../lib/telegram";
import { buildRoadTripFeedbackEmail } from "../../src/emails/road-trip-feedback";

const ADMIN_EMAIL = "jules@vanzonexplorer.com";

// ── Supabase ───────────────────────────────────────────────────────────────────
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function log(msg: string) {
  console.log(`[${new Date().toISOString()}] [road-trip-feedback] ${msg}`);
}

// ── Trouver les road trips à relancer ─────────────────────────────────────────
async function getPendingFeedbacks() {
  const now = new Date();
  const min = new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString(); // -48h
  const max = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(); // -24h

  const { data, error } = await supabase
    .from("road_trip_requests")
    .select("id, prenom, email, region, duree, sent_at")
    .eq("status", "sent")
    .is("feedback_sent_at", null)
    .gte("sent_at", min)
    .lte("sent_at", max)
    .order("sent_at", { ascending: true });

  if (error) throw new Error(`Supabase fetch error: ${error.message}`);
  return data ?? [];
}

// ── Vérifier unsubscribes ─────────────────────────────────────────────────────
async function isUnsubscribed(email: string): Promise<boolean> {
  const { data } = await supabase
    .from("email_unsubscribes")
    .select("id")
    .eq("email", email)
    .maybeSingle();
  return !!data;
}

// ── Main ───────────────────────────────────────────────────────────────────────
async function main() {
  log("Démarrage — recherche des road trips à relancer...");

  if (!process.env.RESEND_API_KEY) throw new Error("RESEND_API_KEY manquant");
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) throw new Error("NEXT_PUBLIC_SUPABASE_URL manquant");
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error("SUPABASE_SERVICE_ROLE_KEY manquant");

  const resend = new Resend(process.env.RESEND_API_KEY);
  const pending = await getPendingFeedbacks();

  log(`${pending.length} road trip(s) éligible(s) au feedback`);

  if (pending.length === 0) {
    log("Rien à envoyer — agent terminé.");
    return;
  }

  let sent = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const rt of pending) {
    try {
      // Vérifier unsubscribe
      if (await isUnsubscribed(rt.email)) {
        log(`⏭️  ${rt.email} désabonné — ignoré`);
        skipped++;
        continue;
      }

      const emailEncoded = encodeURIComponent(rt.email);
      const { subject, html } = buildRoadTripFeedbackEmail({
        prenom: rt.prenom,
        emailEncoded,
      });

      const { error: resendError } = await resend.emails.send({
        from: "Jules de Vanzon Explorer <jules@vanzonexplorer.com>",
        to: rt.email,
        replyTo: ADMIN_EMAIL,
        subject,
        html,
      });

      if (resendError) {
        throw new Error(`Resend error: ${JSON.stringify(resendError)}`);
      }

      // Marquer comme envoyé
      const { error: updateError } = await supabase
        .from("road_trip_requests")
        .update({ feedback_sent_at: new Date().toISOString() })
        .eq("id", rt.id);

      if (updateError) {
        log(`⚠️  Feedback envoyé à ${rt.email} mais mise à jour Supabase échouée: ${updateError.message}`);
      }

      log(`✅ Feedback envoyé → ${rt.prenom} (${rt.email}) — road trip: ${rt.region} ${rt.duree}j`);
      sent++;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      log(`❌ Erreur pour ${rt.email}: ${msg}`);
      errors.push(`${rt.email}: ${msg}`);
    }
  }

  // Résumé Telegram
  const lines = [
    `📧 *Road Trip Feedback Agent*`,
    ``,
    `✅ Envoyés : ${sent}`,
    skipped > 0 ? `⏭️ Ignorés (désabonnés) : ${skipped}` : null,
    errors.length > 0 ? `❌ Erreurs : ${errors.length}` : null,
    errors.length > 0 ? errors.map(e => `• ${e}`).join("\n") : null,
  ].filter(Boolean).join("\n");

  await notifyTelegram(lines);
  log(`Agent terminé — ${sent} envoi(s), ${skipped} ignoré(s), ${errors.length} erreur(s)`);
}

main().catch(async (err) => {
  const msg = err instanceof Error ? err.message : String(err);
  console.error(`[road-trip-feedback] FATAL: ${msg}`);
  await notifyTelegram(`❌ *Road Trip Feedback Agent* — Erreur fatale:\n${msg}`).catch(() => {});
  process.exit(1);
});
