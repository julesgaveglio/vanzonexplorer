import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { slugify } from "@/lib/slugify";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const check = await requireAdmin();
  if (check instanceof NextResponse) return check;

  const { id } = await params;
  const body = await req.json();

  const supabase = createSupabaseAdmin();

  // Fetch current van data before update (needed for revalidation)
  const { data: van } = await supabase
    .from("marketplace_vans")
    .select("id, location_city, status")
    .eq("id", id)
    .single();

  const { error } = await supabase
    .from("marketplace_vans")
    .update(body)
    .eq("id", id);

  if (error) {
    console.error("[admin/marketplace] PATCH error:", error);
    return NextResponse.json({ error: "Erreur mise à jour" }, { status: 500 });
  }

  // Revalider le cache instantanément quand un van est approuvé ou rejeté
  const newStatus = body.status;
  if (newStatus === "approved" || newStatus === "rejected") {
    revalidatePath("/", "layout");          // homepage + MarketplaceVansSection
    revalidatePath("/location", "layout");  // page location principale
    revalidatePath("/sitemap.xml");

    // Revalider la page van individuelle si on connaît la ville
    if (van?.location_city) {
      const citySlug = slugify(van.location_city);
      revalidatePath(`/location/${citySlug}/${id}`);
    }
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
