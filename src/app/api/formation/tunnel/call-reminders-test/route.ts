import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const VIDEO_ID = "uY6pgzXhOPk";
const VIDEO_THUMB = `https://img.youtube.com/vi/${VIDEO_ID}/maxresdefault.jpg`;
const VIDEO_LINK = `https://youtu.be/${VIDEO_ID}`;

export async function GET() {
  const testEmail = "gavegliojules@gmail.com";
  const firstname = "Jules";
  const callDate = "vendredi 6 juin";
  const callHeure = "14h30";

  const results: string[] = [];

  try {
    // ── Email 1: Confirmation immédiate ──
    const e1 = await resend.emails.send({
      from: "Jules · Vanzon Explorer <jules@vanzonexplorer.com>",
      to: testEmail,
      subject: "Ton appel avec Jules est confirmé ✅",
      html: `Salut ${firstname},<br><br>Ton appel est bien réservé pour le <b>${callDate}</b> à <b>${callHeure}</b>.<br><br>D'ici là, je te conseille de regarder la vidéo dans son intégralité si ce n'est pas encore fait. Ça nous permettra d'avoir un <b>échange plus riche</b> !<br><br><a href="${VIDEO_LINK}"><img src="${VIDEO_THUMB}" alt="Regarder la vidéo" style="width:100%;max-width:480px;border-radius:8px"></a><br><br>À très vite !<br>Jules`,
    });
    results.push(`Email 1: ${e1.data?.id}`);

    // ── Email 2: Rappel la veille ──
    const e2 = await resend.emails.send({
      from: "Jules · Vanzon Explorer <jules@vanzonexplorer.com>",
      to: testEmail,
      subject: `On se parle demain ${firstname} 👋`,
      html: `Salut ${firstname},<br><br>Je voulais juste te rappeler qu'on se parle <b>demain à ${callHeure}</b>.<br><br>J'ai regardé tes réponses au formulaire et j'ai déjà quelques <b>idées sur comment t'aider</b>.<br><br>Sois dans un endroit calme et prépare tes questions.<br><br>À demain<br>Jules`,
    });
    results.push(`Email 2: ${e2.data?.id}`);

    // ── Email 3: Rappel 1h avant ──
    const e3 = await resend.emails.send({
      from: "Jules · Vanzon Explorer <jules@vanzonexplorer.com>",
      to: testEmail,
      subject: `On se parle dans 1h ${firstname} 👋`,
      html: `Salut ${firstname}, on se parle dans <b>1h</b>. À tout à l'heure 👋`,
    });
    results.push(`Email 3: ${e3.data?.id}`);

    return NextResponse.json({ ok: true, results });
  } catch (err) {
    console.error("[call-reminders-test]", err);
    return NextResponse.json({ error: String(err), results }, { status: 500 });
  }
}
