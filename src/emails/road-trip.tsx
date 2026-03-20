// src/emails/road-trip.tsx
// Plain HTML email — no @react-email/components dependency needed for v1
// Resend accepts raw HTML strings, so we export a function, not a JSX component

interface JourItineraire {
  numero: number
  titre: string
  spots: Array<{ nom: string; description: string; type: string }>
  camping: string
  tips: string
}

interface ItineraireData {
  intro: string
  jours: JourItineraire[]
  conseils_pratiques: string[]
}

interface RoadTripEmailProps {
  prenom: string
  region: string
  duree: number
  itineraire: ItineraireData
  emailEncoded: string
}

export function buildRoadTripEmail({
  prenom,
  region,
  duree,
  itineraire,
  emailEncoded,
}: RoadTripEmailProps): { subject: string; html: string } {
  const subject = `🚐 Ton road trip ${duree}j en ${region} est prêt, ${prenom} !`

  const joursHtml = itineraire.jours
    .map(
      (jour) => `
      <div style="margin-bottom:32px;padding:24px;background:#1e293b;border-radius:12px;border-left:3px solid #3b82f6;">
        <h3 style="margin:0 0 8px 0;color:#93c5fd;font-size:14px;text-transform:uppercase;letter-spacing:0.1em;">Jour ${jour.numero}</h3>
        <h2 style="margin:0 0 16px 0;color:#f1f5f9;font-size:20px;font-weight:700;">${jour.titre}</h2>
        ${jour.spots
          .map(
            (spot) => `
          <div style="margin-bottom:12px;padding:12px;background:#0f172a;border-radius:8px;">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
              <span style="font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;">${spot.type}</span>
            </div>
            <p style="margin:0 0 4px 0;color:#e2e8f0;font-weight:600;font-size:15px;">📍 ${spot.nom}</p>
            <p style="margin:0;color:#94a3b8;font-size:14px;line-height:1.6;">${spot.description}</p>
          </div>
        `
          )
          .join('')}
        <div style="margin-top:12px;padding:10px 14px;background:#0f172a;border-radius:8px;border-left:2px solid #22c55e;">
          <p style="margin:0;color:#86efac;font-size:13px;">🏕️ <strong>Camping :</strong> ${jour.camping}</p>
        </div>
        ${jour.tips ? `<p style="margin:12px 0 0 0;color:#64748b;font-size:13px;font-style:italic;">💡 ${jour.tips}</p>` : ''}
      </div>
    `
    )
    .join('')

  const conseilsHtml = itineraire.conseils_pratiques
    .map((c) => `<li style="margin-bottom:8px;color:#94a3b8;font-size:14px;line-height:1.6;">${c}</li>`)
    .join('')

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="margin:0;padding:0;background:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:20px;">

    <!-- Header -->
    <div style="text-align:center;padding:32px 0 24px;">
      <img src="https://cdn.sanity.io/images/lewexa74/production/9de5b0e768fa1fcc5ea5aa6f41ac816c249af9b0-1042x417.png"
           alt="Vanzon Explorer" width="180" style="height:auto;display:inline-block;" />
    </div>

    <!-- Hero -->
    <div style="background:linear-gradient(135deg,#1e3a5f,#1e293b);border-radius:16px;padding:32px;margin-bottom:24px;text-align:center;">
      <p style="margin:0 0 8px 0;color:#93c5fd;font-size:14px;text-transform:uppercase;letter-spacing:0.15em;font-weight:600;">Ton itinéraire personnalisé</p>
      <h1 style="margin:0 0 12px 0;color:#f1f5f9;font-size:28px;font-weight:800;line-height:1.2;">
        Road trip ${duree}j en ${region}
      </h1>
      <p style="margin:0;color:#94a3b8;font-size:16px;">Salut ${prenom} ! Voici ton itinéraire sur mesure 🚐</p>
    </div>

    <!-- Intro -->
    <div style="background:#1e293b;border-radius:12px;padding:20px;margin-bottom:24px;">
      <p style="margin:0;color:#cbd5e1;font-size:15px;line-height:1.7;">${itineraire.intro}</p>
    </div>

    <!-- Jours -->
    ${joursHtml}

    <!-- Conseils pratiques -->
    <div style="background:#1e293b;border-radius:12px;padding:24px;margin-bottom:32px;">
      <h3 style="margin:0 0 16px 0;color:#f1f5f9;font-size:17px;font-weight:700;">💡 Conseils pratiques van</h3>
      <ul style="margin:0;padding-left:20px;">
        ${conseilsHtml}
      </ul>
    </div>

    <!-- CTA -->
    <div style="text-align:center;margin-bottom:32px;">
      <a href="https://vanzonexplorer.com/location"
         style="display:inline-block;padding:16px 36px;background:linear-gradient(135deg,#3b82f6,#0ea5e9);color:#fff;text-decoration:none;border-radius:10px;font-weight:700;font-size:16px;letter-spacing:0.02em;">
        🚐 Louer un van Vanzon Explorer
      </a>
      <p style="margin:12px 0 0 0;color:#475569;font-size:13px;">Disponible au départ de Cambo-les-Bains (Pays Basque)</p>
    </div>

    <!-- Footer -->
    <div style="border-top:1px solid #1e293b;padding-top:20px;text-align:center;">
      <p style="margin:0 0 8px 0;color:#475569;font-size:12px;">Vanzon Explorer — vanzonexplorer.com</p>
      <p style="margin:0;color:#334155;font-size:11px;">
        <a href="https://vanzonexplorer.com/unsubscribe?email=${emailEncoded}"
           style="color:#475569;text-decoration:underline;">Se désabonner</a>
      </p>
    </div>

  </div>
</body>
</html>
  `.trim()

  return { subject, html }
}
