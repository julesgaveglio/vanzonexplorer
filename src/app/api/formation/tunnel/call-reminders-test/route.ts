import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const VIDEO_ID = "uY6pgzXhOPk";
const VIDEO_THUMB = `https://img.youtube.com/vi/${VIDEO_ID}/maxresdefault.jpg`;
const VIDEO_LINK = `https://youtu.be/${VIDEO_ID}`;

export async function GET() {
  const testEmail = "gavegliojules@gmail.com";
  const firstname = "Jules";
  const callDate = "Vendredi 6 juin";
  const callHeure = "14h30";

  const results: string[] = [];

  try {
    // ── Email 1: Confirmation immédiate ──
    const e1 = await resend.emails.send({
      from: "Jules · Vanzon Explorer <jules@vanzonexplorer.com>",
      to: testEmail,
      subject: "Ton appel avec Jules est confirmé ✅",
      html: `<div style="font-family:sans-serif;font-size:15px;color:#1a1a1a">
Salut ${firstname},<br><br>
Ton appel est bien réservé le ${callDate} à ${callHeure}.<br><br>
D'ici là je te conseille de regarder la vidéo en entier si ce n'est pas encore fait — on aura un échange bien plus riche :<br><br>
<a href="${VIDEO_LINK}" style="display:block;text-decoration:none"><img src="${VIDEO_THUMB}" alt="Regarder la vidéo" style="width:100%;max-width:480px;border-radius:8px"></a><br>
À très vite<br>
Jules
</div>`,
    });
    results.push(`Email 1: ${e1.data?.id}`);

    // ── Email 2: Rappel la veille ──
    const e2 = await resend.emails.send({
      from: "Jules · Vanzon Explorer <jules@vanzonexplorer.com>",
      to: testEmail,
      subject: `On se parle demain ${firstname} 👋`,
      html: `<div style="font-family:sans-serif;font-size:15px;color:#1a1a1a">
Salut ${firstname},<br><br>
Je voulais juste te rappeler qu'on se parle demain à ${callHeure}.<br><br>
J'ai regardé tes réponses au formulaire et j'ai déjà quelques idées sur comment t'aider.<br><br>
Sois dans un endroit calme et prépare tes questions.<br><br>
À demain<br>
Jules
</div>`,
    });
    results.push(`Email 2: ${e2.data?.id}`);

    // ── Email 3: Rappel 1h avant ──
    const e3 = await resend.emails.send({
      from: "Jules · Vanzon Explorer <jules@vanzonexplorer.com>",
      to: testEmail,
      subject: `On se parle dans 1h ${firstname} 👋`,
      html: `<div style="font-family:sans-serif;font-size:15px;color:#1a1a1a">
Salut ${firstname} c'est Jules. On se parle dans 1h. À tout à l'heure 👋
</div>`,
    });
    results.push(`Email 3: ${e3.data?.id}`);

    return NextResponse.json({ ok: true, results });
  } catch (err) {
    console.error("[call-reminders-test]", err);
    return NextResponse.json({ error: String(err), results }, { status: 500 });
  }
}
