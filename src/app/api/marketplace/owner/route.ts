import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { slugify } from "@/lib/slugify";

async function getOwnerEmail() {
  const { userId } = await auth();
  if (!userId) return null;
  const user = await currentUser();
  return user?.emailAddresses?.[0]?.emailAddress ?? null;
}

/** GET — fetch all vans belonging to the authenticated owner */
export async function GET() {
  const email = await getOwnerEmail();
  if (!email) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const supabase = createSupabaseAdmin();
  const { data, error } = await supabase
    .from("marketplace_vans")
    .select("*")
    .eq("owner_email", email)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }

  return NextResponse.json({ vans: data ?? [] });
}

const updateSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(5).max(100).optional(),
  description: z.string().min(50).max(2000).optional(),
  equipments: z.array(z.string()).optional(),
  price_per_day: z.coerce.number().min(20).max(500).optional(),
  min_days: z.coerce.number().min(1).max(30).optional(),
  deposit: z.coerce.number().min(0).max(5000).nullable().optional(),
  booking_url: z.string().url().or(z.literal("")).nullable().optional(),
  location_city: z.string().min(2).optional(),
  location_postal_code: z.string().optional(),
  location_address: z.string().optional(),
});

/** PATCH — update a van owned by the authenticated user */
export async function PATCH(req: Request) {
  const email = await getOwnerEmail();
  if (!email) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
  }

  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { id, ...updates } = parsed.data;
  const supabase = createSupabaseAdmin();

  // Verify ownership
  const { data: van } = await supabase
    .from("marketplace_vans")
    .select("id, owner_email, status, location_city")
    .eq("id", id)
    .single();

  if (!van || van.owner_email !== email) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  // Apply updates
  const { error } = await supabase
    .from("marketplace_vans")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    console.error("[marketplace/owner] Update error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }

  // Revalidate public pages if van is approved
  if (van.status === "approved") {
    revalidatePath("/", "layout");
    revalidatePath("/location", "layout");
    if (van.location_city) {
      revalidatePath(`/location/${slugify(van.location_city)}/${id}`);
    }
  }

  return NextResponse.json({ success: true });
}
