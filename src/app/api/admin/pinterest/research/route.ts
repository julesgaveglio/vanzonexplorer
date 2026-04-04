import { runPinterestResearch } from "@/lib/pinterest/research";
import { requireAdmin } from "@/lib/auth";
import { NextResponse } from "next/server";

function sseEvent(data: Record<string, unknown>): string {
  return `data: ${JSON.stringify(data)}\n\n`;
}

export async function POST() {
  const check = await requireAdmin();
  if (check instanceof NextResponse) return check;
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(sseEvent(data)));
      };

      try {
        const result = await runPinterestResearch((level, message) => {
          send({ type: "log", level, message });
        });

        send({ type: "result", data: result });
        send({ type: "done" });
      } catch (error) {
        send({
          type: "log",
          level: "error",
          message: `Erreur: ${error instanceof Error ? error.message : String(error)}`,
        });
        send({ type: "done" });
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
