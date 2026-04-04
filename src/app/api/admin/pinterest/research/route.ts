import { runPinterestResearch } from "@/lib/pinterest/research";
import { requireAdmin } from "@/lib/auth";
import { NextResponse } from "next/server";
import { createSSEResponse } from "@/lib/sse";

export async function POST() {
  const check = await requireAdmin();
  if (check instanceof NextResponse) return check;

  return createSSEResponse(async (send) => {
    const result = await runPinterestResearch((level, message) => {
      send({ type: "log", level, message });
    });

    send({ type: "result", data: result });
    send({ type: "done" });
  });
}
