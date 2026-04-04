import { NextRequest } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { discoverEmails } from "@/lib/email-discovery";
import { requireAdmin } from "@/lib/auth";
import { NextResponse } from "next/server";
import { createSSEResponse } from "@/lib/sse";

export async function POST(req: NextRequest) {
  const check = await requireAdmin();
  if (check instanceof NextResponse) return check;
  const body = await req.json();
  const { prospectId, website }: { prospectId: string; website: string } = body;

  if (!prospectId || !website) {
    return new Response(
      `data: ${JSON.stringify({ type: "log", level: "error", message: "prospectId et website sont requis" })}\n\n`,
      { headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" } }
    );
  }

  return createSSEResponse(async (send) => {
    send({ type: "log", level: "info", message: `Enrichissement multi-sources pour ${website}…` });

    const result = await discoverEmails(website, {
      context: "partenariat marque équipement van / outdoor / camping",
      onLog: (level, message) => {
        send({ type: "log", level, message });
      },
    });

    // Save to DB
    const supabase = createSupabaseAdmin();
    await supabase
      .from("prospects")
      .update({
        emails: result.emails,
        contacts: result.contacts,
        status: "enrichi",
        updated_at: new Date().toISOString(),
      })
      .eq("id", prospectId);

    send({
      type: "log",
      level: "success",
      message: `Terminé — ${result.emails.length} email(s) · ${result.contacts.length} contact(s)`,
    });
    send({
      type: "result",
      emails: result.emails,
      contacts: result.contacts,
      bestEmail: result.bestEmail,
      sourceSummary: result.sourceSummary,
    });
    send({ type: "done", count: result.emails.length + result.contacts.length });
  });
}
