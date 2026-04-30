/**
 * VBA Funnel follow-up emails
 * E2 J+1 — "Tu n'as pas encore regardé la vidéo ?" (si pas de vsl_view)
 * E3 J+3 — "Dernière chance de voir ça" (si toujours pas de vsl_view)
 * E4 J+1 post-VSL — "Tu as regardé la vidéo jusqu'au bout" (si vsl_100 mais pas booking_start)
 */

const VSL_BASE = "https://vanzonexplorer.com/van-business-academy/presentation";
const CALENDLY_URL = "https://calendly.com/vanzonexplorer/new-meeting?utm_source=email&utm_medium=sequence&utm_campaign=post-vsl";

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

function ctaButton(utmCampaign: string): string {
  const url = `${VSL_BASE}?utm_source=email&utm_medium=sequence&utm_campaign=${utmCampaign}`;
  return `<p style="margin:24px 0;">
  <a href="${url}" target="_blank" style="display:inline-block;background:linear-gradient(135deg,#B9945F 0%,#E4D398 100%);color:#FFFFFF;text-decoration:none;padding:14px 32px;border-radius:10px;font-size:15px;font-weight:600;">
    Regarder la video &rarr;
  </a>
</p>`;
}

export function buildFollowupE2(firstname: string): { subject: string; html: string } {
  return {
    subject: `Tu n'as pas encore regardé la vidéo ?`,
    html: simpleEmail(`
<p>Salut ${firstname},</p>
<p>Hier tu t'es inscrit(e) pour recevoir ma vidéo sur le business de location de vans, mais tu ne l'as pas encore regardée.</p>
<p>Je comprends, on est tous débordés.</p>
<p>Mais laisse-moi te poser une question : si je te disais qu'avec 15 000€ et quelques mois de travail, tu peux créer un actif qui te rapporte 500-600€ par mois en location, tout en prenant de la valeur à la revente... tu prendrais 15 minutes pour comprendre comment ?</p>
${ctaButton("followup-j1")}
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
<p>J'ai acheté un utilitaire à 9 000€, je l'ai aménagé moi-même pour 5 000€, et en 8 mois de location il m'a rapporté plus de 5 500€ nets. Aujourd'hui il se revendra plus de 21 000€.</p>
<p>Sans diplôme. Sans compétence en bricolage. Et en profitant du van moi-même entre les locations.</p>
<p>Dans cette vidéo de 15 minutes, je t'explique exactement comment j'ai fait et comment tu peux faire pareil.</p>
${ctaButton("followup-j3")}
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
<p>Je vais être honnête avec toi : je suis en train de lancer cet accompagnement. C'est tout nouveau. Et j'ai besoin de 10 personnes motivées qui veulent se lancer dans le business de location de van et qui sont prêtes à me faire des retours honnêtes pour que je puisse améliorer le contenu.</p>
<p>En échange, je t'offre un tarif de lancement que je ne proposerai plus jamais, et surtout un accompagnement personnalisé sur WhatsApp où je réponds à toutes tes questions, du choix du véhicule jusqu'à ta première réservation.</p>
<p>Il reste 4 places sur 10.</p>
<p style="margin:24px 0;">
  <a href="${CALENDLY_URL}" target="_blank" style="display:inline-block;background:linear-gradient(135deg,#B9945F 0%,#E4D398 100%);color:#FFFFFF;text-decoration:none;padding:14px 32px;border-radius:10px;font-size:15px;font-weight:600;">
    Réserver un appel de 30 min &rarr;
  </a>
</p>
<p>C'est un appel de 30 minutes, sans engagement. On discute de ton projet, je te dis si c'est adapté à ta situation, et tu décides après.</p>
<p>Jules</p>
`),
  };
}
