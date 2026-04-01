/**
 * road-trip-feedback.ts — Email de feedback envoyé 24h après génération du road trip
 * Utilisé par scripts/agents/road-trip-feedback-agent.ts via Resend
 */

interface FeedbackEmailProps {
  prenom: string
  emailEncoded: string
}

export function buildRoadTripFeedbackEmail({ prenom, emailEncoded }: FeedbackEmailProps): {
  subject: string
  html: string
} {
  const subject = `Votre road trip personnalisé — votre avis compte 🗺️`

  const unsubUrl = `https://vanzonexplorer.com/api/unsubscribe?email=${emailEncoded}`

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.06);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#1e293b 0%,#0f172a 100%);padding:32px 40px;text-align:center;">
              <p style="margin:0;color:#94a3b8;font-size:12px;font-weight:600;letter-spacing:2px;text-transform:uppercase;">Vanzon Explorer</p>
              <h1 style="margin:8px 0 0;color:#ffffff;font-size:22px;font-weight:800;line-height:1.3;">
                Votre aventure nous inspire 🗺️
              </h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 32px;">

              <p style="margin:0 0 20px;color:#334155;font-size:16px;line-height:1.7;">
                Bonjour <strong>${prenom}</strong>,
              </p>

              <p style="margin:0 0 20px;color:#334155;font-size:16px;line-height:1.7;">
                Je suis Jules de Vanzon Explorer, enchanté&nbsp;! Je suis ravi que vous ayez utilisé notre tout nouvel outil de génération de
                <a href="https://vanzonexplorer.com/road-trip-personnalise" style="color:#3b82f6;font-weight:600;text-decoration:none;">road trips personnalisés</a>
                pour planifier votre aventure.
              </p>

              <p style="margin:0 0 20px;color:#334155;font-size:16px;line-height:1.7;">
                Vous faites partie des premières personnes à le tester, et afin de continuer à l'améliorer et d'offrir la meilleure expérience possible à nos futurs utilisateurs, nous aimerions recueillir votre retour sincère et honnête sur le road trip que vous avez reçu par email.
              </p>

              <!-- Question block -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f9ff;border-left:4px solid #3b82f6;border-radius:8px;margin:0 0 24px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="margin:0 0 10px;color:#1e40af;font-size:15px;font-weight:700;">
                      💬 Quelques questions pour vous guider :
                    </p>
                    <p style="margin:0 0 8px;color:#334155;font-size:15px;line-height:1.6;">
                      • Avez-vous trouvé toutes les informations que vous recherchiez&nbsp;?
                    </p>
                    <p style="margin:0;color:#334155;font-size:15px;line-height:1.6;">
                      • Peut-être avez-vous eu le sentiment qu'il manquait certains éléments&nbsp;?
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 28px;color:#334155;font-size:16px;line-height:1.7;">
                Votre retour est très précieux pour nous. Il nous permettra d'identifier les points à améliorer et de continuer à faire évoluer notre outil.
              </p>

              <!-- CTA -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="mailto:jules@vanzonexplorer.com?subject=Retour%20road%20trip%20personnalisé&body=Bonjour%20Jules%2C%0A%0AVoici%20mon%20retour%20sur%20le%20road%20trip%20personnalisé%20%3A%0A%0A"
                       style="display:inline-block;background:linear-gradient(135deg,#3b82f6 0%,#0ea5e9 100%);color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;padding:14px 32px;border-radius:50px;letter-spacing:0.3px;">
                      ✉️ Partager mon retour
                    </a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Signature -->
          <tr>
            <td style="padding:0 40px 40px;">
              <p style="margin:32px 0 4px;color:#64748b;font-size:15px;line-height:1.6;">
                Si vous avez quelques instants pour partager vos impressions, nous vous en serions très reconnaissants.
              </p>
              <p style="margin:0 0 4px;color:#334155;font-size:15px;">Bien à vous,</p>
              <p style="margin:0;color:#334155;font-size:15px;font-weight:700;">👋🏼 À bientôt sur la route</p>
              <p style="margin:4px 0 0;color:#64748b;font-size:14px;">Jules — Vanzon Explorer</p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f8fafc;padding:20px 40px;border-top:1px solid #e2e8f0;text-align:center;">
              <p style="margin:0;color:#94a3b8;font-size:12px;line-height:1.6;">
                Vanzon Explorer · location de vans aménagés au Pays Basque<br/>
                <a href="${unsubUrl}" style="color:#94a3b8;text-decoration:underline;">Se désabonner</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

  return { subject, html }
}
