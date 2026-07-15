import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { auth, currentUser } from "@clerk/nextjs/server";
import { createSupabaseAdmin } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const formationSlug = body.formationSlug as string;
    if (!formationSlug) {
      return NextResponse.json({ error: "Formation requise" }, { status: 400 });
    }

    // Fetch formation
    const supabase = createSupabaseAdmin();
    const { data: formation } = await supabase
      .from("formations")
      .select("id, name, description, price_cents, slug")
      .eq("slug", formationSlug)
      .eq("is_published", true)
      .single();

    if (!formation || formation.price_cents <= 0) {
      return NextResponse.json({ error: "Formation introuvable" }, { status: 404 });
    }

    // Check if already has access
    const { data: existing } = await supabase
      .from("formation_access")
      .select("id")
      .eq("clerk_id", userId)
      .eq("formation_id", formation.id)
      .single();

    if (existing) {
      return NextResponse.json({ error: "Vous avez déjà accès à cette formation" }, { status: 409 });
    }

    const user = await currentUser();
    const email = user?.emailAddresses?.[0]?.emailAddress ?? undefined;
    const name = user?.firstName ?? undefined;

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://vanzonexplorer.com";
    const stripe = getStripe();

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: email,
      metadata: {
        clerk_user_id: userId,
        product: "formation",
        formation_id: formation.id,
        formation_slug: formation.slug,
      },
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: formation.name,
              description: formation.description || undefined,
            },
            unit_amount: formation.price_cents,
          },
          quantity: 1,
        },
      ],
      success_url: `${siteUrl}/espace-membre/formations/${formation.slug}?success=1`,
      cancel_url: `${siteUrl}/espace-membre/formations/${formation.slug}`,
      ...(name ? { payment_intent_data: { description: `${formation.name} - ${name}` } } : {}),
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[stripe/formation-checkout] Error:", err);
    return NextResponse.json(
      { error: "Erreur lors de la création du paiement." },
      { status: 500 }
    );
  }
}
