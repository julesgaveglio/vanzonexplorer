import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { auth, currentUser } from "@clerk/nextjs/server";

const PROMO_CODES: Record<string, number> = {
  LANCEMENT: 99700, // 997 €
};

const DEFAULT_PRICE = 149700; // 1497 €

export async function POST(req: Request) {
  try {
    // Auth is optional — unauthenticated users can still pay
    const { userId } = await auth();

    const body = await req.json().catch(() => ({}));
    const code = (body.promoCode || "").toUpperCase().trim();
    const installments = body.installments === 4;

    const totalAmount = PROMO_CODES[code] ?? DEFAULT_PRICE;

    let email: string | undefined;
    let name: string | undefined;

    if (userId) {
      const user = await currentUser();
      email = user?.emailAddresses?.[0]?.emailAddress ?? undefined;
      name = user?.firstName ?? undefined;
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://vanzonexplorer.com";
    const stripe = getStripe();

    if (installments) {
      // 4x sans frais via Stripe Subscriptions (4 mois)
      const installmentAmount = Math.ceil(totalAmount / 4);

      // Create or retrieve customer
      const customers = await stripe.customers.list({ email, limit: 1 });
      let customer = customers.data[0];
      if (!customer) {
        customer = await stripe.customers.create({
          email,
          name: name || undefined,
          metadata: { clerk_user_id: userId || "anonymous" },
        });
      }

      // Create a price for the installment
      const price = await stripe.prices.create({
        currency: "eur",
        unit_amount: installmentAmount,
        recurring: { interval: "month", interval_count: 1 },
        product_data: {
          name: "Van Business Academy - 4x sans frais",
        },
      });

      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        customer: customer.id,
        payment_method_types: ["card"],
        metadata: {
          clerk_user_id: userId || "anonymous",
          product: "vba",
          promo_code: code || "none",
          payment_type: "4x",
        },
        subscription_data: {
          metadata: {
            clerk_user_id: userId || "anonymous",
            product: "vba",
            cancel_after_payments: "4",
          },
        },
        line_items: [{ price: price.id, quantity: 1 }],
        success_url: `${siteUrl}/van-business-academy/paiement-confirme?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${siteUrl}/van-business-academy/paiement`,
      });

      return NextResponse.json({ url: session.url });
    }

    // Paiement unique
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: email,
      metadata: {
        clerk_user_id: userId || "anonymous",
        product: "vba",
        promo_code: code || "none",
        payment_type: "1x",
      },
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: "Van Business Academy",
              description:
                "Acces complet a la formation : 8 modules, 60+ videos, methode terrain.",
            },
            unit_amount: totalAmount,
          },
          quantity: 1,
        },
      ],
      success_url: `${siteUrl}/van-business-academy/paiement-confirme?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/van-business-academy/paiement`,
      ...(name ? { payment_intent_data: { description: `VBA - ${name}` } } : {}),
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[stripe/checkout] Error:", err);
    return NextResponse.json(
      { error: "Erreur lors de la creation du paiement." },
      { status: 500 }
    );
  }
}
