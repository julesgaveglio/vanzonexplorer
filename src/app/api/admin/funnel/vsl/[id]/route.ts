import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/server";

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  const sb = createSupabaseAdmin();

  // Check if active
  const { data: vsl } = await sb
    .from("vsl_versions")
    .select("is_active")
    .eq("id", params.id)
    .single();

  if (vsl?.is_active) {
    return NextResponse.json({ error: "Cannot delete active VSL" }, { status: 400 });
  }

  const { error } = await sb.from("vsl_versions").delete().eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
