import { NextResponse } from "next/server";
import { sendViaGmail } from "@/lib/gmail/client";

// Test route — sends all 3 reminder emails to Jules for preview
// GET /api/formation/tunnel/call-reminders-test

export async function GET() {
  const testEmail = "gavegliojules@gmail.com";
  const firstname = "Jules";
  const callDate = "Vendredi 6 juin";
  const callHeure = "14h30";
  const callLink = "https://calendly.com/vanzonexplorer/appel-strategique";

  try {
    // ── Email 1: Confirmation immédiate ──
    await sendViaGmail({
      to: testEmail,
      subject: "Ton appel avec Jules est confirmé ✅",
      textBody: `Salut ${firstname},

Ton appel est bien réservé le ${callDate} à ${callHeure}.

D'ici là je te conseille de regarder la vidéo en entier si ce n'est pas encore fait — on aura un échange bien plus riche.

À très vite`,
    });

    // ── Email 2: Rappel la veille ──
    await sendViaGmail({
      to: testEmail,
      subject: `On se parle demain ${firstname} 👋`,
      textBody: `Salut ${firstname},

Je voulais juste te rappeler qu'on se parle demain à ${callHeure}.

J'ai regardé tes réponses au formulaire et j'ai déjà quelques idées sur comment t'aider.

Sois dans un endroit calme et prépare tes questions.

À demain`,
    });

    // ── Email 3 (placeholder SMS): Rappel 1h avant ──
    await sendViaGmail({
      to: testEmail,
      subject: `[TEST SMS] Rappel 1h avant — ${firstname}`,
      textBody: `Salut ${firstname} c'est Jules. On se parle dans 1h. Voici le lien : ${callLink}. À tout à l'heure 👋`,
    });

    return NextResponse.json({
      ok: true,
      message: `3 emails envoyés à ${testEmail}`,
    });
  } catch (err) {
    console.error("[call-reminders-test] Error:", err);
    return NextResponse.json(
      { error: String(err) },
      { status: 500 }
    );
  }
}
