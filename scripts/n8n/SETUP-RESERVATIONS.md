# Workflow n8n : Réservations → Google Calendar + Telegram

## Architecture

```
Gmail Trigger (poll 2min)
  → Code: Parse email (Yescapa / Wikicampers)  
  → IF: Réservation valide ?
    ✅ → Google Calendar: Créer événement all-day
       → Telegram: Notification
    ❌ → Skip
```

**Avantages vs l'ancien agent TypeScript :**
- Réactif (poll 2min vs 15min GitHub Actions)
- Ne scanne que les NOUVEAUX emails (n8n gère le dedup nativement)
- Pas de Supabase intermédiaire — direct Gmail → Calendar
- Pas de GitHub Actions à maintenir
- Debug visuel dans l'UI n8n

## Import

1. Ouvrir https://n8n-jules.unhinged-lab.com
2. Menu → Import from File → `vanzon-reservations-calendar.json`

## Credentials à configurer

### 1. Gmail OAuth2

- Type : **Gmail OAuth2 API**
- Client ID : `GOOGLE_GSC_CLIENT_ID` (de .env.local)
- Client Secret : `GOOGLE_GSC_CLIENT_SECRET` (de .env.local)
- Scopes : `https://www.googleapis.com/auth/gmail.readonly`
- Connecter le compte `vanzonexplorer@gmail.com`

### 2. Google Calendar OAuth2

- Type : **Google Calendar OAuth2 API**
- Mêmes Client ID / Client Secret
- Scopes : `https://www.googleapis.com/auth/calendar.events`
- Même compte Google

### 3. Telegram Bot

- Type : **Telegram API**
- Bot Token : `TELEGRAM_BOT_TOKEN` (de .env.local)
- Chat ID : mettre dans le node Telegram ou en env var n8n

## Variables d'environnement n8n (optionnel)

Dans Settings → Variables :
- `TELEGRAM_CHAT_ID` — ton chat ID Telegram

## Emails surveillés

| Plateforme | From | Subject contient |
|---|---|---|
| Yescapa | `notifications@yescapa.com` | "réservation instantanée" |
| Wikicampers | `contact@infos.wikicampers.fr` | "confirmée par le locataire" |

## Couleurs Calendar

- **Yescapa** → Violet (grape, colorId 3)
- **Wikicampers** → Orange (tangerine, colorId 6)

## Format événement

```
🚐 Yoni — Yescapa #12345
---
Plateforme: Yescapa
Ref: #12345
Revenu: 450,00€
Assurance: Tous risques
```

Événement all-day (startDate → endDate inclus).

## Après import

1. Configurer les 3 credentials
2. Activer le workflow
3. Tester avec "Execute Workflow" (va chercher les derniers emails)
4. Vérifier qu'un événement apparaît dans Google Calendar
5. Désactiver le GitHub Actions : `.github/workflows/sync-reservations-calendar.yml`

## Dépannage

- **Pas de parsing ?** → Vérifier que le node Code reçoit bien `$json.html` (ouvrir l'exécution, cliquer sur le node Gmail Trigger pour voir la sortie)
- **Pas de Calendar ?** → Vérifier les scopes OAuth2 (calendar.events)
- **Doublons ?** → Le Gmail Trigger ne retraite jamais le même email. Si doublons, vérifier que le workflow n'a pas été réimporté (reset du staticData)
