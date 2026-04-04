import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const check = await requireAdmin();
  if (check instanceof NextResponse) return check;
  const { status, notes } = (await req.json()) as {
    status: "todo" | "in_progress" | "done";
    notes?: string;
  };

  const supabase = createSupabaseAdmin();

  const { error } = await supabase
    .from("cmo_actions")
    .update({ status, notes: notes ?? null })
    .eq("id", params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
