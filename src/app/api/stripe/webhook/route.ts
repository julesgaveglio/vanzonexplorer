import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import Stripe from "stripe";

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  // If webhook secret is configured, verify signature
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event: Stripe.Event;

  if (webhookSecret && sig) {
    try {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } catch (err) {
      console.error("[stripe/webhook] Signature verification failed:", err);
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }
  } else {
    event = JSON.parse(body) as Stripe.Event;
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const clerkUserId = session.metadata?.clerk_user_id;
    const product = session.metadata?.product;

    if (clerkUserId && product === "vba") {
      const supabase = createSupabaseAdmin();

      // Update user plan to vba_member
      const { error } = await supabase
        .from("profiles")
        .update({ plan: "vba_member" })
        .eq("clerk_id", clerkUserId);

      if (error) {
        console.error("[stripe/webhook] Supabase update error:", error);
      } else {
        console.log(`[stripe/webhook] ✅ User ${clerkUserId} upgraded to vba_member`);
      }
    }
  }

  return NextResponse.json({ received: true });
}
