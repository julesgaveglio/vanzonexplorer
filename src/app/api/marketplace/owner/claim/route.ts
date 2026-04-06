import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";

/**
 * POST /api/marketplace/owner/claim
 * Link vans submitted with a different email to the current Clerk account.
 * Body: { submissionEmail: string }
 */
export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const user = await currentUser();
  const clerkEmail = user?.emailAddresses?.[0]?.emailAddress;
  if (!clerkEmail) return NextResponse.json({ error: "Email introuvable" }, { status: 400 });

  let body: { submissionEmail?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
  }

  const submissionEmail = body.submissionEmail?.trim().toLowerCase();
  if (!submissionEmail) {
    return NextResponse.json({ error: "Email de soumission requis" }, { status: 400 });
  }

  const supabase = createSupabaseAdmin();

  // Find vans with the submission email
  const { data: vans, error } = await supabase
    .from("marketplace_vans")
    .select("id, title")
    .eq("owner_email", submissionEmail);

  if (error || !vans || vans.length === 0) {
    return NextResponse.json({ error: "Aucune annonce trouvée avec cet email." }, { status: 404 });
  }

  // Update owner_email to Clerk email
  const { error: updateError } = await supabase
    .from("marketplace_vans")
    .update({ owner_email: clerkEmail })
    .eq("owner_email", submissionEmail);

  if (updateError) {
    return NextResponse.json({ error: "Erreur lors de la mise à jour." }, { status: 500 });
  }

  return NextResponse.json({ success: true, claimed: vans.length });
}
