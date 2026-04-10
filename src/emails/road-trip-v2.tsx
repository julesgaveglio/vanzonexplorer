// src/emails/road-trip-v2.tsx
// Email template HTML — Road Trip Personnalisé v2 (Pays Basque lead magnet)
// Structure : header logo + hero dégradé + jours avec section nuit van distincte + CTA location

import type { GeneratedItineraryV2, ItineraryStop, ItineraryOvernight } from '@/types/roadtrip'

interface RoadTripEmailV2Props {
  firstname: string
  duree: number
  itinerary: GeneratedItineraryV2
  emailEncoded: string
}

const OVERNIGHT_LABEL: Record<ItineraryOvernight['type'], string> = {
  parking_gratuit: 'Parking gratuit',
  aire_camping_car: 'Aire camping-car',
  camping_van: 'Camping van-friendly',
  spot_sauvage: 'Spot sauvage toléré',
}

export function buildRoadTripEmailV2({
  firstname,
  duree,
  itinerary,
  emailEncoded,
}: RoadTripEmailV2Props): { subject: string; html: string } {
  const subject = `🚐 Ton road trip ${duree}j au Pays Basque est prêt, ${firstname} !`

  // ─── Stop card ───────────────────────────────────────────────────────────
  function buildStopCard(stop: ItineraryStop): string {
    const mapsUrl =
      stop.url && stop.url.includes('maps.google')
        ? stop.url
        : `https://maps.google.com/?q=${encodeURIComponent(stop.name + ' Pays Basque')}`
    const externalBtn =
      stop.url && !stop.url.includes('maps.google')
        ? `<a href="${stop.url}" target="_blank" style="display:inline-block;background:#F1F5F9;color:#334155;padding:9px 18px;border-radius:24px;text-decoration:none;font-size:12px;font-weight:700;margin:4px 0;">🔗 Site officiel</a>`
        : ''
    return `
      <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:12px;padding:16px;margin:12px 0;">
        <div style="display:inline-block;background:#EFF6FF;color:#2563EB;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:8px;">
          ${stop.time} · ${stop.type}
        </div>
        <h3 style="margin:0 0 6px 0;color:#0F172A;font-size:17px;font-weight:700;">${stop.name}</h3>
        <p style="margin:0 0 8px 0;color:#334155;font-size:14px;line-height:1.65;">${stop.description}</p>
        ${stop.address ? `<p style="margin:0 0 10px 0;color:#64748B;font-size:12px;">📍 ${stop.address}</p>` : ''}
        <p style="margin:0 0 12px 0;color:#0F766E;font-size:12px;font-weight:600;">💰 ${stop.budget_indicatif}</p>
        <div style="line-height:2;">
          <a href="${mapsUrl}" target="_blank" style="display:inline-block;background:#2563EB;color:#FFFFFF;padding:10px 20px;border-radius:24px;text-decoration:none;font-size:13px;font-weight:700;margin:0 6px 4px 0;">📍 Voir sur Maps</a>
          ${externalBtn}
        </div>
      </div>
    `
  }

  // ─── Overnight card (section distincte "Nuit en van") ────────────────────
  function buildOvernightCard(overnight: ItineraryOvernight): string {
    const typeLabel = OVERNIGHT_LABEL[overnight.type] ?? overnight.type
    const mapsUrl =
      overnight.google_maps_url ||
      `https://maps.google.com/?q=${encodeURIComponent(overnight.name + ' ' + overnight.address)}`
    const amenitiesHtml =
      overnight.amenities && overnight.amenities.length > 0
        ? `<div style="margin:10px 0;">
            ${overnight.amenities
              .map(
                (a) =>
                  `<span style="display:inline-block;background:#EDE9FE;color:#5B21B6;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:600;margin:0 4px 4px 0;">${a}</span>`
              )
              .join('')}
          </div>`
        : ''

    const restrictionsHtml = overnight.restrictions
      ? `<p style="margin:8px 0 0 0;color:#92400E;font-size:12px;">⚠️ ${overnight.restrictions}</p>`
      : ''

    const tipHtml = overnight.tip
      ? `<div style="background:rgba(255,255,255,0.6);border-left:3px solid #8B5CF6;padding:10px 12px;margin-top:12px;border-radius:6px;">
          <p style="margin:0;color:#4C1D95;font-size:12px;line-height:1.6;"><strong>💡 Astuce :</strong> ${overnight.tip}</p>
        </div>`
      : ''

    return `
      <div style="background:linear-gradient(135deg,#F5F3FF 0%,#EDE9FE 100%);border:1px solid #DDD6FE;border-radius:14px;padding:18px;margin-top:14px;">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">
          <span style="font-size:22px;">🌙</span>
          <span style="color:#5B21B6;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:0.1em;">Nuit en van</span>
        </div>
        <div style="display:inline-block;background:#FFFFFF;color:#6D28D9;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;margin-bottom:8px;">
          ${typeLabel} · ${overnight.price}
        </div>
        <h4 style="margin:0 0 6px 0;color:#1E1B4B;font-size:16px;font-weight:800;">${overnight.name}</h4>
        ${overnight.address ? `<p style="margin:0 0 4px 0;color:#4C1D95;font-size:13px;">📍 ${overnight.address}</p>` : ''}
        ${amenitiesHtml}
        ${restrictionsHtml}
        <a href="${mapsUrl}" target="_blank" style="display:block;text-align:center;background:#7C3AED;color:#FFFFFF;padding:12px 18px;border-radius:24px;text-decoration:none;font-size:13px;font-weight:700;margin-top:12px;">📍 Ouvrir sur Google Maps</a>
        ${tipHtml}
      </div>
    `
  }

  // ─── Day blocks ──────────────────────────────────────────────────────────
  const daysHtml = itinerary.days
    .map(
      (day) => `
        <div style="margin-bottom:36px;">
          <div style="border-left:4px solid #2563EB;padding-left:16px;margin-bottom:14px;">
            <p style="margin:0 0 2px 0;color:#2563EB;font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:0.1em;">Jour ${day.day}</p>
            <h2 style="margin:0;color:#0F172A;font-size:22px;font-weight:800;line-height:1.2;">${day.theme}</h2>
          </div>
          ${day.stops.map(buildStopCard).join('')}
          ${buildOvernightCard(day.overnight)}
        </div>
      `
    )
    .join('')

  // ─── Van tips ────────────────────────────────────────────────────────────
  const tipsHtml = (itinerary.tips_van ?? [])
    .map(
      (tip, i) => `
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:12px;">
          <tr>
            <td width="36" valign="top" style="padding-top:1px;">
              <div style="width:28px;height:28px;background:#2563EB;color:#FFFFFF;border-radius:50%;font-size:13px;font-weight:700;text-align:center;line-height:28px;">${i + 1}</div>
            </td>
            <td valign="top" style="padding-left:10px;">
              <p style="margin:0;color:#334155;font-size:14px;line-height:1.6;padding-top:4px;">${tip}</p>
            </td>
          </tr>
        </table>
      `
    )
    .join('')

  // ─── Full HTML ───────────────────────────────────────────────────────────
  const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${itinerary.title}</title>
  <style>
    @media only screen and (max-width: 600px) {
      .email-wrapper { padding: 12px 0 32px !important; }
      .email-card { margin: 0 10px !important; border-radius: 16px !important; }
      .email-card-inner { padding: 18px 16px !important; }
      .hero-pad { padding: 24px 16px 20px !important; }
      .hero-title { font-size: 24px !important; }
      .cta-block { margin: 12px 10px 0 !important; padding: 24px 16px !important; }
      .cta-title { font-size: 18px !important; }
      .cta-btn { padding: 14px 24px !important; font-size: 15px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:#F1F5F9;font-family:Arial,Helvetica,sans-serif;">
  <div class="email-wrapper" style="max-width:600px;margin:0 auto;padding:20px 0 40px;">

    <!-- Logo header -->
    <div style="text-align:center;padding:24px 20px 16px;">
      <img src="https://cdn.sanity.io/images/lewexa74/production/9de5b0e768fa1fcc5ea5aa6f41ac816c249af9b0-1042x417.png"
           alt="Vanzon Explorer" width="160" style="height:auto;display:inline-block;" />
    </div>

    <!-- Hero banner -->
    <div class="email-card" style="background:#FFFFFF;margin:0 20px;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
      <div class="hero-pad" style="background:linear-gradient(135deg,#1D4ED8 0%,#0EA5E9 100%);padding:32px 28px 28px;text-align:center;">
        <div style="display:inline-block;background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.3);border-radius:20px;padding:4px 14px;margin-bottom:16px;">
          <span style="color:#FFFFFF;font-size:12px;font-weight:600;letter-spacing:0.05em;">✨ Généré par IA · Vanzon Explorer</span>
        </div>
        <h1 class="hero-title" style="margin:0 0 10px 0;color:#FFFFFF;font-size:28px;font-weight:800;line-height:1.2;">
          ${itinerary.title}
        </h1>
        <p style="margin:0;color:rgba(255,255,255,0.9);font-size:15px;">Salut ${firstname} ! Ton itinéraire van au Pays Basque est prêt 🚐</p>
      </div>
      <div class="email-card-inner" style="padding:24px 28px 20px;">
        <p style="margin:0;color:#334155;font-size:15px;line-height:1.75;">${itinerary.intro}</p>
      </div>
    </div>

    <!-- Main content -->
    <div class="email-card" style="background:#FFFFFF;margin:16px 20px 0;border-radius:20px;box-shadow:0 4px 24px rgba(0,0,0,0.06);overflow:hidden;">
      <div class="email-card-inner" style="padding:28px;">
        ${daysHtml}

        ${
          itinerary.tips_van && itinerary.tips_van.length > 0
            ? `<div style="border-top:2px solid #EFF6FF;margin:24px 0;"></div>
               <div style="background:#EFF6FF;border-radius:14px;padding:22px 20px;">
                 <h3 style="margin:0 0 18px 0;color:#1D4ED8;font-size:16px;font-weight:800;">💡 Conseils pratiques van</h3>
                 ${tipsHtml}
               </div>`
            : ''
        }
      </div>
    </div>

    <!-- CTA block -->
    <div class="cta-block" style="background:linear-gradient(135deg,#1D4ED8 0%,#0EA5E9 100%);margin:16px 20px 0;border-radius:20px;padding:32px 28px;text-align:center;box-shadow:0 4px 24px rgba(29,78,216,0.25);">
      <p style="margin:0 0 6px 0;color:rgba(255,255,255,0.85);font-size:14px;">${itinerary.cta ?? 'Prêt à partir ? Loue ton van dès maintenant.'}</p>
      <h2 class="cta-title" style="margin:0 0 24px 0;color:#FFFFFF;font-size:22px;font-weight:800;">Nos vans disponibles<br/>au Pays Basque 🏔️</h2>
      <a class="cta-btn" href="https://vanzonexplorer.com/location/biarritz"
         style="display:block;padding:16px 32px;background:#FFFFFF;color:#1D4ED8;text-decoration:none;border-radius:30px;font-weight:800;font-size:16px;box-shadow:0 4px 16px rgba(0,0,0,0.15);">
        🚐 Voir les vans disponibles →
      </a>
    </div>

    <!-- Footer -->
    <div style="padding:24px 20px 0;text-align:center;">
      <p style="margin:0 0 6px 0;color:#94A3B8;font-size:12px;">Vanzon Explorer — <a href="https://vanzonexplorer.com" style="color:#94A3B8;text-decoration:none;">vanzonexplorer.com</a></p>
      <p style="margin:0;color:#CBD5E1;font-size:11px;">
        Tu reçois cet email parce que tu as généré un road trip sur notre site. ·
        <a href="https://vanzonexplorer.com/unsubscribe?email=${emailEncoded}"
           style="color:#94A3B8;text-decoration:underline;">Se désabonner</a>
      </p>
    </div>

  </div>
</body>
</html>
  `.trim()

  return { subject, html }
}
