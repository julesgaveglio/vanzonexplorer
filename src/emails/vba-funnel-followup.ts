/**
 * VBA Funnel follow-up emails
 * E2 — "Tu n'as pas encore regardé la vidéo ?" (si quitte VSL < 3min)
 * E3 — "Dernière chance de voir ça" (J+3, si toujours pas de vsl_view)
 * E4 — "Tu as regardé la vidéo jusqu'au bout" (si vsl_100 mais pas booking_start)
 */

const VSL_BASE = "https://vanzonexplorer.com/van-business-academy/presentation";
const CALENDLY_URL = "https://calendly.com/vanzonexplorer/new-meeting?utm_source=email&utm_medium=sequence&utm_campaign=post-vsl";
const THUMBNAIL_URL = "https://vanzonexplorer.com/images/vsl2-thumbnail.png";

function simpleEmail(body: string): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:15px;line-height:1.7;color:#333;">
  <div style="max-width:500px;margin:0 auto;padding:32px 20px;">
    ${body}
  </div>
</body>
</html>`;
}

function videoThumbnailCTA(utmCampaign: string): string {
  const url = `${VSL_BASE}?utm_source=email&utm_medium=sequence&utm_campaign=${utmCampaign}`;
  return `<table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0;">
  <tr>
    <td align="center">
      <a href="${url}" target="_blank" style="text-decoration:none;">
        <table cellpadding="0" cellspacing="0" border="0" width="460" style="max-width:100%;">
          <tr>
            <td background="${THUMBNAIL_URL}" width="460" height="258" valign="middle" align="center" style="background-size:cover;background-position:center;border-radius:12px;text-align:center;">
              <table cellpadding="0" cellspacing="0" border="0" width="64" height="64" align="center">
                <tr>
                  <td width="64" height="64" align="center" valign="middle" style="background-color:rgba(0,0,0,0.55);border-radius:32px;">
                    <div style="width:0;height:0;border-style:solid;border-width:12px 0 12px 22px;border-color:transparent transparent transparent #ffffff;margin-left:4px;display:inline-block;"></div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </a>
    </td>
  </tr>
</table>`;
}

export function buildFollowupE2(firstname: string): { subject: string; html: string } {
  return {
    subject: `Tu n'as pas encore regardé la vidéo ?`,
    html: simpleEmail(`
<p>Salut ${firstname},</p>
<p>Hier tu t'es inscrit(e) pour recevoir ma vidéo sur le <b>business de location de vans</b>, mais tu ne l'as pas encore regardée en entier.</p>
<p>Je comprends, on est tous débordés.</p>
<p>Mais laisse-moi te poser une question : si je te disais qu'avec <b>15 000€</b> et quelques mois de travail, tu peux créer un actif qui te rapporte <b>500-600€ par mois</b> en location, tout en prenant de la valeur à la revente... tu prendrais 15 minutes pour comprendre comment ?</p>
${videoThumbnailCTA("followup-j1")}
<p>C'est exactement ce que j'ai fait. Deux fois. Et je t'explique tout dans cette vidéo.</p>
<p>Jules</p>
<p style="color:#999;font-size:13px;">P.S. — J'ai commencé sans savoir planter un clou. Si j'ai pu le faire, toi aussi.</p>
`),
  };
}

export function buildFollowupE3(firstname: string): { subject: string; html: string } {
  return {
    subject: `Dernière chance de voir ça`,
    html: simpleEmail(`
<p>${firstname},</p>
<p>Je t'écris une dernière fois.</p>
<p>J'ai acheté un utilitaire à <b>9 000€</b>, je l'ai aménagé moi-même pour <b>5 000€</b>, et en 8 mois de location il m'a rapporté plus de <b>5 500€ nets</b>. Aujourd'hui il se revendra plus de <b>21 000€</b>.</p>
<p>Sans diplôme. Sans compétence en bricolage. Et en profitant du van moi-même entre les locations.</p>
<p>Dans cette vidéo de 15 minutes, je t'explique exactement comment j'ai fait et comment tu peux faire pareil.</p>
${videoThumbnailCTA("followup-j3")}
<p>Si c'est pas pour toi, aucun souci. Mais au moins tu auras les infos pour décider.</p>
<p>Jules</p>
`),
  };
}

export function buildFollowupE4(firstname: string): { subject: string; html: string } {
  return {
    subject: `Tu as regardé la vidéo jusqu'au bout`,
    html: simpleEmail(`
<p>Salut ${firstname},</p>
<p>Tu as regardé ma vidéo en entier, et ça me fait plaisir.</p>
<p>Je vais être honnête avec toi : je suis en train de lancer cet accompagnement. C'est tout nouveau. Et j'ai besoin de <b>10 personnes motivées</b> qui veulent se lancer dans le business de location de van et qui sont prêtes à me faire des retours honnêtes pour que je puisse améliorer le contenu.</p>
<p>En échange, je t'offre un <b>tarif de lancement</b> que je ne proposerai plus jamais, et surtout un accompagnement personnalisé sur WhatsApp où je réponds à toutes tes questions, du choix du véhicule jusqu'à ta première réservation.</p>
<p><b>Il reste 4 places sur 10.</b></p>
<p style="margin:24px 0;">
  <a href="${CALENDLY_URL}" target="_blank" style="display:inline-block;background:#0F172A;color:#FFFFFF;text-decoration:none;padding:14px 32px;border-radius:10px;font-size:15px;font-weight:600;">
    ☎️ Réserver un appel de 30 min
  </a>
</p>
<p>C'est un appel de 30 minutes, sans engagement. On discute de ton projet, je te dis si c'est adapté à ta situation, et tu décides après.</p>
<p>Jules</p>
`),
  };
}
