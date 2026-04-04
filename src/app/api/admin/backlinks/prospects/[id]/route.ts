import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";

type Statut = "découvert" | "contacté" | "relancé" | "obtenu" | "rejeté";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const check = await requireAdmin();
  if (check instanceof NextResponse) return check;
  const body = await req.json().catch(() => ({}));
  const { statut }: { statut?: Statut } = body;

  const validStatuts: Statut[] = ["découvert", "contacté", "relancé", "obtenu", "rejeté"];
  if (!statut || !validStatuts.includes(statut)) {
    return Response.json({ success: false, error: "Statut invalide" }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();
  const { error } = await supabase
    .from("backlink_prospects")
    .update({ statut })
    .eq("id", params.id);

  if (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }

  return Response.json({ success: true });
}
