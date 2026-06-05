import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// Test route — sends all 3 reminder emails to Jules for preview
// GET /api/formation/tunnel/call-reminders-test

export async function GET() {
  const testEmail = "gavegliojules@gmail.com";
  const firstname = "Jules";
  const callDate = "Vendredi 6 juin";
  const callHeure = "14h30";
  const callLink = "https://calendly.com/vanzonexplorer/appel-strategique";

  const results: string[] = [];

  try {
    // ── Email 1: Confirmation immédiate ──
    const e1 = await resend.emails.send({
      from: "Jules · Vanzon Explorer <jules@vanzonexplorer.com>",
      to: testEmail,
      subject: "Ton appel avec Jules est confirmé ✅",
      html: `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:15px;line-height:1.6;color:#1a1a1a;max-width:600px;margin:0 auto;padding:20px">
<p>Salut ${firstname},</p>
<p>Ton appel est bien réservé le <strong>${callDate}</strong> à <strong>${callHeure}</strong>.</p>
<p>D'ici là je te conseille de regarder la vidéo en entier si ce n'est pas encore fait — on aura un échange bien plus riche.</p>
<p>À très vite</p>
<p>Jules</p>
</div>`,
    });
    results.push(`Email 1 OK: ${e1.data?.id}`);

    // ── Email 2: Rappel la veille ──
    const e2 = await resend.emails.send({
      from: "Jules · Vanzon Explorer <jules@vanzonexplorer.com>",
      to: testEmail,
      subject: `On se parle demain ${firstname} 👋`,
      html: `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:15px;line-height:1.6;color:#1a1a1a;max-width:600px;margin:0 auto;padding:20px">
<p>Salut ${firstname},</p>
<p>Je voulais juste te rappeler qu'on se parle demain à <strong>${callHeure}</strong>.</p>
<p>J'ai regardé tes réponses au formulaire et j'ai déjà quelques idées sur comment t'aider.</p>
<p>Sois dans un endroit calme et prépare tes questions.</p>
<p>À demain</p>
<p>Jules</p>
</div>`,
    });
    results.push(`Email 2 OK: ${e2.data?.id}`);

    // ── Email 3 (placeholder SMS): Rappel 1h avant ──
    const e3 = await resend.emails.send({
      from: "Jules · Vanzon Explorer <jules@vanzonexplorer.com>",
      to: testEmail,
      subject: `[TEST SMS] Rappel 1h avant — ${firstname}`,
      html: `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:15px;line-height:1.6;color:#1a1a1a;max-width:600px;margin:0 auto;padding:20px">
<p>Salut ${firstname} c'est Jules. On se parle dans 1h. Voici le lien : <a href="${callLink}">${callLink}</a>. À tout à l'heure 👋</p>
</div>`,
    });
    results.push(`Email 3 OK: ${e3.data?.id}`);

    return NextResponse.json({ ok: true, results });
  } catch (err) {
    console.error("[call-reminders-test] Error:", err);
    return NextResponse.json({ error: String(err), results }, { status: 500 });
  }
}
