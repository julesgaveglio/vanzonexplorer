# Agent: Road Trip Feedback

## Role

Envoie automatiquement un email de feedback 24 heures après qu'un road trip personnalisé a été généré et envoyé à l'utilisateur. L'objectif est de recueillir des retours sincères sur la qualité de l'itinéraire généré pour améliorer l'outil. L'agent respecte les désabonnements et ne relance jamais deux fois le même utilisateur.

---

## Context

**Site :** vanzonexplorer.com
**Outil concerné :** `/road-trip-personnalise` — générateur d'itinéraires personnalisés
**Table Supabase :** `road_trip_requests` (colonnes clés : `status`, `sent_at`, `feedback_sent_at`, `prenom`, `email`, `region`, `duree`)
**Table désabonnements :** `email_unsubscribes`
**Email expéditeur :** `jules@vanzonexplorer.com` (Resend)
**Template email :** `src/emails/road-trip-feedback.ts`
**Script :** `scripts/agents/road-trip-feedback-agent.ts`
**Workflow :** `.github/workflows/road-trip-feedback.yml` (cron toutes les heures)

**Fenêtre de déclenchement :** road trips avec `status='sent'`, `feedback_sent_at IS NULL`, `sent_at` entre `now()-48h` et `now()-24h`

---

## Instructions

### Étape 1 — Identifier les road trips éligibles

Requête Supabase :
- `status = 'sent'`
- `feedback_sent_at IS NULL`
- `sent_at >= now() - 48h` ET `sent_at <= now() - 24h`

### Étape 2 — Filtrer les désabonnés

Pour chaque résultat, vérifier l'absence dans `email_unsubscribes`. Ignorer silencieusement les désabonnés.

### Étape 3 — Envoyer l'email de feedback

Utiliser `buildRoadTripFeedbackEmail({ prenom, emailEncoded })` depuis `src/emails/road-trip-feedback.ts`.
Envoyer via Resend depuis `jules@vanzonexplorer.com` avec `replyTo: jules@vanzonexplorer.com`.

### Étape 4 — Marquer comme envoyé

Mettre à jour `feedback_sent_at = now()` dans Supabase pour éviter tout doublon.

### Étape 5 — Notifier par Telegram

Envoyer un récapitulatif : nombre d'envois, ignorés, erreurs.

---

## Tools Available

- `@supabase/supabase-js` — lecture/écriture `road_trip_requests`, `email_unsubscribes`
- `resend` — envoi de l'email de feedback
- `scripts/lib/telegram.ts` — notification Telegram de fin d'agent
- `src/emails/road-trip-feedback.ts` — builder du template HTML

---

## Output Format

```
[2026-04-01T10:00:00Z] [road-trip-feedback] 3 road trip(s) éligible(s) au feedback
[2026-04-01T10:00:01Z] [road-trip-feedback] ✅ Feedback envoyé → Marie (marie@example.com) — road trip: Pays Basque 5j
[2026-04-01T10:00:02Z] [road-trip-feedback] ⏭️  jean@example.com désabonné — ignoré
[2026-04-01T10:00:03Z] [road-trip-feedback] Agent terminé — 2 envoi(s), 1 ignoré(s), 0 erreur(s)
```

Notification Telegram :
```
📧 Road Trip Feedback Agent

✅ Envoyés : 2
⏭️ Ignorés (désabonnés) : 1
```
