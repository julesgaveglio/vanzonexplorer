import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/server";

export async function GET() {
  const check = await requireAdmin();
  if (check instanceof NextResponse) return check;

  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("marketplace_vans")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[admin/marketplace] GET error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }

  return NextResponse.json(data);
}
