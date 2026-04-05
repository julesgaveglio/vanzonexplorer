import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/server";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const check = await requireAdmin();
  if (check instanceof NextResponse) return check;

  const { id } = await params;
  const body = await req.json();

  const supabase = createSupabaseAdmin();
  const { error } = await supabase
    .from("marketplace_vans")
    .update(body)
    .eq("id", id);

  if (error) {
    console.error("[admin/marketplace] PATCH error:", error);
    return NextResponse.json({ error: "Erreur mise à jour" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const check = await requireAdmin();
  if (check instanceof NextResponse) return check;

  const { id } = await params;

  const supabase = createSupabaseAdmin();
  const { error } = await supabase
    .from("marketplace_vans")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("[admin/marketplace] DELETE error:", error);
    return NextResponse.json({ error: "Erreur suppression" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
