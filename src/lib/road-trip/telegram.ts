// src/lib/road-trip/telegram.ts
// Non-blocking Telegram notifications for road trip generation events

const TELEGRAM_API = 'https://api.telegram.org'

function isConfigured(): boolean {
  return !!(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID)
}

async function send(text: string): Promise<void> {
  if (!isConfigured()) return
  try {
    await fetch(
      `${TELEGRAM_API}/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: process.env.TELEGRAM_CHAT_ID,
          text,
          parse_mode: 'Markdown',
        }),
      }
    )
  } catch {
    // Telegram failure is never fatal
  }
}

export interface GenerationContext {
  prenom: string
  email: string
  region: string
  duree: number
}

export interface GenerationResult {
  modelUsed: string
  fallbackUsed: boolean
  photosCount: number
  totalSpots: number
  campingsFound: number
}

// ── Success notification ───────────────────────────────────────────────────────
export async function notifySuccess(
  ctx: GenerationContext,
  result: GenerationResult
): Promise<void> {
  const icon = result.fallbackUsed ? '⚡' : '✅'
  const modelLine = result.fallbackUsed
    ? `🔄 *Modèle de fallback* : \`${result.modelUsed}\``
    : `🤖 *Modèle* : \`${result.modelUsed}\``

  const text = [
    `${icon} *Road trip généré !*`,
    '',
    `👤 ${ctx.prenom} → ${ctx.region} ${ctx.duree}j`,
    `📧 \`${ctx.email}\``,
    modelLine,
    `📸 Photos : ${result.photosCount}/${result.totalSpots} spots illustrés`,
    `🏕️ Bivouacs OSM : ${result.campingsFound} options trouvées`,
    '',
    `_${new Date().toLocaleString('fr-FR', { timeZone: 'Europe/Paris' })}_`,
  ].join('\n')

  await send(text)
}

// ── Error notification ─────────────────────────────────────────────────────────
export async function notifyError(
  ctx: GenerationContext,
  error: Error,
  triedModels: string[]
): Promise<void> {
  const errMsg = error.message ?? 'Unknown error'
  const isRateLimit =
    errMsg.includes('rate_limit_exceeded') ||
    errMsg.includes('Rate limit') ||
    errMsg.includes('429')

  const diagnostic = isRateLimit
    ? '⚠️ *Quota Groq épuisé* — tous les modèles/clés ont atteint leur limite'
    : `❌ *Erreur technique* : ${errMsg.slice(0, 120)}`

  const action = isRateLimit
    ? '💡 Ajoute `GROQ_API_KEY_2` dans Vercel → Settings → Environment Variables'
    : '💡 Consulte les logs Vercel pour plus de détails'

  const text = [
    `🚨 *Erreur Road Trip Generator*`,
    '',
    `👤 ${ctx.prenom} (${ctx.email})`,
    `📍 Région : ${ctx.region} — ${ctx.duree} jours`,
    `🔄 Modèles essayés : ${triedModels.join(' → ')}`,
    '',
    diagnostic,
    action,
    '',
    `_${new Date().toLocaleString('fr-FR', { timeZone: 'Europe/Paris' })}_`,
  ].join('\n')

  await send(text)
}

// ── Fallback notification ─────────────────────────────────────────────────────
export async function notifyFallback(
  ctx: GenerationContext,
  failedModel: string,
  newModel: string,
  reason: string
): Promise<void> {
  const text = [
    `🔄 *Fallback Groq déclenché*`,
    `👤 ${ctx.prenom} → ${ctx.region}`,
    `❌ \`${failedModel}\` : ${reason.slice(0, 80)}`,
    `✅ Passage sur \`${newModel}\``,
  ].join('\n')

  await send(text)
}
