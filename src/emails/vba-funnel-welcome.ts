interface VBAWelcomeEmailProps {
  firstname: string;
  vslUrl: string;
}

export function buildVBAWelcomeEmail({ firstname, vslUrl }: VBAWelcomeEmailProps): {
  subject: string;
  html: string;
} {
  const subject = `${firstname}, ta vidéo est prête`;

  const html = `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#F8FAFC;font-family:Inter,Helvetica,Arial,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:40px 20px;">

    <!-- Logo -->
    <div style="text-align:center;margin-bottom:32px;">
      <img src="https://cdn.sanity.io/images/lewexa74/production/6fb25c3abe3260a98f42e58b3268810a26fbfed3-542x117.png" alt="Vanzon Explorer" width="140" style="display:inline-block;" />
    </div>

    <!-- Card -->
    <div style="background:#FFFFFF;border-radius:16px;padding:40px 32px;box-shadow:0 1px 3px rgba(0,0,0,0.06);">

      <h1 style="margin:0 0 16px 0;font-size:24px;font-weight:800;color:#0F172A;line-height:1.3;">
        ${firstname}, ta vidéo t'attend
      </h1>

      <p style="margin:0 0 24px 0;font-size:15px;color:#475569;line-height:1.7;">
        Tu as fait le premier pas vers la création de ton business de van aménagé.
        Dans cette vidéo, tu vas découvrir exactement comment passer de zéro à un business rentable,
        même sans expérience en mécanique ou en aménagement.
      </p>

      <!-- CTA -->
      <div style="text-align:center;margin:32px 0;">
        <a href="${vslUrl}" target="_blank" style="display:inline-block;background:linear-gradient(135deg,#B9945F 0%,#E4D398 100%);color:#FFFFFF;text-decoration:none;padding:16px 40px;border-radius:12px;font-size:16px;font-weight:700;box-shadow:0 4px 18px rgba(185,148,95,0.45);">
          Regarder la vidéo gratuite &rarr;
        </a>
      </div>

      <p style="margin:0;font-size:13px;color:#94A3B8;line-height:1.6;text-align:center;">
        Prends 15 minutes au calme, active le son, et regarde jusqu'à la fin.
      </p>

    </div>

    <!-- Footer -->
    <div style="text-align:center;margin-top:32px;">
      <p style="margin:0;font-size:12px;color:#94A3B8;">
        Vanzon Explorer &mdash; Vanlife au Pays Basque
      </p>
    </div>

  </div>
</body>
</html>`.trim();

  return { subject, html };
}
