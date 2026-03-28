import { NextRequest } from "next/server";
import { Resend } from "resend";
import { createSupabaseAdmin } from "@/lib/supabase/server";

const FROM_EMAIL = "Jules — Vanzon Explorer <jules@vanzonexplorer.com>";

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
  const body = await req.json().catch(() => ({}));
  const { recipientEmail, subject, emailBody } = body as {
    recipientEmail?: string;
    subject?: string;
    emailBody?: string;
  };

  const supabase = createSupabaseAdmin();

  // Fetch outreach record
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

  if (!process.env.RESEND_API_KEY) {
    return Response.json({ success: false, error: "RESEND_API_KEY non configuré" }, { status: 500 });
  }

  // Convert plain text email body to HTML (preserve line breaks)
  const htmlBody = `
<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 15px; line-height: 1.6; color: #1a1a1a; max-width: 600px; margin: 0 auto; padding: 20px;">
  ${finalBody
    .split("\n\n")
    .map((para) =>
      `<p style="margin: 0 0 16px 0;">${para.replace(/\n/g, "<br>")}</p>`
    )
    .join("")}
  <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 24px 0;">
  <p style="color: #666; font-size: 13px; margin: 0;">
    Jules Gaveglio — <a href="https://vanzonexplorer.com" style="color: #2563eb; text-decoration: none;">Vanzon Explorer</a><br>
    Location vans aménagés · Pays Basque<br>
    <a href="mailto:jules@vanzonexplorer.com" style="color: #2563eb; text-decoration: none;">jules@vanzonexplorer.com</a>
  </p>
</body>
</html>`.trim();

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);

    const { data: sendData, error: sendError } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [toEmail],
      subject: finalSubject,
      html: htmlBody,
      text: finalBody,
      // Reply-to ensures replies go to Jules's real inbox
      replyTo: "jules@vanzonexplorer.com",
    });

    if (sendError) {
      return Response.json(
        { success: false, error: `Resend error: ${sendError.message}` },
        { status: 500 }
      );
    }

    // Update outreach record
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

    // Move prospect to "contacté"
    await supabase
      .from("backlink_prospects")
      .update({ statut: "contacté" })
      .eq("id", row.prospect_id);

    return Response.json({
      success: true,
      messageId: sendData?.id,
      sentTo: toEmail,
    });
  } catch (error) {
    return Response.json(
      { success: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
