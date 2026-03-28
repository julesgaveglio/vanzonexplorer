import { NextRequest } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { discoverEmails } from "@/lib/email-discovery";

function sseEvent(data: Record<string, unknown>): string {
  return `data: ${JSON.stringify(data)}\n\n`;
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { prospectId, website }: { prospectId: string; website: string } = body;

  if (!prospectId || !website) {
    return new Response(
      `data: ${JSON.stringify({ type: "log", level: "error", message: "prospectId et website sont requis" })}\n\n`,
      { headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" } }
    );
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: Record<string, unknown>) =>
        controller.enqueue(encoder.encode(sseEvent(data)));

      try {
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
      } catch (err) {
        send({
          type: "log",
          level: "error",
          message: `Erreur: ${err instanceof Error ? err.message : String(err)}`,
        });
        send({ type: "done", count: 0 });
      }

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
