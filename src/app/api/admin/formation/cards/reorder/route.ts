import { NextRequest, NextResponse } from "next/server";
import { adminWriteClient } from "@/lib/sanity/adminClient";

export async function POST(req: NextRequest) {
  try {
    const { cards } = (await req.json()) as { cards: { id: string; sortOrder: number }[] };
    if (!Array.isArray(cards)) {
      return NextResponse.json({ error: "cards manquants" }, { status: 400 });
    }

    const transaction = adminWriteClient.transaction();
    for (const { id, sortOrder } of cards) {
      transaction.patch(id, (p) => p.set({ sortOrder }));
    }
    await transaction.commit();

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Formation Cards REORDER]", err);
    return NextResponse.json({ error: "Erreur lors du réordonnancement" }, { status: 500 });
  }
}
