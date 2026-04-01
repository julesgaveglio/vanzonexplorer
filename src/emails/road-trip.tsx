// src/emails/road-trip.tsx
// Plain HTML email — no @react-email/components dependency needed

interface SpotBase {
  nom: string
  description: string
  type: string
  search_query?: string
}

interface SpotEnriched extends SpotBase {
  mapsUrl: string
  photo?: { url: string; photographer: string; photoUrl: string; source?: string }
  wiki?: { extract: string; url: string; thumbnail?: string }
}

interface CampingOption {
  name: string
  mapsUrl: string
  fee?: string
  motorhome?: string
  website?: string
}

interface RestaurantInfo {
  nom: string
  type: string
  specialite: string
  description: string
}

interface JourItineraire {
  numero: number
  titre: string
  spots: SpotBase[] | SpotEnriched[]
  camping: string
  campingMapsUrl?: string
  campingOptions?: CampingOption[]
  restaurant?: RestaurantInfo
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

function isEnriched(spot: SpotBase | SpotEnriched): spot is SpotEnriched {
  return 'mapsUrl' in spot
}

export function buildRoadTripEmail({
  prenom,
  region,
  duree,
  itineraire,
  emailEncoded,
}: RoadTripEmailProps): { subject: string; html: string } {
  const subject = `🚐 Ton road trip ${duree}j en ${region} est prêt, ${prenom} !`

  // ── Spot card ────────────────────────────────────────────────────────────────
  function buildSpotCard(spot: SpotBase | SpotEnriched): string {
    const enriched = isEnriched(spot) ? spot : null

    const photoHtml = enriched?.photo
      ? `<img src="${enriched.photo.url}" alt="${spot.nom}" width="600" style="width:100%;height:220px;object-fit:cover;display:block;" />`
      : ''

    const creditHtml =
      enriched?.photo && enriched.photo.source !== 'wikipedia'
        ? `<p style="margin:8px 0 0 0;color:#94A3B8;font-size:11px;">📷 <a href="${enriched.photo.photoUrl}" style="color:#94A3B8;text-decoration:underline;" target="_blank">${enriched.photo.photographer}</a> via Pexels</p>`
        : enriched?.photo?.source === 'wikipedia'
          ? `<p style="margin:8px 0 0 0;color:#94A3B8;font-size:11px;">📷 Photo via Wikipedia</p>`
          : ''

    const wikiHtml =
      enriched?.wiki?.extract
        ? `<p style="margin:8px 0 0 0;color:#64748B;font-size:12px;font-style:italic;line-height:1.5;">${enriched.wiki.extract}</p>`
        : ''

    const mapsBtn = enriched?.mapsUrl
      ? `<a href="${enriched.mapsUrl}" target="_blank" style="display:inline-block;background:#2563EB;color:#FFFFFF;padding:8px 16px;border-radius:20px;text-decoration:none;font-size:13px;font-weight:600;margin-right:8px;margin-bottom:8px;">📍 Voir sur Maps</a>`
      : ''

    const wikiBtn =
      enriched?.wiki?.url
        ? `<a href="${enriched.wiki.url}" target="_blank" style="display:inline-block;background:#F1F5F9;color:#334155;padding:8px 16px;border-radius:20px;text-decoration:none;font-size:13px;font-weight:600;margin-bottom:8px;">ℹ️ En savoir plus</a>`
        : ''

    const ctaHtml =
      mapsBtn || wikiBtn
        ? `<div style="margin-top:12px;">${mapsBtn}${wikiBtn}</div>`
        : ''

    return `
      <div style="background:#F8FAFC;border-radius:12px;overflow:hidden;margin:12px 0;border:1px solid #E2E8F0;">
        ${photoHtml}
        <div style="padding:16px;">
          <div style="margin-bottom:8px;">
            <span style="display:inline-block;background:#EFF6FF;color:#2563EB;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">${spot.type}</span>
          </div>
          <h3 style="margin:0 0 8px 0;color:#0F172A;font-size:17px;font-weight:700;">${spot.nom}</h3>
          <p style="margin:0;color:#334155;font-size:14px;line-height:1.7;">${spot.description}</p>
          ${wikiHtml}
          ${ctaHtml}
          ${creditHtml}
        </div>
      </div>
    `
  }

  // ── Restaurant card ───────────────────────────────────────────────────────────
  function buildRestaurantCard(restaurant: RestaurantInfo): string {
    const mapsSearch = `https://maps.google.com/?q=${encodeURIComponent(restaurant.nom + ' ' + region + ' France restaurant')}`
    return `
      <div style="background:#FFF7ED;border:1px solid #FED7AA;border-radius:10px;padding:16px;margin-top:12px;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
          <div>
            <p style="margin:0 0 3px 0;color:#C2410C;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;">🍽️ Où manger ce soir</p>
            <p style="margin:0;color:#7C2D12;font-size:11px;">${restaurant.type} · ${restaurant.specialite}</p>
          </div>
          <a href="${mapsSearch}" target="_blank" style="display:inline-block;background:#EA580C;color:#FFFFFF;padding:7px 14px;border-radius:20px;text-decoration:none;font-size:12px;font-weight:600;white-space:nowrap;flex-shrink:0;">📍 Maps</a>
        </div>
        <p style="margin:0 0 6px 0;color:#431407;font-size:15px;font-weight:700;">${restaurant.nom}</p>
        <p style="margin:0;color:#9A3412;font-size:13px;line-height:1.6;">${restaurant.description}</p>
      </div>
    `
  }

  // ── Camping options (Overpass) ────────────────────────────────────────────────
  function buildCampingOptionsCard(options: CampingOption[], llmCamping: string, llmMapsUrl?: string): string {
    const llmUrl = llmMapsUrl ?? `https://maps.google.com/?q=${encodeURIComponent(llmCamping + ' camping France')}`

    // Primary LLM suggestion
    const primaryCard = `
      <div style="flex:1;">
        <p style="margin:0 0 4px 0;color:#166534;font-size:13px;font-weight:700;">🏕️ Ce soir</p>
        <p style="margin:0;color:#15803D;font-size:14px;">${llmCamping}</p>
      </div>
      <a href="${llmUrl}" target="_blank" style="display:inline-block;background:#16A34A;color:#FFFFFF;padding:7px 14px;border-radius:20px;text-decoration:none;font-size:12px;font-weight:600;white-space:nowrap;">📍 Maps</a>
    `

    if (options.length === 0) {
      return `
        <div style="background:#F0FDF4;border:1px solid #BBF7D0;border-radius:10px;padding:14px 16px;margin-top:12px;display:flex;align-items:center;gap:12px;">
          ${primaryCard}
        </div>
      `
    }

    // Overpass options below
    const optionCards = options
      .map((c) => {
        const feeBadge =
          c.fee === 'no' || c.fee === 'free'
            ? `<span style="display:inline-block;background:#DCFCE7;color:#166534;padding:2px 8px;border-radius:20px;font-size:10px;font-weight:700;margin-left:6px;">Gratuit ✅</span>`
            : c.fee === 'yes'
              ? `<span style="display:inline-block;background:#FEF9C3;color:#713F12;padding:2px 8px;border-radius:20px;font-size:10px;font-weight:700;margin-left:6px;">Payant</span>`
              : ''
        const vanBadge =
          c.motorhome === 'yes' || c.motorhome === 'designated'
            ? `<span style="display:inline-block;background:#DBEAFE;color:#1D4ED8;padding:2px 8px;border-radius:20px;font-size:10px;font-weight:700;margin-left:4px;">🚐 Van OK</span>`
            : ''
        return `
          <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid #E7F3EA;">
            <div>
              <span style="color:#14532D;font-size:13px;font-weight:600;">${c.name}</span>
              ${feeBadge}
              ${vanBadge}
            </div>
            <a href="${c.mapsUrl}" target="_blank" style="display:inline-block;background:#BBF7D0;color:#166534;padding:5px 12px;border-radius:20px;text-decoration:none;font-size:11px;font-weight:600;white-space:nowrap;flex-shrink:0;">Maps</a>
          </div>
        `
      })
      .join('')

    return `
      <div style="background:#F0FDF4;border:1px solid #BBF7D0;border-radius:10px;padding:14px 16px;margin-top:12px;">
        <div style="display:flex;align-items:center;gap:12px;padding-bottom:12px;border-bottom:1px solid #BBF7D0;">
          ${primaryCard}
        </div>
        <div style="margin-top:10px;">
          <p style="margin:0 0 8px 0;color:#166534;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;">Autres options à proximité</p>
          ${optionCards}
        </div>
      </div>
    `
  }

  // ── Day cards ─────────────────────────────────────────────────────────────────
  const joursHtml = itineraire.jours
    .map((jour) => {
      const spotsHtml = jour.spots.map(buildSpotCard).join('')
      const restaurantHtml = jour.restaurant ? buildRestaurantCard(jour.restaurant) : ''
      const campingHtml = buildCampingOptionsCard(
        jour.campingOptions ?? [],
        jour.camping,
        jour.campingMapsUrl
      )

      return `
        <div style="margin-bottom:36px;">
          <div style="border-left:4px solid #2563EB;padding-left:16px;margin-bottom:16px;">
            <p style="margin:0 0 2px 0;color:#2563EB;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;">Jour ${jour.numero}</p>
            <h2 style="margin:0;color:#0F172A;font-size:22px;font-weight:800;line-height:1.2;">${jour.titre}</h2>
          </div>

          ${spotsHtml}
          ${restaurantHtml}
          ${campingHtml}

          ${
            jour.tips
              ? `<div style="background:#FFFBEB;border:1px solid #FDE68A;border-radius:10px;padding:14px 16px;margin-top:8px;">
                  <p style="margin:0;color:#92400E;font-size:13px;line-height:1.6;">💡 <strong>Astuce van :</strong> ${jour.tips}</p>
                </div>`
              : ''
          }
        </div>
      `
    })
    .join('')

  // ── Conseils pratiques ────────────────────────────────────────────────────────
  const conseilsHtml = itineraire.conseils_pratiques
    .map(
      (c, i) =>
        `<div style="display:flex;align-items:flex-start;gap:12px;margin-bottom:12px;">
          <span style="display:inline-flex;align-items:center;justify-content:center;min-width:28px;height:28px;background:#2563EB;color:#FFFFFF;border-radius:50%;font-size:13px;font-weight:700;">${i + 1}</span>
          <p style="margin:0;color:#334155;font-size:14px;line-height:1.6;padding-top:4px;">${c}</p>
        </div>`
    )
    .join('')

  // ── Full HTML ─────────────────────────────────────────────────────────────────
  const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Ton road trip en ${region}</title>
</head>
<body style="margin:0;padding:0;background:#F1F5F9;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:20px 0 40px;">

    <!-- Logo header -->
    <div style="text-align:center;padding:24px 20px 16px;">
      <img src="https://cdn.sanity.io/images/lewexa74/production/9de5b0e768fa1fcc5ea5aa6f41ac816c249af9b0-1042x417.png"
           alt="Vanzon Explorer" width="160" style="height:auto;display:inline-block;" />
    </div>

    <!-- Hero banner -->
    <div style="background:#FFFFFF;margin:0 20px;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
      <div style="background:linear-gradient(135deg,#1D4ED8 0%,#0EA5E9 100%);padding:32px 32px 28px;text-align:center;">
        <div style="display:inline-block;background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.3);border-radius:20px;padding:4px 14px;margin-bottom:16px;">
          <span style="color:#FFFFFF;font-size:12px;font-weight:600;letter-spacing:0.05em;">✨ Généré par IA · Vanzon Explorer</span>
        </div>
        <h1 style="margin:0 0 10px 0;color:#FFFFFF;font-size:30px;font-weight:800;line-height:1.15;">
          Ton road trip ${duree}j<br/>en ${region}
        </h1>
        <p style="margin:0;color:rgba(255,255,255,0.85);font-size:15px;">Salut ${prenom} ! Ton itinéraire sur mesure est prêt 🚐</p>
      </div>
      <div style="padding:24px 28px 20px;">
        <p style="margin:0;color:#334155;font-size:15px;line-height:1.75;">${itineraire.intro}</p>
      </div>
    </div>

    <!-- Main content -->
    <div style="background:#FFFFFF;margin:16px 20px 0;border-radius:20px;padding:28px;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
      ${joursHtml}

      <div style="border-top:2px solid #EFF6FF;margin:24px 0;"></div>

      <!-- Conseils pratiques -->
      <div style="background:#EFF6FF;border-radius:14px;padding:22px 24px;">
        <h3 style="margin:0 0 18px 0;color:#1D4ED8;font-size:16px;font-weight:800;">💡 Conseils pratiques van</h3>
        ${conseilsHtml}
      </div>
    </div>

    <!-- CTA block -->
    <div style="background:linear-gradient(135deg,#1D4ED8 0%,#0EA5E9 100%);margin:16px 20px 0;border-radius:20px;padding:32px 28px;text-align:center;box-shadow:0 4px 24px rgba(29,78,216,0.25);">
      <p style="margin:0 0 6px 0;color:rgba(255,255,255,0.8);font-size:14px;">Prêt à partir ? Loue ton van dès maintenant.</p>
      <h2 style="margin:0 0 24px 0;color:#FFFFFF;font-size:22px;font-weight:800;">Départ depuis Cambo-les-Bains,<br/>Pays Basque 🏔️</h2>
      <a href="https://vanzonexplorer.com/location"
         style="display:inline-block;padding:16px 40px;background:#FFFFFF;color:#1D4ED8;text-decoration:none;border-radius:30px;font-weight:800;font-size:16px;box-shadow:0 4px 16px rgba(0,0,0,0.15);">
        🚐 Louer un van Vanzon Explorer →
      </a>
    </div>

    <!-- Footer -->
    <div style="padding:24px 20px 0;text-align:center;">
      <p style="margin:0 0 6px 0;color:#94A3B8;font-size:12px;">Vanzon Explorer — <a href="https://vanzonexplorer.com" style="color:#94A3B8;text-decoration:none;">vanzonexplorer.com</a></p>
      <p style="margin:0;color:#CBD5E1;font-size:11px;">
        Tu reçois cet email parce que tu as demandé un itinéraire sur notre site. ·
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
