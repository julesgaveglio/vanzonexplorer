import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { auth, currentUser } from "@clerk/nextjs/server";

const PROMO_CODES: Record<string, number> = {
  LANCEMENT: 99700, // 997 €
};

const DEFAULT_PRICE = 149700; // 1497 €

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const code = (body.promoCode || "").toUpperCase().trim();

    const unitAmount = PROMO_CODES[code] ?? DEFAULT_PRICE;

    const user = await currentUser();
    const email = user?.emailAddresses?.[0]?.emailAddress ?? undefined;
    const name = user?.firstName ?? undefined;

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://vanzonexplorer.com";

    const session = await getStripe().checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: email,
      metadata: {
        clerk_user_id: userId,
        product: "vba",
        promo_code: code || "none",
      },
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: "Van Business Academy",
              description:
                "Accès complet à la formation : 8 modules, 60+ vidéos, méthode terrain.",
            },
            unit_amount: unitAmount,
          },
          quantity: 1,
        },
      ],
      success_url: `${siteUrl}/van-business-academy/paiement-confirme?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/van-business-academy/paiement`,
      ...(name ? { payment_intent_data: { description: `VBA — ${name}` } } : {}),
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[stripe/checkout] Error:", err);
    return NextResponse.json(
      { error: "Erreur lors de la création du paiement." },
      { status: 500 }
    );
  }
}
