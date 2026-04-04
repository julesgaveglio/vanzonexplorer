import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { sendViaGmail, isGmailConfigured } from "@/lib/gmail/client";
import { requireAdmin } from "@/lib/auth";

interface OutreachRow {
  id: string;
  prospect_id: string;
  recipient_email: string | null;
  email_subject: string | null;
  email_body: string | null;
  approved: boolean;
  sent_at: string | null;
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const check = await requireAdmin();
  if (check instanceof NextResponse) return check;
  const body = await req.json().catch(() => ({}));
  const { recipientEmail, subject, emailBody } = body as {
    recipientEmail?: string;
    subject?: string;
    emailBody?: string;
  };

  const supabase = createSupabaseAdmin();

  // Charger le brouillon
  const { data: outreach, error: fetchError } = await supabase
    .from("backlink_outreach")
    .select("*")
    .eq("id", params.id)
    .single();

  if (fetchError || !outreach) {
    return Response.json({ success: false, error: "Email introuvable" }, { status: 404 });
  }

  const row = outreach as OutreachRow;

  if (row.sent_at) {
    return Response.json({ success: false, error: "Cet email a déjà été envoyé" }, { status: 400 });
  }

  const toEmail = recipientEmail || row.recipient_email;
  if (!toEmail) {
    return Response.json({ success: false, error: "Aucune adresse email destinataire" }, { status: 400 });
  }

  const finalSubject = subject || row.email_subject || "Collaboration Vanzon Explorer";
  const finalBody = emailBody || row.email_body || "";

  if (!finalBody) {
    return Response.json({ success: false, error: "Corps de l'email vide" }, { status: 400 });
  }

  if (!isGmailConfigured()) {
    return Response.json(
      { success: false, error: "Gmail API non configurée (GOOGLE_GMAIL_CLIENT_ID / CLIENT_SECRET / REFRESH_TOKEN manquants)" },
      { status: 500 }
    );
  }

  try {
    // Envoi via Gmail API — email visible dans la boîte "Envoyés" + signature auto
    const { messageId, threadId } = await sendViaGmail({
      to: toEmail,
      subject: finalSubject,
      textBody: finalBody,
    });

    // Mettre à jour le brouillon outreach
    await supabase
      .from("backlink_outreach")
      .update({
        approved: true,
        sent_at: new Date().toISOString(),
        recipient_email: toEmail,
        email_subject: finalSubject,
        email_body: finalBody,
      })
      .eq("id", params.id);

    // Passer le prospect en "contacté"
    await supabase
      .from("backlink_prospects")
      .update({ statut: "contacté" })
      .eq("id", row.prospect_id);

    return Response.json({
      success: true,
      messageId,
      threadId,
      sentTo: toEmail,
    });
  } catch (error) {
    return Response.json(
      { success: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
