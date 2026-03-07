import { auth } from "@clerk/nextjs/server";
import { getStripe } from "@/lib/club/stripe";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const priceId = process.env.STRIPE_PRO_PRICE_ID;
  if (!priceId) {
    return NextResponse.json({ error: "Prix Stripe non configuré" }, { status: 500 });
  }

  const supabase = createSupabaseAdmin();

  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_customer_id, email")
    .eq("clerk_id", userId)
    .single();

  let customerId = profile?.stripe_customer_id;

  if (!customerId) {
    const customer = await getStripe().customers.create({
      email: profile?.email || undefined,
      metadata: { clerk_id: userId },
    });
    customerId = customer.id;

    await supabase
      .from("profiles")
      .update({ stripe_customer_id: customerId })
      .eq("clerk_id", userId);
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  const session = await getStripe().checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${baseUrl}/club/dashboard?checkout=success`,
    cancel_url: `${baseUrl}/club/dashboard`,
    metadata: { clerk_id: userId },
  });

  return NextResponse.json({ url: session.url });
}
