import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/server";

export async function PATCH(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  const sb = createSupabaseAdmin();
  const targetId = params.id;

  // Deactivate current active VSL
  await sb
    .from("vsl_versions")
    .update({ is_active: false, deactivated_at: new Date().toISOString() })
    .eq("is_active", true);

  // Activate target VSL
  const { data, error } = await sb
    .from("vsl_versions")
    .update({ is_active: true, activated_at: new Date().toISOString(), deactivated_at: null })
    .eq("id", targetId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
